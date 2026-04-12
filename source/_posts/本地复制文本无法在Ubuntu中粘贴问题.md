---
title: 本地复制文本无法在Ubuntu中粘贴问题
date: 2020-02-10 12:34:13
updated: 2023-07-16 17:11:17
categories:
  - Linux
tags:
  - Ubuntu
---
<!-- more -->

在家办公，安装开发环境后无法粘贴。查询并自己实践后，解决方法如下：

**        1. sudo apt-get autoremove open-vm-tools **

**        2. sudo apt-get install open-vm-tools-desktop **

**        3.重启虚拟机**

** **我通过以上方法即可解决，如果执行步骤1失败，可参考下查看我的另一篇博客 ，看看是否为相同的错误

“**ubuntu apt-get安装软件Unable to locate package...”**
