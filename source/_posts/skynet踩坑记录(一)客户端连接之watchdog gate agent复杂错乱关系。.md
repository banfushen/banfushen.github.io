---
title: skynet踩坑记录(一)客户端连接之watchdog gate agent复杂错乱关系。
date: 2019-08-19 20:23:20
updated: 2023-07-16 17:11:17
categories:
  - skynet
tags:
  - skynet 网络模块
---
<!-- more -->

笔者转行做游戏服务器开发有四个月了，现在公司用的是skynet框架，由于之前没做过服务器开发，现在还是处于边学习，边跟项目的情况。由于工作原因，网络这一块断断续续看了两个星期，一直没理解，今天再看的时候，终于懂了skynet监听网络端口的流程，也懂了，客户端是怎么连接的。果然应了那句话：**欠了技术债，早晚要还的。（学习一定要专注啊！！！可以省好多时间。）**

** **这张图是在网上找的，非常的清晰，要顺着标识看，并结合代码，就能大致了解这个过程。![](/images/posts/skynetwatchdog-gate-agent/20190819195844523.png)

1.在main中会newservice watchdog启动看门狗服务，lua start conf给看门狗发送lua消息start参数为conf。

2.在watchdog服务中会，newservice gate启动网关服务(实际上是通过gateserver.start启动)，然后监听传入或者默认的端口。

3.当有新连接接入的时候，实际上是gate server监听到的。

4.gate server send2watchdog open，并传入参数。

5.在watchdog server中会创建一个agent(每个连接接入，创建一个agent)，并传入相关的信息(gate，fd，watchdog)。

6.由于有watchdog传入的信息，agent可以call2gate server forward(用于打开fd，一定要打开，链接成功不代表马上可以读到数据，需要打开这个套接字，允许fd接收数据，这样才能接受到client传入的数据)。

7.当client send requste，首先到达gate。

8.gate server 的message方法中处理，转发给agent。

9.agent处理之后，在发回给client。

需要注意的是：

1.实际上client连接到的是gate server。

2.gate server把具体的client消息转发给agent由agent处理具体逻辑。

3.gate 与 watchdog 与 agent是相互配合的。

至于为什么要这么做，目前我也不是很清楚。。。
