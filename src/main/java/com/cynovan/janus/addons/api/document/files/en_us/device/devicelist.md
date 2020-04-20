## Endpoint overview

Obtains the device list. Data returned are paginated, with maximum of 15 entries per request.

## Request endpoint

/api/device/list

## Request type

GET

## Request parameters

Seq | Key      | Required | Description
--- | -------- | :------: | --------------------------------------------------
1   | token    | True     | Access token obtained in the Janus settings page
2   | page     | False    | Pagination, defaults to `1` when not specified

## Code example

``` JavaScript
    // Make request via jQuery AJAX
    $.ajax({
        type:'get',
        url:'http://127.0.0.1/api/device/list',
        dataType:'json',
        data:{
            token:'BE60-E612-A5DD-CBA9',
            page:2
        }
    });
```

## Return value

Return value is formatted as JSON

Seq | Key     | Description
--- | ------- | --------------------------------------------------------------------
1   | code    | Status code<br>200 = Success<br/>401 = Token authentication failed
2   | message | A detail description for the response
3   | data    | A data object, described below

`data` object details:

Seq | Key     | Description
--- | ------- | ---------------------------------------------------
1   | total   | Total entries within the queried date time period
2   | page    | Current page number
3   | count   | Total entries in current page
4   | devices | Devices returned in this page

## Return value example

``` JSON
{
    code:200,
    message:'',
    data:{
        total:1000,
        page:2,
        count:15,
        devices:[{
                "uuid": "850E-1861-CA70-8319",
                "uuid_type": "1",
                "tag": ["robot"],
                "baseInfo": {
                    "name": "Welding Robot A1",
                    "remarks": "Industrial Automation"
                },
                "create_date": "2018-10-25 11:18:35.558",
                "online": false,
                "id": "5bd1360bef03ca46edc0878f"
            },
            ... ...
            {
                "uuid": "D052-F775-9BFD-FF1A",
                "uuid_type": "1",
                "tag": [],
                "baseInfo": {
                    "name": "Welding Robot B5",
                    "remarks": ""
                },                
                "create_date": "2018-10-19 10:43:04.532",
                "online": false,               
                "id": "5bc944b81bc64cb1dc073010"
            }
        ]        
    }
}
```

