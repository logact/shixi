## Endpoint overview

Stomp相关:
This endpoint enables user to obtain realtime messages sent by the device via WebSocket. You can:

1. Get WebSocket related information
2. Subscribe to topics via information obtained

References:

STOMP: <https://stomp.github.io/>

Example code download (please replace the below address `127.0.0.1:8080` with the address of your Janus instance)

JavaScript: http://127.0.0.1:8080/resource/api/examples/janus-stomp-websocket-js.zip

C#: http://127.0.0.1:8080/resource/api/examples/janus-stomp-websocket-csharp.zip

## Obtaining WebSocket connection information via HTTP API

### Request endpoint

/api/janus/websocket

### Request type

GET

### Request parameters

Seq | Key   | Required | Description
--- | ----- | :------: | ------------------------------------------
1   | token | True     | Access token obtained in the Janus settings page
2   | uuid  | True     | The UUID of the device

### Return value

Return value is formatted as JSON

Seq | Key     | Description
--- | ------- | -----------------------------------------------------------------------------------------------------
1   | code    | Status code<br>200 = Success<br/>401 = Token authentication failed<br/>1003 = Device does not exist
2   | message | A detail description for the response
3   | data    | WebSocket information

## Return value example

``` JSON
{
    code:200,
    message:'',
    data:{
        // Communication via WebSocket, through WS protocol
        "websocket":"ws://127.0.0.1:8080/websocket",
        // Topic to subscribe for data
        "topic":"/websocket/deviceData/uuid"
    }
}
```

## 2、连接WebSocket订阅实时数据

### Code example

``` JavaScript
    /* The following example is for STOMP via WebSocket */
    
    <!-- include related libraries -->
    
    <!-- include STOMP -->
    <script src="https://cdn.bootcss.com/stomp.js/2.3.3/stomp.min.js"></script>
    
    <!-- include jQuery for AJAX -->
    <script src="https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js"></script>
    
    <script>
        window.onload=function() {
            // obtain WebSocket information from HTTP API
            $.get({
                // accessing the HTTP API endpoint
                url: "http://127.0.0.1:8080/api/janus/websocket",
                data: {
                    // token obtained from Janus info page for authentication
                    token: "59E9-B2A9-7609-D0E2",
                    // the UUID of the device that you wish to obtain data from
                    uuid: "E07E-8972-925A-C99B"
                },
                // parse return data as JSON
                dataType:'json',
                success: function (result) {
                    // check for status code, if success (200) then continue
                    if(result.code === 200){
                        // the URL for WebSocket
                        var url = result.data.websocket;
                        // the topic to subscribe
                        var topic = result.data.topic;
    
                        // instantiate a STOMP via WebSocket client
                        var stomp = Stomp.client(url);
                        // initiate connection to WebSocket
                        stomp.connect({}, function () {
                            // subscribe to topic for device data on connection success
                            stomp.subscribe(topic, function (result) {
                                // the returned data from WebSocket is a string
                                if (result.body) {
                                    // parse the string into JSON
                                    var message = $.parseJSON(result.body);
                                    alert(result.body);
                                    /*
                                        // data example
                                        {
                                            "uuid":"device_uuid",
                                            "time":"2018-04-12 14:25:20:34",
                                            "data":{
                                                "speed":20,
                                                "open" : true
                                            }
                                        }
                                    */
                                }
                            });
                        });
                    }else{
                        // alert for errors
                        alert(result.message);
                    }
                }
            });
        }
    </script>
```