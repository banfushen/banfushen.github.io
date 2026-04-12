---
title: golang 使用time包碰到数字与时间相乘的问题
date: 2021-01-25 20:46:01
updated: 2023-07-16 17:11:17
categories:
  - golang
tags:
  - golang
---
<!-- more -->

在项目中使用time包时，睡眠时间时想要通过配置文件获取，然而整数与时间相乘又报错。如下

![](https://img-blog.csdnimg.cn/20210125204313549.png)

查询time包发现

```
// A Duration represents the elapsed time between two instants
// as an int64 nanosecond count. The representation limits the
// largest representable duration to approximately 290 years.
type Duration int64
```

即，其实就是一个int64的数。最后先把需要的数字进行转换，这样解决即可

```
err = client.Set(ctx, key, data, time.Duration(ex)*time.Second).Err()
```

![](https://img-blog.csdnimg.cn/20210125204542483.png)
