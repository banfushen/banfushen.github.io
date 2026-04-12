---
title: Lua逻辑运算符and，or，not
date: 2019-04-15 11:56:05
updated: 2023-07-16 17:11:17
categories:
  - lua
tags:
  - Lua and、or、no't lua三目运算符浅析
---
<!-- more -->

在Lua中合理使用and，or，not可提高代码效率，减少代码量，增加可读性。

Lua逻辑运算符and，or，not规则如下：

设定 **A 的值为 true**，**B 的值为 false**：

**操作符**
**描述**
**实例**
and
逻辑与操作符。 若 A 为 true，则返回 B；若A为false，则返回A。
(A and B) 为 false。

or

逻辑或操作符。 若 A 为 true，则返回 A，若A为false，则返回 B。
(A or B) 为 true。
not
逻辑非操作符。与逻辑运算结果相反，如果条件为 true，逻辑非为 false。
not(A and B) 为 true。

**优先级and>or，意味着当一行代码同时出现and与or的时候，先进行and操作。**

```
A or B and C == A or (B and C）
```

**例子：**

```
print('---------------and--------------------')
print(true and true)
print(true and false)
print(false and true)
print(false and false)
print('---------------or---------------------')
print(true or true)
print(true or false)
print(false or true)
print(false or false)
print('--------------not---------------------')
print(not(true))
print(not(false))
print('------------and，or-------------------')
print(true or false and false)
```

**输出：**

![](https://img-blog.csdnimg.cn/20190415115145741.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

**lua三目运算符：**

```
ret = a > b and a or b
```

a>b时：a>b and a or b----->a or b----->a

a<=b时：a>b and a or b ----->a>b or b----->b

**lua并不能完全实现三目运算符**

三目运算的一般形式a ? b : c

```
<p>a = true,结果为b<br />
a = false,结果为c</p>
</li>
<li>
<p>对应Lua中的a and b or c</p>

<ul><li>b = true
    <ul><li>a = true
        <ul><li>a and b –> true</li>
            <li>b or c –> b</li>
        </ul></li>
        <li>a = false
        <ul><li>a and b –> false</li>
            <li>b or c –> c</li>
        </ul></li>
    </ul></li>
    <li>b = false
    <ul><li>a = true
        <ul><li>a and b –> false</li>
            <li>b or c –> c</li>
        </ul></li>
        <li>a = false
        <ul><li>a and b –> false</li>
            <li>b or c –> c</li>
        </ul></li>
    </ul></li>
</ul></li>
```

</ul>

由此可见，lua要想实现三目运算符要注意

### **注意：Lua中的and与or，和C/C++的与、或有所区别。不要混淆使用。**
