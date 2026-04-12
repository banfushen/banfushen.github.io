---
title: Ubuntu 18.04.3 安装redis，配置端口与密码
date: 2022-05-08 16:50:36
permalink: /2022/05/08/Ubuntu-18-04-3-安装redis，配置端口与密码/
categories:
  - redis
tags:
  - redis
---
# Ubuntu 18.04.3 安装redis，配置端口与密码

## 下载

`sudo apt-get install redis-server`

## 查看

`ps -aux | grep redis`
![](/2022/05/08/Ubuntu-18-04-3-%E5%AE%89%E8%A3%85redis%EF%BC%8C%E9%85%8D%E7%BD%AE%E7%AB%AF%E5%8F%A3%E4%B8%8E%E5%AF%86%E7%A0%81/803319237335.png)

## 修改端口

`sudo subl /etc/redis/redis.conf`，改为自己想要的端口。
![](/2022/05/08/Ubuntu-18-04-3-%E5%AE%89%E8%A3%85redis%EF%BC%8C%E9%85%8D%E7%BD%AE%E7%AB%AF%E5%8F%A3%E4%B8%8E%E5%AF%86%E7%A0%81/1589519230469.png)

## 重启redis

`sudo service redis-server restart`
`ps -aux | grep redis`
![](/2022/05/08/Ubuntu-18-04-3-%E5%AE%89%E8%A3%85redis%EF%BC%8C%E9%85%8D%E7%BD%AE%E7%AB%AF%E5%8F%A3%E4%B8%8E%E5%AF%86%E7%A0%81/2428019220999.png)

## 密码修改

继续修改`/etc/redis/redis.conf`，找到一个  # requirepass foobared  的字段将这个字段的注释取消掉，这个字段是数据的访问密码，将foobared替换成自己想要设置的密码。
![](/2022/05/08/Ubuntu-18-04-3-%E5%AE%89%E8%A3%85redis%EF%BC%8C%E9%85%8D%E7%BD%AE%E7%AB%AF%E5%8F%A3%E4%B8%8E%E5%AF%86%E7%A0%81/3274819223503.png)
修改后重启redis，`sudo service redis-server restart`
![](/2022/05/08/Ubuntu-18-04-3-%E5%AE%89%E8%A3%85redis%EF%BC%8C%E9%85%8D%E7%BD%AE%E7%AB%AF%E5%8F%A3%E4%B8%8E%E5%AF%86%E7%A0%81/3825619232450.png)

sbul是我装了sublime text之后的编辑器，如果没有安装，将subl换成vi/vim即可。我自己通过以上方式，已能修改，做次记录。
