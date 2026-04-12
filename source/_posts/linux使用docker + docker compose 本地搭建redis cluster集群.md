---
title: linux使用docker + docker compose 本地搭建redis cluster集群
date: 2021-12-05 23:19:04
updated: 2023-07-16 17:11:17
categories:
  - redis Linux
tags:
  - docker redis linux
---
<!-- more -->

## 背景

项目用到一个redis库，对于里面的集群相关功能要自己测试（就像《代码简洁之道》中说的，使用第三方库需要自己有测试用例，这样即使第三方库更新了，直接用原来的测试用例，也知道是否能兼容）。所以需要自己本地搭建redis集群测试。

**搭建是使用docker搭建的，一下需要启动很多个container，所以使用docker-compose作为容器编排**我的环境已经有了，没有的自己下载

## 直接上redis-cluster模式

redis集群有三种模式：**master+slave(主从)、sentinel(哨兵)、cluster(集群)**
我实际项目用的cluster模式，所以这里直接使用cluster模式。这个docker-compose.yml参考至[docker 部署 redis 的三种集群模式](https://blog.csdn.net/weixin_45444133/article/details/119642841)，里面还有一些关于redis集群的说明，docker-compose.yml我亲自使用，没问题。

```yml
## docker-compose.yml
version: '2'
services:
  redis-node-0:
    user: root
    container_name: redis-node-0
    image: docker.io/bitnami/redis-cluster:6.2
    ports: 
      - 16379:6379
    volumes:
      - ./redis_data-0:/bitnami/redis/data
    environment:
      - 'ALLOW_EMPTY_PASSWORD=yes'
      - 'REDIS_NODES=redis-node-0 redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5'
    networks:
      redis-cluster-network: 
        ipv4_address: 192.168.88.2

  redis-node-1:
    user: root
    container_name: redis-node-1
    image: docker.io/bitnami/redis-cluster:6.2
    ports: 
      - 16380:6379
    volumes:
      - ./redis_data-1:/bitnami/redis/data
    environment:
      - 'ALLOW_EMPTY_PASSWORD=yes'
      - 'REDIS_NODES=redis-node-0 redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5'
    networks:
      redis-cluster-network: 
        ipv4_address: 192.168.88.3

  redis-node-2:
    user: root
    container_name: redis-node-2
    image: docker.io/bitnami/redis-cluster:6.2
    ports: 
      - 16381:6379
    volumes:
      - ./redis_data-2:/bitnami/redis/data
    environment:
      - 'ALLOW_EMPTY_PASSWORD=yes'
      - 'REDIS_NODES=redis-node-0 redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5'
    networks:
      redis-cluster-network: 
        ipv4_address: 192.168.88.4

  redis-node-3:
    user: root
    container_name: redis-node-3
    image: docker.io/bitnami/redis-cluster:6.2
    ports: 
      - 16382:6379
    volumes:
      - ./redis_data-3:/bitnami/redis/data
    environment:
      - 'ALLOW_EMPTY_PASSWORD=yes'
      - 'REDIS_NODES=redis-node-0 redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5'
    networks:
      redis-cluster-network: 
        ipv4_address: 192.168.88.5

  redis-node-4:
    user: root
    container_name: redis-node-4
    image: docker.io/bitnami/redis-cluster:6.2
    ports: 
      - 16383:6379
    volumes:
      - ./redis_data-4:/bitnami/redis/data
    environment:
      - 'ALLOW_EMPTY_PASSWORD=yes'
      - 'REDIS_NODES=redis-node-0 redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5'
    networks:
      redis-cluster-network: 
        ipv4_address: 192.168.88.6

  redis-node-5:
    user: root
    container_name: redis-node-5
    image: docker.io/bitnami/redis-cluster:6.2
    ports: 
      - 16384:6379
    volumes:
      - ./redis_data-5:/bitnami/redis/data
    depends_on:
      - redis-node-0
      - redis-node-1
      - redis-node-2
      - redis-node-3
      - redis-node-4
    environment:
      - 'ALLOW_EMPTY_PASSWORD=yes'
      - 'REDISCLI_AUTH=bfsbfs'
      - 'REDIS_CLUSTER_REPLICAS=1'
      - 'REDIS_NODES=redis-node-0 redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5'
      - 'REDIS_CLUSTER_CREATOR=yes'
    networks:
      redis-cluster-network: 
        ipv4_address: 192.168.88.7
  
networks:
  redis-cluster-network:
    driver: bridge
    ipam:
      config:
        - subnet: 192.168.88.0/24
```

直接`docker-compose up -d`

```bash
## 在dockers-compose.yml目录
docker-compose up -d

Creating network "rediscluster_redis-cluster-network" with driver "bridge"
Pulling redis-node-4 (docker.io/bitnami/redis-cluster:6.2)...
6.2: Pulling from bitnami/redis-cluster
1d7019cad1df: Pull complete
0c20d9bbd5c0: Pull complete
7434cc9f2f61: Pull complete
01dd376516ef: Pull complete
a10fc7cec580: Pull complete
2e7c2cbaa852: Pull complete
eef01af132bf: Pull complete
234dbecfe19a: Pull complete
Digest: sha256:57e9093dfaa412c691592e7e2ca6402a6f7d76b10cff04669fca4a82365f1874
Status: Downloaded newer image for bitnami/redis-cluster:6.2
WARNING: Connection pool is full, discarding connection: localhost
WARNING: Connection pool is full, discarding connection: localhost
WARNING: Connection pool is full, discarding connection: localhost
Creating redis-node-2
Creating redis-node-4
Creating redis-node-0
WARNING: Connection pool is full, discarding connection: localhost
WARNING: Connection pool is full, discarding connection: localhost
Creating redis-node-3
Creating redis-node-1
WARNING: Connection pool is full, discarding connection: localhost
WARNING: Connection pool is full, discarding connection: localhost
WARNING: Connection pool is full, discarding connection: localhost
WARNING: Connection pool is full, discarding connection: localhost
WARNING: Connection pool is full, discarding connection: localhost
WARNING: Connection pool is full, discarding connection: localhost
WARNING: Connection pool is full, discarding connection: localhost
WARNING: Connection pool is full, discarding connection: localhost
Creating redis-node-5
```

测试完毕，停止redis

```bash
## 在dockers-compose.yml目录
docker-compose stop
docker-compose rm
```
