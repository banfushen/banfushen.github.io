---
title: nodejs aes192加密，在golang中解密碰到的坑
date: 2021-01-25 20:35:23
updated: 2023-07-16 17:11:17
categories:
  - golang
tags:
  - golang node.js
---
<!-- more -->

最近改写服务器，集群中服务器是nodejs写的，把其中一个服务器改成golang写的，碰到了nodejs aes192加密，再golang中解密碰到的坑，如下。

在nodejs中是这样加密的

```
const encrypt = (toEncrypt) => {
    const cipher = crypto.createCipher('aes192', cryptoKey);
    let encrypted = cipher.update(toEncrypt, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  };
```

发现golang中根本不知道aes192对应的到底是aes192中的那种加密模式，经过查询接口已经废弃

![](/images/posts/nodejs-aes192golang/20210125201828320.png)

使用新的接口，原来的接口文档已经找不到了，刚开始顺着这个方法一直找，首先AES 有五种加密模式：电码本模式（Electronic Codebook Book (ECB)）、密码分组链接模式（Cipher Block Chaining (CBC)）、计算器模式（Counter (CTR)）、密码反馈模式（Cipher FeedBack (CFB)）和输出反馈模式（Output FeedBack (OFB)），要查到具体nodejs中使用的到底是哪个方法，**查看新的接口说明，这里是重点一，通过接口说明，一步一步找出具体调用的是五个模式中的哪个**

![](/images/posts/nodejs-aes192golang/20210125202402933.png)

然后查看用的到底是什么，可以看到，用的是DES-192-CBC

![](/images/posts/nodejs-aes192golang/20210125202429309.png)

然后查看对应的golang的解密方法，发现，必须要给定密钥，和向量。而原来的nodejs接口，只需要给一个字符串就可以了，再次查询资料，最后在第三方的资料中，找到

**crypto.createCipher(algorithm, password)：用给定的算法和密钥，创建并返回一个Cipher加密算法的对象。参数：algorithm算法是依赖OpenSSL库支持的算法, 例如: 'aes192'算法等，password是用来派生key和iv的，它必须是一个 'binary'二进制格式的字符串或者是一个Buffer可以看到给定password参数，是用来生成key和iv的，具体怎么生成的，无从得知，或者说，要搞懂这个太麻烦了。**

**所以最后得出的结论是：nodejs使用原来的接口根本无法在golang中解密，所以必须修改nodejs的接口为新的接口。这里是重点二**

将nodejs的接口修改为

```
encrypt(toEncrypt) {
        const cipher = crypto.createCipheriv('aes192', this.cryptoKey, this.cryptoVi);
        let encrypted = cipher.update(toEncrypt, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
```

然后在golang中用同样的密钥和向量解密，这个解密方法不难，随便搜索即可找到。

```
//对密文删除填充
func unPadDing(cipherText []byte) []byte {
    //取出密文最后一个字节end
    end := cipherText[len(cipherText)-1]
    //删除填充
    cipherText = cipherText[:len(cipherText)-int(end)]
    return cipherText
}

//AEC解密（CBC模式）
func aesCbcDecrypt(cipherText []byte) string {
    //指定解密算法，返回一个AES算法的Block接口对象
    block, err := aes.NewCipher(cryp2Key)
    if err != nil {
        panic(err)
    }
    //指定分组模式，返回一个BlockMode接口对象
    blockMode := cipher.NewCBCDecrypter(block, iv)
    //解密
    plainText := make([]byte, len(cipherText))
    blockMode.CryptBlocks(plainText, cipherText)
    //删除填充
    plainText = unPadDing(plainText)

    return string(plainText)
}
```

这样就可以成功解密了。

**最后：最坑的就是nodejs的接口，找了好久都找不到解密方法，原来要用新接口，而且必须找到接口到底对应哪个加密方法才能在golang解密。**
