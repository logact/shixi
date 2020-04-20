## Endpoint overview

This endpoint enables user to obtain realtime messages sent by the device via WebSocket. You can:

1. Get WebSocket related information
2. Subscribe to topics via information obtained

References:

SockJS: <https://github.com/sockjs/sockjs-client>

STOMP: <https://stomp.github.io/>

Example code download (please replace the below address `127.0.0.1:8080` with the address of your Janus instance)

JavaScript: http://127.0.0.1:8080/resource/api/examples/janus-sockjs-stomp-websocket-js.zip

Java: http://127.0.0.1:8080/resource/api/examples/janus-sockjs-stomp-websocket-java.zip

## Obtaining WebSocket connection information via HTTP API

### Request endpoint

/api/janus/websocket-sockjs

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
        // Communication via SockJS, through HTTP protocol
        "websocket":"http://127.0.0.1:8080/ws?",
        // Topic to subscribe for data
        "topic":"/ws/deviceData/uuid"
    }
}
```

## Obtaining realtime data by subscribing to WebSocket

### Code example

``` JavaScript
    /* The following example is for STOMP via SockJS */
    
    <!-- include related libraries -->
    
    <!-- include SockJS -->
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    
    <!-- include STOMP -->
    <script src="https://cdn.bootcss.com/stomp.js/2.3.3/stomp.min.js"></script>
    
    <!-- include jQuery for AJAX -->
    <script src="https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js"></script>
    
    <script>
        window.onload=function() {
            // obtain WebSocket information from HTTP API
            $.get({
                // accessing the HTTP API endpoint
                url: "http://192.168.33.188:8082/api/janus/websocket-sockjs",
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
    
                        // instantiate a SockJS instance
                        var socket = new SockJS(url);
                        // instantiate a STOMP client via SockJS instance
                        var stompClient = Stomp.over(socket);
                        // initiate connection to WebSocket
                        stompClient.connect({}, function () {
                            // subscribe to topic for device data on connection success
                            stompClient.subscribe(topic, function (result) {
                                // the returned data from WebSocket is a string
                                if (result.body) {
                                    // parse the string into JSON
                                    var message = $.parseJSON(result.body);
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