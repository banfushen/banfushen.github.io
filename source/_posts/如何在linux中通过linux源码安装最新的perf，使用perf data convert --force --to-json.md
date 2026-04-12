---
title: 如何在linux中通过linux源码安装最新的perf，使用perf data convert --force --to-json
date: 2022-02-10 20:25:42
updated: 2023-07-16 17:11:17
categories:
  - Linux 性能优化
tags:
  - linux debian
---
<!-- more -->

perf可以针对进程进行profile，也可以对线程进行profile。再对进程profile之后，拿到perf.data，也可以修改为针对进程下的线程进行profile。所以照理来说应该是可以从perf.data中查看到有多少线程。
这也符合我们的一般要求，即有perf.data之后，可以针对线程显示火焰图。经过查询资料发现，perf中有`perf data convert --force --to-json temp.json`可以把perf.data转成json进行查看，但是要新版本的perf才有…这就恨坑爹，以为着我们需要自己安装最新的perf。

# 安装perf

我的系统是RedHat系列，对应的Debian系列需要自己修改一下install相关。
拉取最新的内核代码`git clone git://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git --depth 1000`

```bash
[root@ip-10-155-128-114 ~]# cd linux/tools/perf/
[root@ip-10-155-128-114 perf]# LIBBABELTRACE=1 LIBBABELTRACE_DIR=/usr/local  make
  BUILD:   Doing 'make -j2' parallel build
  HOSTCC  fixdep.o
  HOSTLD  fixdep-in.o
  LINK    fixdep
Warning: Kernel ABI header at 'tools/include/uapi/linux/kvm.h' differs from latest version at 'include/uapi/linux/kvm.h'
diff -u tools/include/uapi/linux/kvm.h include/uapi/linux/kvm.h
Warning: Kernel ABI header at 'tools/include/uapi/linux/perf_event.h' differs from latest version at 'include/uapi/linux/perf_event.h'
diff -u tools/include/uapi/linux/perf_event.h include/uapi/linux/perf_event.h
Warning: Kernel ABI header at 'tools/include/uapi/linux/prctl.h' differs from latest version at 'include/uapi/linux/prctl.h'
diff -u tools/include/uapi/linux/prctl.h include/uapi/linux/prctl.h
Warning: Kernel ABI header at 'tools/include/uapi/sound/asound.h' differs from latest version at 'include/uapi/sound/asound.h'
diff -u tools/include/uapi/sound/asound.h include/uapi/sound/asound.h
Warning: Kernel ABI header at 'tools/arch/x86/include/asm/cpufeatures.h' differs from latest version at 'arch/x86/include/asm/cpufeatures.h'
diff -u tools/arch/x86/include/asm/cpufeatures.h arch/x86/include/asm/cpufeatures.h
Warning: Kernel ABI header at 'tools/arch/x86/include/uapi/asm/prctl.h' differs from latest version at 'arch/x86/include/uapi/asm/prctl.h'
diff -u tools/arch/x86/include/uapi/asm/prctl.h arch/x86/include/uapi/asm/prctl.h
Warning: Kernel ABI header at 'tools/include/uapi/asm-generic/unistd.h' differs from latest version at 'include/uapi/asm-generic/unistd.h'
diff -u tools/include/uapi/asm-generic/unistd.h include/uapi/asm-generic/unistd.h
Warning: Kernel ABI header at 'tools/perf/arch/x86/entry/syscalls/syscall_64.tbl' differs from latest version at 'arch/x86/entry/syscalls/syscall_64.tbl'
diff -u tools/perf/arch/x86/entry/syscalls/syscall_64.tbl arch/x86/entry/syscalls/syscall_64.tbl
Warning: Kernel ABI header at 'tools/perf/arch/powerpc/entry/syscalls/syscall.tbl' differs from latest version at 'arch/powerpc/kernel/syscalls/syscall.tbl'
diff -u tools/perf/arch/powerpc/entry/syscalls/syscall.tbl arch/powerpc/kernel/syscalls/syscall.tbl
Warning: Kernel ABI header at 'tools/perf/arch/s390/entry/syscalls/syscall.tbl' differs from latest version at 'arch/s390/kernel/syscalls/syscall.tbl'
diff -u tools/perf/arch/s390/entry/syscalls/syscall.tbl arch/s390/kernel/syscalls/syscall.tbl
Warning: Kernel ABI header at 'tools/perf/arch/mips/entry/syscalls/syscall_n64.tbl' differs from latest version at 'arch/mips/kernel/syscalls/syscall_n64.tbl'
diff -u tools/perf/arch/mips/entry/syscalls/syscall_n64.tbl arch/mips/kernel/syscalls/syscall_n64.tbl
Makefile.config:201: *** Error: flex is missing on this system, please install it.  Stop.
make[1]: *** [sub-make] Error 2
make: *** [all] Error 2
```

错误原因是没有flex，安装flex，yum install flex，安装flex之后还需要安装bison，yum install bison，安装完毕后重新LIBBABELTRACE=1 LIBBABELTRACE_DIR=/usr/local make即可，前面加环境变量是因为需要在这个环境变量下编译才能使用perf data做转换。否则会报错perf should be compiled with environment variables LIBBABELTRACE=1 and LIBBA。
之后便可以用perf data将采集到的数据转成json，这样就可以看到进程中有哪些线程，可以针对单线程做profile。

```bash
[root@ip-10-155-136-104 ~]# ./linux/tools/perf/perf record -g -F 99 -p 3169  ## 3169是进程id
[root@ip-10-155-136-104 ~]# ./linux/tools/perf/perf data convert --force --to-json temp.json
```

最后在写个脚本分析json文件即可。
参考：
[perf.data转成json](https://stackoverflow.com/questions/11921842/read-and-parse-perf-data)。
[perf file format](https://openlab-mu-internal.web.cern.ch/03_Documents/3_Technical_Documents/Technical_Reports/2011/Urs_Fassler_report.pdf)
[perf.data-file-format.txt](https://github.com/torvalds/linux/blob/master/tools/perf/Documentation/perf.data-file-format.txt)
