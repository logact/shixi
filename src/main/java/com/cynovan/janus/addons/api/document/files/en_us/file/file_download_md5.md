## Endpoint overview

Download a file that was uploaded to the server via the Janus file API by MD5 checksum

## Request endpoint

/api/file/download_md5

## Request type

GET

## Request parameters

Seq | Key   | Required | Description
--- | ----- | :------: | -------------------------------------------------
1   | token | True     | Access token obtained in the Janus settings page
2   | md5   | True     | MD5 checksum for the requested file

## Code example

``` JavaScript
    // Make request via jQuery AJAX
    $.ajax({
        type:'get',
        url:'http://127.0.0.1/api/file/download_md5',
        dataType:'json',
        data: {
            token: 'xxxx',
            md5: '798a4bf7fcbfab4791f12deb7d1e9716'
        }
    });
```

## Return value

A file corresponding to the `md5` checksum will be returned **on success**.

Otherwise a JSON will be returned **on failure**.

Seq | Key     | Description
--- | ------- | ----------------------------------------------------------------------------
1   | code    | Status code<br/>401 = Token authentication failed<br/>2002 = File not found
2   | message | A detailed message describing the response

## Return value example

``` JSON
{
    "code": 2002,
    "message": "The requested file cannot be found on the server"
}
```

