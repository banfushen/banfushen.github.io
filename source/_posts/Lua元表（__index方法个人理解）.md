---
title: Lua元表（__index方法个人理解）
date: 2019-04-16 11:26:29
updated: 2023-07-16 17:11:17
categories:
  - lua
tags:
  - Lua 元表 __index
---
<!-- more -->

**什么是Lua元表：**

原表可理解为“一个**方法表**（类似函数表）“，里面包含了一些解决方案。当一个table设置元表之后，相当于关联了这个方法表

**setmetatable(table,metatable):** 对指定 table 设置元表(metatable)，如果元表(metatable)中存在 __metatable 键值，setmetatable 会失败。
**getmetatable(table):** 返回对象的元表(metatable)。

### 实例：

```
mytable = {} ;                         -- 普通表
mymetatable = {} ;                     -- 元表
setmetatable(mytable,mymetatable);     -- 把 mymetatable 设为 mytable 的元表
```

### 以下为返回对象元表：

```
getmetatable(mytable)                            -- 这回返回mymetatable
```

元表中有很多原方法，下面以**__index元方法**为例：

当你通过键来访问 table 的时候，如果这个键没有值，那么Lua就会寻找该table的metatable（假定有metatable）中的__index 键。如果__index包含一个表格，Lua会在表格中查找相应的键。

### 例如：

```
house = {house_computer = "Macbook"};
company = {company_computer = "Acer"};
setmetatable(house, company);                  --把company设置为house的metatable
print(house.company_computer);
```

输出的结果是**nil**。

把代码改为：

```
house = {house_computer = "Macbook"};
company = {company_computer = "Acer"};
company.__index = company;               -- 把company的__index方法指向自己
setmetatable(house, company);            --把company设置为house的metatable
print(house.company_computer);
```

输出的结果是**Acer**。

在刚学习时，对**__index**方法有所误解：**如果house 的元表是company ，如果访问了一个house中不存在的成员，就会访问查找company中有没有这个成员。**而这个理解实际上是错误的，即使将house的元表设置为company，而且company中也确实有这个成员，返回结果仍然会是nil，原因就是company的__index元方法没有赋值。之前有说过，原表类似于“**方法表**”，设置元表相当于关联了方法表，但是并不是在方法表里查找元素，而应该是调用方法表里相应的方法。**__index就是定义了当表在查找相应的key值对应的value时，查找失败，应该怎么办。**

把代码改为：

```
house = {house_computer = "Macbook"};
company = {company_computer = "Acer"};
company.__index = function()
                    return "hello world!";
                    end
setmetatable(house, company);    --把company设置为house的metatable
print(house.company_computer);
```

输出的结果是**hello world!**。

在上述例子中，访问house.company_computer时，house中没有company_computer这个成员，但Lua接着发现house有元表company，注意：此时，Lua并不是直接在company中找名为company_computer的成员，而是调用company的__index方法，如果__index方法为nil，则返回nil，如果是一个表，那么就到__index方法所指的这个表中查找名为company_computer的成员，于是，最终找到了company_computer成员。__index方法除了可以是一个表，还可以是一个函数，如果是一个函数，__index方法被调用时将返回该函数的返回值。

> ### 总结
>
> Lua 查找一个表元素时的规则，其实就是如下 3 个步骤:
>
> - 1.在表中查找，如果找到，返回该元素，找不到则继续
> - 2.判断该表是否有元表，如果没有元表，返回 nil，有元表则继续。
> - 3.判断元表有没有 __index 方法，如果 __index 方法为 nil，则返回 nil；如果 __index 方法是一个表，则重复 1、2、3；如果 __index 方法是一个函数，则返回该函数的返回值。
>
> 该部分内容来自作者寰子：https://blog.csdn.net/xocoder/article/details/9028347

## 注：别的元方法也一样，调用的是实际上是设置的元表的元方法。
