---
title: 从头开始读skynet源码（3）skynet.start服务器启动之后做了什么
date: 2021-03-21 16:54:12
updated: 2023-07-16 17:11:17
categories:
  - skynet
tags:
  - 后端
---
<!-- more -->

俗事缠身，加上自己有点懒，skynet分析的事情拖了很久，之后尽快分析完。其实skynet是一个很优秀的框架，值得细读，多读（上加公司的老大这么对我说的，现在我也觉得是这样的）。skynet.star东西比较多，分四篇分析。下面直接进入正题。

## 启动服务器skynet_start()

start传入配置的线程数量，启动服务器。

```c
void 
skynet_start(struct skynet_config * config) {
	...
	// 调用start传入配置线程数量
	// 这个线程数量就是工作线程数量
	start(config->thread);

	// harbor_exit may call socket send, so it should exit before socket_free
	skynet_harbor_exit();
	skynet_socket_free();
	if (config->daemon) {
		daemon_exit(config->daemon);
	}
}
```

下面进入到start的逻辑，在同一个文件，先看注释，了解大概流程。之后我们一个结构一个结构分析

```c
static void
start(int thread) {
    // 声明传入的线程数量thread+3，之后会看到为什么+3
	pthread_t pid[thread+3];  

	// 创建服务器monitor
	struct monitor *m = skynet_malloc(sizeof(*m));
	memset(m, 0, sizeof(*m));
	m->count = thread;  // 记录线程数量
	m->sleep = 0;

	// 创建对应数量的skynet_monitor 并初始化
	m->m = skynet_malloc(thread * sizeof(struct skynet_monitor *));
	int i;
	for (i=0;i<thread;i++) {
		m->m[i] = skynet_monitor_new();
	}
	// 初始化互斥锁
	if (pthread_mutex_init(&m->mutex, NULL)) {
		fprintf(stderr, "Init mutex error");
		exit(1);
	}
	// 初始化条件变量
	if (pthread_cond_init(&m->cond, NULL)) {
		fprintf(stderr, "Init cond error");
		exit(1);
	}

	// 这里就是额外+的三个线程
	// 一条监视者线程，一条定时器线程，一条网络线程
	create_thread(&pid[0], thread_monitor, m);
	create_thread(&pid[1], thread_timer, m);
	create_thread(&pid[2], thread_socket, m);

	// 这里是设程的比重，关于消息队列的调度
	static int weight[] = { 
		-1, -1, -1, -1, 0, 0, 0, 0,
		1, 1, 1, 1, 1, 1, 1, 1, 
		2, 2, 2, 2, 2, 2, 2, 2, 
		3, 3, 3, 3, 3, 3, 3, 3, };
	// 声明对应数量的工作线程环境
	struct worker_parm wp[thread];
	
	// 初始化工作线程
	for (i=0;i<thread;i++) {
		wp[i].m = m;	// 关联服务器monitor
		wp[i].id = i;   // 关联线程id
		
		// 配置线程比重，这个比重有什么用之后分析
		// 如果配置了超过8条工作线程，会走else逻辑，比重都是0
		if (i < sizeof(weight)/sizeof(weight[0])) {
			wp[i].weight= weight[i];
		} else {
			wp[i].weight = 0;
		}
		
		// 创建工作线程，这里pid[i+3]，与上面对应
		create_thread(&pid[i+3], thread_worker, &wp[i]);
	}

	// 等待监视者线程，定时器线程，网络线程结束
	// 服务器正常运行，是不会结束的
	for (i=0;i<thread+3;i++) {
		pthread_join(pid[i], NULL); 
	}

	// 如果结束了，做清理工作
	free_monitor(m);
}
```

经过上面可以知道，其实服务器模型就是线程池模型，启动了一条监视者线程，一条定时器线程，一条网络线程和配置的工作线程。要想知道线程是怎么工作的，要对上面各个线程的工作函数进行逐一分析即可。下篇分析monitor。
