---
title: kubernetes cluster autoscale 不会删除nodes
date: 2022-04-16 14:39:34
updated: 2023-07-16 17:11:15
categories:
  - k8s
tags:
  - kubernetes
---

项目上线后，通过`kubectl top` node，发现有的node上使用的资源非常少，`kubectl describe node` 发现完全可以驱逐。但是cluster autoscaler缺没有驱逐。

<!-- more -->

按照官方的说法

![cluster autoscaler condition](/images/posts/kubernetes-cluster-autoscale/cluster-autoscaler-condition.png)

检查了node上的pod，没发现有什么pod满足以上。

查看cluster autoscaler的日志

![cluster autoscaler log](/images/posts/kubernetes-cluster-autoscale/cluster-autoscaler-log.png)

gitlab runner原来装在kube-system namespace下，最后把node上的gitlab runner删除，node即可被驱逐，猜测gitlab runner可能满足了以下导致。

![gitlab runner cause](/images/posts/kubernetes-cluster-autoscale/gitlab-runner-cause.png)
