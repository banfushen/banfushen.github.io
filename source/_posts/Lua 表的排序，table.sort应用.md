---
title: Lua 表的排序，table.sort应用
date: 2020-02-28 20:27:22
updated: 2023-07-16 17:11:17
categories:
  - lua
---
<!-- more -->

最近项目使用到表的排序，我使用table.sort通过表的value排序，使用key进行排序暂未研究。之前一直不是很清楚table.sort这个方法，刚好有机会记录一下。

方法原型：**table.sort (table, funtion(a,b))**

两个入参：1.table-----------需要排序的table

2.function-------排序方法，可自定义。如果不填，则按默认排序。形式是固定的，**入参a,b为排序table中的value1、value2....(这个具体不知道怎么描述)**

**1.不传排序方法，采用自定义：**

![](https://img-blog.csdnimg.cn/20200228181909324.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

结果：

![](https://img-blog.csdnimg.cn/20200228181946524.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

可以看到，table.sort默认是使用table中存贮的 value进行从小到大的排序，有一点需要注意的是，如果table中含有number和string，使用默认的方法进行比较会报 number和string比较的错误。也有一些别的坑，使用的时候需要谨慎(默认的我用的比较少)

**2.传入自定义的排序方法：**

例如传入的table是 :

![](https://img-blog.csdnimg.cn/20200228200424965.png)

传入的方法的格式是固定的，也就是一个

匿名函数function(a,b)

........(你的实现)

end

匿名函数中的a,b是传入的table的2个value，table.sort每次会返回两个value传入比较函数。上例是t中的value。

比较函数是这样的：

![](https://img-blog.csdnimg.cn/20200228201556405.png)

结果为：

![](https://img-blog.csdnimg.cn/20200228201704536.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

自定义的比较函数功能十分强大，但是也有一些坑。

**注意：**

**1.table.sort并不稳定，当条件的两个元素相等时，它们在排序后的相对位置可能会改变(据说，我自己暂未出现，可能用的少)**

**2.要求需要排序table中间元素不能有nil，否则会报错**

**3.当比较的两个元素相等的时候，比较函数一定要返回false，返回true会报错，table.sort会根据你返回的bool来判断两个value是否保持原来的顺序**
