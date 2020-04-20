## Endpoint overview

Create a device on Janus

## Request endpoint

/api/device/create

## Request type

POST

## Request parameters

Seq | Key     | Required | Description
--- | ------- | :------: | ---------------------------------------------------------------------------------------------
1   | token   | True     | Access token obtained in the Janus settings page
2   | name    | True     | Name for the new device
3   | uuid    | False    | Janus will choose a UUID from its pool by randomly by default. If you choose to specify UUID, the specified UUID must be available in Janus' UUID allocated pool
4   | tag     | False    | Tags for this device, separated by commas, e.g. `"robot,tool"`
5   | remarks | False    | Remarks for this device

## Code example

``` JavaScript
    // Make request via jQuery AJAX
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/api/device/create',
        dataType:'json',
        data:{
            token:'',
            name:'Welding Robot A1',
            tag:'robot,welding',
            remarks:'This is a welding robot'
        }
    });
```

## Return value

Return value is formatted as JSON

Seq | Key     | Description
--- | ------- | -----------------------------------------------------------------------------------------------------
1   | code    | Status code<br>200 = Success<br/>401 = Token authentication failed<br/>1006 = UUID specified does not belong to this Janus, or is already being used<br/>1005 = Maximum allowed device limit has been reached
2   | message | A detail description for the response
3   | data    | Returns the new device's information on success, empty otherwise

## Return value example

``` JSON
{
    code:200,
    message:'',
    data:{
        // Device UUID
        uuid:'', 
        baseInfo:{
            // Device name
            name:'',
            // Device remarks
            remarks:''
        },
        // Device tags
        tag:[]
    }
}
```

