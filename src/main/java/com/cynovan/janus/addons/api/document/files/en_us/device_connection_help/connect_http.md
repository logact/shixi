## Overview

Sends data to Janus via HTTP API

## Request endpoint
/httpapi/data

## Request type
POST

## Request parameters

Predefined fields:

Seq | Key       | Required | Description
--- | --------- | :------: | -------------------------------------------------------------------------------------------
1   | token     | True     | Access token obtained in the Janus settings page
2   | uuid      | True     | The UUID of the device
3   | time      | False    | Data generation date time, in `yyyyMMddHHmmssSSSS` format. Leaving it empty means use current timestamp

All other fields other than the above predefined fields will be treated as data. For example, if you're sending two
values to Janus, `speed` and `temperature`, simply add `speed={speed_value}` and `temperature={temp_value}` to the
request body.

## Code example

``` JavaScript
    // Make request via jQuery AJAX
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/httpapi/data',
        dataType:'json',
        data:{
            // predefined fields
            'token':'',
            'uuid':'',
            'time':'',
            // data fields
            'speed':'',
            'temperature':''
        }
    });
```

## Return value

Return value is formatted as JSON

Seq | Key     | Description
--- | ------- | -----------------------------------------------------------------------------------------------------
1   | code    | Status code<br>200 = Success<br/>1002 = Invalid data format<br/>1003 = Invalid token, authentication failed<br/>1004 = No UUID given in POSTed data
2   | message | A detail description for the response

## HTTP callback

Please beware: make sure to use full URL address in order to avoid problems, e.g. `http://www.example.com/api/callback`

When Janus receives data from the device via the HTTP API, a POST request with the following data will be sent to the
callback URL defined.

Data is formatted as JSON

Seq | Key    | Required | Description
--- | ------ | :------: | ----------------------------------------------------------------------------------------------
1   | uuid   | True     | The UUID of the device
2   | action | True     | The action type of this data. `update` means the data being POSTed is meant for updating values
3   | data   | True     | The updated data, as a JSON string

``` JSON
{
    "uuid":"Device_UUID", 
    "action":"update", 
    "data":"{"xx":"xx"}" 
}
```