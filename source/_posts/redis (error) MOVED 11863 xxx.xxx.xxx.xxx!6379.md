---
title: redis (error) MOVED 11863 xxx.xxx.xxx.xxx:6379
date: 2021-04-15 19:40:55
updated: 2023-07-16 17:11:17
categories:
  - redis
tags:
  - redis
---
<!-- more -->

最近在集群中查询redis碰到这个问题，

```bash
(error) MOVED 11863 xxx.xxx.xxx.xxx:6379
```

简单查询后发现，是因为redis是集群方式的，而使用redis-cli连接redis的时候，没有指定集群模式，指定后即可。

这样指定即可

```bash
./redis-cli -h xxx.xxx.xxx -p 6379 -c
```
