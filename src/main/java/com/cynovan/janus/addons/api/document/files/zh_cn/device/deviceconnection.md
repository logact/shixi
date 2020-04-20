## 接口简述

通过 Janus Http API 设置设备接入

## 请求地址

/api/device/connection

## 请求方式

POST

## 请求参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|token     | 是     | 令牌 (token)
2|uuid      | 是     | 操作的设备序列号
3|conn_type | 是     | 设置设备的接入方式

其中，设备接入方式 conn_type 可选的方式有以下几种:

序号|类别 | 描述 | 额外参数 
---- | ----- | ----- |---------------------------------------------------------------------
1 | triton | 设备作为triton接入  |
2 | mqtt_client | 设备作为Mqtt客户端接入  |
3 | modbus_slave | 设备作为Modbus Slave接入 | (1) modbus(表示Modbus协议,支持tcp和rtu协议；e.g：modbus=tcp)<br/> (2) slave(表示Slave ID；e.g：slave=1)<br/> (3) port(表示端口号；只有在 modbus = tcp 时可选填；e.g：port=502)<br/> (4) time(表示定时读取的时间间隔；e.g：time=1000)<br/> (5) timeUnit (表示定时读取的时间单位，可选m，s，ms；e.g：timeUnit=s)<br/> (6) ip (IP地址，只有在 modbus = tcp 时可选填) <br/>(7)modbus=rtu时需要额外增加的参数：<br/>&emsp;<1> commPortId(表示串口号；e.g：commPortId=COM1)<br/>&emsp;<2>baudRate(表示波特率，可选300, 600, 1200, 2400, 4800, 9600, 19200, 38400, 76800, 153600；e.g：baudRate=9600)；<br/>&emsp;<3>parity(表示校验位：0:NONE;1:ODD;2:EVEN；e.g：parity=2)；<br/>&emsp;<4>dataBits(表示数据位，可选6, 7, 8；e.g：dataBits=8)；<br/>&emsp;<5>stopBits(表示停止位，可选1, 2；e.g：stopBits=1)；<br/>(8) (可选项) 可传入的参数 row，表示数据读取配置，<br/>&ensp; area，数据区域:<br/>&emsp;<1> Read Coils(1);<br/>&emsp;<2> Read Discrete Inputs(2);<br/>&emsp;<3> Read Holding Registers(3);<br/>&emsp;<4> Read Input Registers(4)；<br/>&ensp;start，读取位置-开始 <br/>&ensp;end，读取位置-结束 <br/>&ensp; e.g：row=[{"area":"3","start":"0","end":"1"}]
4 | modbus_master | 设备作为Modbus Master接入 | 同modbus_slave
5 | tcp_client | 设备作为TCP Socket客户端接入 | 可选项：(1)hex(表示数据为16进制格式，eg: hex=true)；(2)client_ip(TCP 客户端地址，表示Janus通过此IP自动关联数据至该设备)
6 | tcp_server | 设备作为TCP Server接入 | (1) ip(表示TCP Server IP)，<br/> (2) port(表示TCP Server Port)；<br/>(3) (可选项) timer_switch (是否定时发送数据到TCP Server)<br/> &ensp;如果timer_switch=true, 则必须传入参数：<br/>&emsp;<1> time (表示定时读取的时间间隔；e.g：time=1000) <br/>&emsp;<2> timeUnit (表示定时读取的时间单位，可选m，s，ms；e.g：timeUnit=s) <br/>&emsp;<3> radix16 (表示是否16进制格式；e.g：radix16=true) <br/>(4) (可选项) timer_data (表示要发送的数据，划分多组数据；e.g：timer_data=1\n2\n3)
7 | udp_client | 设备作为UDP Socket客户端接入 | 可选项： (1)hex(表示数据为16进制格式，eg: hex=true)；(2)client_ip(UDP客户端IP地址，表示Janus通过此IP自动关联数据至该设备)
8 | udp_server | 设备作为UDP Server接入 | (1) ip(表示UDP Server IP)，<br/> (2) port(表示UDP Server Port)；<br/>(3) (可选项) timer_switch (是否定时发送数据到UDP Server)<br/> &ensp;如果timer_switch=true, 则必须传入参数：<br/>&emsp;<1> time (表示定时读取的时间间隔；e.g：time=1000) <br/>&emsp;<2> timeUnit (表示定时读取的时间单位，可选m，s，ms；e.g：timeUnit=s) <br/>&emsp;<3> radix16 (表示是否16进制格式；e.g：radix16=true) <br/>(4) (可选项) timer_data (表示要发送的数据，划分多组数据；e.g：timer_data=1\n2\n3)
9 | serial_port | 设备作为串口接入 | (1) commPortId (表示串口号；e.g：commPortId=COM1)，<br/>(2) baudRate (表示波特率，可选300, 600, 1200, 2400, 4800, 9600, 19200, 38400, 76800, 153600；e.g：baudRate=9600)<br/>(3) parity (表示校验位：0:NONE;1:ODD;2:EVEN；e.g：parity=2)<br/>(4) dataBits (表示数据位，可选6, 7, 8；e.g：dataBits=8)<br/>(5) stopBits (表示停止位，可选1, 2；e.g：stopBits=1)，<br/>(6) time (表示定时读取的时间间隔；e.g：time=1000)，<br/>(7) timeUnit (表示定时读取的时间单位，可选m，s，ms；e.g：timeUnit=s)，<br/>(8) receive_type (表示接收数据格式，可选ascii，hex；e.g：receive_type=ascii)<br/>(9) send_type (表示发送数据格式，可选 ascii，hex；e.g：send_type=ascii)；<br/>(10) (可选项) timer_data(表示要发送的数据，\n划分多组数据；e.g：timer_data=1\n2\n3) 
10 | http_rest | 设备使用Http发送数据到Janus | 

## 请求示例

``` JavaScript
    //使用jQuery AJax作为请求提交工具
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

## 返回值说明

返回值格式为JSON

序号|名称  | 描述
--------- | :------ | -------------------------------------------------------------
1|code     | 请求状态: <br/>200 = 请求成功；<br/>401 = Token授权失败；<br/>1002 = 参数不正确；<br/>1003 = 设备不存在；<br/> 1004 = 时间格式不正确；<br/>
2|message   |  请求状态描述

## 返回值示例

``` JSON
{
	"code": 200,
	"message": "成功"
}
```

