## Endpoint overview

Search for a file that was uploaded via the Janus file API

The `keyword` matches against the file name or tag, only exact match is supported at this time. A maximum number of 10
files' information will be returned at once.

## Request endpoint

/api/file/search

## Request type

GET

## Request parameters

Seq | Key     | Required | Description
--- | ------- | :------: | ---------------------------------------------------------------------
1   | token   | True     | Access token obtained in the Janus settings page
2   | keyword | True     | File name or tag, multiple keywords can be separated with commas (,)

## Code example

``` JavaScript
    // Make request via jQuery AJAX
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

## Return value

Return value is JSON formatted

Seq | Key     | Description
--- | ------- | ---------------------------------------------------------------------
1   | code    | Status code<br/>200 = Success<br/>401 = Token authentication failed
2   | message | A detail description for the response
3   | data    | File information

## Return value example

``` JSON
{
    "code": 200,
    "message": "Success",
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

