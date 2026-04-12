---
title: 从头开始读skynet源码（5）skynet.start服务器启动之后做了什么之thread_timer(skynet定时器)
date: 2021-03-21 21:48:14
updated: 2023-07-16 17:11:17
categories:
  - skynet
tags:
  - 后端 c语言
---
<!-- more -->

继续按照skynet.start中的顺序分析。分析skynet定时器。启动各个线程都会做类似的初始化。

## 定时器分析

这里要做一个前置理解，定时器，是只需要关心最近即将到来的任务，而不用关心距离现在比较远的任务，例如
1.你注册了100个定时任务，定时任务按照时间排序后
2.A任务2s后触发，B任务3h后触发，C任务h后触发……
3.当刷新时间的时候，需要去拿到即将到来的任务而需要关心之后的任务，这里就是只需要关心A任务，也就是你不需要去遍历所有任务列表拿到即将发生的任务，因为B之后的任务包括B，时间间隔太远了都不需要去关心。

所以定时器的设计需要：
1.查询快
2.做好排序
3.删除做完的任务之后不影响之前结构

常见的设计例如使用最小堆，时间轮，红黑树，而skynet使用的是时间轮。

时间轮的设计就类似于我们生活中的钟表，大概说就是，秒针走一圈，分针走一格，分针走一圈，时针走一格。
运用到程序中，大概就是，
1.我们只关心秒针的任务。
2.秒针的一圈任务执行完了之后，拿分针一格的任务分配到秒针各秒中。这样就我们每次都只会从秒针的任务中拿到需要执行的任务，和第1点一致。
3.分针的一圈任务执行完了之后，拿时针一格的任务分配到分针各分中。

### 先看定时器结构

```c
#define TIME_NEAR_SHIFT 8					// 临近时间转移量
#define TIME_NEAR (1 << TIME_NEAR_SHIFT)	// 临近时间量 0x10000
#define TIME_LEVEL_SHIFT 6					// 别的时间等级转移量
#define TIME_LEVEL (1 << TIME_LEVEL_SHIFT)	// 时间等级 0x1100
#define TIME_NEAR_MASK (TIME_NEAR-1)		// 临近时间掩码 0x1111
#define TIME_LEVEL_MASK (TIME_LEVEL-1)		// 别的时间等级掩码 0x1011

struct timer_event {
    uint32_t handle; //即是设置定时器的来源，又是超时消息发送的目标
    int session; //session，一个增ID，溢出了从1开始，所以不要设时间很长的timer
};

// 时间节点链表
struct timer_node {
	struct timer_node *next;	// 下一个节点地址
	uint32_t expire;			// 到期时间
};

// 定时器任务链表，
// 链表每个节点是一个时间节点链表
// 这里一定要清楚，定时器任务链表上每个节点是一个时间节点链表
// 即同一时间的任务链表
struct link_list {
	struct timer_node head;		// 头节点
	struct timer_node *tail;	// 尾节点
};

struct timer {
	// (临近时间)8 + 4*(另外等级)6 = 32，刚好32位
	struct link_list near[TIME_NEAR];	// 临近时间的定时器任务链表，也就是我上面说的秒针
	struct link_list t[4][TIME_LEVEL];	// 剩下的四个等级的任务链表

	struct spinlock lock;				// 自旋锁
	uint32_t time;						// 服务器经过的的tick数，每10毫秒tick一次
	uint32_t starttime;					// 程序启动时间戳
	uint64_t current;					// 启动到现在的耗时，精度10毫秒级
	uint64_t current_point;				// 当前时间，精度10毫秒级
};
```

### 定时器初始化

skynet_start中调用 skynet_timer_init初始化，在我的《从头开始读skynet源码（1）》中有写。

```c
// skynet_start中调用 skynet_timer_init初始化
void 
skynet_timer_init(void) {
	TI = timer_create_timer();
	uint32_t current = 0;
	systime(&TI->starttime, &current);
	TI->current = current;
	TI->current_point = gettime();
}

static struct timer *
timer_create_timer() {
	struct timer *r=(struct timer *)skynet_malloc(sizeof(struct timer));
	memset(r,0,sizeof(*r));

	int i,j;

	// 重置临近时间定时器任务链表
	for (i=0;i<TIME_NEAR;i++) {
		link_clear(&r->near[i]);
	}

	// 重置别的等级定时器任务链表
	for (i=0;i<4;i++) {
		for (j=0;j<TIME_LEVEL;j++) {
			link_clear(&r->t[i][j]);
		}
	}

	// 初始化按互斥锁
	SPIN_INIT(r)

	// 重置启动到现在的耗时
	r->current = 0;

	return r;
}

// 清空该任务节点
// 一次取出该任务节点的所有任务
static inline struct timer_node *
link_clear(struct link_list *list) {
	struct timer_node * ret = list->head.next;
	list->head.next = 0;
	list->tail = &(list->head);

	return ret;
}
```

## 启动定时器线程

```c
static void
start(int thread) {
 	...
	create_thread(&pid[1], thread_timer, m);
	...
}

// 定时器线程
static void *
thread_timer(void *p) {
	struct monitor * m = p;				// 拿到服务器 monitor
	skynet_initthread(THREAD_TIMER);    // 设置线程共享变量，标记为定时器线程
	
	// 线程死循环
	for (;;) {
		skynet_updatetime();			// 刷新skynet时间
		skynet_socket_updatetime();		// 更新socket的时间
		CHECK_ABORT						// 检查是否还有skynet服务
		wakeup(m,m->count-1);			// 尝试唤醒
		usleep(2500);	               	// 休息2.5毫秒
		
		// 如果收到退出信号，则退出循环
		if (SIG) {
			signal_hup();
			SIG = 0;
		}
	}
	// wakeup socket thread
	skynet_socket_exit();
	// wakeup all worker thread
	pthread_mutex_lock(&m->mutex);
	m->quit = 1;
	pthread_cond_broadcast(&m->cond);
	pthread_mutex_unlock(&m->mutex);
	return NULL;
}

// 如果有未工作的线程，将其唤醒（虚假唤醒）
static void
wakeup(struct monitor *m, int busy) {
	if (m->sleep >= m->count - busy) {
		// signal sleep worker, "spurious wakeup" is harmless
		pthread_cond_signal(&m->cond);
	}
}
```

可以看到，定时器就是每2.5毫秒刷新一次，至于定时任务的处理，**看到skynet_updatetime。这里就是skynet定时器的精华。**

### skynet_updatetime，定时器刷新

```c
void
skynet_updatetime(void) {
	uint64_t cp = gettime();		// 获取当前时间
	
	if(cp < TI->current_point) {	
		// 如果当前时间小于服务器时间则重置时间
		skynet_error(NULL, "time diff error: change from %lld to %lld", cp, TI->current_point);
		TI->current_point = cp;
	} else if (cp != TI->current_point) {
		// 如果当前时间大于等于服务器时间
		// 获取相差时间
		uint32_t diff = (uint32_t)(cp - TI->current_point);

		TI->current_point = cp;	// 更新服务器时间
		TI->current += diff;	// 更新启动到现在的耗时
		
		// 处理相差时间的定时任务
		int i;
		for (i=0;i<diff;i++) {
			timer_update(TI);
		}
	}
}

// 给一个时间差，处理相差时间的定时器任务
static void 
timer_update(struct timer *T) {
	SPIN_LOCK(T);		// 加锁

	// try to dispatch timeout 0 (rare condition)
	timer_execute(T);	// 处理任务

	// shift time first, and then dispatch timer message
	// 重新分配任务，也就是我说的秒针走了一圈，
	// 把分针任务分配到秒针的概念
	timer_shift(T);		

	// 再次尝试处理任务，类似分针走一格，重新分配秒针
	// 重新分配后，第一秒的任务也触发了
	timer_execute(T); 	

	SPIN_UNLOCK(T);	// 解锁
}

// 处理任务
static inline void
timer_execute(struct timer *T) {
	// 当前时间与时间掩码做&运算
	// 时间掩码 0x1111，&运算之后
	// 获得当前时间需要处理的所有任务链表
	// 我们只关心即将到来的所有任务
	int idx = T->time & TIME_NEAR_MASK; 
	
	while (T->near[idx].head.next) {
		// 如果该任务节点有任务，取出所有任务
		struct timer_node *current = link_clear(&T->near[idx]);
		SPIN_UNLOCK(T);
		// dispatch_list don't need lock T
		dispatch_list(current);
		SPIN_LOCK(T);
	}
}

// 分发时间任务
static inline void
dispatch_list(struct timer_node *current) {
	// 循环处理这个任务节点的所有任务
	do {
		// 获取任务结构，这个是注册定时器任务的时候加入的
		// 下面会有分析
		struct timer_event * event = (struct timer_event *)(current+1);

		// 给任务加上信息
		struct skynet_message message;
		message.source = 0;
		message.session = event->session; //这个很重要，接收侧靠它来识别是哪个timer
		message.data = NULL;
		message.sz = (size_t)PTYPE_RESPONSE << MESSAGE_TYPE_SHIFT;

		// 将任务放入消息队列
		skynet_context_push(event->handle, &message);
		
		// 获取下一个任务
		struct timer_node * temp = current;
		current=current->next;
		skynet_free(temp);	
	} while (current);
}

// skynet服务注册定时器任务
int
skynet_timeout(uint32_t handle, int time, int session) {
	if (time <= 0) {
		// 立刻触发
		struct skynet_message message;
		message.source = 0;
		message.session = session;
		message.data = NULL;
		message.sz = (size_t)PTYPE_RESPONSE << MESSAGE_TYPE_SHIFT;

		if (skynet_context_push(handle, &message)) {
			return -1;
		}
	} else {
		// 稍后触发
		struct timer_event event;
		event.handle = handle;	//记录是哪个skynet服务
		event.session = session;
		timer_add(TI, &event, sizeof(event), time);	//加入定时器任务链表
	}

	return session;
}

//加入定时器任务链表
static void
timer_add(struct timer *T,void *arg,size_t sz,int time) {
	struct timer_node *node = (struct timer_node *)skynet_malloc(sizeof(*node)+sz);
	memcpy(node+1,arg,sz);

	SPIN_LOCK(T);
		
	node->expire=time+T->time;	// 记录触发时间
	add_node(T,node);			// 加入到合适的节点

	SPIN_UNLOCK(T);
}

// 加入到合适的节点
static void
add_node(struct timer *T,struct timer_node *node) {
	uint32_t time=node->expire;		// 触发时间
	uint32_t current_time=T->time;	// 启动到现在经过的tick
	
	if ((time|TIME_NEAR_MASK)==(current_time|TIME_NEAR_MASK)) {
		// 如果是临近发生的，则丢入临近发生链表的对应节点
		// 触发时间 & 0x1111，获得触发时间对应的节点
		link(&T->near[time&TIME_NEAR_MASK],node);
	} else {
		// 如果不是临近发生的，则丢入对应的链表
		int i;
		uint32_t mask=TIME_NEAR << TIME_LEVEL_SHIFT;
		// 在接下来的三等级中寻找
		for (i=0;i<3;i++) {
			if ((time|(mask-1))==(current_time|(mask-1))) {
				break;
			}
			mask <<= TIME_LEVEL_SHIFT;
		}
		// 如果不是前面三个等级，则是第四个等级
		link(&T->t[i][((time>>(TIME_NEAR_SHIFT + i*TIME_LEVEL_SHIFT)) & TIME_LEVEL_MASK)],node);	
	}
}

// 将时间节点加入
tatic inline void
link(struct link_list *list,struct timer_node *node) {
	list->tail->next = node;
	list->tail = node;
	node->next=0;
}
```

### skynet_socket_updatetime 网络线程刷新时间

```c
void
skynet_socket_updatetime() {
	socket_server_updatetime(SOCKET_SERVER, skynet_now());
}

void
socket_server_updatetime(struct socket_server *ss, uint64_t time) {
	ss->time = time;
}
```

至此，定时器方面的分析，大概完毕，下篇分享thread_socket，skynet网络线程。
