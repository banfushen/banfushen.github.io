---
title: Xshell连接虚拟机失败Could not connect to '192.xxx.xx.xxx' (port 22)：Connection failed.
date: 2019-05-27 10:10:30
updated: 2023-07-16 17:41:00
categories:
  - 笔记
tags:
  - Xshell
---
<!-- more -->

之后的工作会使用Xshell，今天搞一个下来连接自己的虚拟机，发现连接失败：

![](https://img-blog.csdnimg.cn/20190527100348655.png)

猜想是可能是虚拟机或者Xshell部分没设置好

查询后通过以下方法解决，做此记录：

1.安装OpenSSH，执行**sudo apt-get install openssh-server openssh-client**命令。

![](https://img-blog.csdnimg.cn/20190527100736178.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

2.执行**netstat -tnl**命令，查看22端口。

![](https://img-blog.csdnimg.cn/20190527100842369.png)

博主通过以上方法已可以接连上。

![](https://img-blog.csdnimg.cn/20190527101126749.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

参考地址：[https://blog.csdn.net/s243471087/article/details/80208985](https://blog.csdn.net/s243471087/article/details/80208985)
