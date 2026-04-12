---
title: 从头开始读skynet源码（6）skynet.start服务器启动之后做了什么之thread_socket(skynet网络线程（一）)
date: 2021-04-04 15:17:44
updated: 2023-07-16 17:11:17
categories:
  - skynet
tags:
  - c语言
---
<!-- more -->

接上回，继续分析skynet网络线程。主要分析的是tcp，
网络很长很长，需要分两篇分析：
1分析别的线程向socket线程发送消息。
2分析客户端向socket线程发送消息。
网络线程执行代码如下。

## socket_server的创建

skynet_state.c中调用的时候调用skynet_socket_init初始化，这里有一个需要需要的地方，

```c
void 
skynet_socket_init() {
	SOCKET_SERVER = socket_server_create(skynet_now());
}

struct socket_server * 
socket_server_create(uint64_t time) {
	int i;
	int fd[2];					// 声明两个管道，读和写
	poll_fd efd = sp_create();	// 创建epoll
	// 检查epoll是否创建成功
	if (sp_invalid(efd)) {
		fprintf(stderr, "socket-server: create event pool failed.\n");
		return NULL;
	}
	// 创建读、写管道
	if (pipe(fd)) {
		sp_release(efd);
		fprintf(stderr, "socket-server: create socket pair failed.\n");
		return NULL;
	}
	// 将读管道加入epoll，并监听可读
	if (sp_add(efd, fd[0], NULL)) {
		// add recvctrl_fd to event poll
		fprintf(stderr, "socket-server: can't add server fd to event pool.\n");
		close(fd[0]);
		close(fd[1]);
		sp_release(efd);
		return NULL;
	}

	// 创建socket_server
	struct socket_server *ss = MALLOC(sizeof(*ss));	
	ss->time = time;			// 关联创建时间
	ss->event_fd = efd;			// 关联epoll
	ss->recvctrl_fd = fd[0];	// 关联读管道
	ss->sendctrl_fd = fd[1];	// 关联写管道
	ss->checkctrl = 1;			// 将其他线程通知初始化为1，即啊有通知

	// 一个socket_server创建32个socket结构
	// 每个socket都是用于向外部发送消息的
	// 也就是说，别的线程发过来的消息会通过这32个socket结构发出去
	for (i=0;i<MAX_SOCKET;i++) {
		struct socket *s = &ss->slot[i];
		s->type = SOCKET_TYPE_INVALID;		// type 初始化为SOCKET_TYPE_INVALID
		clear_wb_list(&s->high);			// 清空高优先级列表
		clear_wb_list(&s->low);				// 清空低优先级列表
		spinlock_init(&s->dw_lock);			// 自旋锁初始化
	}
	ss->alloc_id = 0;
	ss->event_n = 0;
	ss->event_index = 0;
	memset(&ss->soi, 0, sizeof(ss->soi));
	FD_ZERO(&ss->rfds);
	assert(ss->recvctrl_fd < FD_SETSIZE);

	return ss;
}
```

## socket线程工作流程

```c
#define CHECK_ABORT if (skynet_context_total()==0) break;

static void *
thread_socket(void *p) {
	struct monitor * m = p;				// 拿到服务器 monitor
	skynet_initthread(THREAD_SOCKET);	// 设置线程共享变量，标记为网络线程
	for (;;) {
		int r = skynet_socket_poll();	// socket处理
		if (r==0)
			break;
		if (r<0) {
			CHECK_ABORT					// 如果socket返回值小于0，判断服务器时候还存在skynet服务
			continue;
		}
		wakeup(m,0);					// 如果没有工作线程，则通过条件变量唤醒线程
	}
	return NULL;
}
```

可以看到，主要的socket处理就是skynet_socket_poll，看到skynet_socket_poll。

```c
int 
skynet_socket_poll() {
	struct socket_server *ss = SOCKET_SERVER;			// 获得socket_server
	assert(ss);
	struct socket_message result;						// 声明socket消息
	int more = 1;
	int type = socket_server_poll(ss, &result, &more);	// 获取消息类型
	// 按照不同的类型处理消息
	switch (type) {
	case SOCKET_EXIT:
		return 0;
	case SOCKET_DATA:
		forward_message(SKYNET_SOCKET_TYPE_DATA, false, &result);
		break;
	case SOCKET_CLOSE:
		forward_message(SKYNET_SOCKET_TYPE_CLOSE, false, &result);
		break;
	case SOCKET_OPEN:
		forward_message(SKYNET_SOCKET_TYPE_CONNECT, true, &result);
		break;
	case SOCKET_ERR:
		forward_message(SKYNET_SOCKET_TYPE_ERROR, true, &result);
		break;
	case SOCKET_ACCEPT:
		forward_message(SKYNET_SOCKET_TYPE_ACCEPT, true, &result);
		break;
	case SOCKET_UDP:
		forward_message(SKYNET_SOCKET_TYPE_UDP, false, &result);
		break;
	case SOCKET_WARNING:
		forward_message(SKYNET_SOCKET_TYPE_WARNING, false, &result);
		break;
	default:
		skynet_error(NULL, "Unknown socket message type %d.",type);
		return -1;
	}
	if (more) {
		return -1;
	}
	return 1;
}
```

可以看到，就是获取socket消息类型并处理的过程。按照以下顺序分析：
1.socket_server的结构、socket的结构，socket消息结构。
2.socket_server_poll获取消息类型。
3.别的服务发来socket各个消息怎么处理的。

## socket相关结构

先简单看一下相关结构

```c
// socket_server.c
// socket write 链表节点结构
struct write_buffer {
	struct write_buffer * next;	
	void *buffer;
	char *ptr;
	int sz;
	bool userobject;
	uint8_t udp_address[UDP_ADDRESS_SIZE];
};

#define SIZEOF_TCPBUFFER (offsetof(struct write_buffer, udp_address[0]))
#define SIZEOF_UDPBUFFER (sizeof(struct write_buffer))

// socket write 链表
struct wb_list {
	struct write_buffer * head;
	struct write_buffer * tail;
};

struct socket_stat {
	uint64_t rtime;
	uint64_t wtime;
	uint64_t read;
	uint64_t write;
};

struct socket {
	uintptr_t opaque;
	struct wb_list high;		// 高优先级发送队列，wb是write buff
	struct wb_list low;			// 低优先级发送队列
	int64_t wb_size;			// 发送字节大小
	struct socket_stat stat;	// socket 的发送记录
	volatile uint32_t sending;	// 
	int fd;						// socket文件描述符
	int id;						// 位于socket_server的slot列表中的位置
	uint8_t protocol;			// tcp or udp
	uint8_t type;				// epoll事件触发时，会根据type来选择处理事件的逻辑
	uint16_t udpconnecting;
	int64_t warn_size;
	union {
		int size;
		uint8_t udp_address[UDP_ADDRESS_SIZE];
	} p;
	struct spinlock dw_lock;	// 自旋锁
	int dw_offset;
	const void * dw_buffer;
	size_t dw_size;
};

struct socket_server {
	volatile uint64_t time;
	int recvctrl_fd;			// 接收管道消息的文件描述
	int sendctrl_fd;			// 发送管道消息的文件描述
	int checkctrl;				// 判断是否有其他线程通过管道，向socket线程发送消息的标记变量
	poll_fd event_fd;			// epoll实例id
	int alloc_id;				// 已经分配的socket slot列表id
	int event_n;				// 标记本次epoll事件的数量
	int event_index;			// 下一个未处理的epoll事件索引
	struct socket_object_interface soi;
	struct event ev[MAX_EVENT];	// epoll事件列表
	struct socket slot[MAX_SOCKET];	// socket 列表
	char buffer[MAX_INFO];			// 地址信息转成字符串以后，存在这里
	uint8_t udpbuffer[MAX_UDP_PACKAGE];
	fd_set rfds;					// 文件描述符集合
};

// socket_server.h
struct socket_message {
	int id;				// skynet socket_server中32个socket结构中的哪个socket发出的消息
	uintptr_t opaque;	// 哪个skynet服务
	int ud;	// for accept, ud is new connection id ; for data, ud is size of data 如果是accept，ud是连接文件描述符，如果是data，ud是数据大小
	char * data;	// 数据
};
```

## socket_server_poll获取消息类型

```c
// return type
int 
socket_server_poll(struct socket_server *ss, struct socket_message * result, int * more) {
	// 进来就是个死循环
	for (;;) {
		// 是否有其他线程通过管道，向socket线程发送消息
		// 这里是本篇分析
		if (ss->checkctrl) {
			// 判断是否有可读事件，函数之后有分析
			if (has_cmd(ss)) {
				int type = ctrl_cmd(ss, result);			// 判断消息类型并返回，函数之后有分析
				if (type != -1) {
					// 如果获得消息类型，清零标记并返回
					clear_closed_event(ss, result, type);
					return type;
				} else
					// 无法获取类型则继续
					continue;
			} else {
				ss->checkctrl = 0;	// 没有可读事件就重置标志
			}
		}
		// 下一个处理的epool事件索引 与 本次epoll事件的数量 是否相等
		// 这里下一篇分析
		if (ss->event_index == ss->event_n) {
			ss->event_n = sp_wait(ss->event_fd, ss->ev, MAX_EVENT);
			ss->checkctrl = 1;
			if (more) {
				*more = 0;
			}
			ss->event_index = 0;
			if (ss->event_n <= 0) {
				ss->event_n = 0;
				if (errno == EINTR) {
					continue;
				}
				return -1;
			}
		}
		struct event *e = &ss->ev[ss->event_index++];
		struct socket *s = e->s;
		if (s == NULL) {
			// dispatch pipe message at beginning
			continue;
		}
		struct socket_lock l;
		socket_lock_init(s, &l);
		switch (s->type) {
		case SOCKET_TYPE_CONNECTING:
			return report_connect(ss, s, &l, result);
		case SOCKET_TYPE_LISTEN: {
			int ok = report_accept(ss, s, result);
			if (ok > 0) {
				return SOCKET_ACCEPT;
			} if (ok < 0 ) {
				return SOCKET_ERR;
			}
			// when ok == 0, retry
			break;
		}
		case SOCKET_TYPE_INVALID:
			fprintf(stderr, "socket-server: invalid socket\n");
			break;
		default:
			if (e->read) {
				int type;
				if (s->protocol == PROTOCOL_TCP) {
					type = forward_message_tcp(ss, s, &l, result);
				} else {
					type = forward_message_udp(ss, s, &l, result);
					if (type == SOCKET_UDP) {
						// try read again
						--ss->event_index;
						return SOCKET_UDP;
					}
				}
				if (e->write && type != SOCKET_CLOSE && type != SOCKET_ERR) {
					// Try to dispatch write message next step if write flag set.
					e->read = false;
					--ss->event_index;
				}
				if (type == -1)
					break;				
				return type;
			}
			if (e->write) {
				int type = send_buffer(ss, s, &l, result);
				if (type == -1)
					break;
				return type;
			}
			if (e->error) {
				// close when error
				int error;
				socklen_t len = sizeof(error);  
				int code = getsockopt(s->fd, SOL_SOCKET, SO_ERROR, &error, &len);  
				const char * err = NULL;
				if (code < 0) {
					err = strerror(errno);
				} else if (error != 0) {
					err = strerror(error);
				} else {
					err = "Unknown error";
				}
				force_close(ss, s, &l, result);
				result->data = (char *)err;
				return SOCKET_ERR;
			}
			if(e->eof) {
				force_close(ss, s, &l, result);
				return SOCKET_CLOSE;
			}
			break;
		}
	}
}

// 不阻塞判断是否有可读事件
static int
has_cmd(struct socket_server *ss) {
	struct timeval tv = {0,0};	// 声明超时时间
	int retval;					// 返回值

	FD_SET(ss->recvctrl_fd, &ss->rfds);	//将读管道描述符加入文件描述符集合

	// 用select判断是否有可读事件
	retval = select(ss->recvctrl_fd+1, &ss->rfds, NULL, NULL, &tv);
	if (retval == 1) {
		return 1;
	}
	return 0;
}

// return type
// 获取事件类型
static int
ctrl_cmd(struct socket_server *ss, struct socket_message *result) {
	int fd = ss->recvctrl_fd;	//拿到读管道描述符
	// the length of message is one byte, so 256+8 buffer size is enough.
	uint8_t buffer[256];
	uint8_t header[2];
	block_readpipe(fd, header, sizeof(header));	// 阻塞的读取消息头信息
	int type = header[0];						// 从头信息获取消息类型
	int len = header[1];						// 从头信息获取消息长度
	block_readpipe(fd, buffer, len);			// 阻塞读取消息内容 
	// ctrl command only exist in local fd, so don't worry about endian.
	// 按照类型处理消息，下面会逐一分析各个函数
	switch (type) {
	case 'S':
		return start_socket(ss,(struct request_start *)buffer, result);
	case 'B':
		return bind_socket(ss,(struct request_bind *)buffer, result);
	case 'L':
		return listen_socket(ss,(struct request_listen *)buffer, result);
	case 'K':
		return close_socket(ss,(struct request_close *)buffer, result);
	case 'O':
		return open_socket(ss, (struct request_open *)buffer, result);
	case 'X':
		result->opaque = 0;
		result->id = 0;
		result->ud = 0;
		result->data = NULL;
		return SOCKET_EXIT;
	case 'D':
	case 'P': {
		int priority = (type == 'D') ? PRIORITY_HIGH : PRIORITY_LOW;
		struct request_send * request = (struct request_send *) buffer;
		int ret = send_socket(ss, request, result, priority, NULL);
		dec_sending_ref(ss, request->id);
		return ret;
	}
	case 'A': {
		struct request_send_udp * rsu = (struct request_send_udp *)buffer;
		return send_socket(ss, &rsu->send, result, PRIORITY_HIGH, rsu->address);
	}
	case 'C':
		return set_udp_address(ss, (struct request_setudp *)buffer, result);
	case 'T':
		setopt_socket(ss, (struct request_setopt *)buffer);
		return -1;
	case 'U':
		add_udp_socket(ss, (struct request_udp *)buffer);
		return -1;
	default:
		fprintf(stderr, "socket-server: Unknown ctrl %c.\n",type);
		return -1;
	};

	return -1;
}
```

## 别的服务发过来 socket 各个消息类型的处理

这里按照open—->listen—->bind—->start—->再往后分析

### open_socket

```c
// 请求opensocket的消息类型
struct request_open {
	int id;
	int port;
	uintptr_t opaque;
	char host[1];
};

// return -1 when connecting
// 一个新的连接
static int
open_socket(struct socket_server *ss, struct request_open * request, struct socket_message *result) {
	int id = request->id;					// 获取id
	result->opaque = request->opaque;		// 绑定这个socket对应的skynet服务
	result->id = id;						// 绑定定位于socket_server的slot列表中的位置
	result->ud = 0;
	result->data = NULL;
	struct socket *ns;						// 声明一个socket结构
	int status;								// 声明一个变量待会用来接收返回值
	struct addrinfo ai_hints;
	struct addrinfo *ai_list = NULL;
	struct addrinfo *ai_ptr = NULL;
	char port[16];
	sprintf(port, "%d", request->port);
	memset(&ai_hints, 0, sizeof( ai_hints ) );
	ai_hints.ai_family = AF_UNSPEC;
	ai_hints.ai_socktype = SOCK_STREAM;
	ai_hints.ai_protocol = IPPROTO_TCP;

	// 处理名字到地址以及服务到端口这两种转换，返回的是一个addrinfo的结构（列表）指针
	status = getaddrinfo( request->host, port, &ai_hints, &ai_list );
	if ( status != 0 ) {
		result->data = (void *)gai_strerror(status);	//如果失败收集错误信息
		goto _failed;
	}
	int sock= -1;
	// 遍历addrinfo链表
	for (ai_ptr = ai_list; ai_ptr != NULL; ai_ptr = ai_ptr->ai_next ) {
		// 根据信息，创建socket文件描述符
		sock = socket( ai_ptr->ai_family, ai_ptr->ai_socktype, ai_ptr->ai_protocol );
		if ( sock < 0 ) {
			continue;
		}
		socket_keepalive(sock);	// 设置为keepalive会自动发送心跳包检测
		sp_nonblocking(sock);	// 设置非阻塞
		
		// 建立socket连接
		status = connect( sock, ai_ptr->ai_addr, ai_ptr->ai_addrlen);
		if ( status != 0 && errno != EINPROGRESS) {
			close(sock);
			sock = -1;
			continue;
		}
		break;
	}

	if (sock < 0) {
		result->data = strerror(errno);
		goto _failed;
	}

	// 创建一个socket结构，关联到epoll
	ns = new_fd(ss, id, sock, PROTOCOL_TCP, request->opaque, true);
	if (ns == NULL) {
		close(sock);
		result->data = "reach skynet socket number limit";
		goto _failed;
	}

	if(status == 0) {
		
		ns->type = SOCKET_TYPE_CONNECTED;
		struct sockaddr * addr = ai_ptr->ai_addr;
		void * sin_addr = (ai_ptr->ai_family == AF_INET) ? (void*)&((struct sockaddr_in *)addr)->sin_addr : (void*)&((struct sockaddr_in6 *)addr)->sin6_addr;
		if (inet_ntop(ai_ptr->ai_family, sin_addr, ss->buffer, sizeof(ss->buffer))) {
			result->data = ss->buffer;
		}
		freeaddrinfo( ai_list );
		return SOCKET_OPEN;
	} else {
		ns->type = SOCKET_TYPE_CONNECTING;
		sp_write(ss->event_fd, ns->fd, ns, true);
	}

	freeaddrinfo( ai_list );
	return -1;
_failed:
	freeaddrinfo( ai_list );
	ss->slot[HASH_ID(id)].type = SOCKET_TYPE_INVALID;
	return SOCKET_ERR;
}

// 为一个新的连接创建一个epool
static struct socket *
new_fd(struct socket_server *ss, int id, int fd, int protocol, uintptr_t opaque, bool add) {
	struct socket * s = &ss->slot[HASH_ID(id)];
	assert(s->type == SOCKET_TYPE_RESERVE);

	// 如果是add，则添加对fd监听读事件
	if (add) {
		if (sp_add(ss->event_fd, fd, s)) {
			// 监听失败处理
			s->type = SOCKET_TYPE_INVALID;
			return NULL;
		}
	}

	s->id = id;								// 绑定solt中的位置
	s->fd = fd;								// 绑定fd
	s->sending = ID_TAG16(id) << 16 | 0;	
	s->protocol = protocol;					// 协议
	s->p.size = MIN_READ_BUFFER;		
	s->opaque = opaque;						// 绑定skynet服务
	s->wb_size = 0;
	s->warn_size = 0;
	check_wb_list(&s->high);				// 清空高优先级队列
	check_wb_list(&s->low);					// 清空低优先级队列
	s->dw_buffer = NULL;
	s->dw_size = 0;
	memset(&s->stat, 0, sizeof(s->stat));
	return s;
}
```

### listen_socket

```c
struct request_listen {
	int id;
	int fd;
	uintptr_t opaque;
	char host[1];
};

static int
listen_socket(struct socket_server *ss, struct request_listen * request, struct socket_message *result) {
	int id = request->id;				// 获取id
	int listen_fd = request->fd;		// 获取fd
	// 这个上面已分析
	struct socket *s = new_fd(ss, id, listen_fd, PROTOCOL_TCP, request->opaque, false);
	if (s == NULL) {
		goto _failed;
	}
	s->type = SOCKET_TYPE_PLISTEN;		// 记录类型
	return -1;
_failed:
	close(listen_fd);
	result->opaque = request->opaque;
	result->id = id;
	result->ud = 0;
	result->data = "reach skynet socket number limit";
	ss->slot[HASH_ID(id)].type = SOCKET_TYPE_INVALID;

	return SOCKET_ERR;
}
```

### bind_socket

```c
struct request_bind {
	int id;
	int fd;
	uintptr_t opaque;
};

static int
bind_socket(struct socket_server *ss, struct request_bind *request, struct socket_message *result) {
	int id = request->id;				// 获取请求的id
	result->id = id;					// 绑定id
	result->opaque = request->opaque;	// 绑定服务
	result->ud = 0;
	
	// 这个函数上面分析过了
	struct socket *s = new_fd(ss, id, request->fd, PROTOCOL_TCP, request->opaque, true);
	if (s == NULL) {
		result->data = "reach skynet socket number limit";
		return SOCKET_ERR;
	}
	sp_nonblocking(request->fd);	// 设置非阻塞
	s->type = SOCKET_TYPE_BIND;		// 设置类型
	result->data = "binding";
	return SOCKET_OPEN;
}
```

### start_socket

```c
// socket 开始工作
static int
start_socket(struct socket_server *ss, struct request_start *request, struct socket_message *result) {
	int id = request->id;						// 从接受到的消息获取id
	result->id = id;							// 绑定位于socket_server的slot列表中的位置
	result->opaque = request->opaque;			// 绑定与本socket关联的服务地址
	result->ud = 0;								// ud设置为0
	result->data = NULL;						// data为 null
	struct socket *s = &ss->slot[HASH_ID(id)];	// 将id进行hash并存贮

	// 判断是否为无效的socket
	if (s->type == SOCKET_TYPE_INVALID || s->id !=id) {
		result->data = "invalid socket";
		return SOCKET_ERR;
	}
	struct socket_lock l;
	socket_lock_init(s, &l);
	if (s->type == SOCKET_TYPE_PACCEPT || s->type == SOCKET_TYPE_PLISTEN) {
		if (sp_add(ss->event_fd, s->fd, s)) {
			force_close(ss, s, &l, result);
			result->data = strerror(errno);
			return SOCKET_ERR;
		}
		s->type = (s->type == SOCKET_TYPE_PACCEPT) ? SOCKET_TYPE_CONNECTED : SOCKET_TYPE_LISTEN;
		s->opaque = request->opaque;
		result->data = "start";
		return SOCKET_OPEN;
	} else if (s->type == SOCKET_TYPE_CONNECTED) {
		// todo: maybe we should send a message SOCKET_TRANSFER to s->opaque
		s->opaque = request->opaque;
		result->data = "transfer";
		return SOCKET_OPEN;
	}
	// if s->type == SOCKET_TYPE_HALFCLOSE , SOCKET_CLOSE message will send later
	return -1;
}
```

### close_socket

这里我们还需要额外看一看两个方法sp_write，force_close

```c
struct request_close {
	int id;
	int shutdown;
	uintptr_t opaque;
};

// 判断发送队列是否为空
static inline int
send_buffer_empty(struct socket *s) {
	return (s->high.head == NULL && s->low.head == NULL);
}

// 判断是否还有消息
static inline int
nomore_sending_data(struct socket *s) {
	return send_buffer_empty(s) && s->dw_buffer == NULL && (s->sending & 0xffff) == 0;
}

static int
close_socket(struct socket_server *ss, struct request_close *request, struct socket_message *result) {
	int id = request->id;							// 获取id
	struct socket * s = &ss->slot[HASH_ID(id)];		// 获取socket结构

	// 如果已经是无效的socket
	if (s->type == SOCKET_TYPE_INVALID || s->id != id) {
		result->id = id;
		result->opaque = request->opaque;
		result->ud = 0;
		result->data = NULL;
		return SOCKET_CLOSE;
	}
	struct socket_lock l;
	socket_lock_init(s, &l);	// 读写锁
	if (!nomore_sending_data(s)) {
		// 如果还有消息没发送则发送完
		int type = send_buffer(ss,s,&l,result);
		// type : -1 or SOCKET_WARNING or SOCKET_CLOSE, SOCKET_WARNING means nomore_sending_data
		if (type != -1 && type != SOCKET_WARNING)
			return type;
	}
	if (request->shutdown || nomore_sending_data(s)) {
		// 没有消息了，可以关闭
		force_close(ss,s,&l,result);
		result->id = id;
		result->opaque = request->opaque;
		return SOCKET_CLOSE;
	}
	s->type = SOCKET_TYPE_HALFCLOSE;

	return -1;
}

/*
	Each socket has two write buffer list, high priority and low priority.

	1. send high list as far as possible.
	2. If high list is empty, try to send low list.
	3. If low list head is uncomplete (send a part before), move the head of low list to empty high list (call raise_uncomplete) .
	4. If two lists are both empty, turn off the event. (call check_close)
 */
static int
send_buffer_(struct socket_server *ss, struct socket *s, struct socket_lock *l, struct socket_message *result) {
	assert(!list_uncomplete(&s->low));
	// step 1
	if (send_list(ss,s,&s->high,l,result) == SOCKET_CLOSE) {
		return SOCKET_CLOSE;
	}
	if (s->high.head == NULL) {
		// step 2
		if (s->low.head != NULL) {
			if (send_list(ss,s,&s->low,l,result) == SOCKET_CLOSE) {
				return SOCKET_CLOSE;
			}
			// step 3
			if (list_uncomplete(&s->low)) {
				raise_uncomplete(s);
				return -1;
			}
			if (s->low.head)
				return -1;
		} 
		// step 4
		assert(send_buffer_empty(s) && s->wb_size == 0);
		sp_write(ss->event_fd, s->fd, s, false);			

		if (s->type == SOCKET_TYPE_HALFCLOSE) {
				force_close(ss, s, l, result);
				return SOCKET_CLOSE;
		}
		if(s->warn_size > 0){
				s->warn_size = 0;
				result->opaque = s->opaque;
				result->id = s->id;
				result->ud = 0;
				result->data = NULL;
				return SOCKET_WARNING;
		}
	}

	return -1;
}

static void 
sp_write(int efd, int sock, void *ud, bool enable) {
	struct epoll_event ev;
	ev.events = EPOLLIN | (enable ? EPOLLOUT : 0);
	ev.data.ptr = ud;
	epoll_ctl(efd, EPOLL_CTL_MOD, sock, &ev);
}

static void
force_close(struct socket_server *ss, struct socket *s, struct socket_lock *l, struct socket_message *result) {
	result->id = s->id;				// 关联id
	result->ud = 0;					
	result->data = NULL;	
	result->opaque = s->opaque;		// 关联服务
	if (s->type == SOCKET_TYPE_INVALID) {
		return;
	}
	assert(s->type != SOCKET_TYPE_RESERVE);
	free_wb_list(ss,&s->high);		// 清空高优先级队列
	free_wb_list(ss,&s->low);		// 清空低优先级队列
	if (s->type != SOCKET_TYPE_PACCEPT && s->type != SOCKET_TYPE_PLISTEN) {
		sp_del(ss->event_fd, s->fd);	//删除对fd的监听
	}
	socket_lock(l);						// 上锁
	if (s->type != SOCKET_TYPE_BIND) {
		if (close(s->fd) < 0) {			// 关闭fd
			perror("close socket:");
		}
	}
	s->type = SOCKET_TYPE_INVALID;
	if (s->dw_buffer) {
		free_buffer(ss, s->dw_buffer, s->dw_size);	//释放buff
		s->dw_buffer = NULL;
	}
	socket_unlock(l);					// 解锁
}
```

### send_socket

```c
/*
	When send a package , we can assign the priority : PRIORITY_HIGH or PRIORITY_LOW

	If socket buffer is empty, write to fd directly.
		If write a part, append the rest part to high list. (Even priority is PRIORITY_LOW)
	Else append package to high (PRIORITY_HIGH) or low (PRIORITY_LOW) list.
 */

struct request_send {
	int id;
	int sz;
	char * buffer;
};

struct send_object {
	void * buffer;
	int sz;
	void (*free_func)(void *);
};

static int
send_socket(struct socket_server *ss, struct request_send * request, struct socket_message *result, int priority, const uint8_t *udp_address) {
	int id = request->id;						// 获取id
	struct socket * s = &ss->slot[HASH_ID(id)];	// 获取socket 结构
	struct send_object so;						// 声明发送对象
	send_object_init(ss, &so, request->buffer, request->sz);
	// 判断socket是否是无效
	if (s->type == SOCKET_TYPE_INVALID || s->id != id 
		|| s->type == SOCKET_TYPE_HALFCLOSE
		|| s->type == SOCKET_TYPE_PACCEPT) {
		so.free_func(request->buffer);
		return -1;
	}
	// 判断是否是listen类型socket
	if (s->type == SOCKET_TYPE_PLISTEN || s->type == SOCKET_TYPE_LISTEN) {
		fprintf(stderr, "socket-server: write to listen fd %d.\n", id);
		so.free_func(request->buffer);
		return -1;
	}
	// 如果没有数据，或者是连接中的socket
	if (send_buffer_empty(s) && s->type == SOCKET_TYPE_CONNECTED) {
		if (s->protocol == PROTOCOL_TCP) {
			append_sendbuffer(ss, s, request);	// add to high priority list, even priority == PRIORITY_LOW
		} else {
			// udp
			if (udp_address == NULL) {
				udp_address = s->p.udp_address;
			}
			union sockaddr_all sa;
			socklen_t sasz = udp_socket_address(s, udp_address, &sa);
			if (sasz == 0) {
				// udp type mismatch, just drop it.
				fprintf(stderr, "socket-server: udp socket (%d) type mistach.\n", id);
				so.free_func(request->buffer);
				return -1;
			}
			int n = sendto(s->fd, so.buffer, so.sz, 0, &sa.s, sasz);
			if (n != so.sz) {
				append_sendbuffer_udp(ss,s,priority,request,udp_address);
			} else {
				stat_write(ss,s,n);
				so.free_func(request->buffer);
				return -1;
			}
		}
		sp_write(ss->event_fd, s->fd, s, true);	// 监听写就绪事件
	} else {
		// 正常的可以直接发送的socket
		if (s->protocol == PROTOCOL_TCP) {
			// 如果是tcp，按照队列优先级添加
			if (priority == PRIORITY_LOW) {
				append_sendbuffer_low(ss, s, request);
			} else {
				append_sendbuffer(ss, s, request);
			}
		} else {
			if (udp_address == NULL) {
				udp_address = s->p.udp_address;
			}
			append_sendbuffer_udp(ss,s,priority,request,udp_address);
		}
	}
	// 如果发送的包太大，则报一个警告
	if (s->wb_size >= WARNING_SIZE && s->wb_size >= s->warn_size) {
		s->warn_size = s->warn_size == 0 ? WARNING_SIZE *2 : s->warn_size*2;
		result->opaque = s->opaque;
		result->id = s->id;
		result->ud = s->wb_size%1024 == 0 ? s->wb_size/1024 : s->wb_size/1024 + 1;
		result->data = NULL;
		return SOCKET_WARNING;
	}
	return -1;
}

// 发送对象初始化
static inline bool
send_object_init(struct socket_server *ss, struct send_object *so, void *object, int sz) {
	if (sz < 0) {
		so->buffer = ss->soi.buffer(object);
		so->sz = ss->soi.size(object);
		so->free_func = ss->soi.free;
		return true;
	} else {
		so->buffer = object;
		so->sz = sz;
		so->free_func = FREE;
		return false;
	}
}

// 添加到发送队列
static inline void
append_sendbuffer(struct socket_server *ss, struct socket *s, struct request_send * request) {
	struct write_buffer *buf = append_sendbuffer_(ss, &s->high, request, SIZEOF_TCPBUFFER);
	s->wb_size += buf->sz;
}

static struct write_buffer *
append_sendbuffer_(struct socket_server *ss, struct wb_list *s, struct request_send * request, int size) {
	struct write_buffer * buf = MALLOC(size);
	struct send_object so;
	buf->userobject = send_object_init(ss, &so, request->buffer, request->sz);
	buf->ptr = (char*)so.buffer;
	buf->sz = so.sz;
	buf->buffer = request->buffer;
	buf->next = NULL;
	if (s->head == NULL) {
		s->head = s->tail = buf;
	} else {
		assert(s->tail != NULL);
		assert(s->tail->next == NULL);
		s->tail->next = buf;
		s->tail = buf;
	}
	return buf;
}
```

至此，别的线程发送到网络线程的消息已经大概分析完毕，下篇分析客户端发过来数据，网络线程怎么处理。
