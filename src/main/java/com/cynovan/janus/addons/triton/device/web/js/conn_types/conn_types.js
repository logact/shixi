define([], function () {
    var connTypes = [{
        id: 'triton',
        name: 'Triton(系统默认)',
        i18nKey: 'triton_default',
        template: 'connection_triton_template',
        display: 'connection_triton_display_template',
        type:'内置SDK'
    }, {
        id: 'mqtt_client',
        name: '设备作为Mqtt客户端接入',
        i18nKey: 'device.mqtt.connect',
        template: 'connection_mqtt_client_template',
        display: 'connection_mqtt_client_display_template',
        help_doc: 'connect-mqtt',
        'example_template': 'connection_mqtt_help_template',
        type:'MQTT'
    }, {
        id: 'modbus_slave',
        name: '设备作为Modbus Master接入',
        i18nKey: 'device.modbus.master',
        template: 'connection_modbus_slave_template',
        display: 'connection_modbus_slave_display_template',
        help_doc: 'connect-modbus',
        'example_template': 'connection_help_template',
        type:'Modbus/串口'
    }, {
        id: 'modbus_master',
        name: '设备作为Modbus Slave接入',
        i18nKey: 'device.modbus.slave',
        template: 'connection_modbus_master_template',
        display: 'connection_modbus_master_display_template',
        help_doc: 'connect-modbus',
        'example_template': 'connection_help_template',
        type:'Modbus/串口'
    }, {
        id: 'tcp_client',
        name: '设备作为TCP Socket客户端接入',
        i18nKey: 'device.tcp.client',
        template: 'connection_tcp_client_template',
        display: 'connection_tcp_client_display_template',
        help_doc: 'connect-tcp-socket',
        'example_template': 'connection_tcp_help_template',
        type:'TCP Socket'
    }, {
        id: 'udp_client',
        name: '设备作为UDP Socket客户端接入',
        i18nKey: 'device.udp.client',
        template: 'connection_udp_client_template',
        display: 'connection_udp_client_display_template',
        help_doc: 'connect-udp-socket',
        'example_template': 'connection_udp_help_template',
        type:'UDP Socket'
    }, {
        id: 'tcp_server',
        name: '设备作为TCP Server接入',
        i18nKey: 'device.tcp.server',
        template: 'connection_tcp_server_template',
        display: 'connection_tcp_server_display_template',
        type:'TCP Socket'
    }, {
        id: 'udp_server',
        name: '设备作为UDP Server接入',
        i18nKey: 'device.udp.server',
        template: 'connection_udp_server_template',
        display: 'connection_udp_server_display_template',
        type:'UDP Socket'
    }, {
        id: 'http_server',
        name: '设备作为Http Server接入',
        i18nKey: 'device.http.server',
        template: 'connection_http_server_template',
        display: 'connection_http_server_display_template',
        type:'HTTP'
    }, {
        id: 'serial_port',
        name: '设备作为串口接入',
        i18nKey: 'device.serial.port',
        template: 'connection_serial_port_template',
        display: 'connection_serial_port_display_template',
        type:'Modbus/串口'
    }, {
        id: 'http_rest',
        name: '设备使用Http发送数据到Janus',
        i18nKey: 'device.http',
        template: 'http_rest_template',
        help_doc: 'connect-http',
        'example_template': 'connection_http_help_template',
        display: 'http_rest_display_template',
        type:'HTTP'
    }, {
        id: 'opc_ua_server',
        name: '设备作为OPC UA TCP Server接入',
        i18nKey: 'device.opc',
        template: 'opc_ua_server_template',
        display: 'opc_ua_server_display_template',
        type:'TCP Socket'
    }, {
        id: 'bacnet_ip',
        name: '设备使用Bacnet/IP接入',
        i18nKey: 'device.bacnet',
        template: 'bacnet_ip_server_template',
        display: 'bacnet_ip_server_display_template',
        type:'Modbus/串口'
    }];

    return connTypes;
})