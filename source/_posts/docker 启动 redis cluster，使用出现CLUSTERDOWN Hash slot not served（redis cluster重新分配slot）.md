---
title: docker 启动 redis cluster，使用出现CLUSTERDOWN Hash slot not served（redis cluster重新分配slot）
date: 2021-12-07 22:24:21
updated: 2023-07-16 17:11:17
categories:
  - redis
tags:
  - redis docker linux
---
<!-- more -->

# 背景

就像上一篇所说，我使用了docker-componse启动了redis cluster集群。经过了一天的测试，本来测试已经完毕了，但是今天修改了点代码，再次测试的时候发现redis cluster起不来了。报错`CLUSTERDOWN Hash slot not served`。从这个错误提示，可以看出是slot分配原因造成的。上网找，真的蛋疼，你复制我，我复制你，最后还是得自己解决。

# 查看详细

```bash
banfushen@banfushen:~/redis-cluster$ redis-cli -p 16379
127.0.0.1:16379>
127.0.0.1:16379>
127.0.0.1:16379> CLUSTER info
cluster_state:fail
cluster_slots_assigned:0
cluster_slots_ok:0
cluster_slots_pfail:0
cluster_slots_fail:0
...
127.0.0.1:16379> CLUSTER SLOTS
Empty slot
```

# 直接修复

猜测就是slot分配的问题，进入具体container，重新分配slot

```bash
banfushen@banfushen:~/redis-cluster$ docker exec -it redis-node-0 /bin/bash
root@a77b8222eba2:/#
## 先查看命令
root@a77b8222eba2:/# redis-cli --cluster help
Cluster Manager Commands:
  create         host1:port1 ... hostN:portN
                 --cluster-replicas <arg>
  check          host:port
                 --cluster-search-multiple-owners
  info           host:port
  fix            host:port
                 --cluster-search-multiple-owners
                 --cluster-fix-with-unreachable-masters
  reshard        host:port
                 --cluster-from <arg>
                 --cluster-to <arg>
                 --cluster-slots <arg>
                 --cluster-yes
                 --cluster-timeout <arg>
                 --cluster-pipeline <arg>
                 --cluster-replace
  rebalance      host:port
                 --cluster-weight <node1=w1...nodeN=wN>
                 --cluster-use-empty-masters
                 --cluster-timeout <arg>
                 --cluster-simulate
                 --cluster-pipeline <arg>
                 --cluster-threshold <arg>
                 --cluster-replace
  add-node       new_host:new_port existing_host:existing_port
                 --cluster-slave
                 --cluster-master-id <arg>
  del-node       host:port node_id
  call           host:port command arg arg .. arg
                 --cluster-only-masters
                 --cluster-only-replicas
  set-timeout    host:port milliseconds
  import         host:port
                 --cluster-from <arg>
                 --cluster-from-user <arg>
                 --cluster-from-pass <arg>
                 --cluster-from-askpass
                 --cluster-copy
                 --cluster-replace
  backup         host:port backup_directory
  help

For check, fix, reshard, del-node, set-timeout you can specify the host and port of any working node in the cluster.

Cluster Manager Options:
  --cluster-yes  Automatic yes to cluster commands prompts

## 直接修复
root@a77b8222eba2:/# redis-cli --cluster fix --cluster-search-multiple-owners 127.0.0.1:6379
...
>>> Covering slot 694 with 192.168.88.3:6379
>>> Check for multiple slot owners...
[OK] No multiple owners found.
root@f3f2043dba55:/#
root@f3f2043dba55:/#
root@f3f2043dba55:/#
root@f3f2043dba55:/# redis-cli -p 6379
127.0.0.1:6379> cluster info
cluster_state:ok
cluster_slots_assigned:16384
cluster_slots_ok:16384
cluster_slots_pfail:0
cluster_slots_fail:0
cluster_known_nodes:6
cluster_size:6
cluster_current_epoch:33
cluster_my_epoch:30
cluster_stats_messages_ping_sent:489
cluster_stats_messages_pong_sent:523
cluster_stats_messages_meet_sent:6
cluster_stats_messages_sent:1018
cluster_stats_messages_ping_received:523
cluster_stats_messages_pong_received:495
cluster_stats_messages_received:1018
127.0.0.1:6379> exit
root@f3f2043dba55:/# exit
```
