## Endpoint overview

Obtains detailed information of a device

## Request endpoint

/api/device/query

## Request type

GET

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
        url:'http://127.0.0.1/api/device/query',
        dataType:'json',
        data:{
            token:'BE60-E612-A5DD-CBA9',
            uuid:'850E-1861-CA70-8319'
        }
    });
```

## Return value

Return value is formatted as JSON

Seq | Key     | Description
--- | ------- | -----------------------------------------------------------------------------------------------------
1   | code    | Status code<br>200 = Success<br/>401 = Token authentication failed<br/>1003 = Device does not exist
2   | message | A detail description for the response
3   | data    | The queried device's detail information

## Return value example

``` JSON
{
	"code": 200,
	"message": "success",
	"data": {
		"uuid": "850E-1861-CA70-8319",
		"name": "Welding Robot A1",
		"online": false,
		"tag": ["robot"],
		"create_date": "2018-10-25 11:07:33.161",
		"remarks": "Industrial Automation",
	}
}
```

