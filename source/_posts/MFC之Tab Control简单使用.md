---
title: MFC之Tab Control简单使用
date: 2019-01-10 10:12:26
updated: 2023-07-16 17:11:17
tags:
  - MFC学习
---
<!-- more -->

**Tab Control**是MFC中一个常用的功能，可实现切换界面，将不同功能的控件放置在不同页面中。

**1.在工具栏中选择Tab Control控件，将控件大小拉满整个对话框，如图：**

![](https://img-blog.csdnimg.cn/20190109152640207.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

**2.在对话框类中声明一个 CTabCtrl变量：**

CTabCtrl m_tab;

变量用于与Tab Control控件交互,为此要在DoDataExchange函数中加入DDX_Control语句：

DDX_Control(pDX, IDC_TAB1, m_tab);    //IDC_TAB1为控件ID

![](https://img-blog.csdnimg.cn/20190109160421504.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

**3.选择资源视图插入两个测试页面，右键点击Dialog，选择插入Dialog中，作为Tab Control控件切换的界面，然后将插入的对话框的Border属性设置为None，Style设置为Child，设置后的效果如下图所示：**

![](https://img-blog.csdnimg.cn/20190109162504991.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

**4.为创建的两个话框建立类，如DlgSS、DlgFinance。添加类的方法：右击对话框界面，在弹出框中选择添加类；**

![](https://img-blog.csdnimg.cn/20190109162658726.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

**5.在Tab Control控件所在的对话框类的头文件中添加插入的页面对话框的头文件，然后添加以下内容：**

```
int m_FuncTab;

    DlgSS m_page0;    //没加头文件会报错

    DlgFinance m_page1;//没加头文件会报错

    std::vector<CDialog*> m_pDialog;  //用来保存对话框对象指针，记得添加vector的头文件

    afx_msg void OnTcnSelchangeTab1(NMHDR *pNMHDR, LRESULT *pResult);
```

**6.在对话框类的初始化函数中需要把DlogSS和Tab Control关联起来，并保存页面地址，设置初始页面，在OnInitDialog()中添加以下实现代码：**

// 为Tab Control增加页面

    m_tab.InsertItem(0, _T("测试0"));

    m_tab.InsertItem(1, _T("测试1"));

```
//创建对话框

    m_page0.Create(IDD_DIALOG_SS, &m_tab);

    m_page1.Create(IDD_DIALOG_Finance, &m_tab);

    //设定在Tab内显示的范围

    CRect rc;

    m_tab.GetClientRect(rc);

    rc.top += 20;

    rc.bottom -= 0;

    rc.left += 0;

    rc.right -= 0;

    m_page0.MoveWindow(&rc);    //设置子对话框尺寸并移动到指定位置

    m_page1.MoveWindow(&rc);    //设置子对话框尺寸并移动到指定位置
```

```
//把对话框对象指针保存起来

    m_pDialog.push_back(&m_page0);

    m_pDialog.push_back(&m_page1);

    //显示初始页面

    m_pDialog[0]->ShowWindow(SW_SHOW);

    //保存当前选择

    m_FuncTab = 0;
```

**7.为Tab Control添加消息处理程序，双击Tab Control控件，自动进入消息处理程序代码：**

![](https://img-blog.csdnimg.cn/20190109171224342.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

**8.运行结果如图：**

![](https://img-blog.csdnimg.cn/20190110101036693.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

![](https://img-blog.csdnimg.cn/20190110101045142.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2JhbmZ1c2hlbjAwNw==,size_16,color_FFFFFF,t_70)

本文参考的资料有：http://blog.csdn.net/hustspy1990/article/details/5425365
