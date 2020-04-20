## 简述

设备作为 MQTT 客户端接入 Janus

## 数据接入Topic

devicepub

## 数据下发Topic

devicesub

## 传输数据参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|uuid      | 是    | 设备序列号
2|time      |       | 数据产生的时间，格式为yyyyMMddHHmmssSSS, 如该栏位为空，则取当前时间
3|speed     |       |（设备数据）speed 速度
4|temperature |     |（设备数据）temperature 温度

备注：以上 speed、temperature只是示例，在实际请求中按需（数量不限）添加自己的设备数据

## 示例

传输数据格式为 JSON

``` JSON

{
    "uuid": "设备UUID",           // 设备序列号 
    "time": "20180310142505336",  // 数据产生的时间：格式为yyyyMMddHHmmssSSS, 如该栏位为空，则取当前时间  
    "speed": "10",                // 速度=10 
    "temperature": 36.5,          // 温度=36.5 
    ... 
    "key_10": "test"
}

```

## 请求示例

数控机床 [CNC_10001] 通过 MQTT 客户端接入Janus，发送 [机床型号] [规格] [品牌] 信息到Janus

``` JSON

{
    "uuid":"CNC_10001", 
    "MachineType":"E-CNC-PP2",              //机床型号 
    "Type":"主轴:高精度主轴轴承，适应高刚性",  //规格
    "Company":"GOOGOL",                     //品牌 
}

```
