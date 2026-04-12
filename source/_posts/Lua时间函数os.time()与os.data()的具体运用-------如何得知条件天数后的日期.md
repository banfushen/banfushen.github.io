---
title: Lua时间函数os.time()与os.data()的具体运用-------如何得知条件天数后的日期
date: 2019-11-17 13:19:58
updated: 2023-07-16 17:11:17
categories:
  - lua
tags:
  - Lua 时间函数 os.time os.date
---
<!-- more -->

最近的工作是要求写一个任务系统，需要在特定日期重置任务，或者在天数后重置任务。

这就延伸出一个问题，如何得知条件天数后的日期。

这个问题的难点在于，每个月的天数不一样，加上相同的天数后每个月变化后的日期怎么处理。

例如，我们要求40天后的日期

### 其实lua的时间函数十分强大，可以用以下方法:

1.算出当时间，以表表示。

2.算出40天后的日期。

程序与结果如下

```
local now_time = os.date("*t", os.time())
for k,v in pairs(now_time) do
    print(k,v)
end
print("----------------分割--------------------------")

now_time.day = now_time.day + 40
local next_monday = os.date("*t", os.time(now_time))
for k,v in pairs(next_monday) do
    print(k,v)
end
```

![](https://img-blog.csdnimg.cn/20191117130731630.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

### 特别说明

1.os.date创建日期表时now_time，所有的字段均在有效范围之内。(例如, now_time.daya+40之后，now_time.day = 57)

2.os.time传入一个修改后的日期表now_time(now_time.day = 57)时，其中的字段不需要归一化，会自动处理，得到新时间戳

3.得到的t2时间戳通过os.date转化为日期表，及可得到40天后的被归一化日期表。

4.同理也可以通过改变hour来计算5小时后，改变min来计算100分钟后，改变month来计算6个月后的日期。
