---
title: Kubernetes nodes are not ready原因查看
date: 2021-07-24 18:02:50
updated: 2023-07-16 17:11:17
categories:
  - k8s
tags:
  - kubernetes
---
<!-- more -->

今早收到了Prometheus的报警，4% of Kubernetes nodes are not ready。

直接查看node情况即可知道原因。

```bash
banfushen@pro:~/helm-chart/prometheus-netease/templates$ kubectl describe nodes ip-xx-x-xxx-xxx.ap-northeast-1.compute.internal
Name:               ip-xx-x-xxx-xxx.ap-northeast-1.compute.internal
Roles:              node
Labels:             beta.kubernetes.io/arch=amd64
                    beta.kubernetes.io/instance-type=c5.xlarge
                    beta.kubernetes.io/os=linux
                    failure-domain.beta.kubernetes.io/region=ap-northeast-1
                    failure-domain.beta.kubernetes.io/zone=ap-northeast-1c
                    kubernetes.io/hostname=ip-xx-x-xxx-xxx.ap-northeast-1.compute.internal
                    kubernetes.io/role=node
                    node-role.kubernetes.io/node=
Annotations:        node.alpha.kubernetes.io/ttl: 0
                    volumes.kubernetes.io/controller-managed-attach-detach: true
CreationTimestamp:  Sat, 24 Jul 2021 03:05:08 +0800
Taints:             <none>
Unschedulable:      false
Conditions:
  Type             Status  LastHeartbeatTime                 LastTransitionTime                Reason                       Message
  ----             ------  -----------------                 ------------------                ------                       -------
  OutOfDisk        False   Sat, 24 Jul 2021 18:00:31 +0800   Sat, 24 Jul 2021 03:05:08 +0800   KubeletHasSufficientDisk     kubelet has sufficient disk space available
  MemoryPressure   False   Sat, 24 Jul 2021 18:00:31 +0800   Sat, 24 Jul 2021 03:05:08 +0800   KubeletHasSufficientMemory   kubelet has sufficient memory available
  DiskPressure     False   Sat, 24 Jul 2021 18:00:31 +0800   Sat, 24 Jul 2021 03:05:08 +0800   KubeletHasNoDiskPressure     kubelet has no disk pressure
  PIDPressure      False   Sat, 24 Jul 2021 18:00:31 +0800   Sat, 24 Jul 2021 03:05:08 +0800   KubeletHasSufficientPID      kubelet has sufficient PID available
  Ready            True    Sat, 24 Jul 2021 18:00:31 +0800   Sat, 24 Jul 2021 03:05:28 +0800   KubeletReady                 kubelet is posting ready status
```
