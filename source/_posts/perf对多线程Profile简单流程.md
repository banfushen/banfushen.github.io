---
title: perf对多线程Profile简单流程
date: 2022-02-13 20:48:52
updated: 2023-07-16 17:11:15
categories:
  - Linux 性能优化
tags:
  - linux
---
<!-- more -->

## 背景知识

Perf是用于软件性能分析的工具，通过Perf，应用程序可以利用PMU，tracepoint和内核中的特殊计数器进行性能统计。Perf不但可以分析应用程序的性能问题(per thread)，也可以分析内核的性能问题，处理所有性能相关的事件：程序运行期间的硬件事件，如instructions retired ，processor clock cycles等；软件事件，如Page Fault和进程切换。

Perf基本原理是对被监测对象进行采样，最简单的情形是根据tick中断进行采样，即在tick中断内触发采样点，在采样点里判断程序当前的上下文。假如一个程序90%的时间都花费在函数func1()上，那么90%的采样点都应该落在函数func1()的上下文中，采样时间越长，上述推论越可靠。**使用perf要有管理员权限**

## 使用perf对多线程进行profile

### 准备多线程程序

在此程序中，创建了两个线程。分别跑了不同次数的func1()方法。`gcc -lpthread main.c`

```c
#include <pthread.h>
#include <stdio.h>
#include <string.h>

pthread_t thread[2];

void func1() {
    int i = 0;
    while (i<10000)
        ++i;
}

void func2() {
    int i = 0;

    while (i<10000)
        i = i*2;
    func1();
}

void *thread1()
{
        for (;;)
        {
            func1();
        }

        pthread_exit(NULL);
}

void *thread2()
{
        for (;;)
        {
            func2();
        }

        pthread_exit(NULL);
}

void thread_create(void)
{
        int temp;
        memset(&thread, 0, sizeof(thread));
        if((temp = pthread_create(&thread[0], NULL, thread1, NULL)) != 0)
                printf("线程1创建失败!\n");
        else
                printf("线程1被创建\n");

        if((temp = pthread_create(&thread[1], NULL, thread2, NULL)) != 0)
                printf("线程2创建失败\n");
        else
                printf("线程2被创建\n");
}

int main()
{
        thread_create();
        pthread_join(thread[0],NULL);
        printf("线程1加入");
        pthread_join(thread[1],NULL);
        printf("线程2加入");

        return 0;
}
```

### 使用perf对程序进行采样

#### 对还没启动的程序

```shell
root@ma100:/home/banfushen/perf_cpu/multi_thread# perf record -h
Usage: perf record [<options>] [<command>]
    or: perf record [<options>] -- <command> [<options>]

    ...
    -F, --freq <n>        profile at this frequency
    -g                    enables call-graph recording
    -p, --pid <pid>       record events on existing process id
    -t, --tid <tid>       record events on existing thread id
    ...
```

`perf record -g -F 99 ./a.out`，对多线程程序进行采样，采样频率99，(-F 99: sample at 99 Hertz (samples per second). I’ll sometimes sample faster than this (up to 999 Hertz), but that also costs overhead. 99 Hertz should be negligible. Also, the value ‘99’ and not ‘100’ is to avoid lockstep sampling, which can produce skewed results.)。运行完毕会得到一个`perf.data`，要想得到火焰图，还需要借助别的工具。

#### 对已经启动的程序

对于已经启动的程序，要拿到pid，`perf record -g -F 99 -p <pid>`

### 下载工具FlameGraph

`git clone https://github.com/brendangregg/FlameGraph.git`

```plaintext
banfushen@ma100:~/perf_cpu/FlameGraph$ pwd
/home/banfushen/perf_cpu/FlameGraph
```

### 生成火焰图

#### 对perf.data生成火焰图(按照上面来说就是一个进程的)

`perf script |/home/banfushen/perf_cpu/FlameGraph/stackcollapse-perf.pl|/home/banfushen/perf_cpu/FlameGraph/flamegraph.pl > output.svg`
![\[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-68Nci8QI-1644756192593)(_v_images/20211214172626556_19376.png)\]](https://img-blog.csdnimg.cn/cedfefcf300a468b9c32fc84ffc19bfb.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBAQmFuRlM=,size_20,color_FFFFFF,t_70,g_se,x_16)

#### 对单个线程生成火焰图

要知道线程id

```shell
root@ma100:/home/banfushen/perf_cpu/multi_thread# perf script -h

 Usage: perf script [<options>]
    or: perf script [<options>] record <script> [<record-options>] <command>
    or: perf script [<options>] report <script> [script-args]
    or: perf script [<options>] <script> [<record-options>] <command>
    or: perf script [<options>] <top-script> [script-args]

    ...
    -v, --verbose         be more verbose (show symbol address, etc)
        --pid <pid[,pid...]>
        --tid <tid[,tid...]>
                          only consider symbols in these tids
```

`perf script -v --tid <tid> 指定线程`
`perf script -v --tid 2283471|/home/banfushen/perf_cpu/FlameGraph/stackcollapse-perf.pl|/home/banfushen/perf_cpu/FlameGraph/flamegraph.pl > output1.svg`
![\[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-UAKuRRSC-1644756192594)(_v_images/20211214172949738_20703.png)\]](https://img-blog.csdnimg.cn/db320151507f4c3a8ecb2e5258e0e704.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBAQmFuRlM=,size_20,color_FFFFFF,t_70,g_se,x_16)

#### 对多个线程生成火焰图

`perf script -v --tid <tid[,tid...]> 指定多个线程`
`perf script -v --tid 2283472,2283471|/home/banfushen/perf_cpu/FlameGraph/stackcollapse-perf.pl|/home/banfushen/perf_cpu/FlameGraph/flamegraph.pl > output3.svg`
![\[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-y7qrS028-1644756192595)(_v_images/20211214173120899_8466.png)\]](https://img-blog.csdnimg.cn/6fbc37032b3c4efba64387ab5f115c22.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBAQmFuRlM=,size_20,color_FFFFFF,t_70,g_se,x_16)
参考资料:
[perf Examples](https://www.brendangregg.com/perf.html)
[perf性能分析](https://melonshell.github.io/2019/10/09/tool1_perf/)
[性能分析利器之perf浅析](http://walkerdu.com/2018/09/13/perf-event/)
[利用perf剖析Linux应用程序](https://blog.gmem.cc/perf)
[Linux性能分析工具Perf简介](https://segmentfault.com/a/1190000021465563)
