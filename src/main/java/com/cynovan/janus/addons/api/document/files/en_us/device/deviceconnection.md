## Endpoint overview

Configures the connection type of a device

## Request endpoint

/api/device/connection

## Request type

POST

## Request parameters

Seq | Key       | Required | Description
--- | --------- | :------: | ------------------------------------------
1   | token     | True     | Access token obtained in the Janus settings page
2   | uuid      | True     | The UUID of the device
3   | conn_type | True     | Connection type of this device

Available values for `conn_type` are the followings:

Seq | Type name     | Description      | Additional parameters
--- | ------------- | ---------------- | -------------------------
1   | triton        | Triton client    | None
2   | mqtt_client   | MQTT client      | None
3   | modbus_slave  | Modbus Slave     | (1) `modbus`: type of Modbus connection (`tcp` or `rtu`), e.g. `modbus=tcp`<br/>(2) `slave`: slave ID of device, e.g. `slave=1`<br/>(3) `port`: port number for Modbus TCP, e.g. `port=502`<br/>(4) `time`: read interval, e.g. `time=1000`<br/>(5) `timeUnit`: time unit for read interval (`m`, `s`, `ms`), e.g. `timeUnit=ms`<br/>(6) `ip`: IP address for Modbus TCP, e.g. `ip=192.168.1.100`<br/>(7) **(optional)** `row`: defines which region and address to read data from, `area` defines the region, valid values are:<br/>`1: Read Coils`<br/>`2: Read Discrete Input`<br/>`3: Read Holding Registers`<br/>`4: Read Input Registers`<br/>`start` defines the start address, and `end` defines the end address. e.g. `row=[{"area":"3","start":"0","end":"1"}]`
4   | modbus_master | Modbus Master    | See `Modbus Slave`
5   | tcp_client    | TCP client       | **Optional**<br/>(1) `hex`: defines whether data is in hexadecimal format, e.g. `hex=true`<br/>(2) `client_ip`: defines TCP client IP, Janus will use this IP address to associate data to this device automatically, e.g. `client_ip=192.168.1.100`
6   | tcp_server    | TCP server       |
7   | udp_client    | UDP client       | **Optional**<br/>(1) `hex`: defines whether data is in hexadecimal format, e.g. `hex=true`<br/>(2) `client_ip`: defines UDP client IP, Janus will use this IP address to associate data to this device automatically, e.g. `client_ip=192.168.1.100`
8   | udp_server    | UDP server       |
9   | serial_port   | Serial device    | (1) `commPortId`: serial port identifier, e.g. `commPortId=COM1` or `commPortId=/dev/ttyS0`<br/>(2) `baudRate`: baud rate, available options: `300, 600, 1200, 2400, 4800, 9600, 19200, 38400, 76800, 153600`, e.g. `baudRate=9600`<br/>(3) `parity`: parity, availble options: `1`:NONE, `2`:ODD, `3`:EVEN, e.g. `parity=1`<br/>(4) `dataBits`: data bits, available options: `6, 7, 8`, e.g. `dataBits=8`<br/>(5) `stopBits`: stop bits, available options: `1, 2`, e.g. `stopBits=1`<br/>(6) `time`: read interval, e.g. `time=1000`<br/>(7) `timeUnit`: time unit for read interval (`m`, `s`, `ms`), e.g. `timeUnit=s`<br/>(8) `receive_type`: Modbus data type for incoming data, available options: `ascii, hex`, e.g. `receive_type=ascii`<br/>(9) `send_type`: Modbus data type for outgoing data, available options: `ascii, hex`, e.g. `send_type=hex`<br/>(10) **(Optional)** `timer_data`: Outgoing data to be sent in interval, multi-line data can be separated with `\n` newline character, e.g. `timer_data=1\n2\n3`
10  | http_rest     | HTTP REST client | None

## Code example

``` JavaScript
    // Make request via jQuery AJAX
    $.ajax({
        type:'post',
        url:'http://127.0.0.1/api/device/connection',
        dataType:'json',
        data:{
            token:'BE60-E612-A5DD-CBA9',
            uuid:'850E-1861-CA70-8319',
            conn_type:'triton'
        }
    });
```

## Return value

Return value is formatted as JSON

Seq | Key     | Description
--- | ------- | -----------------------------------------------------------------------------------------------------
1   | code    | Status code<br>200 = Success<br/>401 = Token authentication failed<br/>1002 = Invalid parameters<br/>1003 = Device does not exist<br/>1004 = Invalid time format
2   | message | A detail description for the response

## Return value example

``` JSON
{
	"code": 200,
	"message": "成功"
}
```

