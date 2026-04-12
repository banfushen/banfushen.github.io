---
title: 从头开始读skynet源码（1）main入口干了什么
date: 2020-10-24 19:32:03
updated: 2023-07-16 17:11:17
categories:
  - skynet
tags:
  - 1024程序员节 后端
---
<!-- more -->

使用skynet一年半了。源码也断断续续读了不少，也看了几篇skynet的源码分析。他们都说的很好。但是觉得分析只是给你一个理解代码的观点，但是没个人的理解方式是不一样的，我也写一写我自己的理解。

下面进入正题。

首先，还是要有一个观念，skynet是干嘛的，云风前辈的Skynet 设计综述，wiki什么的都是要读的。然后进入正题。

从我学习开始，我理解的一个C/C++程序都是从main函数开始运行的，skynet也不例外。**以下的代码关键部分都带有注释。**

**skynet_main.c    **

**main函数其实就是，解析配置，做一些初始化，然后使用配置去调用启动函数。**

```
int
main(int argc, char *argv[]) {
    const char * config_file = NULL ;
    if (argc > 1) {
        config_file = argv[1];
    } else {
        fprintf(stderr, "Need a config file. Please read skynet wiki : https://github.com/cloudwu/skynet/wiki/Config\n"
            "usage: skynet configfilename\n");
        return 1;
    }

    //这里做一些初始化
    luaS_initshr();
    skynet_globalinit();  //全局数据的一些初始化
    skynet_env_init();    //环境初始化

    sigign();

    struct skynet_config config;

    //打开一个lua虚拟机用于解析传入的配置
    struct lua_State *L = luaL_newstate();    
    luaL_openlibs(L);    // link lua lib

    int err =  luaL_loadbufferx(L, load_config, strlen(load_config), "=[skynet config]", "t");
    assert(err == LUA_OK);
    lua_pushstring(L, config_file);

    err = lua_pcall(L, 1, 1, 0);
    if (err) {
        fprintf(stderr,"%s\n",lua_tostring(L,-1));
        lua_close(L);
        return 1;
    }
    _init_env(L);    //这里看函数就知道是初始化环境

    //记录配置
    config.thread =  optint("thread",8);
    config.module_path = optstring("cpath","./cservice/?.so");
    config.harbor = optint("harbor", 1);
    config.bootstrap = optstring("bootstrap","snlua bootstrap");
    config.daemon = optstring("daemon", NULL);
    config.logger = optstring("logger", NULL);
    config.logservice = optstring("logservice", "logger");
    config.profile = optboolean("profile", 1);

    //解析完，关闭用于解析的lua虚拟机
    lua_close(L);

    //通过配置启动调用skynet_start
    skynet_start(&config);
    skynet_globalexit();
    luaS_exitshr();

    return 0;
}
```

**skynet_start.c**

**skynet_start做的就是继续初始化，这里需要注意的是bootstrap，这里通过配置可以知道，其实是启动的是snlua（用C写的模块），之后所有的lua服务都是通过snlua启动的（snlua加载lua文件））先记着，之后再分析。**

```
void 
skynet_start(struct skynet_config * config) {
    // register SIGHUP for log file reopen
    // 这里处理一些信号的问题。
    struct sigaction sa;
    sa.sa_handler = &handle_hup;
    sa.sa_flags = SA_RESTART;
    sigfillset(&sa.sa_mask);
    sigaction(SIGHUP, &sa, NULL);

    //看看是否配置了守护进程
    if (config->daemon) {
        if (daemon_init(config->daemon)) {
            exit(1);
        }
    }
    skynet_harbor_init(config->harbor);            // harbor(港口)初始化
    skynet_handle_init(config->harbor);            // handler初始化，存贮全部的服务句柄
    skynet_mq_init();                            // 全局队列初始化
    skynet_module_init(config->module_path);    // C模块初始化
    skynet_timer_init();                        // 定时器初始化
    skynet_socket_init();                        // socket初始化
    skynet_profile_enable(config->profile);        

    //启动logger服务
    struct skynet_context *ctx = skynet_context_new(config->logservice, config->logger);
    if (ctx == NULL) {
        fprintf(stderr, "Can't launch %s service\n", config->logservice);
        exit(1);
    }

    skynet_handle_namehandle(skynet_context_handle(ctx), "logger");

    //启动配置中的bootstrap服务
    bootstrap(ctx, config->bootstrap);

    //调用start传入配置线程数量
    start(config->thread);

    // harbor_exit may call socket send, so it should exit before socket_free
    skynet_harbor_exit();
    skynet_socket_free();
    if (config->daemon) {
        daemon_exit(config->daemon);
    }
}
```

然后调用，start，这是整个逻辑的启动，下篇先分析bootstrap。
