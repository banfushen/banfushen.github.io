---
title: Lua位操作
date: 2020-07-07 20:08:30
updated: 2023-07-16 17:11:17
categories:
  - lua
tags:
  - lua
---
<!-- more -->

在用redis写排行榜的时候，相同积分的情况要按照到达时间排序，用到了Lua的位操作，网上很少这方面的资料，写一下做简单笔记。

lua位操作其实和c语言一样，例子如下:

![](https://img-blog.csdnimg.cn/20200707200527919.png)

结果为:

![](https://img-blog.csdnimg.cn/20200707200654971.png)

实际应用可以看看我的另一篇博客，《使用redis做排行榜相同积分情况下，如何使用到达时间来排序》
