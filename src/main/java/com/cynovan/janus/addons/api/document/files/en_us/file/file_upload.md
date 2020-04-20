## Endpoint overview

Uploads a file to Janus

**Note:** Use `MultipartFile` requests in Java to upload the file

## Request endpoint

/api/file/upload

## Request type

POST

## Request parameters

Seq | Key   | Required | Description
--- | ----- | :------: | -------------------------------------------------
1   | token | True     | Access token obtained in the Janus settings page
2   | file  | True     | File to be uploaded (max. 16MB)
3   | tags  | False    | Tags for the uploaded file, separated by commas

## Code example

``` JavaScript
    // Construct the form-data
    var formData = new FormData();
    formData.append("file", file, fileName);
    formData.append("token", "xxxx");
    formData.append("tags", "tag1,tag2,tag3");
    
    // Make request via jQuery AJAX
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/api/file/upload',
        dataType:'json',
        data: formData
    });
```

## Return value

Return value is JSON formatted

Seq | Key     | Description
--- | ------- | -----------------------------------------------------------------------------------------------------
1   | code    | Status code<br/>200 = Success<br/>401 = Token authentication failed<br/>2001 = Failed to upload file
2   | message | A detail description for the response
3   | data    | File information

## Return value example

``` JSON
{
    code:200,
    message:'Success',
    data:{
        // file ID
        "fileId":"5bd135deef03ca46e8348614", 
        // file MD5 checksum
        "md5":"798a4bf7fcbfab4791f12deb7d1e9716"
    }
}
```

