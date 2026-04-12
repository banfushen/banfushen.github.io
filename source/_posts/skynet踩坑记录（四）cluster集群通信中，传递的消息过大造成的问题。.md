---
title: skynet踩坑记录（四）cluster集群通信中，传递的消息过大造成的问题。
date: 2020-10-23 09:26:58
updated: 2023-07-16 17:11:17
categories:
  - skynet
tags:
  - 后端
---
<!-- more -->

昨天更新后，一直触发这个报错。第一眼看我都吓懵了，这什么鬼报错，call fail。框架级别的报错。这怎么解决。

![](https://img-blog.csdnimg.cn/20201023090638345.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

理性分析，然后在同事的提醒下查看了core的日志，然后发现

![](https://img-blog.csdnimg.cn/20201023090722415.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

一查代码，发现

![](https://img-blog.csdnimg.cn/20201023090801288.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

原来是集群通信中，传递的包过大造成的。获取玩家排行榜历史的时候，我缓存的所有玩家的历史，这样每个玩家只需要去拿就行了，不需要再进行多余的db操作。检查自己的逻辑，的确是发了很大的包。测试的时候数据不足，并没有发现。

想起在云风的blog中也说过，集群通信有错误会提示，但是业务层面要自己重新处理。

最后修改业务层面的代码解决，其实也可以把过大的包拆成几分发送。
