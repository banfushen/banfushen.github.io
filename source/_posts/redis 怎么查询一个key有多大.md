---
title: redis 怎么查询一个key有多大
date: 2022-01-09 17:06:27
updated: 2023-07-16 17:11:17
categories:
  - redis
tags:
  - redis
---
<!-- more -->

在项目开发过程中，最好是能估计出自己开发的功能要使用多大的redis内存

# 使用redis自带的方法

## debug object key

```bash
127.0.0.1:6006> get testkey
"this is a test"
127.0.0.1:6006> debug object testkey
Value at:0x7f4f19e2b500 refcount:1 encoding:embstr serializedlength:15 lru:14327341 lru_seconds_idle:6
```

- Value at: 内存地址
- refcount: 引用次数
- encoding: 编码类型
- serializedlength: 序列化后的长度（注意这里的长度是序列化后的长度，保存为rdb文件时使用了该算法，不是真正存贮在内存的大小，不过可以用于比较）memory usage1
2
127.0.0.1:6006> memory usage queuesSet
(integer) 1489075554

返回字节数

# 借助工具

借助redis rdb tools工具，需要下载rdbtools，`pip install rdbtools`。

```bash
banfushen@banfushen:~$ redis-memory-for-key -p 6006 testkey
Key                             testkey
Bytes                           72
Type                            string
```

# 使用脚本

```python
import redis

h = 'localhost'
p = 6006

rd = redis.Redis(host=h, port=p, decode_responses=True)
print(rd.type('testkey'), rd.strlen('testkey'))
```

```bash
banfushen@banfushen:~/gitlab/dbsync/test$ python redis_size.py 
(u'string', 14)
```
