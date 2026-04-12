---
title: C调用Lua与解决Lua环境问题
date: 2020-08-12 15:56:32
updated: 2023-07-16 17:11:17
categories:
  - lua
tags:
  - c++ lua
---
<!-- more -->

一直是在框架上进行开发，而skynet的优点之一也是可以用lua来写逻辑，所以C调用lua这一块一直没有自己实际尝试，现在正在训练ai，刚好有时间搞搞这个。

先补充概念：

**   1.C是需要自己管理内存的，申请、释放**

**       2.lua是自动管理内存的，没有引用的变量会定时被gc**

** **那如果，c在调用lua时，如果lua变量被释放了，就悲剧了。所以需要用一个东西一直来引用lua的变量。C与lua交互就是使用虚拟栈来交互（个人理解）。

下面上代码，这些C使用lua的api可以自己去查具体的用处。

附上lua 5.3中文参考手册地址：[https://www.runoob.com/manual/lua53doc/contents.html#contents](https://www.runoob.com/manual/lua53doc/contents.html#contents)

** 1.以下为C代码**

```
#include <stdio.h>

extern "C" 
{
    #include "lua.h"
    #include "lauxlib.h"    //这里需要真tm的注意，不是luaxlib
    #include "lualib.h"
}

//调用lua中的add函数
int call_lua_add(lua_State *L)
{
    lua_getglobal(L, "add");         //把虚拟机中全局变量 add 压入虚拟机L的栈，这里注意，一定要是全局变量
    lua_pushnumber(L, 123);            //第一个参数入栈
    lua_pushnumber(L, 456);         //第二个参数入栈
    lua_call(L, 2, 1);                //调用栈中的add函数，2个参数，1个返回值
    int sum = (int)lua_tonumber(L, -1);        //获取栈顶元素(上一步的返回值)
    lua_pop(L, 1);        //栈顶元素出战
    return sum;
}

int main()
{
    lua_State *L = luaL_newstate();        //新建lua虚拟机
    luaL_openlibs(L);                    //在虚拟机中载入lua所有函数库
    luaL_dofile(L, "Test.lua");            //加载 并 运行指定的文件
    lua_settop(L, 0);                    //重新设置栈底，这个过程，是为了确认栈底是空的，以便后面的操作是按照顺序入栈的且从1号栈位开始
    int ret = call_lua_add(L);
    printf("调用lua文件结果为 %d\n", ret);
    lua_close(L);                        //一定记得关闭虚拟机  

    return 0;
}
```

**2.以下为lua代码**

```
function add( x, y )
    return x+y
end

print("你终于动手了")
```

**3.编译c文件，然后发现报错了，原因时找不到头文件的，也就是环境没指定好**

![](https://img-blog.csdnimg.cn/20200812142708412.png)

**4.简单查找一下**

![](https://img-blog.csdnimg.cn/20200812142804341.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

**4.然后编译，-I参数是用来指定头文件目录 （是i），然后发现报错了**

![](https://img-blog.csdnimg.cn/20200812142853903.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

这个报错是说没找到这些东西，因为这些都在lualib库里，查找一下，指定一下即可。

![](https://img-blog.csdnimg.cn/20200812143354735.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

**5.我是直接sudo cp /usr/lib/x86_64-linux-gnu/liblua5.3.so.0 . 将库拷贝到本目录，然后改名为liblua5.3.so。然后编译，-l参数就是用来指定程序要链接的库，-l参数紧接着就是库名 （l），没报错。运行。结果如下**

![](https://img-blog.csdnimg.cn/20200812152425666.png)

因为使用lua也有一段时间了，以前一直感觉C与lua交互是不难的，但是感觉是感觉，只有自己实际操作了，才有权力去说难不难。今天尝试了，的确不难。还是需要尽量都是自己去尝试了，才下结论。**“有剑不用，和没有剑，不是用一个概念”**
