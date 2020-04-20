## Endpoint overview

Obtain detailed device information

## Request endpoint

/api/device/query

## Request type

GET

## Request parameters

Seq | Key   | Required | Description
--- | ----- | :------: | ------------------------------------------
1   | token | True     | Access token obtained in the Janus settings page
2   | uuid  | True     | The UUID of the device

## Code example

``` JavaScript
    // Make request via jQuery AJAX
    $.ajax({
        type:'get',
        url:'http://127.0.0.1/api/device/query',
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
1   | code    | Status code<br>200 = Success<br/>401 = Token authentication failed<br/>1003 = Device does not exist
2   | message | A detail description for the response
3   | data    | Device information

## Return value example

``` JSON
{
    code:200,
    message:'',
    data:{
        uuid:'Device_UUID',
        name:'Device Name',
        remarks:'Detail description'
        // tags for this device
        tag:['robot','arc welding'],
        create_date:'2018-10-16 07:49:34.299',
        // online status
        online:false
    }
}
```

