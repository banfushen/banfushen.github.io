---
title: redis cluster使用lua脚本的坑，非同一个slot也可以使用lua脚本
date: 2022-02-10 21:09:51
updated: 2023-07-16 17:11:17
categories:
  - lua redis
tags:
  - lua redis 数据库
---
<!-- more -->

在项目中，需要用lua脚本操作redis cluster中的多个key，但是非同slot的时候会报错，例如下面test3、test6在同一个node，但是却不是同一个slot。redis使用lua脚本可以这样`redis-cli -a xxxxx--eval demo.lua key1 key2 , val1 val2`

```bash
banfushen@ma100:~/redis-cluster$ redis-cli -p 16380 -c
192.168.88.7:6379> set test3 3333
-> Redirected to slot [13026] located at 192.168.88.3:6379
OK
192.168.88.6:6379> set test5 3333
-> Redirected to slot [4644] located at 192.168.88.5:6379
OK
192.168.88.5:6379> set test6 3333
-> Redirected to slot [8775] located at 192.168.88.3:6379
OK
192.168.88.3:6379> cluster keyslot test3
(integer) 13026
192.168.88.3:6379> cluster keyslot test6
(integer) 8775
192.168.88.3:6379>
```

# 通过key传入

一般在redis cluster中使用lua脚本，会碰到`(error) CROSSSLOT Keys in request don't hash to the same slot`

```bash
banfushen@ma100:~/test$ cat get.lua
local key1 = KEYS[1]
local key1 = KEYS[2]

local value1 = redis.call("GET", key1)
local value2 = redis.call("GET", key2)

return {value1, value2}
banfushen@ma100:~/test$  redis-cli -p 16380 -c --eval get.lua test3 test6
(error) CROSSSLOT Keys in request don't hash to the same slot
```

# 通过value传入

在官方的说明中，redis 使用lua脚本是限制在用一个node上使用的，可是这里明明是同一个node，却无法使用，但是如果我们把脚本改成下面这样

```bash
banfushen@ma100:~/test$ cat get.lua
local key1 = ARGV[1]
local key2 = ARGV[2]

local value1 = redis.call("GET", key1)
local value2 = redis.call("GET", key2)

return {value1, value2}
banfushen@ma100:~/test$ redis-cli -p 16380 -c --eval get.lua  , test6 test3
1) "3333"
2) "3333"
```

这样即可解决。

# 总结

应该是按照KEY传入的时候，redis为了防止key不在同一个node上，对key进行slot判断，如果不是同一个slot就直接返回了，但是是支持同一个node的，**只要我们对我们需要操作的key进行分类，同一个node的key通过value传入，即可在lua脚本中对同一个node的key操作。**在我们设计redis cluster的时候，是知道每个node的slot的，每个key的solt可以使用以下计算

```bash
192.168.88.3:6379> cluster keyslot test3
(integer) 13026
```

我们只需要先判断slot在某个范围内，属于一个node，即可进行批量操作。
