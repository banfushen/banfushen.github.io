---
title: golang 实际项目中连接redis集群碰到的坑
date: 2021-01-26 11:06:04
updated: 2023-07-16 17:11:17
categories:
  - golang
tags:
  - golang
---
<!-- more -->

项目中redis直接是使用了aws的redis服务，redis是集群，也就是golang连接redis集群碰到的坑，如下

首先我使用的是redisgo，因为看着api比较方便，比较像redis-cli，而且aws也推荐。然后一开始连接也没事，我部署了不下10遍，然而有一天部署时。服务器在操作redis时忽然报错。“(error) MOVED xxxx xxx.xxx.xxx.xxx:xxxx”，经过查询得知这是由于redis没有选择连接集群导致的，再次查询，发现aws官方推荐了两个redis库，redisgo和go-redis两个库，**redisgo是不支持集群的(太坑了)，而且我部署了那么多次都没问题。可能一直都连到master上了，**忽然就连到slave就报错了。还好发现的早。

go-redis/redis连接数据库的时候，官方的demo给的就是一堆端口，

```
import "github.com/go-redis/redis/v8"

rdb := redis.NewClusterClient(&redis.ClusterOptions{
    Addrs: []string{":7000", ":7001", ":7002", ":7003", ":7004", ":7005"},

    // To route commands by latency or randomly, enable one of the following.
    //RouteByLatency: true,
    //RouteRandomly: true,
})
```

这个是可以填好多地址的，只要把自己的地址填入string的切片即可，**如果只有一个地址，就只填一个(项目中redis集群可能对外只暴露一个地址)**

```
clusterClient = redis.NewClusterClient(&redis.ClusterOptions{
    Addrs: []string{"your addr1"},
})
```

**redis.NewClusterClient这个接口默认是连接master的，如果只想连接slave，则通过参数控制，具体查看接口的说明即可。**

** ** 最后切换了包之后，成功解决了redis集群连接的问题。
