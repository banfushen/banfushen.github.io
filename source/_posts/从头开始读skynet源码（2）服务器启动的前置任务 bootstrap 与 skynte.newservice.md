---
title: 从头开始读skynet源码（2）服务器启动的前置任务 bootstrap 与 skynte.newservice
date: 2020-12-13 15:28:46
updated: 2023-07-16 17:11:17
categories:
  - skynet
tags:
  - 后端
---
<!-- more -->

上一篇分析之后，本来第二部分分析是想分析start之后的逻辑的，这样会让人比较快速的理解skynet框架。但想想还是顺着代码启动的思路写下去会比较好，我觉得这样我自己更容易理解。

bootstrap是引导程序的意思，在skynet中，的确也是做了服务器工作的前置任务。

再skynet_start.c中

```
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
```

查询配置

![](/images/posts/skynet2-bootstrap-skyntenewservice/20201213131031565.png)

可以得知，传入的参数是"snlua bootsrtap"，再看到函数的实现

```
static void
bootstrap(struct skynet_context * logger, const char * cmdline) {
    int sz = strlen(cmdline);
    char name[sz+1];
    char args[sz+1];
    sscanf(cmdline, "%s %s", name, args);
    //name = snlua, args = bootstrap
    struct skynet_context *ctx = skynet_context_new(name, args);
    if (ctx == NULL) {
    skynet_error(NULL, "Bootstrap error : %s\n", cmdline);
    skynet_context_dispatchall(logger);
    exit(1);
    }
}
```

接下来看到skynet_context_new方法，在skynet_server.c

```
struct skynet_context * 
skynet_context_new(const char * name, const char *param) {
        //先查询snlua模块，这是一个C写的服务，在skynet_start.c中
        //skynet_statc方法，skynet_module_init(config->module_path)进行初始化
    struct skynet_module * mod = skynet_module_query(name);

    if (mod == NULL)
        return NULL;

        //分析1
        //这里创建一个新的lua虚拟机，所以会有各个服务的隔离
    void *inst = skynet_module_instance_create(mod);
    if (inst == NULL)
        return NULL;
    struct skynet_context * ctx = skynet_malloc(sizeof(*ctx));
    CHECKCALLING_INIT(ctx)

    ctx->mod = mod;
    ctx->instance = inst;
    ctx->ref = 2;
    ctx->cb = NULL;
    ctx->cb_ud = NULL;
    ctx->session_id = 0;
    ctx->logfile = NULL;

    ctx->init = false;
    ctx->endless = false;

    ctx->cpu_cost = 0;
    ctx->cpu_start = 0;
    ctx->message_count = 0;
    ctx->profile = G_NODE.profile;
    // Should set to 0 first to avoid skynet_handle_retireall get an uninitialized handle
    ctx->handle = 0;    
    ctx->handle = skynet_handle_register(ctx);
    struct message_queue * queue = ctx->queue = skynet_mq_create(ctx->handle);
    // init function maybe use ctx->handle, so it must init at last
    context_inc();

    CHECKCALLING_BEGIN(ctx)
        //分析2
        //这里使用snlua，启动传入的bootstrap.lua
    int r = skynet_module_instance_init(mod, inst, ctx, param);
    CHECKCALLING_END(ctx)
    if (r == 0) {
        struct skynet_context * ret = skynet_context_release(ctx);
        if (ret) {
            ctx->init = true;
        }
        skynet_globalmq_push(queue);
        if (ret) {
            skynet_error(ret, "LAUNCH %s %s", name, param ? param : "");
        }
        return ret;
    } else {
        skynet_error(ctx, "FAILED launch %s", name);
        uint32_t handle = ctx->handle;
        skynet_context_release(ctx);
        skynet_handle_retire(handle);
        struct drop_t d = { handle };
        skynet_mq_release(queue, drop_message, &d);
        return NULL;
    }
}
```

按照分析1、分析2的顺序。先看到skynet_module_instance_create，分析1

```
void * 
skynet_module_instance_create(struct skynet_module *m) {
    if (m->create) {
        return m->create(); // 调用c模块的create
    } else {
        return (void *)(intptr_t)(~0);
    }
}
```

看到snlua的create，再service_snlua.c，构建新的lua虚拟机，所以有服务之间的隔离。

```
struct snlua *
snlua_create(void) {
    struct snlua * l = skynet_malloc(sizeof(*l));    
    memset(l,0,sizeof(*l));
    l->mem_report = MEMORY_WARNING_REPORT;
    l->mem_limit = 0;
    l->L = lua_newstate(lalloc, l); // 这里构建了新的lua虚拟机
    return l;
}
```

创建完虚拟机后，看到分析2，到skynet_module_instance_init，在skynet_module.c中，可以看到，其实就是上面代码注释说的，使用snlua的init去启动bootstarp

```
int
skynet_module_instance_init(struct skynet_module *m, void * inst, struct skynet_context *ctx, const char * parm) {
    return m->init(inst, ctx, parm);
}
```

接下来我们到service_snlua.lua中看是怎么使用snlua去启动一个lua脚本的，skynet中，C模块的定义，必须要有一些方法，比如init，上面的m->init，最后会调用到下面的函数

```
int
snlua_init(struct snlua *l, struct skynet_context *ctx, const char * args) {
    int sz = strlen(args);
    char * tmp = skynet_malloc(sz);
    memcpy(tmp, args, sz);
        //给需要初始化的服务设置回调函数为上面的luanch_cb
    skynet_callback(ctx, l , launch_cb);
    const char * self = skynet_command(ctx, "REG", NULL);
    uint32_t handle_id = strtoul(self+1, NULL, 16);
    // it must be first message
        // 给服务发送消息触发上面的launch_cb
        // 这里先知道触发上面，具体的消息处理我们的分析会说明
        // 给服务发送消息之后，具体的服务是怎么去处理的
    skynet_send(ctx, 0, handle_id, PTYPE_TAG_DONTCOPY,0, tmp, sz);
    return 0;
}
```

发送消息后，调用到luanch_cb

```
static int
launch_cb(struct skynet_context * context, void *ud, int type, int session, uint32_t source , const void * msg, size_t sz) {
    assert(type == 0 && session == 0);
    struct snlua *l = ud;
    skynet_callback(context, NULL, NULL);
    int err = init_cb(l, context, msg, sz);//再这进行服务的最后初始化，分析在下面
    if (err) {
        skynet_command(context, "EXIT", NULL);
    }

    return 0;
}
```

最后调用init_cb，下面是精简了的代码，只是为了说明调用流程

```
static int
init_cb(struct snlua *l, struct skynet_context *ctx, const char * args, size_t sz) {
        ......

        //这里，就是使用loader.lua去加载我们的bootstrap
        const char * loader = optstring(ctx, "lualoader", "./lualib/loader.lua");

    int r = luaL_loadfile(L,loader);
    if (r != LUA_OK) {
        skynet_error(ctx, "Can't load %s : %s", loader, lua_tostring(L, -1));
        report_launcher_error(ctx);
        return 1;
    }
    lua_pushlstring(L, args, sz);
    r = lua_pcall(L,1,0,1); // 这里，就又通过C语言的lua接口，调用回了lua层面。
    if (r != LUA_OK) {
        skynet_error(ctx, "lua loader error : %s", lua_tostring(L, -1));
        report_launcher_error(ctx);
        return 1;
    }
    lua_settop(L,0);
    if (lua_getfield(L, LUA_REGISTRYINDEX, "memlimit") == LUA_TNUMBER) {
        size_t limit = lua_tointeger(L, -1);
        l->mem_limit = limit;
        skynet_error(ctx, "Set memory limit to %.2f M", (float)limit / (1024 * 1024));
        lua_pushnil(L);
        lua_setfield(L, LUA_REGISTRYINDEX, "memlimit");
    }
    lua_pop(L, 1);

    lua_gc(L, LUA_GCRESTART, 0);

    return 0;
}
```

启动了bootstrap又怎样呢，往下看bootstrap.lua

```
skynet.start(function()
    local sharestring = tonumber(skynet.getenv "sharestring" or 4096)
    memory.ssexpand(sharestring)

    local standalone = skynet.getenv "standalone"

        // 这里又用snlua去启动了launcher.lua，启动过程和bootstrap一样
        // 这个launcher服务先记住，待会儿就知道干嘛的了
    local launcher = assert(skynet.launch("snlua","launcher"))
    skynet.name(".launcher", launcher)

        // 这下面还有一些是bootstrap这个前置任务做的
        // 这里skynet.newservice是啥？
    ......
        skynet.newservice "service_mgr"
    pcall(skynet.newservice,skynet.getenv "start" or "main")
    skynet.exit()// 启动完上面的，完成了任务，这个服务就退出了

end)
```

看到skynet.newservice，这个在skynet中，就是lua层用来启动新服务的。在skynet.lua中，可以看到，call  .launcher就是使用上面启动的launcher.lua去启动一个服务

```
function skynet.newservice(name, ...)
        // 这个参数 "LAUNCH", "snlua", name, ...特别注意一下
        // 最后也是用调用snlua去启动一个lua服务
    return skynet.call(".launcher", "lua" , "LAUNCH", "snlua", name, ...)
end
```

在看到launcher中的LAUNCH，在launcher.lua中

```
require "skynet.manager"    -- import manager apis

local function launch_service(service, ...)
    local param = table.concat({...}, " ")
    local inst = skynet.launch(service, param)
    local session = skynet.context()
    local response = skynet.response()
    if inst then
        services[inst] = service .. " " .. param
        instance[inst] = response
        launch_session[inst] = session
    else
        response(false)
        return
    end
    return inst
end

function command.LAUNCH(_, service, ...)
    launch_service(service, ...)
    return NORET
end
```

下面看到skyne.launch，在manager.lua

```
local c = require "skynet.core"

function skynet.launch(...)
    local addr = c.command("LAUNCH", table.concat({...}," "))
    if addr then
        return tonumber("0x" .. string.sub(addr , 2))
    end
end
```

调用到c.command，

这里的skynet.core是一个C语言模块，至此，我们将进入C语言实现部分，调用skynet.core.command(“LAUNCH”, “snlua ...”)。

我们先总结一下lua部分的内容：

newservice–>skynet.call .launcher–>.launcher=skynet.launch(“snlua”, “launcher”)–>skynet.core.command(“LAUNCH”, “snlua ...”)

skynet.core其实是在lua_skynet.c中定义的，其command对应于lcommand函数。 这时的参数其实都压进了lua_State中。

```
static int
lcommand(lua_State *L) {
    struct skynet_context * context = lua_touserdata(L, lua_upvalueindex(1));
    const char * cmd = luaL_checkstring(L,1);
    const char * result;
    const char * parm = NULL;
    if (lua_gettop(L) == 2) {
        parm = luaL_checkstring(L,2);
    }

        // 这里就是调用skynet_server.c
    result = skynet_command(context, cmd, parm);
    if (result) {
        lua_pushstring(L, result);
        return 1;
    }
    return 0;
}
```

也就最后调用到skynet_server.c中skynet_command

```
static struct command_func cmd_funcs[] = {
    { "TIMEOUT", cmd_timeout },
    { "REG", cmd_reg },
    { "QUERY", cmd_query },
    { "NAME", cmd_name },
    { "EXIT", cmd_exit },
    { "KILL", cmd_kill },
    { "LAUNCH", cmd_launch }, //LAUNCH对应这个
    { "GETENV", cmd_getenv },
    { "SETENV", cmd_setenv },
    { "STARTTIME", cmd_starttime },
    { "ABORT", cmd_abort },
    { "MONITOR", cmd_monitor },
    { "STAT", cmd_stat },
    { "LOGON", cmd_logon },
    { "LOGOFF", cmd_logoff },
    { "SIGNAL", cmd_signal },
    { NULL, NULL },
};

const char * 
skynet_command(struct skynet_context * context, const char * cmd , const char * param) {
    struct command_func * method = &cmd_funcs[0];
    while(method->name) {
        if (strcmp(cmd, method->name) == 0) {
            return method->func(context, param);
        }
        ++method;
    }

    return NULL;
}
```

再看到cmd_launch，这里就十分熟悉了，接入回上面的bootstrap的分析

```
static const char *
cmd_launch(struct skynet_context * context, const char * param) {
    size_t sz = strlen(param);
    char tmp[sz+1];
    strcpy(tmp,param);
    char * args = tmp;
    char * mod = strsep(&args, " \t\r\n");
    args = strsep(&args, "\r\n");

        // 这里这几行是不是特别熟悉
        // 没错，就是和上面的bootstrap的启动一模一样
        // 就是使用snlua去启动另外的服务
    struct skynet_context * inst = skynet_context_new(mod,args);
    if (inst == NULL) {
        return NULL;
    } else {
        id_to_hex(context->result, inst->handle);
        return context->result;
    }
}
```

可以看到，之后我们在lua层使用的skynet.newservice都是通过launcher.lua去启动新服务器的了。

最后bootstrap做的事情中一个重要就是，启动了launcher.lua服务，之后框架中skynet.newservice就是调用launcher去启动lua服务。

所以叫他服务器的前置任务。之后的启动新服务之后，回调函数怎么挂钩之类的，之后在分析。

下一篇分享bootstrap后skynet_start做了什么
