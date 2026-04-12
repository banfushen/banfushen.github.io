---
title: 工作中第一次使用gitlab提交代码，到gitlab CICD自动部署到k8s碰到的坑，最终解决的过程。
date: 2021-01-26 21:02:22
updated: 2023-07-16 17:11:17
categories:
  - k8s
tags:
  - gitlab ci/cd
---
<!-- more -->

# 背景

我不是从头开始搭建，而是在已有部分条件的情况下进行，因为是我自己一个人负责集群中，一个服务器的重写，领导就叫我在gitlab上创建仓库，然后自己提交代码。我之前是没用过gitlab的，上一家公司的工作用的是svn，所以对我来说，一切都是未知。我的项目是golang写的。
我的目的是：把项目打包成镜像—->上传到镜像仓库—->部署到k8s

# 先建立仓库

登录gitlab—->选择New project，会到一下页面，按照自己的情况填写
![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/20210126195740360.png)

这里有一点需要注意，当你创建完项目之后，会看到一些指引，例如叫你上传一个readme.md。我刚开始是没有权限的，所以什么也弄不了，直到你获得权限，你就可以操作仓库了。

# 获得权限后，先拉仓库到本地

![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/2021012620053184.png)

进入你的工程，选择clone，然后选择自己想要的方式，使用git clone拉取仓库到你的本地。拉取之后，就可以用**git add . —->git commit -m “xxxx” —->git push origin master**提交到仓库。
注意：一般git 提交的时候，需要忽略一些文件，只需要在项目的目录添加一个.gitignore即可。
我提交完的文件大概如下，其中只需要知道两个
![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/20210126200949287.png)
 .gitignore 是用来忽略一些不需要提交的文件
 .gitlab-ci.yaml 是用来自动部署的

# 先讲解一下gitlab cicd

其实这个东西不难，不知道网上为什么那么多解释，也不能写的都是不易于新手理解的一长串七七八八的概念。cicd需要两个东西：.gitlab-ci.yaml文件、gitlab-runner

**.gitlab-ci.yaml**
其实就是描述了你需要的自动部署过程，例如，你需要打包docker镜像，然后上传，那你就需要在gitlab-ci,yaml中使用它的语法去描述这个过程即可。
**gitlab-runner**
这个东西更易于理解，不知道网上哪些什么鬼解释。你既然写了自动部署脚本，那就需要有东西去执行你写的自动部署脚本，而gitlab-runner就是这个东西（类似于一个k8s中的pod，如果不对欢迎指出）。

其实这两个就是很简单的东西，反正我理解完，说出来就这么些。**gitlab-runner跑的地方，就是你的gitlab项目地址，也就是说，你写的脚本就相当于在一台linux机器中，有一个你的项目的文件夹，你就在这个文件夹下写脚本（这是我自己的理解，我也的确是这样做的，如果有什么不对的地方欢迎讨论）**，你完全可以在你的.gitlab-ci.yaml中写脚本用ls，pwd的命令看就知道了。

# 部署阶段

## 编写.gitlab-ci.yaml文件

一开始我也不知道，上来就是直接用了个golang的cicd的demo（这个东西不用在gitlab添加cicd的时候就可以选择demo），执行之后，发现其实.gitlab-ci.yaml写的就是shell脚本（当时不知道，其实这个是和gitlab-runner相关的，后面再说）。这就简单了啊。
关于语法，这里不做说明
由于是项目，这里只能贴出部分
整个脚本分为三个阶段

```bash
stages:
    - build
    - docker_publish
    - deploy
```

## build代码上传后，直接写脚本go build，例如我的文件中这样写

```bash
build:
    image: golang:1.15.6
    stage: build
    before_script:
      - mkdir -p $GOPATH/src/$(dirname $REPO_NAME)
      - ln -svf $CI_PROJECT_DIR $GOPATH/src/$REPO_NAME
      - cd $GOPATH/src/$REPO_NAME
    script:
      - pwd
      - ls
      - cd realTimeMsg
      - go mod download
      - go build -o $CI_PROJECT_DIR/RtmServer
    artifacts:
      paths:
        - RtmServer
      expire_in: 2 mos
```

这个很好理解，主要看script，一看便知。

## docker_pulish将输出打包成镜像，这个就需要在docker中使用docker，要使用services如下。

这个构建也不难，在gitlab中上传你写好的Dockerfile后直接build即可。

```bash
docker_publish:
  image: docker:latest
  services:
    - docker:dind
  script:
   	...
    - docker build -f Dockerfile --pull -t xxx
    - docker image ls 
    - docker push xxx
```

这里需要注意一些，在.gitlab-ci.yaml文件中，需要定义的环境变量可以在setting—->cicd里面设置
![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/2021012620364154.png)

## deploy部署，我碰到的最大的问题就在这里

我的部署脚本中，就是无法dev的k8s中部署，我使用脚本kubectl cluster-info，发现我的脚本跑在的地方根本不是我的dev k8s，所以肯定无法部署。这种情况下我就去查了。
![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/20210126210436704.png)
出现这种问题的原因是：gitlab-runner没有在我想要的环境中跑。所以无法关联到集群。
我在项目的部署的时候，也没有创建gitlab-runner，但是我的部署脚本的确跑起来了。
经过查询，**原来是我参与的项目中有默认的共享的gitlab-runner**，直接用这个跑了。

我首先尝试了把我的项目添加到k8s，也就是这个按钮，原来是add，我添加之后变成这个
![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/20210126204205559.png)
添加方法在这里：[https://segmentfault.com/a/1190000020947651](https://segmentfault.com/a/1190000020947651)，我是参考了这个文章。
但是并没有解决我的问题。

最后我在dev 的k8s环境中，给我的项目注册了一个gitlab-runner，我的开发环境已经存在gitlab-runner，如果你的不存在，就安装一下。
之后这样搞先打开setting—->cicd—->runners
![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/20210126204710663.png)
然后使用gitlab-runner register
![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/20210126204942387.png)
输入之前runner那张图的url
输入之前runner那张图的token
出入描述
输入tag，这个很重要，.gitlab-ci.yaml脚本通过tag关联runner
输入选择的执行方式，我选了shell

注册完之后会发现setting—->cicd—->runners多了一个runner
![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/20210126205400881.png)
到这里还是不能用，就算在.gitlab-ci.yaml文件中关联了这个tag。这样关联，加上tags即可

```bash
deploy:
  image: dtzar/helm-kubectl:2.9.1
  stage: deploy
  tags:
    - goRtm
```

因为这个runner并不能跑起来，如果能够运行，则是前面是绿色的，tag改过了，和上图对应的不一样，说明一下。
![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/20210126205703316.png)
还要调用gitlab-runner run，调用之后就变成绿色的就可以用了
![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/20210126205935238.png)
![在这里插入图片描述](/images/posts/gitlabgitlab-cicdk8s/2021012621003097.png)
做完这些，我就可以在提交代码后，自动部署到我想要的k8s中了。

因为文章涉及到公司项目，很多东西不能交代清楚。大概只能这样写了。
