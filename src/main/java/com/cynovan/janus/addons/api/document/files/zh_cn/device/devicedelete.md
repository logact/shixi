## 接口简述

使用 Janus Http API 删除设备

## 请求地址

/api/device/remove

## 请求方式

POST

## 请求参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|token     | 是      | 令牌 (token)
2|uuid      | 是| 设备的UUID

## 请求示例

``` JavaScript
    //使用jQuery AJax作为请求提交工具
    $.ajax({
        type:'get',
        url:'http://127.0.0.1/api/device/remove',
        dataType:'json',
        data:{
            token:'',
            uuid:''
        }
    });

```

## 返回值说明

返回值格式为JSON

序号|名称  | 描述
--------- | :------ | -------------------------------------------------------------
1|code     | 请求状态: <br/>200 = 请求成功；<br/>401 = Token授权失败；<br/>
2|message      |  请求状态描述

## 返回值示例

``` JSON
{
    code:200,
    message:''
}
```

