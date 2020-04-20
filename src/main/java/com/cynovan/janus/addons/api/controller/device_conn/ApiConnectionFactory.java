package com.cynovan.janus.addons.api.controller.device_conn;

public class ApiConnectionFactory {

    public static ApiConnection createConnection(String conn_type, String token) {
        ApiConnection conn = null;
        switch (conn_type) {
            case "triton":
                conn = new ApiTritonMqttClient(token);
                break;
            case "mqtt_client":
                conn = new ApiTritonMqttClient(token);
                break;
            case "modbus_slave":
                conn = new ApiModbusSlave(token);
                break;
            case "modbus_master":
                conn = new ApiModbusSlave(token);
                break;
            case "tcp_client":
                conn = new ApiTcpClient(token);
                break;
            case "tcp_server":
                conn = new ApiTcpServer(token);
                break;
            case "udp_client":
                conn = new ApiUdpClient(token);
                break;
            case "udp_server":
                conn = new ApiUdpServer(token);
                break;
            case "serial_port":
                conn = new ApiSerialPort(token);
                break;
            case "http_rest":
                conn = new ApiHttpRest(token);
                break;
            default:
                conn = new ApiConnection(token);
        }
        return conn;
    }
}
