## Endpoint overview

Configures how would a device connects to Janus

## Request endpoint

/api/device/connection

## Request type

POST

## Request parameters

Seq | Key       | Required | Description
--- | --------- | :------: | ----------------------------------------------------------------
1   | token     | True     | Access token obtained in the Janus settings page
2   | uuid      | True     | The UUID of the device to be configured
3   | conn_type | True     | Connection type of the device<br/>triton: Triton client<br/>mqtt_client: MQTT client<br/>modbus_slave: Modbus slave<br/>modbus_master: Modbus master<br/>tcp_client: TCP client<br/>udp_client: UDP client<br/>tcp_server: TCP server<br/>udp_server: UDP Server<br/>serial_port: Serial device<br/>http_rest: Janus HTTP REST API

## Code example

``` JavaScript
    // Make request via jQuery AJAX
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/api/device/connection',
        dataType:'json',
        data:{
            token:'',
            uuid:'',
            conn_type:'mqtt_client'
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
        uuid:'Device UUID',
        name:'Device name',
        remarks:'Device remarks'
        // Tags for this device
        tag:['robot','arc welding'],
        create_date:'2018-10-16 07:49:34.299',
        // Online status
        online:false
    }
}
```

