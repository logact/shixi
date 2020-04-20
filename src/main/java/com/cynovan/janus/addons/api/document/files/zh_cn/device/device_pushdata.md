## 接口简述

通过 Janus API 向设备下发数据

operation_id 为下发数据的 id，将会在数据下发后返回。

callback 为接口回调 url，将会在设备成功收到推送，并且返回对应 operation_id 后请求， 请求参数为 operation_id 以及设备上传的数据。

如： "{operation_id: "xxxxxx", key1: "value1", key2: "value2}"

## 请求地址

/api/device/pushdata

## 请求方式

POST

## 请求参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|token     | 是      | 令牌 (token)
2|uuid      |  是| 设备的UUID
3|data      |  是| 下发的数据
4|callback      |   | 回调的URL

## 请求示例

``` JavaScript
    //使用jQuery AJax作为请求提交工具
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/api/device/pushdata',
        dataType:'json',
        data:{
            token:"",
            uuid:"",
            data:{
                "a":1,
                "b":2
            },
            callback:""
        }
    });

```

## 返回值说明

返回值格式为JSON

序号|名称  | 描述
--------- | :------ | -------------------------------------------------------------
1|code     | 请求状态: <br/>200 = 请求成功；<br/>401 = Token授权失败；<br/>1003 = 设备不存在；<br/>1020 = 下发数据不符合JSON格式
2|message      |  请求状态描述
3|data     |  返回消息， 包括下发的 data, operation_id

## 返回值示例

``` JSON
{
    code:200,
    message:'',
    data:{
        "uuid":"设备UUID",
        "action":'update',
        "data":{
            "a":1,
            "b":2,
            "operation_id":""
        }   
    }
}
```

