---
title: Redis中如何设置set中的元素过期
date: 2021-04-15 19:30:53
updated: 2023-07-16 17:11:17
categories:
  - redis
tags:
  - redis
---
<!-- more -->

最近在工作中碰到了这个问题，我需要在一个set中记录集群中k8s pod的ip，但是pod随时会挂，所以采取一个定时让每个pod去update cache的做法。但是set中是无法设置其中元素过期时间的。有两个解决方法

## 把set改用sorted set

每个元素都带上分数，这个分数就是你的过期时间。先用ZRemRangeByScore删除过期元素（分数之外的元素），然后每个pod带上过期时间戳去定时去EasyZAdd，下面是伪代码

```bash
for{
	nowTime := time.Now().Unix()
	redis.ZRemRangeByScore("setName", "0", strconv.FormatInt((nowTime-5), 10))
	urlInfo := redis.Z{
		Score:  float64(nowTime), //以秒为单位
		Member: *h.SqsUrl}
	redis.ZAdd("setName", &urlInfo)
}
```

## 不用set，用string

这个就是使用固定的开头，例如:my*server_ip_xxx.xxx.xxx。然后使用传统的setex，获取key的时候使用模糊匹配，keys my_server_ip**也可。

用哪种仁者见仁智者见智。
