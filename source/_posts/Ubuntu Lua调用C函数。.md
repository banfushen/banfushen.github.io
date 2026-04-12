---
title: Ubuntu Lua调用C函数。
date: 2020-10-09 19:54:53
updated: 2023-07-16 17:11:17
categories:
  - lua
tags:
  - 后端
---
<!-- more -->

用了很久lua，框架原因，今天写一下lua调用so库。

真的是不做不知道，一做真奇妙。网上那么多篇文章，基本上都是你抄我，我抄你。错误都一样，验证都没验证过。。。

先声明一下我的环境，Ubuntu 18.04，lua5.3

**1.概念补充，lua和c交互是通过一个虚拟的栈来交互的，为什么是这样？**

C与Lua之间通信关键内容在于一个虚拟的栈。几乎所有的调用都是对栈上的值进行操作，所有C与Lua之间的数据交换也都通过这个栈来完成。另外，也可以使用栈来保存临时变量。每一个与Lua通信的C函数都有其独有的虚拟栈，虚拟栈由Lua管理。

栈的使用解决了C和Lua之间两个不协调的问题：第一，Lua会自动进行垃圾收集，而C要求显式的分配存储单元，两者引起的矛盾。第二，Lua中的动态类型和C中的静态类型不一致引起的混乱。

**2.要想调用C中的方法，则需要把C编译成动态库，我是在linux下，所以是.so，代码如下**

c_so.cpp

```
extern "C" {
  #include <stdio.h>
  #include <lua.h>
  #include <lualib.h>
  #include <lauxlib.h>
}

//自定义函数
static int my_add(lua_State *L)
{
    int x = lua_tonumber(L,1); //第一个参数,转换为数字
    int y = lua_tonumber(L,2); //第二个参数,转换为数字
    int sum = x + y;           
    lua_pushnumber(L, sum);    //将函数的结果压入栈中。如果有多个返回值，可以在这里多次压入栈中。
    return 1; //返回sum计算结果
}

static int showstr(lua_State *L)
{
   //从lua中传入的第一个参数
   const char *str = lua_tostring (L, 1);

   printf ("c program str = %s\n", str);
   return 0;
}

/* 需要一个"luaL_Reg"类型的结构体，其中每一个元素对应一个提供给Lua的函数。
 * 每一个元素中包含此函数在Lua中的名字，以及该函数在C库中的函数指针。
 * 最后一个元素为“哨兵元素”（两个"NULL"），用于告诉Lua没有其他的函数需要注册。
 */
static luaL_Reg funclist[] =
{
    {"add", my_add}, //my_add()函数，lua中访问时使用名称为add
    {"show", showstr}, //showstr()函数，lua中访问时使用名称为show
    {NULL, NULL},  //最后必须有这个
};

/* 此函数为C库中的“特殊函数”。
 * 通过调用它注册所有C库中的函数，并将它们存储在适当的位置。
 * 此函数的命名规则应遵循：
 * 1、使用"luaopen_"作为前缀。
 * 2、前缀之后的名字将作为"require"的参数。
 */
extern "C" int luaopen_mylib(lua_State *L )
{
     /* void luaL_newlib (lua_State *L, const luaL_Reg l[]);
     * 创建一个新的"table"，并将"l"中所列出的函数注册为"table"的域。
     */ 
    luaL_newlib(L, funclist);
    return 1;
}
```

然后编译 **gcc -shared -fPIC c_so.cpp -o mylib.so -I /home/lk/my_skynet_learning/skynet/3rd/lua/**

编译完成后将会得到mylib.so

![](/images/posts/ubuntu-luac/20201009195100952.png)

testso.lua

```
local mylib = require "mylib"

local i = mylib.add(1, 2)
print(i)

local j = mylib.show('真的太多坑了')
```

运行结果如下

![](/images/posts/ubuntu-luac/20201009195329107.png)

网上搜的真的是各种坑。哎。
