---
title: redis list插入失败，服务器与redis调试过程记录（redis连接列表，redis日志，redis监视着模式）。
date: 2021-07-20 21:29:02
updated: 2023-07-16 17:11:17
categories:
  - redis
tags:
  - redis
---
<!-- more -->

前段时间在项目中碰到一个redis list插不进去的问题。背景是使用了redis list做消息队列，有两个服务器，server1存贮的redis string 类型的key的value是服务器1自己的mq1，server2要将消息插入server1的mq1。然后server1在读出这个mq1中存贮的消息。再去做一些业务操作。server1对mq1采用的是brpop，也就是阻塞的拿消息。

下面将mq这个redis list的key成为mq1。

我碰到了一个很奇葩的问题，server2从redis中读出了mq1，然后往mq1插入也没有报错。但是server1对mq1进行brpop一直拿不到消息。很是纳闷。甚至一度以为redis除了问题。下面进入艰难的调试过程。

# 先查看redis有多少连接

因为无论哪个server，对redis来说都是client进行操作，就想查看redis的连接。是会不会有别的server和我pop了同一个list，可以用client list命令查看。下面的输出是举例，调试时的输出已经过去太久找不到了。例如：

```bash
127.0.0.1:6006> client list
id=381 addr=192.xxx.xx.x:27804 fd=15 name= age=1367 idle=36 flags=b db=0 sub=0 psub=0 multi=-1 qbuf=0 qbuf-free=0 obl=0 oll=0 omem=0 events=r cmd=brpop
id=385 addr=192.xxx.xx.x:52192 fd=10 name= age=8 idle=0 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=26 qbuf-free=32742 obl=0 oll=0 omem=0 events=r cmd=client
id=378 addr=192.xxx.xx.x:27316 fd=12 name= age=1367 idle=254 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=0 qbuf-free=0 obl=0 oll=0 omem=0 events=r cmd=get
id=382 addr=192.xxx.xx.x:27820 fd=16 name= age=1367 idle=33 flags=b db=0 sub=0 psub=0 multi=-1 qbuf=0 qbuf-free=0 obl=0 oll=0 omem=0 events=r cmd=brpop
id=379 addr=192.xxx.xx.x:27328 fd=13 name= age=1367 idle=1367 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=0 qbuf-free=0 obl=0 oll=0 omem=0 events=r cmd=info
id=380 addr=192.xxx.xx.x:27334 fd=14 name= age=1367 idle=1212 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=0 qbuf-free=0 obl=0 oll=0 omem=0 events=r cmd=exec
id=10 addr=192.168.96.5:51404 fd=9 name= age=950692 idle=950692 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=0 qbuf-free=0 obl=0 oll=0 omem=0 events=r cmd=ping
id=9 addr=192.168.96.5:51402 fd=8 name= age=950692 idle=950692 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=0 qbuf-free=0 obl=0 oll=0 omem=0 events=r cmd=info
```

在我查看之后，发现的确时一个lpush，一个pop都没有。（这些输出参数都有意义，感兴趣可以自己查一下）

# 查redis日志

每个服务器对于redis来说都是client，如果能查日志就好了，经过查询资料，可以用以下方式查日志。这个方式一般来说是用来查询慢查询的日志，但是可以设置，把慢查询的日志设置为0，既可以获取所有日志。

```shell
# 查询log的时间阀值(微秒，一毫秒等于1000微秒)，大于该数字的语句才会记录。负数表示不记录，0记录所有的。
`config get slowlog-log-slower-than`  

# 设置log的时间阀值为0毫秒
`config set slowlog-log-slower-than 0`  

# 查询log的最大条数。大于该数字，旧的会被丢弃。
`config get slowlog-max-len`  

# 设置log的最大条数为300
`config set slowlog-max-len 300`  

# 获取最近20条日志
`slowlog get 20`  
```

在获取了日志之后，也没发现什么问题，server2的确插入了（这里的输出也是demo，调试输出找不到了）。而且并没有pop，这就奇怪了，难道有什么阻塞了么。

```bash
127.0.0.1:6006> slowlog get 20
1) 1) (integer) 2
   2) (integer) 1626785061
   3) (integer) 16357
   4) 1) "lpush"
      2) "game"
      3) "{\"msg\":{\"data\":{\"playerName\":\"bfs\",\"msg\":\"\xe6\xb6\x88\xe6\x81\xaf\xe4\xbd\x938\",\"playerId\":\"832a3d73-317c-4a39-8df8-c2fd8965a1b3\",\"timestamp\":162380889111... (185 more bytes)"
   5) "192.xxx.xx.x:27334"
   6) ""
```

# 进入redis监视着模式

最后尝试了进入reids monitor，这个模式下可以动态观看日志。输入类似这样，所有的无所遁形。

```bash
127.0.0.1:6006> monitor
OK
1626787232.810556 [0 192.xxx.xx.x:27316] "get" "AuthToken-747b1041-7390-4d85-bcc2-a9f2221ce52d"
1626787232.831783 [0 192.xxx.xx.x:27316] "setex" "AuthToken-747b1041-7390-4d85-bcc2-a9f2221ce52d" "1800" "{\"tokenId\":\"747b1041-7390-4d85-bcc2-a9f2221ce52d\",\"generated\":1626783720,\"userId\":\"832a3d73-317c-4a39-8df8-c2fd8965a1b3\",\"expire\":1784463720}"
```

进入这个monitor之后，发现的确也是发现server2的确插入了，但是server1就是没能brpop出消息，就在人发呆之际，发现server1 brpop的key和server2插入的key不一样。server1 brpop的key是直接写死的mq1，然是server1在存贮mq1的时候进行了json化，导致server2拿到的mq1是\“mq1\”，所以一直插错了。。。

最后是自己坑了自己，但是是一个有节奏的调试过程，做记录。
