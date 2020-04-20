## Overview

Connect to Janus as an MQTT client

## Topics to subscribe

Seq | Topic     | Description
--- | --------- | -----------------------------------------------
1   | devicepub | For uploading data to Janus (device -> Janus)
2   | devicesub | For obtaining data from Janus (Janus -> device)

## Data format

Predefined fields:

Seq | Key       | Required | Description
--- | --------- | :------: | -------------------------------------------------------------------------------------------
1   | uuid      | True     | The UUID of the device
2   | time      | False    | Data generation date time, in `yyyyMMddHHmmssSSSS` format. Leaving it empty means use current timestamp

All other fields other than the above predefined fields will be treated as data. For example, if you're sending two
values to Janus, `speed` and `temperature`, simply add `speed={speed_value}` and `temperature={temp_value}` to the
data body.

## Example

Data should be formatted as JSON

``` JSON

{
    "uuid": "Device_UUID",        // Device UUID
    "time": "20180310142505336",  // Data generation date time, in `yyyyMMddHHmmssSSSS` format. Leaving it empty means use current timestamp
    "speed": "10",                // speed = 10
    "temperature": 36.5,          // temperature = 36.5
    ... 
    "key_10": "test"
}

```

## Code example

A CNC device with UUID `CNC_10001` is connected to Janus as an MQTT client. It's sending its machine `model`, `type` and 
`manufacturer` information to Janus.

数控机床 [CNC_10001] 通过 MQTT 客户端接入Janus，发送 [机床型号] [规格] [品牌] 信息到Janus

``` JSON
{
    "uuid":"CNC_10001", 
    "model":"E-CNC-PP2",                        // Model
    "type":"high performance, high precision",  // Type
    "manufacturer":"GOOGOL",                    // Manufacturer
}
```
