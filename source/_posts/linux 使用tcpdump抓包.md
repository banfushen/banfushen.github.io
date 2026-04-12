---
title: linux 使用tcpdump抓包
date: 2021-07-21 17:50:09
updated: 2023-07-16 17:11:17
categories:
  - Linux
tags:
  - linux 后端
---
<!-- more -->

最近更换了服务器的消息队列，客户端反馈说服务器有时候会多发消息下去，十分纳闷，只改了服务器的消息队列，但是服务器像客户端发消息的代码一行没改，日志也只是发一条消息下去，但是因为改了消息队列，最后使用linux抓包看看，以证清白。

tcpdump输出demo如下（这不是调试时的数据，只是demo）。这里我指定查看8060端口。

```bash
root@mdev-2:/home/banfushen/webclient# tcpdump port 8060
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes
17:41:07.061086 IP 10.xxx.xxx.xxx.51321 > 11.xxx.xxx.xxx.8060: Flags [.], seq 2312385062:2312385063, ack 2244282406, win 1021, length 1
17:41:07.061177 IP 11.xxx.xxx.xxx.8060 > 10.xxx.xxx.xxx.51321: Flags [.], ack 1, win 101, options [nop,nop,sack 1 {0:1}], length 0
```

抓包之后，发现的确只发下去一条，然后去抓客户端，在客户端打断点调试，最后发现是客户端自己的确收到一条，但是别的逻辑导致事件重复触发。最后证明清白。

tcpdump还有一些别的命令做一下记录：

```bash
# 监听指定网卡
tcpdump -i en0

# 监听本机与192.xxx.xxx.xx之间的通信包，出\入都会监听
tcpdump host 192.xxx.xxx.xx

# 监听192.xxx.xxx.xx来源的通信
tcpdump src host 192.xxx.xxx.xx

# 监听192.xxx.xxx.xx为目标的通信
tcpdump dst host 192.xxx.xxx.xx

# 监听3000端口
tcpdump port 3000
```

tcpdump非常强大，还有一些更多的功能用到的时候再查询。
