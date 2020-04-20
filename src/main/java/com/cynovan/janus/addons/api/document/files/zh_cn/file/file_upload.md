## 接口简述

使用 Janus Http API 上传文件到服务器

注意： Java 上传文件请使用 MultipartFile 请求

## 请求地址

/api/file/upload

## 请求方式

POST

## 请求参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|token     | 是 | 令牌 (token)
2|file      | 是 | 要上传的文件(大小限制: 16MB)
3|tags      | 否 | 文件的标签，多个标签用逗号(,)隔开

## 请求示例

``` JavaScript
    
    // 构建提交的 form-data
    var formData = new FormData();
    formData.append("file", file, fileName);
    formData.append("token", "xxxx");
    formData.append("tags", "tag1,tag2,tag3");
    
    //使用jQuery AJax作为请求提交工具
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/api/file/upload',
        dataType:'json',
        data: formData
    });

```

## 返回值说明

返回值格式为JSON

序号|名称  | 描述
--------- | :------ | -------------------------------------------------------------
1|code     | 请求状态: <br/>200 = 请求成功；<br/>401 = Token授权失败；<br/>2001 = 文件上传失败；<br/>
2|message      |  请求状态描述
3|data     |  返回消息

## 返回值示例

``` JSON
{
    code:200,
    message:'成功',
    data:{
        // 文件 id
        "fileId":"5bd135deef03ca46e8348614", 
        // 文件 md5
        "md5":"798a4bf7fcbfab4791f12deb7d1e9716"
    }
}
```

