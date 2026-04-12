---
title: 怎么在linux中安装golang, 不需要在windows下载好包
date: 2021-01-21 19:12:29
updated: 2023-07-16 17:11:17
categories:
  - golang
tags:
  - golang
---
<!-- more -->

其实我已经安装了很久了, 久到我已经忘记怎么安装了, 今天在k8s中调试时, 要重新装golang, 上网查了一下, 发现太多文章都是不太方便的, 例如现在windows下载好包, 再考到linux下解压, 有这么麻烦么, 下面直接上流程

# 1.先下载golang的包

这里网上好多文章都是在windows下搜索, 下载好拷贝过去, 其实不用这么干, 在linux中直接下载就好了

我是debian 64位的系统, 工作目录是/usr/local. 这样下

```
// 如果你看到这篇文章,可能已经过了很久,go的版本自己看着修改
wget https://storage.googleapis.com/golang/go1.15.7.linux-amd64.tar.gz

// 如果没有wget, 先进行以下步骤, 然后再再下载golang
// apt-get update
// apt-get install wget
```

# 2.解压golang

```
// 你下载再哪里就在哪里解压
tar -C /usr/local -xzf go1.15.7.linux-amd64.tar.gz
```

# 3.设置环境变量

```
export PATH=$PATH:/usr/local/go/bin

//这里写你自己的工作目录
export GOPATH=/usr/local/go_project

export GOROOT=/usr/local/go
```

最后用go version 查看是否安装成功

![](https://img-blog.csdnimg.cn/20210121190942174.png)

打完收工.
