## Endpoint overview

Modify a device

## Request endpoint

/api/device/edit

## Request type

POST

## Request parameters

Seq | Key          | Required | Description
--- | ------------ | :------: | -------------------------------------------------
1   | token        | True     | Access token obtained in the Janus settings page
2   | uuid         | True     | The UUID of the device
3   | name         | False    | Device name
4   | tag          | False    | Device tags, separated by commas
5   | remarks      | False    | Device remarks
6   | team_name    | False    | Team name, must be a team already exists on Janus
7   | sync_neptune | False    | Set data synchronization to Neptune

## Code example

``` JavaScript
    // Make request via jQuery AJAX
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/api/device/edit',
        dataType:'json',
        data:{
            token:'',
            uuid:'',
            name:'Robot',
            tag:'Robots,Welding',
            remarks:'This is a robot',
            team_name:'Team 1',
            sync_neptune:true
        }
    });

```

## Return value

Return value is formatted as JSON

Seq | Key     | Description
--- | ------- | -----------------------------------------------------------------------------------------------------
1   | code    | Status code<br>200 = Success<br/>401 = Token authentication failed<br/>1003 = Device does not exist
2   | message | A detail description for the response
3   | data    | Returns device information on success, or empty on failure

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

