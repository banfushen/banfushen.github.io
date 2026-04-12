---
title: golang如何快速查询并发写map的位置(concurrent map iteration and map write)
date: 2021-04-15 19:46:45
updated: 2023-07-16 17:11:17
categories:
  - golang
tags:
  - golang
---
<!-- more -->

最近项目中高并发时碰到golang碰到了map并发读写的问题。
找问题找了好久，可以借助这个方发，编译的时候加上-race，在发生并发读写的地方会有提醒。

```bash
go run main.go -race
```

会出现DATA RACE，这张图是网上找的，我也尝试过，图找不到了。借用网友的图。
![在这里插入图片描述](/images/posts/golangmapconcurrent-map-iteration-and-map-write/20210415194250384.png)
这是一个方法，使用这个也会有所缺陷，例如你的协程就不能开太多了，我记得好像只能开8000多个。而我开启了之后因为协程不够，并发不够又无法触发，最后是领导找到的。

最后我的原因是因为一般一个变量会定义在循环之外（这不是理所应当的么，当时写的时候没想那么多，而又是自己的思路，找了好久没找到），我在循环之外定义了变量，然后这个变量赋值的时候里面有map，导致了这个问题，最后把变量定义放在循环里就可以了。
