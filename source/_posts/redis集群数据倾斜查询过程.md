---
title: redis集群数据倾斜查询过程
date: 2021-07-23 18:08:05
updated: 2023-07-16 17:11:17
categories:
  - redis
tags:
  - redis
---
<!-- more -->

项目上redis cluster数据产生了倾斜，项目是有3个节点，但第一个节点用了80%的内存，第二第三个节点基本没存数据。

# redis cluster存贮规律

redis 集群有16384个槽，会先对要存贮的key进行hash，将得到的结果放到对应的槽。一般会对整个key进行hash，如果key中含有{}，会对{}中的字符串进行哈希。

# 先查看集群中是否是因为key的原因造成倾斜

```shell
redis-cli -h xxx.xxx.xxx.xxx -p xxx -c
keys *{*}*
```

查看之后发现，并不是因为{}导致key全部塞到第一个节点，说明应该不是key的原因

# 查找集群中的大key

```shell
redis-cli -h xxx.xxx.xxx.xxx -p xxx -c --bigkeys
redis-memory-for-key -s xxx.xxx.xxx.xxx -p xxx keyname
```

这里有一点需要注意，bigkeys命令会再各个节点中遍历，一个节点一个节点的插，所以要多执行几遍。最后发现有一个list里面有3W多个数据，查看大小，就是这个原因导致的，最后再查询代码，发现是业务代码问题，解决即可。
redis-memory-for-key也可能没连接到指定节点，需要多执行几次。
