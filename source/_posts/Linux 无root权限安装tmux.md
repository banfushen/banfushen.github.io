---
title: Linux 无root权限安装tmux
date: 2020-11-23 09:57:06
updated: 2023-07-16 17:11:17
categories:
  - Linux
tags:
  - linux
---
<!-- more -->

在新公司中，开发是需要连接到开发机上的，而且员工作为普通用户，无法安装软件到除用户目录以外的目录(也就是没有root权限)。当我们需要下载安装一些常用工具时，因为没网，所以无法使用`apt-get`等下载指令。

**ps：为什么没有root，就无法使用apt-get，因为apt-get是会去写一些文件到root用户才有权限的文件夹(例如/user....)或者修改系统环境变量的。而普通用户是没有权限，所以没法使用。**

**       要解决这个问题，最主要的方法就是，修改安装的目录，添加自己用户下指定目录为环境变量。**

最后使用以下方法安装tmux，亲测可行。

# **1.下载及其依赖软件**

这里有一个坑，待会儿说。

```
wget -c https://github.com/tmux/tmux/releases/download/3.0a/tmux-3.0a.tar.gz 

wget -c https://github.com/libevent/libevent/releases/download/release-2.1.11-stable/libevent-2.1.11-stable.tar.gz 

wget -c https://ftp.gnu.org/gnu/ncurses/ncurses-6.2.tar.gz
```

# 2.解压

tar -zxvf xxxxxx

# 3.先安装依赖，在安装tmux

```
# libevent
./configure --prefix=$HOME/.local --disable-shared
make && make install

# ncurses
./configure --prefix=$HOME/.local
make && make install

# tmux
./configure CFLAGS="-I$HOME/.local/include -I$HOME/.local/include/ncurses" LDFLAGS="-L$HOME/.local/lib -L$HOME/.local/include/ncurses -L$HOME/.local/include" --prefix=$HOME/.local/bin
make && make install

cp tmux $HOME/.local/bin
```

这里，如果出现类似这种错误，就是我上面说的坑。我自己也碰到了，最后改了过来，这个图是引用网上的，我的情况忘记截图了。

![](/images/posts/linux-roottmux/20201123095157736.png)

看这位的回答就知道原因了，原地址在[https://segmentfault.com/q/1010000015949611](https://segmentfault.com/q/1010000015949611)

![](/images/posts/linux-roottmux/20201123095348446.png)

我选了相应版本后，解决了以上问题。最后安装成功。

最后设置环境变量

```
#环境变量设置
#将下面的语句添加到.bashrc中
export $PATH="$HOME/.local/bin:$PATH"
#重载环境
source .bashrc
```
