## 接口简述

使用 Janus Http API 获取设备列表。该接口使用分页查询机制，每页返回15条数据。

## 请求地址

/api/device/list

## 请求方式

GET

## 请求参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|token     | 是     | 令牌 (token)
2|page      |        | 查询数据的页数，不传入时，默认查询第一页数据

## 请求示例

``` JavaScript
    //使用jQuery AJax作为请求提交工具
    $.ajax({
        type:'get',
        url:'http://127.0.0.1/api/device/list',
        dataType:'json',
        data:{
            token:'BE60-E612-A5DD-CBA9',
            page:2
        }
    });

```

## 返回值说明

返回值格式为JSON

序号|名称  | 描述
--------- | :------ | -------------------------------------------------------------
1|code     | 请求状态: <br/>200 = 请求成功；<br/>401 = Token授权失败；
2|message      |  请求状态描述
3|data.total     |  Janus内的设备的总个数
4|data.page      |  当前设备页数
5|data.count     |  当前返回设备个数
6|data.devices   |  本次查询的设备列表

## 返回值示例

``` JSON
{
    code:200,
    message:'',
    data:{
        total:1000,
        page:2,
        count:15,
        devices:[{
                "uuid": "850E-1861-CA70-8319",
                "uuid_type": "1",
                "tag": ["机器人"],
                "baseInfo": {
                    "name": "弧焊机器人1",
                    "remarks": "工业自动化生产"
                },
                "create_date": "2018-10-25 11:18:35.558",
                "online": false,
                "id": "5bd1360bef03ca46edc0878f"
            },
            ... ...
            {
                "uuid": "D052-F775-9BFD-FF1A",
                "uuid_type": "1",
                "tag": [],
                "baseInfo": {
                    "name": "弧焊机器人15",
                    "remarks": ""
                },                
                "create_date": "2018-10-19 10:43:04.532",
                "online": false,               
                "id": "5bc944b81bc64cb1dc073010"
            }
        ]        
    }
}
```

