---
title: golang ”优雅关闭的 Go Web 服务器“，可能会碰到的坑。
date: 2021-01-18 17:41:03
updated: 2023-07-16 17:11:17
categories:
  - golang
tags:
  - golang
---
<!-- more -->

在最近的项目中，使用了go 搭建了web服务器，所以"优雅的关闭服务器"，经过查资料，发现go在1.8之后，http包已经有Shutdown()方法，但是使用起来还是有一些要注意的地方。

如果对go很熟悉的，对这些包很熟悉的人，肯定不会碰到这个问题。只怪我太菜。。。碰到了坑。下面直接上代码。

查询资料的时候，在网上看到这样的代码

```
func gracefullShutdown(server *http.Server, logger *log.Logger, quit <-chan os.Signal, done chan<- bool) {
  <-quit
  logger.Println("Server is shutting down...")

  ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
  defer cancel()

  server.SetKeepAlivesEnabled(false)
  if err := server.Shutdown(ctx); err != nil {
    logger.Fatalf("Could not gracefully shutdown the server: %v\n", err)
  }
  close(done)
}
```

像这种写法，是启动了别的goroutin去执行gracefullShoudown，所以需要额外的一个done channel来阻塞主线程。我们的http服务器必然会调用这个ListenAndServer(如下)，**当调用了gracefullShutdown中server.Shutdown(ctx)，ListenAndServer会直接返回**，而主线程直接结束了的话，别的线程也就会跟着一起结束。也就没有了等待服务器关闭这么一说法了。

```
router := http.NewServeMux()
router.HandleFunc("/healthcheck", healthcheck)
port := fmt.Sprint(":8080")
srv := &http.Server{
    Addr:         port,
    Handler:      router,
}

if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
    logger.Error("[HTTP] server listen on", port, ", err:", err)
}
```

### **       注意：server.ListenAndServe() 方法在 Shutdown 时会立刻返回，Shutdown 方法会阻塞至所有连接闲置或 context 完成，所以 Shutdown 的方法要写在主 goroutine 中或者。如果像上面一样使用在新的goroutine中，则需要自己写好阻塞主携程的方法。**

** **

**最后附上完整使用新goroutine监听关闭服务器的demo：**

```
package main

import (
    "context"
    "fmt"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func gracefullShutdown(server *http.Server, quit <-chan os.Signal, done chan<- bool) {
    <-quit
    // 30s，让服务器做一些清理操作
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    server.SetKeepAlivesEnabled(false)
    if err := server.Shutdown(ctx); err != nil {
        fmt.Println("server.Shutdown err ..... ", err)
    }
    //do Something ：
    fmt.Println("do something start ..... ", time.Now())
    time.Sleep(5 * time.Second)
    fmt.Println("do something end ..... ", time.Now())
    close(done)
}

func main() {
    var (
        done = make(chan bool, 1)
        quit = make(chan os.Signal, 1)
    )

    router := http.NewServeMux()
    port := fmt.Sprint(":36010")
    srv := &http.Server{
        Addr:    port,
        Handler: router,
    }

    // 给信号挖个坑，如果抓到这些信号就退出程序
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    go gracefullShutdown(srv, quit, done)

    fmt.Println("[HTTP] http server listen", port)
    if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        fmt.Println("ListenAndServe err ..... ", err)
        os.Exit(1)
    }
    <-done
    fmt.Println("[HTTP] Showdown end")
}
```

![](/images/posts/golang-go-web/20210118173824843.png)
