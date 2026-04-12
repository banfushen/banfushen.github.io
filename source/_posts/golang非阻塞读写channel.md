---
title: golang非阻塞读写channel
date: 2021-07-23 14:27:08
updated: 2023-07-16 17:11:17
categories:
  - golang
tags:
  - golang
---
<!-- more -->

服务器最近压测的时候发现了问题。发现是往channel写数据，但是channel满了，导致服务器部分功能阻塞。golang的channel读或写是会造成阻塞的，但是可以用select的多路复用解决这个问题。

不阻塞读channel（也可以加上超时）

```go
func readChan(c chan int) (int, error) {
	select {
	case num := <-c:
		return num, nil
	default:
		return 0, errors.New("chan do not have data")
	}
}

// 加上超时时间
func readChanWithTimeout(c chan int) (int, error) {
	timeout := time.NewTimer(time.Microsecond * 100)

	select {
	case num := <-c:
		return num , nil
	case <-timeout.C:
		return 0, errors.New("read chan time out")
	}
}
```

非阻塞写入channel（也可以加上超时）

```go
func writeChan(num int, c chan int) error {
	select {
	case ch <- num:
		return nil
	default:
		return errors.New("chan is full")
	}
}

// 加上超时时间
func writeChanWithTimeout(num int, c chan int) error {
	timeout := time.NewTimer(time.Microsecond * 100)

	select {
	case c <- num:
		return nil
	case <-timeout.C:
		return errors.New("write chan time out")
	}
}
```
