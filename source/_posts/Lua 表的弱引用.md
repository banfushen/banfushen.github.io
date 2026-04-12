---
title: Lua 表的弱引用
date: 2020-09-15 20:29:41
updated: 2023-07-16 17:11:17
categories:
  - lua
tags:
  - lua 后端
---
<!-- more -->

最近被问到一个问题，什么是lua表的弱引用，之前看过lua程序设计第四版，但是当时不记得了，并不能回答出来。之后做了简单查阅，作此记录。

lua的垃圾回收机制是，当一个变量不再被引用了。当触发垃圾回收机制的时候，会回收这部分内存。**而弱引用，则是更好的回收内存的一种方法。**下面上代码：

**对key设置弱引用之前：**

```
local t = {}
local key1 = { name  = 'key1' }
t[key1] = 1
key1 = nil

for k,v in pairs(t) do
    print(k,v)
    for k1,v1 in pairs(k) do    --由于k是一个table，再次打印
        print(k1,v1)
    end
end
```

输出结果是这样的：

![](/images/posts/lua/20200915201431469.png)

可以看到，即使我们的表key1置为空了，但是表t依然能够打印出来（是表 t 还是包含着对表 key1 的引用）。**下面我们设置key的弱引用**，代码如下：

```
local t = {}
local key1 = { name  = 'key1' }
t[key1] = 1
key1 = nil
setmetatable(t, {__mode = "k"})   --设置 table 中 key 的弱引用
collectgarbage()                  --手动触发垃圾回收  

for k,v in pairs(t) do
    print(k,v)
    for k1,v1 in pairs(k) do
        print(k1,v1)
    end
end
```

**输出结果是这样的：**

![](/images/posts/lua/20200915200902928.png)

可以看到，当触发垃圾回收的时候，表t 已经被清空了。这就是由于对 table key 的弱引用，**当key值没有被别的值引用时，垃圾回收会直接回收含有这个指定key的表的内存。**

**        弱引用也可以设置位 table 的 value**。

** 对value设置弱引用之前：**

```
local t = {}
local key2 = { name = 'key2'}
table.insert(t, key2)
key2 = nil

for k,v in pairs(t) do
    print(k,v)
    for k1,v1 in pairs(v) do      --由于 v 是一个table 再次打印
        print(k1,v1)
    end
end
```

**结果如下：**

![](/images/posts/lua/20200915201721105.png)

** 对value设置弱引用：**

```
local t = {}
local key2 = { name = 'key2'}
table.insert(t, key2)
key2 = nil

setmetatable(t, {__mode = "v"})   --设置 table value的弱引用
collectgarbage()                  --手动触发垃圾回收

for k,v in pairs(t) do
    print(k,v)
    for k1,v1 in pairs(v) do
        print(k1,v1)
    end
end
```

**结果如下：**

![](/images/posts/lua/2020091520251692.png)

**也可以同时设置对 key 和 value 的弱引用。**这样一旦有一个被置为nil，则垃圾回收时直接触发回收。

```
local t = {}
local key2 = { name = 'key2'}
table.insert(t, key2)
key2 = nil

setmetatable(t, {__mode = "v"})   --设置 table，key 和 value 的弱引用
collectgarbage()                  --手动触发垃圾回收

for k,v in pairs(t) do
    print(k,v)
    for k1,v1 in pairs(v) do
        print(k1,v1)
    end
end
```

** 结果如下：**

![](/images/posts/lua/2020091520251692.png)

** **最后，合理的使用弱引用，可以加强垃圾回收。但是如果不熟悉，也可能造成意想不到的后果。
