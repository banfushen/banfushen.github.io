---
title: Lua for 循环
date: 2019-04-02 17:02:46
updated: 2023-07-16 17:11:17
categories:
  - lua
tags:
  - LUA LUA语言For循环
---
<!-- more -->

真的是无语，我手一个字一个字的敲的，发布一年后说我抄袭。Lua语言for循环分为两大类：**数值for循环、泛型for循环**

# **1.数值for循环**

Lua 编程语言中数值for循环语法格式:

```
for var=exp1,exp2,exp3 do  
    <执行体>  
end
```

var 从 exp1 变化到 exp2，每次变化以 exp3 为步长递增 var，并执行一次 **"执行体"**。exp3 是可选的，如果不指定，默认为1。

### 实例：

```
for i=10,1,-2 do
    print(i)
end
```

以上实例输出结果为：

![](/images/posts/lua-for/20190402165248152.png)

### **注意：**for的三个表达式在循环开始前一次性求值，以后不再进行求值。

```
function f(x)
    print("function")
    return x*2
end
for i=1,f(5) do 
    print(i)
end
```

以上实例输出结果为：

![](/images/posts/lua-for/20190402165706247.png)

# 2.泛型for循环

泛型 for 循环通过一个迭代器函数来遍历所有值，Lua 编程语言中泛型 for 循环语法格式:

```
--打印数组a的所有值  
a = {"one", "two", "three"}
for i, v in ipairs(a) do
    print(i, v)
end
```

i是数组索引值，v是对应索引的数组元素值。ipairs是Lua提供的一个迭代器函数，用来迭代数组。

### 实例：

```
days = {"Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"}  
for i,v in ipairs(days) do 
    print(v) 
end
```

以上实例输出结果为：

![](/images/posts/lua-for/20190402170223788.png)
