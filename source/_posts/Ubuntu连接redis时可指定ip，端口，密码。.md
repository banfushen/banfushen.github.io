---
title: Ubuntu连接redis时可指定ip，端口，密码。
date: 2019-09-04 17:04:31
updated: 2023-07-16 17:11:17
categories:
  - redis Linux
tags:
  - redis
---
<!-- more -->

转做游戏服务器开发之后，基本上都在写游戏逻辑，关于redis的操作也已经有了现成的接口。今天提交了代码有点空闲时间打算学一学redis。

博主是按照网上的教程使用redis-cli去连接redis，但是之前本地的redis已经改过redis的默认配置文件，直接使用redis-cil发现并不能连接上。

![](https://img-blog.csdnimg.cn/20190904165940392.png)

查询资料后发现可以指定ip，端口，和密码如下。

**  redis-cli -h xxx.xxx.xxx.xxx -p xxxx -a mima   例如（redis-cli -h 127.0.0.1 -p 12345 -a zheshimima）**

即可连接。作此记录。
