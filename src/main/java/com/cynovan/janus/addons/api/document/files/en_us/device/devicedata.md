## Endpoint overview

Obtains data uploaded by device. Data returned are paginated, with maximum of 100 entries per request.

## Request endpoint

/api/device/data

## Request type

GET

## Request parameters

Seq | Key      | Required | Description
--- | -------- | :------: | ----------------------------------------------------------------------------------
1   | token    | True     | Access token obtained in the Janus settings page
2   | uuid     | True     | The UUID of the device
3   | start    | True     | The starting date time for queried data, formatted in `yyyy-MM-dd HH:mm:ss`, e.g. `2017-10-12 13:55:12`
3   | end      | True     | The ending date time for queired data, formatted in `yyyy-MM-dd HH:mm:ss`, e.g. `2017-10-12 13:55:12`
4   | page     | False    | Pagination, defaults to `1` when not specified
5   | fields   | False    | Return only specified data fields. Defaults to all fields when not specified. Separated by commas, e.g. `fields=speed,voltage,amperage`

## Code example

``` JavaScript
    // Make request via jQuery AJAX
    $.ajax({
        type:'get',
        url:'http://127.0.0.1/api/device/data',
        dataType:'json',
        data:{
            token:'',
            uuid:'',
            start:'2017-10-12 13:55:12',
            end:'2017-10-13 13:55:12',
            page:2
        }
    });
```

## Return value

Return value is formatted as JSON

Seq | Key     | Description
--- | ------- | -----------------------------------------------------------------------------------------------------
1   | code    | Status code<br>200 = Success<br/>401 = Token authentication failed<br/>1003 = Device does not exist<br/>1004 = Invalid date time format
2   | message | A detail description for the response
3   | data    | A data object, described below

`data` object details:

Seq | Key   | Description
--- | ----- | ---------------------------------------------------
1   | total | Total entries within the queried date time period
2   | page  | Current page number
3   | count | Total entries in current page
4   | datas | Actual data in this page

## Return value example

``` JSON
{
    code:200,
    message:'',
    data:{
        total:1000,
        page:2,
        count:100,
        datas:[{
            // this is the date time of when the data was uploaded to Janus
            time:'2017-10-12 13:56:21.335',
            // the actual data uploaded by device
            data:{
                speed:"200",
                voltage:"50"
            }    
        }]
        
    }
}
```

