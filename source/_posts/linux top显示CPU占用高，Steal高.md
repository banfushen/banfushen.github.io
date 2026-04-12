---
title: linux top显示CPU占用高，Steal高
date: 2021-12-26 21:50:18
updated: 2023-07-16 17:11:17
categories:
  - Linux
tags:
  - linux 运维 服务器
---
<!-- more -->

开发这么久，第一次这种问题，记录一下。
在某天开发中，开发机的cpu忽然飙升，一直降不下来，刚开始没注意，一直删除cpu占用高的进程，一直无效，仔细看。top显示Steal高。![blog.csdnimg.cn/b5e3e319214548e19d47151304d9c346.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBAQmFuRlM=,size_20,color_FFFFFF,t_70,g_se,x_16)](https://img-blog.csdnimg.cn/b51ef36628bb49698905550605f2054c.png)
经过查询是因为宿主机出了问题，[详细说明看这里。](https://scoutapm.com/blog/understanding-cpu-steal-time-when-should-you-be-worried)
然后联系了运维，更换了宿主机，解决。
