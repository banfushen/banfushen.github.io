---
title: C++字符串分割
date: 2019-01-29 11:05:46
updated: 2023-07-16 17:11:17
tags:
  - C++ 字符串分割
---
<!-- more -->

函数设计时，可将多个参数通过分隔符连接成为一个参数传入，这样可减少函数的入参数字。函数内部需要对传入的合并参数进行分割，获取需要的参数即可。

```
/****************************************************************************

函数名称: iMystrtok

函数功能: 根据sFlg分割sData

*****************************************************************************/

long iMystrtok(string sData, string sFlg, vector<string> &vStr)

{

    if (sData.empty())

    {

        return 0;

    }

    vStr.clear();

    size_t uiOffset = 0, uiPos = 0;

    uiPos = sData.find(sFlg, uiOffset);

    while (uiPos != string::npos)

    {

        vStr.push_back(sData.substr(uiOffset, uiPos-uiOffset));

        uiOffset = uiPos + sFlg.size();

        uiPos = sData.find(sFlg, uiOffset);

    }

    vStr.push_back(sData.substr(uiOffset, sData.length() - uiOffset));    

    return 0;

}
```

例如：

string TestString = string("2019|hello|world");

vector<string> sTmp;

iMystrtok(TestString, "|", sTmp);

cout<<sTmp[0]<<endl;

cout<<sTmp[1]<<endl;

cout<<sTmp[2]<<endl;

输出为：

2019

hello

world
