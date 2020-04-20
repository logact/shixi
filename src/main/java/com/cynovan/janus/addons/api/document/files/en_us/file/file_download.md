## Endpoint overview Endpoint overview

Download a file that was uploaded to the server via the Janus file API by file ID

## Endpoint overview Request endpoint

/api/file/download

## Request type

GET

## Request parameters

Seq | Key    | Required | Description
--- | ------ | :------: | --------------------------------------------------
1   | token  | True     | Access token obtained in the Janus settings page
2   | fileId | True     | ID for the requested file

## Code example

``` JavaScript
    // Make request via jQuery AJAX
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

## Return value

A file corresponding to the `fileId` will be returned **on success**.

Otherwise a JSON will be returned **on failure**.

Seq | Key     | Description
--- | ------- | ----------------------------------------------------------------------------
1   | code    | Status code<br/>401 = Token authentication failed<br/>2002 = File not found
2   | message | A detail description for the response

## Return value example

``` JSON
{
    "code": 2002,
    "message": "The requested file cannot be found on the server"
}
```
