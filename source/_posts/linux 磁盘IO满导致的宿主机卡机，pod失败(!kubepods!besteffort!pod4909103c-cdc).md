---
title: linux 磁盘IO满导致的宿主机卡机，pod失败(/kubepods/besteffort/pod4909103c-cdc)
date: 2021-09-29 19:35:42
updated: 2023-07-16 17:11:17
categories:
  - Linux k8s
tags:
  - linux docker elasticsearch kubernetes
---
<!-- more -->

# 背景

开发机上装了minikube，起了一个docker镜像当minikube的宿主机，在启动了一定量的deployment A之后，deployment A就全挂了（启动1~2个deployment A，没有问题，启动到第三个，就全挂）。然后宿主机卡爆。

# 查询pod挂的原因

```bash
kubectl describe pod 

...
  Exit Code:    137
      Started:      Wed, 29 Sep 2021 16:02:30 +0800
      Finished:     Wed, 29 Sep 2021 16:04:19 +0800
    Ready:          False
    Restart Count:  12
...
```

看到了其中镜像挂了的返回值是137，此状态码一般是因为 pod 中容器内存达到了它的资源限制(resources.limits)，一般是内存溢出(OOM)，CPU达到限制只需要不分时间片给程序就可以。因为限制资源是通过 linux 的 cgroup 实现的，所以 cgroup 会将此容器强制杀掉，类似于 kill -9。
但是通过top查看发现cpu和内存都没满，但是内存交换满了（KiB Swap），感觉是因为宿主机没资源了，所以干掉pod中的资源，接着往下查，寻找更多node的信息。

因为minikube是起在docker中的，所以查看一下docker状态

```bash
docker stats

94ec0f757f48        banfushen6_elasticsearch_1         1.24%               1.653GiB / 4.657GiB   35.49%              9.15GB / 6.79GB     85.3MB / 38.6GB     205
a57d56927433        banfushen6_dynamodb_1              17.73%              329.7MiB / 31.42GiB   1.02%               223MB / 188MB       17MB / 12.3kB       86
6aa3384e7433        banfushen6_mongooseim_1            0.02%               287.6MiB / 31.42GiB   0.89%               4.22MB / 0B         19.3MB / 1.03MB     27
6f8203c6c8bd        banfushen6_rabbitmq_1              0.11%               98.38MiB / 31.42GiB   0.31%               4.22MB / 0B         19.9MB / 3.94MB     307
722f40c6405f        minikube                           205.57%             7.398GiB / 7.812GiB   94.69%              441MB / 8.04MB      4.08MB / 48.1kB     2218
```

这下，找到了pod失败的原因。接下来查找宿主机卡住的原因。

# 查看node信息

```bash
kubectl describe node minikube
Name:               minikube
Roles:              master
Labels:             beta.kubernetes.io/arch=amd64
                    beta.kubernetes.io/os=linux
                    kubernetes.io/arch=amd64
                    kubernetes.io/hostname=minikube
                    kubernetes.io/os=linux
                    minikube.k8s.io/commit=2c82918e2347188e21c4e44c8056fc80408bce10
                    minikube.k8s.io/name=minikube
                    minikube.k8s.io/updated_at=2021_07_20T17_14_34_0700
                    minikube.k8s.io/version=v1.14.2
                    node-role.kubernetes.io/master=
Annotations:        kubeadm.alpha.kubernetes.io/cri-socket: /var/run/dockershim.sock
                    node.alpha.kubernetes.io/ttl: 0
                    volumes.kubernetes.io/controller-managed-attach-detach: true
CreationTimestamp:  Tue, 20 Jul 2021 17:14:27 +0800
Taints:             <none>
Unschedulable:      false
Conditions:
  Type             Status  LastHeartbeatTime                 LastTransitionTime                Reason                       Message
  ----             ------  -----------------                 ------------------                ------                       -------
  MemoryPressure   False   Wed, 29 Sep 2021 17:02:14 +0800   Wed, 29 Sep 2021 16:37:39 +0800   KubeletHasSufficientMemory   kubelet has sufficient memory available
  DiskPressure     False   Wed, 29 Sep 2021 17:02:14 +0800   Wed, 29 Sep 2021 16:37:39 +0800   KubeletHasNoDiskPressure     kubelet has no disk pressure
  PIDPressure      False   Wed, 29 Sep 2021 17:02:14 +0800   Wed, 29 Sep 2021 16:37:39 +0800   KubeletHasSufficientPID      kubelet has sufficient PID available
  Ready            True    Wed, 29 Sep 2021 17:02:14 +0800   Wed, 29 Sep 2021 16:57:04 +0800   KubeletReady                 kubelet is posting ready status
```

看到了这句话kubelet has no disk pressure，在结合之前top的交换内存满了，判定磁盘的问题。通过公司的monitor查看到机器的磁盘io使用率已满。
![在这里插入图片描述](https://img-blog.csdnimg.cn/883d70f6cf0546e0b201a61923f999b0.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAQmFuRlM=,size_20,color_FFFFFF,t_70,g_se,x_16)

# 找出导致io爆炸的容器

我先用了pidstat -d 1查看哪个进程对io的占用最高，但是缺没找到任何相关信息，然后直接在宿主机查看内核日志

```bash
cat /var/log/messages | ag killed

Sep 29 17:50:31 bfs kernel: [5618442.047786] Task in /docker/722f40c6405f6933ac2722e40a40fef4c52e36b2ba0e44bdd1a8aba0027ca313/kubepods/besteffort/pod4909103c-cdc2-432e-92aa-2e06c2c7d1e3/9d62c1f82041c40d691498b2ded86caa663404489f7c3a62ad37c72eb2470911 killed as a result of limit of /docker/722f40c6405f6933ac2722e40a40fef4c52e36b2ba0e44bdd1a8aba0027ca313
```

可以看到，docker被内核干掉了，拿到docker的id前缀，去查找看是什么容器造成的。

```bash
docker@minikube:~$ docker ps | grep  e5bdaaef
e5bdaaefff4a        7c797432e61c           "/usr/local/bin/dock…"   11 minutes ago      Up 11 minutes                               k8s_elasticsearch
```

发现，原来是pod中启动了es，多个es导致io炸裂，最后修改pod资源，不启动es，解决问题
