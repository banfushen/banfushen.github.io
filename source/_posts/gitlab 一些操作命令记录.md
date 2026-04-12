---
title: gitlab 一些操作命令记录
date: 2021-01-30 14:25:51
updated: 2023-07-16 17:11:17
categories:
  - 笔记
tags:
  - gitlab
---
<!-- more -->

```
之前在上一家公司用的都是svn，现在使用gitlab。最近又在测试cicd，反复查询了一些命令，
  也敲了一些命令，自己也记录一下，持续更新。
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210130141337117.png)

```bash
git clone <addr> 					// 拷贝远程仓库到本地
git status							// 查看仓库当前的状态，显示有变更的文件（有的情况下文件增减看不到）
git diff <file>						// 比较文件的不同，即暂存区和工作区的差异。
git add .							// 添加文件到暂存区
git add -f <file>					// 在文件增加没有提示时，手动添加文件
git commit -m "xxx" 				// 将暂存区内容添加到仓库中
git push origin <branch>			// 提交本地仓库到指定分支
git pull origin <branch>			// 拉取远程分支更新本地仓库
git tag <v1.x.x>					// 给本地打标签
git tag -d <v1.x.x>		  			// 删除本地标签
git push origin <tag> 				// 提交本地标签到远程仓库
git push origin :refs/tags/<tag>	// 删除远程仓库tag
```
