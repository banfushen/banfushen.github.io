---
title: vs code golang代码不会自动对齐问题
date: 2021-04-09 17:58:52
updated: 2023-07-16 17:11:17
categories:
  - 笔记
tags:
  - golang
---
<!-- more -->

## 做此纪录

本来使用vs做golang开发的时候，代码都会对齐的，忽然有一天，就不能对齐了。
在网上找了好多都没找到答案，最后今天看了Effective Go前面的Formatting，觉得是这个东西出问题了。
然后查看vs配置，File—->Preferences—->settting—->go。
 ![在这里插入图片描述](/images/posts/vs-code-golang/20210409175728336.png)
点击后查看发现没有这一项，加上就好了。非常的简单。做此纪录
![在这里插入图片描述](/images/posts/vs-code-golang/20210409175815920.png)
