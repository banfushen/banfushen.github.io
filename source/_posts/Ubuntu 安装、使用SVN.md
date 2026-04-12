---
title: Ubuntu 安装、使用SVN
date: 2020-02-10 14:08:52
updated: 2023-07-16 17:11:17
categories:
  - Linux
tags:
  - Ubuntu svn
---
<!-- more -->

**1.在terminal 输入 svn 看是否有安装svn**

** **![](/images/posts/ubuntu-svn/20200210135345374.png)

**2.如果和我一样没装有svn则执行 sudo apt install subversion**

** **![](/images/posts/ubuntu-svn/20200210135528732.png)

** 3.在首次使用svn check out的时候，会直接提示输入账号密码。**

**     4.如果想要修改svn的账号与密码，删除目录 ~/.subversion/auth/ 下的所有文件。下一次操作svn时会提示你重新输入用户名和密码的。换成你想用的就可以了。然后系统默认会记录下来的。**
