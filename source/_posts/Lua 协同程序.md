---
title: Lua 协同程序
date: 2019-04-17 11:30:21
updated: 2023-07-16 17:11:17
categories:
  - lua
tags:
  - Lua 协程（coroutine）
---
<!-- more -->

### 协同程序(coroutine)简介

Lua 协同程序(coroutine)与线程比较类似：拥有独立的堆栈，独立的局部变量，独立的指令指针，同时又与其它协同程序共享全局变量和其它大部分东西。

### 线程和协同程序区别

1.线程可以同时运行，协同程序却需要彼此协作的运行。

2.在任一指定时刻**只有一个**协同程序在运行，并且这个正在运行的协同程序只有在**明确的被要求**挂起的时候才会被挂起。

协同程序有点类似与，在等待同一个线程锁的几个线程。

### 方法概览

**方法**
**描述**
coroutine.create(func)
 
 创建coroutine，该方法只创建，如需唤醒coroutine需配合resume方法；

```
<p>入参：是协程运行的函数；</p>

        <p>返回：成功返回coroutine。</p>
        </td>
    </tr><tr><td style="width:225px;">coroutine.resume(co, val1, ...)</td>
        <td style="width:624px;">
        <p>唤醒coroutine，和create配合使用；</p>

        <p>入参：可任意输入，但是第一个入参必须是coroutine.create()的返回值。</p>

        <p>           1.如果是第一次唤醒，其余入参作为协程运行函数的入参。多余的参数被舍弃。</p>

        <p>           2.如果是唤醒调用yield()挂起的协程，其他输入参数将作为yield()的返回值。</p>

        <p>           除第一个入参外，如果入参个数少于yield()返回值个数，则执行失败，如果多于yield()返回</p>

        <p>           值个数，则多余的参数被舍弃，执行成功；</p>

        <p>返回：成功返回true与yield()的入参。失败返回错误提示。</p>
        </td>
    </tr><tr><td style="width:225px;">coroutine.yield(val1, ...)</td>
        <td style="width:624px;">
        <p>挂起coroutine，和resume配合使用能有很多有用的效果；</p>

        <p>入参：可以任意输入，输入的入参将作为resume的返回值；</p>

        <p>返回：resume()的入参作。</p>
        </td>
    </tr><tr><td style="width:225px;">coroutine.status(co)</td>
        <td style="width:624px;">
        <p>获取coroutine的状态；</p>

        <p>入参：coroutine.create()的返回值；</p>

        <p>返回：返回coroutine的状态有四种：dead，suspend，running,normal。</p>
        </td>
    </tr><tr><td style="width:225px;">coroutine.wrap(func)</td>
        <td style="width:624px;">
        <p>创建coroutine，返回一个函数，一旦你调用这个函数，就进入coroutine，和create功能重复；</p>

        <p>入参：是协程运行的函数；</p>

        <p>返回：成功返回一个函数。</p>
        </td>
    </tr><tr><td style="width:225px;">coroutine.running()</td>
        <td style="width:624px;">返回：正在跑的coroutine，一个coroutine就是一个线程，当使用running的时候，就是返回一个corouting的线程号</td>
    </tr></tbody></table><h3>方法详解</h3>
```

**1. coroutine.create(func)**

创建一个主体函数为 func 的新协程。 func 必须是一个 Lua 的函数。 返回这个新协程，它是一个类型为 "thread" 的对象。不会启动该协程。

```
local co = coroutine.create(
    function()
        print("this is a coroutine")
        return "coroutine return"
    end)
print(co)
print(coroutine.resume(co))
```

**输出：**

![](https://img-blog.csdnimg.cn/20190417104732777.png)

**2. coroutine.resume(co, val1, ...)与coroutine.yield(val1, ...)**

**coroutine.resume(co, val1, ...)，开始或唤醒协程co的运行。**

如果第一次执行一个协程时，他会从协程函数开头处开始运行。val1,...这些值会以参数形式传入主体函数。
如果该协程被挂起，resume 会重新启动它； val1, ... 这些参数会作为挂起点（yield）的返回值。
如果协程运行起来没有错误，将运行到协程挂起或协程结束， resume 返回 true 加上传给 yield 的所有值 （当协程挂起）， 或是主体函数的所有返回值（当协程中止）。

**coroutine.yield(val1, ...)，挂起正在调用的协程的执行。 传递给 yield 的参数都会转为 resume 的额外返回值。**

```
local co = coroutine.create(
    function (input)
        print("input : "..input)
        local param1, param2 ,param3 = coroutine.yield("yield1", "learning1")
        print("param1 is : " .. param1)
        print("param2 is : " .. param2)
        print("param3 is : " .. param3)
        local param4, param5 = coroutine.yield("yield2", "learning2")
    print("param4 is : " .. param4)
    print("param5 is : " .. param5)
        -- return 也会将结果返回给 resume
        return "coroutine return" , 1+2
    end)

--第一次执行,将参数传给input
print("first resume",coroutine.resume(co, "coroutine function"))
print("this is main chunk")
--第二次执行,将参数作为yield的返回值,传给param1 param2 param3
print("second resume",coroutine.resume(co, "param1", "param2", "param3"))
--第三次执行,将参数作为yield的返回值,传给param4 param5 多余的param6被舍弃
print("third resume",coroutine.resume(co, "param4", "param5", "param6"))
```

**输出：**

![](https://img-blog.csdnimg.cn/20190417110959958.png)

**分析：**

第一次调用resume，将协同程序唤醒，入参作为函数入参；
协同程序运行；
运行到yield语句；
yield挂起协同程序，第一次resume返回，,resume操作成功返回true，否则返回false；（注意：此处yield入参（yield1、learning1）是resume的返回值）
第二次调用resume，将协同程序唤醒，入参（param1, param2 ,param3）作为yield的返回值 ；
协同程序运行；
运行到yield语句；
yield挂起协同程序，第二次resume返回，,resume操作成功返回true，否则返回false；（注意：此处yield入参（yield2、learning2）是resume的返回值）
...

**3. coroutine.status(co)**

以字符串形式返回协程 co 的状态：

当协程正在运行（它就是调用 status 的那个） ，返回 "running"；
如果协程调用 yield 挂起或是还没有开始运行，返回 "suspended"；
如果协程是活动的，都并不在运行（即它正在延续其它协程），返回 "normal"；
如果协程运行完主体函数或因错误停止，返回 "dead"。

`local co
local co2 = coroutine.create(function() print(“3.”..coroutine.status(co)) end)
co = coroutine.create(
    function ()
        print(“2.”..coroutine.status(co))
        coroutine.resume(co2)
        coroutine.yield()
    end)`

print(“1.”..coroutine.status(co))
coroutine.resume(co)
print(“4.”..coroutine.status(co))
coroutine.resume(co)
print(“5.”..coroutine.status(co))

</code></pre>

**输出：**

![](https://img-blog.csdnimg.cn/20190417111258814.png)

**4. coroutine.wrap(func)**

创建一个主体函数为 func 的新协程。func 必须是一个 Lua 的函数。返回一个函数，每次调用该函数都会延续该协程(不需要调用resume)。传给这个函数的参数都会作为 resume 的额外参数。和 resume 返回相同的值，只是没有第一个布尔量。

```
local wrap = coroutine.wrap(
    function (input)
        print("input : "..input)
        local param1, param2 ,param3 = coroutine.yield("yield1", "learning1")
        print("param1 is : " .. param1)
        print("param2 is : " .. param2)
        print("param3 is : " .. param3)
        local param4, param5 = coroutine.yield("yield2", "learning2")
    print("param4 is : " .. param4)
    print("param5 is : " .. param5)
        -- return 也会将结果返回给 resume
        return "coroutine return" , 1+2
    end)

--第一次执行,将参数传给input
print("first resume", wrap("coroutine function"))
print("this is main chunk")
--第二次执行,将参数作为yield的返回值,传给param1 param2 param3
print("second resume", wrap("param1", "param2", "param3"))
--第三次执行,将参数作为yield的返回值,传给param4 param5 多余的param6被舍弃
print("third resume", wrap("param4", "param5", "param6"))
```

**输出：**

![](https://img-blog.csdnimg.cn/2019041711183286.png)

**注：coroutine.wrap不是保护模式运行,如果发生任何错误，抛出这个错误。如下**

```
local wrap = coroutine.wrap(
    function (input)
        print("input : "..input)
        local param1, param2 ,param3 = coroutine.yield("yield1", "learning1")
        print("param1 is : " .. param1)
        print("param2 is : " .. param2)
        print("param3 is : " .. param3)
        local param4 = coroutine.yield("yield2", "learning2")
    print("param4 is : " .. param4)
    print("param5 is : " .. param5)
        -- return 也会将结果返回给 resume
        return "coroutine return" , 1+2
    end)

--第一次执行,将参数传给input
print("first resume", wrap("coroutine function"))
print("this is main chunk")
--第二次执行,将参数作为yield的返回值,传给param1 param2 param3
print("second resume", wrap("param1", "param2", "param3"))
--第三次执行,将参数作为yield的返回值,传给param4 param5 多余的param6被舍弃
print("third resume", wrap("param4", "param5", "param6"))
```

**输出：**

![](https://img-blog.csdnimg.cn/20190417112301475.png)

**5. coroutine.running()**

返回当前的协程,如果实在主线程,则返回nil

```
local co = coroutine.create(
    function () 
        print(coroutine.running()) 
        end)

print(coroutine.running())
coroutine.resume(co)
print(co)
```

**输出：**

![](https://img-blog.csdnimg.cn/20190417112015927.png)
