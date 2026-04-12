---
title: C++多态、虚函数笔记
date: 2019-03-17 23:32:34
updated: 2023-07-16 17:11:17
categories:
  - 笔记
tags:
  - C++ 多态 虚函数
---
<!-- more -->

**多态**按字面的意思就是多种形态。当类之间存在层次结构，并且类之间是通过继承关联时，就会用到多态。

C++ 多态意味着调用成员函数时，据调用函数的对象的类型来执行不同的函数。

# 例如：

```
#include <iostream>
using namespace std;

class Shape {
protected:
    int width, height;
public:
    Shape(int a = 0, int b = 0): width(a), height(b) { }//初始化width, height
    int area()
    {
        cout << "Parent class area :" << endl;
        return 0;
    }
};
class Rectangle : public Shape {
public:
    //Rectangle(int a = 0, int b = 0) :Shape(a, b) { }
    Rectangle(int a = 0, int b = 0)
    {
        width = a;
        height = b;
    }
    int area()
    {
        cout << "Rectangle class area :" << width * height << endl;
        return (width * height);
    }
};
class Triangle : public Shape {
public:
    Triangle(int a = 0, int b = 0) :Shape(a, b) { }//派生类先调用基类构造函数初始化width， height。然后派生类继承变量
    int area()
    {
        cout << "Triangle class area :" << width * height << endl;
        return (width * height / 2);
    }
};
// 程序的主函数
int main()
{
    Shape *shape;
    Rectangle rec(10, 7);
    Triangle  tri(10, 5);

    // 存储矩形的地址
    shape = &rec;
    // 调用矩形的求面积函数 area
    shape->area();

    // 存储三角形的地址
    shape = &tri;
    // 调用三角形的求面积函数 area
    shape->area();

    system("Pause");

    return 0;
}
```

运行结果为

![](/images/posts/c/20190317230333452.png)

基类的指针可以指向派生类的对象，我们想达到的结果是，分别调用rec对象的area()方法，tri对象的area()方法计算面积。

但调用函数 area() 被编译器设置为基类中的版本，这就是所谓的**静态多态**，或**静态链接** - 函数调用在程序执行前就准备好了。有时候这也被称为**早绑定**，因为 area() 函数在程序编译期间就已经设置好了。

但现在，让我们对程序稍作修改，在 Shape 类中，area() 的声明前放置关键字 **virtual**，如下所示：

```
class Shape {
protected:
    int width, height;
public:
    Shape(int a = 0, int b = 0): width(a), height(b) { }
    virtual int area()
    {
        cout << "Parent class area :" << endl;
        return 0;
    }
};
```

运行结果如下：

![](/images/posts/c/20190317231409414.png)

此时，编译器看的是指针的内容，而不是它的类型。因此，由于 tri 和 rec 类的对象的地址存储在 *shape 中，所以会调用各自的 area() 函数。

正如您所看到的，每个子类都有一个函数 area() 的独立实现。这就是**多态**的一般使用方式。有了多态，您可以有多个不同的类，都带有同一个名称但具有不同实现的函数，函数的参数甚至可以是相同的。

## 虚函数

**虚函数** 是在基类中使用关键字 **virtual** 声明的函数。在派生类中重新定义基类中定义的虚函数时，会告诉编译器不要静态链接到该函数。

想要的是在程序中任意点可以根据所调用的对象类型来选择调用的函数，这种操作被称为**动态链接**，或**后期绑定**。

## 纯虚函数

如果想要在基类中定义虚函数，以便在派生类中重新定义该函数更好地适用于对象，但是在基类中又不能对虚函数给出有意义的实现，这个时候就会用到纯虚函数。

我们可以把基类中的虚函数 area() 改写如下：

```
class Shape {
   protected:
      int width, height;
   public:
      Shape( int a=0, int b=0)
      {
         width = a;
         height = b;
      }
      // pure virtual function
      virtual int area() = 0;
};
```

1. = 0 告诉编译器，函数没有主体，上面的虚函数是**纯虚函数**。纯虚函数用来规范派生类的行为，即接口。包含纯虚函数的类是抽象类，抽象类不能定义实例，但可以声明指向实现该抽象类的具体类的指针或引用。

2. 虚函数声明如下：

```
class Shape {
protected:
    int width, height;
public:
    Shape(int a = 0, int b = 0): width(a), height(b) { }
    virtual int area();
    //{
    //    cout << "Parent class area :" << endl;
    //    return 0;
    //}
};
```

虚函数必须实现，如果不实现，编译器将报错，错误提示为

![](/images/posts/c/20190317232503174.png)

编译器对每个包含虚函数的类创建一个虚函数表VTABLE，表中每一项指向一个虚函数的地址，即VTABLE表可以看成一个函数指针的数组，每个虚函数的入口地址就是这个数组的一个元素。

每个含有虚函数的类都有各自的一张虚函数表VTABLE。每个派生类的VTABLE继承了它各个基类的VTABLE，如果基类VTABLE中包含某一项（虚函数的入口地址），则其派生类的VTABLE中也将包含同样的一项，但是两项的值可能不同。如果派生类中重载了该项对应的虚函数，则派生类VTABLE的该项指向重载后的虚函数，如果派生类中没有对该项对应的虚函数进行重新定义，则使用基类的这个虚函数地址。

在创建含有虚函数的类的对象的时候，编译器会在每个对象的内存布局中增加一个vptr指针项，该指针指向本类的VTABLE。在通过指向基类对象的指针（设为bp）调用一个虚函数时，编译器生成的代码是先获取所指对象的vptr指针，然后调用vptr所指向类的VTABLE中的对应项（具体虚函数的入口地址）。

当基类中**没有定义虚函数**时，其长度=数据成员长度；派生类长度=自身数据成员长度+基类继承的数据成员长度；

当基类中**定义虚函数后**，其长度=数据成员长度+虚函数表的地址长度；派生类长度=自身数据成员长度+基类继承的数据成员长度+虚函数表的地址长度。

包含一个虚函数和几个虚函数的类的长度增量为0。含有虚函数的类只是增加了一个指针用于存储虚函数表的首地址。

派生类与基类同名的虚函数在VTABLE中有相同的索引号（或序号）。
