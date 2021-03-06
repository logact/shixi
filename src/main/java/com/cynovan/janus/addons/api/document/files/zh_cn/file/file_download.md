## 接口简述

使用 Janus Http API 下载上传到服务器的文件

## 请求地址

/api/file/download

## 请求方式

GET

## 请求参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|token     | 是 | 令牌 (token)
2|fileId      | 是 | 文件 id

## 请求示例

``` JavaScript
    
    //使用jQuery AJax作为请求提交工具
    $.ajax({
        type:'get',
        url:'http://127.0.0.1/api/file/download',
        dataType:'json',
        data: {
            token: 'xxxx',
            fileId: '5bd135deef03ca46e8348614'
        }
    });

```

## 返回值说明

请求**成功**返回对应的文件

请求**失败**返回值格式为JSON

序号|名称  | 描述
--------- | :------ | -------------------------------------------------------------
1|code     | 请求状态:<br/>401 = Token授权失败；<br/> 2002 =  文件未找到；<br/>
2|message  |  请求状态描述

## 返回值示例

``` JSON
{
    "code": 2002,
    "message": "文件未找到"
}
```
