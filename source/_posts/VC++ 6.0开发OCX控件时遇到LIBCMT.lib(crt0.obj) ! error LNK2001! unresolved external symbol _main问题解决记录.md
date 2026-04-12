---
title: VC++ 6.0开发OCX控件时遇到LIBCMT.lib(crt0.obj)：error：LNK2001 unresolved external symbol _main问题解决记录
date: 2019-01-05 11:58:14
updated: 2023-07-16 17:42:10
tags:
  - VC 6.0 OCX控件
---
<!-- more -->

当你OCX控件的ReleaseMinDependency版时，你得到了下面这个链接错误：

**LIBCMT.LIB(crt0.obj) : error LNK2001: unresolved external symbol _main**

而Debug版本的编连却顺利通过。

出错原因：

如果你在工程中使用了CRT函数，而这些函数又需要CRT启动代码，就会出现这种链接错误。默认情况下，ReleaseMinDepende配置的Preprocessor definitions中定义了**_ATL_MIN_CRT**，它将CRT启动代码从你的EXE或DLL剔出去了。

背景知识：

ATL支持把一个服务器编连优化成最小尺寸或者依赖性最小。我们可以定义三个预处理器符号来影响服务器的优化。

_ATL_MIN_CRT             服务器不链接标准的C/C++运行库

_ATL_DLL                  服务器动态链接工具函数库atl.dll

_ATL_STATIC_REGISTRY    服务器静态链接对组件注册的支持

如果定义了预处理器符号_ATL_MIN_CRT，那么我们的服务器不链接C/C++运行库，并且ATL提供了函数malloc、realloc、new和delete的一个实现。当定义了这个符号时，我们不能调用任何其他的C/C++运行库的函数。否则，就会受到这样的待遇：

LIBCMT.LIB(crt0.obj) : error LNK2001: unresolved external symbol _main

ATL向导生成的ATL工程为所有的Release版本的编连定义了_ATL_MIN_CRT，但是没有为Debug版本定义这个符号。

Debug配置没有定义这三个符号中的任何一个。

RelMinSize配置定义了_ATL_MIN_CRT和_ATL_DLL。

RelMinDependency配置定义了_ATL_MIN_CRT和_ATL_STATIC_REGISTRY。

解决方法：

Project -----> Settings-----> C/C++

在Category中选择General ;

去除**_ATL_MIN_CRT**这个预处理符号；

参考来自：[https://blog.csdn.net/richie12/article/details/5799097](https://blog.csdn.net/richie12/article/details/5799097)
