## 接口简述

首先通过Janus Http API 获得WebSocket连接信息，再通过WebSocket订阅设备实时数据

SockJS相关:

<https://github.com/sockjs/sockjs-client>

Stomp相关:

<https://stomp.github.io/>

示例代码下载(请使用本机Janus地址替换URL中的127.0.0.1:8080):

JavaScript示例: http://127.0.0.1:8080/resource/api/examples/janus-sockjs-stomp-websocket-js.zip

Java示例: http://127.0.0.1:8080/resource/api/examples/janus-sockjs-stomp-websocket-java.zip

## 1、使用Http接口获得WebSocket连接信息

### 请求地址

http://127.0.0.1:8080/api/janus/websocket-sockjs

### 请求方式

GET

### 请求参数

序号|名称 | 必填 | 描述
--------- |--------- | :------: | -------------------------------------------------------------
1|token     | 是      | 请求令牌（Janus信息中可见） 
2|uuid      | 是      | 设备的UUID

### 返回值说明

返回值格式为JSON

序号|名称  | 描述
--------- | :------ | -------------------------------------------------------------
1|code     | 请求状态: <br/>200 = 请求成功；<br/>401 = Token授权失败；<br/>1003 = 设备不存在；<br/>
2|message      |  请求状态描述
3|data     |  返回WebSocket连接信息

## 返回值示例

``` JSON
{
    code:200,
    message:'',
    data:{
        //基于SockJS的地址，协议为http
        "websocket":"http://127.0.0.1:8080/ws?",
        //订阅数据的topic
        "topic":"/ws/deviceData/uuid"
    }
}
```

## 2、连接WebSocket订阅实时数据

### 代码示例

``` JavaScript
    /*基于 SockJS+Stomp 的 WebSocket 方式，请查看如下代码示例：*/
    
    <!-- 引入相关类库 -->
    
    <!--引入SockJS -->
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    
    <!--引入Stomp -->
    <script src="https://cdn.bootcss.com/stomp.js/2.3.3/stomp.min.js"></script>
    
    <!--引入jQuery,用于Ajax请求 -->
    <script src="https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js"></script>
    
    <script>
        window.onload=function() {
            //请求 http 接口，获得连接 WebSocket 的必备信息
            $.get({
                // http接口地址
                url: "http://192.168.33.188:8082/api/janus/websocket-sockjs",
                data: {
                    //传入 http 的 Token 验证
                    token: "59E9-B2A9-7609-D0E2",
                    //传入要订阅实时数据的设备UUID
                    uuid: "E07E-8972-925A-C99B"
                },
                //指定返回的数据以 JSON 解析
                dataType:'json',
                success: function (result) {
                    //获取 WebSocket 信息成功
                    if(result.code === 200){
                        //WebSocket 的 url
                        var url = result.data.websocket;
                        // 设备实时数据的 topic
                        var topic = result.data.topic;
    
                        //创建 SockJS 的实例
                        var socket = new SockJS(url);
                        //创建 Stomp 实例
                        var stompClient = Stomp.over(socket);
                        //连接 WebSocket server
                        stompClient.connect({}, function () {
                            //连接成功时，订阅设备数据
                            stompClient.subscribe(topic, function (result) {
                                //获得设备数据,此处为 String 类型
                                if (result.body) {
                                    //转换设备数据为 JSON
                                    var message = $.parseJSON(result.body);
                                    /*
                                        数据示例:
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
                        //弹出错误消息
                        alert(result.message);
                    }
                }
            });
        }
    </script>
```