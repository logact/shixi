## 接口简述

使用 Janus Http API 创建设备

## 请求地址

/api/device/create

## 请求方式

POST

## 请求参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|token     | 是      | 令牌 (token)
2|name      | 是| 设备名称
3|uuid      | |如传入，则必须在Janus授权在UUID范围内。 如不传入，则Janus随机选取未使用的UUID作为该设备UUID
4|tag       | | 设备标签 (选填，多个标签请用英文","隔开，e.g："机器人,机床")
5|remarks   | | 设备备注
6|team_name   | | 团队名称，如传入，则必须是Janus上已经存在的团队
7|sync_neptune   | | 同步设备数据到Neptune，布尔类型

## 请求示例

``` JavaScript
    //使用jQuery AJax作为请求提交工具
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/api/device/create',
        dataType:'json',
        data:{
            token:'',
            name:'车间末位机器人',
            tag:'机器人,弧焊',
            remarks:'这是放在车间末位的机器人',
            team_name:'团队1',
            sync_neptune:true
        }
    });

```

## 返回值说明

返回值格式为JSON

序号|名称  | 描述
--------- | :------ | -------------------------------------------------------------
1|code     | 请求状态: <br/>200 = 请求成功；<br/>401 = Token授权失败；<br/>1006 = 传入的UUID不属于该Janus或已经被使用；<br/>1005 = 设备可接入数量已达到上限；<br/>
2|message      |  请求状态描述
3|data      | 请求成功时，返回创建设备的信息；失败时为空

## 返回值示例

``` JSON
{
    code:200,
    message:'',
    data:{
        //设备的UUID
        uuid:'', 
        baseInfo:{
            //设备的名称
            name:'',
            //设备的备注
            remarks:''
        },
        //设备的Tag
        tag:[]
    }
}
```

