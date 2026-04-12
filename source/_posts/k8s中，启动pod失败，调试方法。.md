---
title: k8s中，启动pod失败，调试方法。
date: 2020-12-21 18:45:20
updated: 2023-07-16 17:11:17
categories:
  - k8s
tags:
  - kubernetes 后端
---
<!-- more -->

在k8s中，是不能够直接启动容器的，容器必须要依附于pod的形式启动。当pod启动失败的时候，可以这么去调试。

1.找到pod启动的镜像，将镜像进行二次封装，修改镜像的入口

```
FROM xxxxx            //pod启动的镜像
ENTRYPOINT ["python", "-m", "SimpleHTTPServer", "8080"] //修改镜像的入口
```

2.将镜像上传到镜像库

3.修改pod的yaml文件，修改镜像地址，修改探针

```
containers:
    - name: containers_name
    image: image_path

//这里要注意要把levenesspoint给屏蔽了，要不会一直kill掉containers，然后重启
```

4.使用kubectl exec -it -n <namespaces>  <podname> /bin/sh进入到containers内部进行运行自己的代码，调试。
