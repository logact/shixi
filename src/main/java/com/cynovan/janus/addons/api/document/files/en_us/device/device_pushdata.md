## Endpoint overview

Send data to device via Janus

`operation_id` is the unique identifier for the message being sent, it will be returned upon data being sent successfully.

`callback` is the callback URL for this data push operation. An HTTP request with `operation_id` and device's returned
data will be POSTed to this callback URL.

POST data example:

``` JSON
{
    "operation_id":"xxxxxx",
    "key1":"value1",
    "key2":"value2
}
```

## Request endpoint

/api/device/pushdata

## Request type

POST

## Request parameters

Seq | Key      | Required | Description
--- | -------- | :------: | ------------------------------------------
1   | token    | True     | Access token obtained in the Janus settings page
2   | uuid     | True     | The UUID of the device
3   | data     | True     | Data being sent to device
4   | callback | False    | Callback URL for this data push operation

## Code example

``` JavaScript
    // Make request via jQuery AJAX
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/api/device/pushdata',
        dataType:'json',
        data:{
            token:"",
            uuid:"",
            data:{
                "a":1,
                "b":2
            },
            callback:""
        }
    });
```

## Return value

Return value is formatted as JSON

Seq | Key     | Description
--- | ------- | -----------------------------------------------------------------------------------------------------
1   | code    | Status code<br>200 = Success<br/>401 = Token authentication failed<br/>1003 = Device does not exist<br/>1020 = Data being sent is not valid JSON
2   | message | A detail description for the response
3   | data    | Returned data from this operation (operation_id and data from device)

## Return value example

``` JSON
{
    code:200,
    message:'',
    data:{
        "uuid":"Device_UUID",
        "action":'update',
        "data":{
            "a":1,
            "b":2,
            "operation_id":""
        }   
    }
}
```

