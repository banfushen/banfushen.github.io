---
title: 关于mysql存贮json与json中数据的检索
date: 2019-10-24 15:51:12
updated: 2023-07-16 17:11:17
categories:
  - mysql
tags:
  - mysql存json
---
<!-- more -->

这两天工作，碰到一个实用的mysql存贮json问题，需要查找mysql中存贮的json中的json作此记录。

因为mysql是关系型数据库，所以如果想在一个key中存贮更多的数据，存贮一个json是不错的选择(支持存贮多层的json)。

我用到的activity_conf表格中activity_config中存贮的就是json。

```
DROP TABLE IF EXISTS `activity_conf`;
CREATE TABLE `activity_conf` (
  `activity_id` char(64) COLLATE utf8mb4_general_ci NOT NULL COMMENT '活动ID',
  `activity_config` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

我需要获取 activity_config中存贮的end_time，而end_time是两层json如下

![](/images/posts/mysqljsonjson/20191024151315801.png)

可用以下语句

```
select activity_id, json_extract(activity_config, '$.end_time.conf_value') as end_time from activity_conf;
```

查找结果如下

![](/images/posts/mysqljsonjson/20191024154502932.png)

### ** 可以使用以下语句查找mysql中存贮的json数据：**

```
select json_extract( key, '$.fir_json_key.sec_json_key') from table;
```

打完收工
