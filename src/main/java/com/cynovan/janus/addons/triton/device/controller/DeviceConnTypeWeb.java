package com.cynovan.janus.addons.triton.device.controller;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.conns.device_as_bacnet_ip_server.DeviceAsBacnetIPService;
import com.cynovan.janus.base.connection.conns.device_as_opcserver.utils.OpcUAUtils;
import com.cynovan.janus.base.connection.service.DataAccessCreateService;
import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.device.jdo.QDataExchange;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fazecast.jSerialComm.SerialPort;
import com.google.common.collect.Lists;
import com.serotonin.bacnet4j.exception.BACnetException;
import org.bson.Document;
import org.eclipse.milo.opcua.sdk.client.OpcUaClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping(value = "connections")
public class DeviceConnTypeWeb extends BaseWeb {
    @Value("${broker-mqtt}")
    private String broker_mqtt;

    @Value("${socket_udp_port}")
    private Integer socket_udp_port;

    @Value("${socket_tcp_port}")
    private Integer socket_tcp_port;

    @Value("${server.port}")
    private String server_port;

    @RequestMapping(value = {"triton_client", "mqtt_client"})
    public String loadMqttClient() {
        ObjectNode dataNode = JsonLib.createObjNode();
        dataNode.put("broker", StringLib.join(StringLib.getIPAddresses(), ", "));
        dataNode.put("port", StringLib.substring(broker_mqtt, StringLib.lastIndexOf(broker_mqtt, ":") + 1));
        String token = DocumentLib.getString(QJanus.get(), "token");
        dataNode.put("userName", token);
        dataNode.put("password", "");
        dataNode.put("topic", "devicepub");
        dataNode.put("pushtopic", "devicesub");
        return dataNode.toString();
    }

    @RequestMapping(value = "http_rest")
    public String loadHttpRest(HttpServletRequest request) {
        ObjectNode dataNode = JsonLib.createObjNode();

        String addr = RequestLib.getCompleteUrl(request, "httpapi/data");
        if (StringLib.contains(addr, "localhost")) {
            String url = new StringBuilder().append("http://")
                    .append("@ip@")
                    .append(":")
                    .append(server_port).append("/httpapi/data").toString();
            List<String> ipAddress = StringLib.getIPAddresses();

            List<String> urls = Lists.newArrayList();
            ipAddress.stream().forEach(ip -> {
                urls.add(StringLib.replace(url, "@ip@", ip));
            });

            addr = StringLib.join(urls, " , ");
        }

        dataNode.put("addr", addr);
        dataNode.put("token", DocumentLib.getString(QJanus.get(), "token"));
        dataNode.put("method", "POST");
        dataNode.put("param", "data");
        return dataNode.toString();
    }

    @PostMapping(value = "deviceDataExchange")
    public String loadDeviceDataExchange(@RequestParam String uuid) {
        Document dataExchange = DBUtils.find(QDataExchange.collectionName,
                DocumentLib.newDoc("uuid", uuid));
        if (dataExchange == null) {
            dataExchange = DocumentLib.newDoc();
            dataExchange.put("uuid", uuid);
            dataExchange.put("conn_type", "triton");
            Document document = DocumentLib.parse(loadMqttClient());
            document.put("uuid", uuid);
            dataExchange.put("conn_info_triton", document);
            DBUtils.save(QDataExchange.collectionName, dataExchange);
        }
        return dataExchange.toJson();
    }

    @RequestMapping(value = "modbus_local_ip")
    public String modbus_local_ip() {
        List<String> ipAddress = StringLib.getIPAddresses();
        ObjectNode dataNode = JsonLib.createObjNode();
        dataNode.put("ip", StringLib.join(ipAddress, ","));
        return dataNode.toString();
    }

    @RequestMapping(value = "modbus_comm_port_scan")
    public String modbus_comm_scan() {
        List<String> commPorts = Lists.newArrayList();
        SerialPort ports[] = SerialPort.getCommPorts();
        if (ports != null) {
            for (int i = 0; i < ports.length; i++) {
                SerialPort serialPort = ports[i];
                commPorts.add(serialPort.getSystemPortName());
            }
        }
        ObjectNode dataNode = JsonLib.createObjNode();
        dataNode.set("ports", JsonLib.toJSON(commPorts));
        return dataNode.toString();
    }

    @RequestMapping(value = {"tcp_client", "udp_client"})
    public String loadSocketClient(HttpServletRequest request) {
        ObjectNode dataNode = JsonLib.createObjNode();
        dataNode.put("address", StringLib.join(StringLib.getIPAddresses(), ", "));
        if (StringLib.contains(request.getRequestURI(), "tcp_client")) {
            dataNode.put("port", socket_tcp_port);
        } else {
            dataNode.put("port", socket_udp_port);
        }

        dataNode.put("token", DocumentLib.getString(QJanus.get(), "token"));

        return dataNode.toString();
    }


    @RequestMapping(value = "restart")
    public String unRegisterConn(@RequestParam String uuid) {
        DataAccessCreateService service = SpringContext.getBean(DataAccessCreateService.class);
        service.restart(uuid);
        /*清除设备数据的粘滞功能*/
        CacheUtils.deleteLike(uuid);
        return CheckMessage.newInstance().toString();
    }

    @RequestMapping(value = "opc_pid")
    public String loadAllPid(@RequestParam String uuid, @RequestParam String endpoint_url, @RequestParam String securityPolicy, @RequestParam String auth_type, String username, String password) {

        CheckMessage message = CheckMessage.newInstance();
        Document documentLib = DocumentLib.newDoc();
        documentLib.put("uuid", uuid);
        documentLib.put("endpoint_url", endpoint_url);
        documentLib.put("securityPolicy", securityPolicy);
        documentLib.put("auth_type", auth_type);
        if (StringLib.isNotEmpty(username)) {
            documentLib.put("username", username);
        }
        if (StringLib.isNotEmpty(password)) {
            documentLib.put("password", password);
        }

        OpcUaClient opcUaClient = OpcUAUtils.createOpcUaClient(documentLib);
        try {
            opcUaClient.connect().get();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (ExecutionException e) {
            e.printStackTrace();
        }
        List<Document> list = OpcUAUtils.readAllNodes(opcUaClient);
        message.addData("nodeList", list);
        return message.toString();
    }

    @RequestMapping(value = "loadAllObject")
    public String loadAllObject(@RequestParam int port, @RequestParam int deviceInstance,@RequestParam String uuid) throws SocketException, UnknownHostException {
        CheckMessage message = CheckMessage.newInstance();
        Document document = DocumentLib.newDoc();
        document.put("portNum", port);
        document.put("uuid", uuid);
        document.put("deviceInstance",deviceInstance);

        DeviceAsBacnetIPService deviceAsBacnetIPService = SpringContext.getBean(DeviceAsBacnetIPService.class);
        List<Document> nodeList = null;
        try {
            nodeList = deviceAsBacnetIPService.readAllNode(document);
        } catch (BACnetException e) {
            e.printStackTrace();
        }
        message.addData("nodeList", nodeList);
        return message.toString();
    }
}
