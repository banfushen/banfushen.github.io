---
title: k8s中，怎么在container中切换角色
date: 2020-12-21 11:20:40
updated: 2023-07-16 17:11:17
categories:
  - k8s
tags:
  - k8s 后端
---
<!-- more -->

工作中，需要在k8s中调试container，但是container中有可能很多东西又没有，比如vim等，没有就无法修改代码，想使用su 更改为root用户又不知道密码。可以使用以下方法。

直接修改pod的yaml文件

```
containers:
  - name: ...
    image: ...
    securityContext:
      runAsUser: 0
```

这样登录进去就是root角色，**0指root用户的uid**。在里面就可以安装自己想安装的工具进行调试。

比如我，进去调试之后安装了vim

```
apt update
apt install vim
```
