---
title: ubuntu apt-get安装软件Unable to locate package...
date: 2020-02-10 11:09:40
updated: 2023-07-16 17:11:17
categories:
  - Linux
tags:
  - ubuntu
---
<!-- more -->

由于受疫情影响(希望快点好起来)，只能在家办公，再一次安装开发环境。

使用 **apt-get install**碰到以下问题

![](https://img-blog.csdnimg.cn/2020021011014055.png)

** 1.sudo apt-get update 更新软件源**

![](https://img-blog.csdnimg.cn/20200210110410941.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

如果更新成功，无报错，无警告，则执行自己的下载即可

但是我执行最后有警告

**Some index files failed to download. They have been ignored, or old ones used instead.**

** **查询资料之后发现是自己的更新源问题，需要切换更新源，执行以下步骤

**2.搜索打开 software&update**

![](https://img-blog.csdnimg.cn/20200210122059355.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

打开之后选择

![](https://img-blog.csdnimg.cn/20200210122414928.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

**选择other**

** **![](https://img-blog.csdnimg.cn/20200210122519647.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

**更换源之后执行 sudo apt-get update，无报错，之后再下载自己需要下载的即可**

可能是这次下载的Ubuntu的问题，导致这个问题的出现，以前没碰到过。
