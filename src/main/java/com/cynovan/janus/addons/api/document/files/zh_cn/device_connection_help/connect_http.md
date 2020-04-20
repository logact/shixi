## 简述

设备使用Http发送数据到Janus示例

## 请求地址
/httpapi/data

## 请求方式
POST

## 请求参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|token     | 是      | 令牌 (token)
2|uuid      |  是| 设备的UUID
3|time      |  | 数据产生的时间,格式为yyyyMMddHHmmssSSS, 如该栏位为空,则取当前时间
4|speed     |  | 传输数据列表中的speed
5|temperature | | 传输数据列表中的temperature

备注：speed、temperature只是示例，在实际请求中按需（数量不限）添加自己的设备数据

## 请求示例

``` JavaScript
    //使用jQuery AJax作为请求提交工具
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/httpapi/data',
        dataType:'json',
        data:{
            'token':'',
            'uuid':'',
            'time':'',
            'speed':'',
            'temperature':''
        }
    });

```

## 返回值说明

返回值格式为JSON

序号|名称  | 描述
--------- | :------ | -------------------------------------------------------------
1|code     | 请求状态: <br/>200 = 请求成功；<br/>1002 = 数据格式错误；<br/>1003 = token错误,授权失败；<br/>1004 = 数据中没有uuid；<br/>
2|message      |  请求状态描述

## 下发数据说明如下：

注意：请输入完整的下发地址（例如：https://www.xxxxx.com或者http://www.xxxxx.com），否则容易出现下发失败的情况 

Janus收到数据后会通过POST方式把数据发送给您填入的下发地址

发送的数据格式为JSON

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|uuid      |  是| 设备的UUID
2|action      | 是 | janus默认栏位，值为update时标识本次的操作为数据更新
3|data     | 是 | 更新的内容，它是一个json字符串 

``` JSON
{
    "uuid":"设备UUID", 
    "action":"update", 
    "data":"{"xx":"xx"}" 
}
```