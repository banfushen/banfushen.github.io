---
title: Ubuntu 18.04.3 安装svn
date: 2019-08-12 15:01:32
updated: 2023-07-16 17:11:17
categories:
  - Linux
tags:
  - svn Ubuntu 18.04.3
---
<!-- more -->

今天早上上班后，发现电脑的机械硬盘居然崩了，原来以为这种情况只会存在传说中，没想到自己真正碰到了。由于基本上所有的资料和开发环境都是存在机械硬盘上的，一切的一切只能重来，借此机会，记录一下自己走过的路。

** **使用的是：

VMware:Workstation 15 Pro          [https://www.7down.com/soft/310739.html](https://www.7down.com/soft/310739.html)

Ubuntu:18.04.3                                [https://ubuntu.com/download/desktop](https://ubuntu.com/download/desktop)

**这些下载好之后，便开始装svn：**

** 1.sudo apt-get update**

**       2.sudo apt install subversion**

**       3.输入 svn help 查看是否安装成功 **

![](/images/posts/ubuntu-18043-svn/20190812150011860.png)

出现这个，则表示安装成功。

**4.安装成功后，输入svn co + 你的地址，会提示你输入svn账号与密码。**
