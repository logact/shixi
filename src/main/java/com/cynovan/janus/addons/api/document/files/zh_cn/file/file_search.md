## 接口简述

使用 Janus Http API 搜索上传到服务器的文件

使用文件名或者标签来搜索，目前只支持精确搜索

将最多返回10个文件信息

## 请求地址

/api/file/search

## 请求方式

GET

## 请求参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|token     | 是 | 令牌 (token)
2|keyword   | 是 | 文件名或者标签,可使用多个关键字，用[,]分割

## 请求示例

``` JavaScript
    
    //使用jQuery AJax作为请求提交工具
    $.ajax({
        type:'get',
        url:'http://127.0.0.1/api/file/search',
        dataType:'json',
        data: {
            token: 'xxxx',
            keyword: 'zzz,aaa'
        } 
    });

```

## 返回值说明

返回值格式为JSON

序号|名称  | 描述
--------- | :------ | -------------------------------------------------------------
1|code     | 请求状态: <br/>200 = 请求成功；<br/>401 = Token授权失败；<br/>
2|message      |  请求状态描述
3|data     |  返回消息

## 返回值示例

``` JSON
{
    "code": 200,
    "message": "成功",
    "data": {
        "files": [
            {
                "name": "20180806.txt",
                "tags": [
                    "aa",
                    "bb",
                    "cc",
                    "dd"
                ],
                "md5": "83d7383f9d42d2ecb505f904e4465fcf",
                "fileId": "5bcfee061bc64c45a25a90de"
            },
            {
                "name": "p.png",
                "tags": [
                    "aa",
                    "bb"
                ],
                "md5": "323c581892767d5cf578b74d9d8aad7d",
                "fileId": "5bd02104ef03ca6ff08b0da4"
            },
            {
                "name": "test.txt",
                "tags": [
                    "aa",
                    "bb"
                ],
                "md5": "d1acd16c63ab3efc4a837323338fefdc",
                "fileId": "5bd124cbef03ca368b2597c2"
            },
            {
                "name": "test.txt",
                "tags": [
                    "aa",
                    "bb"
                ],
                "md5": "798a4bf7fcbfab4791f12deb7d1e9716",
                "fileId": "5bd135deef03ca46e8348614"
            }
        ]
    }
}
```

