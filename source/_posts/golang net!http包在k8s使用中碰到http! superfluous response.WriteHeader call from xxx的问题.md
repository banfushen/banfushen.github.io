---
title: golang net/http包在k8s使用中碰到http：superfluous response.WriteHeader call from xxx的问题
date: 2021-01-21 17:48:37
updated: 2023-07-16 17:42:48
categories:
  - golang
tags:
  - golang
---
<!-- more -->

在项目中，需要使用golang写http服务器并部署在k8s中，在server deployment.yaml中存在livenessProbe(存活探针)以及readinessProbe(就绪探针)，这两个我都是写了向服务器发送一个http请求，如果服务器收到并回复，则表示成功，但是在使用过程中，日志一直输出，这些会干扰日志的查看。

![](/images/posts/golang-nethttpk8shttp-superfluous-responsewriteheader-call-from-xxx/20210121174550591.png)

经过查询与测试，最后修复，做此纪录，代码如下。

```
func healthcheck(w http.ResponseWriter, r *http.Request) {
    //fmt.Fprintf(w, "i m live") 原来就是因为多了这行,然后一直输出,屏蔽了即可
    w.WriteHeader(200)
}

func main() {
    router := http.NewServeMux()
    router.HandleFunc("/healthcheck", healthcheck)
    port := fmt.Sprint(":", *config.Conf.HttpPort)
    srv := &http.Server{
        Addr:    port,
        Handler: router,
    }

    logger.Info("[HTTP] http server listen", port)
    if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        logger.Error("[HTTP] server listen on", port, ", err:", err)
        os.Exit(1)
    }
}
```
