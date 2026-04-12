---
title: 关于mysql存贮json与json中数据的求和计算
date: 2019-09-16 20:06:26
updated: 2023-07-16 17:11:17
categories:
  - mysql
tags:
  - mysql json
---
<!-- more -->

mysql是关系型数据库，为了方便的记录更多的数据，现在工作中用的mysql记录得value是以json的形式记录的。

例如：

player_data表格结构是这样的：

```
DROP TABLE IF EXISTS `player_data`;
CREATE TABLE `player_data` (
  `uid` bigint(20) NOT NULL COMMENT '用户ID',
  `data` json NOT NULL COMMENT '游戏数据，以json形式包含',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

player_data中玩家的数据是这样记录的：

key:uid --- value:{"data": { "user_prize": 0}

我需要计算所有玩家user_prize的总和，这样即可

```
select sum(data->"$.user_prize") from player_data where data->"$.user_prize" is not null
```

![](https://img-blog.csdnimg.cn/2019091620004713.png)

mysql中存贮json，应用十分的强大，不仅可以存贮单层的key(如上)，还可以可以存贮多层的key，关于多层key的应用之后在更新。
