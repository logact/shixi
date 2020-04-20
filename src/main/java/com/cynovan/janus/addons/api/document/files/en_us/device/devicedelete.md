## Endpoint overview

Delete a device

## Request endpoint

/api/device/remove

## Request type

POST

## Request parameters

Seq | Key      | Required | Description
--- | -------- | :------: | -------------------------------------------------
1   | token    | True     | Access token obtained in the Janus settings page
2   | uuid     | True     | The UUID of the device

## Code example

``` JavaScript
    // Make request via jQuery AJAX
    $.ajax({
        type:'get',
        url:'http://127.0.0.1/api/device/remove',
        dataType:'json',
        data:{
            token:'',
            uuid:''
        }
    });
```

## Return value

Return value is formatted as JSON

Seq | Key     | Description
--- | ------- | -----------------------------------------------------------------------------------------------------
1   | code    | Status code<br>200 = Success<br/>401 = Token authentication failed
2   | message | A detail description for the response

## Return value example

``` JSON
{
    code:200,
    message:''
}
```

