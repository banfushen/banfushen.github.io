---
title: 从头开始读skynet源码（4）skynet.start服务器启动之后做了什么之monitor(监视者)
date: 2021-03-21 17:01:09
updated: 2023-07-16 17:11:17
categories:
  - skynet
tags:
  - 后端 c语言
---
<!-- more -->

## monitor

monitor分为服务器的monitor 和 skynet_monitor，整个服务器只有一个服务器monitor，每条工作线程绑定一个skynet_monitor，上面在声明了若干条线程数量后，先做的就是创建服务器monitor。

### 服务器 monitor

```c
// 可以把服务退出的消息从框架层抛出来，让上层逻辑可以感知到
struct monitor {
	int count;					// 多少条工作线程
	struct skynet_monitor ** m; // skynet_monitor
	pthread_cond_t cond;		// 条件变量
	pthread_mutex_t mutex;		// 互斥锁
	int sleep;					
	int quit;					// 服务器是否退出的标记
};

start(int thread) {
	...
	struct monitor *m = skynet_malloc(sizeof(*m));
	memset(m, 0, sizeof(*m));
	m->count = thread;
	m->sleep = 0;

	m->m = skynet_malloc(thread * sizeof(struct skynet_monitor *));
	int i;
	for (i=0;i<thread;i++) {
		m->m[i] = skynet_monitor_new();
	}
	if (pthread_mutex_init(&m->mutex, NULL)) {
		fprintf(stderr, "Init mutex error");
		exit(1);
	}
	if (pthread_cond_init(&m->cond, NULL)) {
		fprintf(stderr, "Init cond error");
		exit(1);
	}
	create_thread(&pid[0], thread_monitor, m);
	...
}
```

### 工作线程监视 skynet_monitor

```c
// skynet_monitor.h
struct skynet_monitor * skynet_monitor_new();//新建一个监视器
void skynet_monitor_delete(struct skynet_monitor *);//删除一个监视器
void skynet_monitor_trigger(struct skynet_monitor *, uint32_t source, uint32_t destination);//通知监视器开始
void skynet_monitor_check(struct skynet_monitor *);//检查监视器是否陷入死循环

// skynet_monitor.c
// 主要用于监测skynet服务在处理消息时是否陷入死循环
struct skynet_monitor {
	int version;                // 当前版本
    int check_version;          // 检查版本
    uint32_t source;            // 消息源服务
    uint32_t destination;       // 消息目标服务
};

truct skynet_monitor * 
skynet_monitor_new() {
	struct skynet_monitor * ret = skynet_malloc(sizeof(*ret));
	memset(ret, 0, sizeof(*ret));
	return ret;
}
```

### thread_monitor 线程

```c
// 如果没有正在运行的skynet_context(skynet服务)则break
#define CHECK_ABORT if (skynet_context_total()==0) break;

// skynet_server.c
// 设置统一线程内的共享数据
// 线程内部的各个函数调用都能访问、但其它线程不能访问的变量
// 处理了进程内静态变量全部线程共享的问题
void
skynet_initthread(int m) {
	uintptr_t v = (uint32_t)(-m);
	pthread_setspecific(G_NODE.handle_key, (void *)v);
}

// skynet_monitor.c
// 检查服务是否陷入死循环
void 
skynet_monitor_check(struct skynet_monitor *sm) {
	if (sm->version == sm->check_version) {
		// 这说明一个消息处理了5到10秒还没有返回，
		// 导致sm->version一直没有增长。下一次check发现没有增长，
		// 就认为它可能发生死循环了。
		// 处理也只是加一个标记，并打印一条错误日志，没有再做其他处理。
		if (sm->destination) {
			skynet_context_endless(sm->destination);
			skynet_error(NULL, "A message from [ :%08x ] to [ :%08x ] maybe in an endless loop (version = %d)", sm->source , sm->destination, sm->version);
		}
	} else {
		// 如果版本不一致，更新检查版本
		sm->check_version = sm->version;
	}
}

static void *
thread_monitor(void *p) {
	struct monitor * m = p;				//拿到服务器monitor
	int i;
	int n = m->count;					// 拿到工作线程数
	
	// 设置统一线程内的共享数据THREAD_MONITOR，标记为monitor线程
	skynet_initthread(THREAD_MONITOR); 
	
	// 线程死循环
	for (;;) {
		// 定义在上面，检查是否还有skynet服务运行
		CHECK_ABORT	
		
		// 检查每一个工作线程是否陷入死循环
		for (i=0;i<n;i++) {
			skynet_monitor_check(m->m[i]);
		}
		// 每秒检查一次是否还有服务在运行
		// 延迟5s后再进入上面的检查工作线程
		for (i=0;i<5;i++) {
			CHECK_ABORT	
			sleep(1);
		}
	}

	return NULL;
}
```

至此，skynet.star大概做了什么，monitor部分功能都做了大概分析。下篇顺着skynet.star分析，thread_timer(skynet定时器)
