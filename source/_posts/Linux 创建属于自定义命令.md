---
title: Linux 创建属于自定义命令
date: 2020-02-11 17:21:56
updated: 2023-07-16 17:11:17
categories:
  - Linux
tags:
  - linux
---
<!-- more -->

在家办公，再次搭建开发环境，加上这次多次碰到，做此记录

subl 是我安装的编辑器，如果你看到这这篇博客，把subl换成自己的编辑器(vi、vim)即可。

**1.在terminal 输入：subl ~/.bashrc**

![](/images/posts/linux/20200211171732628.png)

**2.找到这个地方并添加自己的命令，可添加多个指令，用"；"隔开**

![](/images/posts/linux/20200211171840145.png)

**3.在terminal 输入：source ~/.bashrc (立即生效)**
