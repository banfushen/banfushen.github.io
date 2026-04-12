---
title: iptable为什么之后pod的probability越来越大
date: 2022-02-10 20:03:47
updated: 2023-07-16 17:11:17
categories:
  - Linux k8s
tags:
  - 负载均衡 运维
---
<!-- more -->

项目集群是使用k8s管理的，流量分发使用的是iptable，据压测反馈说负载不均衡，吓得老夫赶紧去查看，发现原来是压测同学搞错了。在查询的过程中，发现iptable规则之后的probability越来越大，记录一下原因。

```bash
root@ip-10-1-34-89:/home/admin# iptables -t nat -nL
...
Chain KUBE-SVC-7XZINH2IMK6FHKPK (2 references)
target     prot opt source               destination
KUBE-SEP-TOX5PBICM2IS3QEP  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.20000000019
KUBE-SEP-BHWNMZ5XNYG7AESG  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.25000000000
KUBE-SEP-OQLKQS2OMOJTYZF6  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.33332999982
KUBE-SEP-EQOKMESPFMECIZJJ  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.50000000000
KUBE-SEP-GVLV4E5D2AGR4O5J  all  --  0.0.0.0/0            0.0.0.0/0
...
```

可以看到，总共5条记录，刚开始probability为0.2—->0.25—->0.33—->0.5—-无，为什么会这样。
因为流量进入之后，按照iptable规则转发，公共5条，所以第一条接收20%的流量。
剩下还有4条，下一条应该接收剩余流量的1/4，也就是25%。
剩下还有3条，下一条应该接收剩余流量的1/3，也就是33%。
……
最后一条因为只剩下它了，所有流量都会走这里，所以不用写probability。
