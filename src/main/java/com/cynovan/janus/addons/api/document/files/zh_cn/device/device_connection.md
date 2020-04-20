## 接口简述

使用 Janus Http API 设置设备的接入配置

## 请求地址

/api/device/connection

## 请求方式

POST

## 请求参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|token     | 是      | 令牌 (token)
2|uuid      |  是| 设备的UUID
3|conn_type      |  是| 连接方式：<br/>triton ：设备使用Triton连接<br/>mqtt_client ：设备作为MQTT客户端连接<br/>modbus_slave ：设备作为Modbus Master接入<br/>modbus_master ： 设备作为Modbus Slave接入<br/>tcp_client ： 设备作为TCP Socket客户端接入<br/>udp_client ： 设备作为UDP Socket客户端接入<br/>tcp_server ： 设备作为TCP Server接入<br/>udp_server ： 设备作为UDP Server接入<br/>serial_port ： 设备作为串口接入 <br/>http_rest ：设备使用Http发送数据到Janus

## 请求示例

``` JavaScript
    //使用jQuery AJax作为请求提交工具
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/api/device/connection',
        dataType:'json',
        data:{
            token:'',
            uuid:'',
            conn_type:'mqtt_client'
        }
    });

```

## 返回值说明

返回值格式为JSON

序号|名称  | 描述
--------- | :------ | -------------------------------------------------------------
1|code     | 请求状态: <br/>200 = 请求成功；<br/>401 = Token授权失败；<br/>1003 = 设备不存在；<br/>
2|message      |  请求状态描述
3|data     |  设备信息

## 返回值示例

``` JSON
{
    code:200,
    message:'',
    data:{
        uuid:'设备UUID',
        name:'设备名称',
        remarks:'设备描述'
        //设备的Tag
        tag:['机器人','弧焊'],
        create_date:'2018-10-16 07:49:34.299',
        //是否在线
        online:false
    }
}
```

