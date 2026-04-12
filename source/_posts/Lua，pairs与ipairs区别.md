---
title: Lua，pairs与ipairs区别
date: 2019-04-02 17:31:33
updated: 2023-07-16 17:11:17
categories:
  - lua
tags:
  - LUA中pairs与ipairs区别
---
<!-- more -->

pairs遍历表中全部key，value

ipairs 这个迭代器只能遍历所有数组下标的值，这是前提，也是和 pairs 的最根本区别，也就是说如果 ipairs 在迭代过程中是会直接跳过所有手动设定key值的变量。

特别注意一点，和其他多数语言不同的地方是，迭代的下标是从1开始的。

### pairs实例：

```
tab = {1, 2, 3, key1 = nil, key2 = "val2", nil,  "d"}
for k, v in pairs(tab) do
    print(k,v)
end
```

以上实例结果：

![](https://img-blog.csdnimg.cn/20190402171306522.png)

**注意：pairs遍历过程中元素出现的顺序可能是随机的，唯一能确定的是，每个元素只会出现一次。**

### ipairs实例：

```
tab = {1, 2, 3, key1 = nil, key2 = "val2", nil,  "d"}
for k, v in ipairs(tab) do
    print(k,v)
end

tab = {1, 2, 3, key1 = nil, key2 = "val2", "d"}
for k, v in ipairs(tab) do
    print(k,v)
end
```

以上实例结果：

![](https://img-blog.csdnimg.cn/20190402172336252.png)

ps：中间那道杠（-------）是分隔符，插入代码时不能选择LUA，选择了别的语言代替，上面实例代码中删除了打印分隔符，如果没删除，代码会变成纯白色，可读性不强。

## 总结：

### **1.pairs** 能迭代所有键值对。

### **2.ipairs** 可以想象成 **int+pairs**，只会迭代键为数字的键值对。

### 3.ipairs在迭代过程中如果遇到nil时会直接停止。
