package com.cynovan.janus.base.device.push;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.conns.device_as_opcserver.DeviceAsOPCServerService;
import com.cynovan.janus.base.connection.conns.device_as_tcpclient.DeviceAsTcpClientService;
import com.cynovan.janus.base.connection.conns.device_as_tcpserver.SocketTCPClientService;
import com.cynovan.janus.base.connection.conns.device_as_udp_server.SocketUDPClientService;
import com.cynovan.janus.base.connection.conns.device_as_udpclient.DeviceAsUdpClientService;
import com.cynovan.janus.base.connection.conns.http.HttpConnector;
import com.cynovan.janus.base.connection.conns.modbus.device_as_master.ModbusSlaveService;
import com.cynovan.janus.base.connection.conns.modbus.device_as_slave.ModbusMasterService;
import com.cynovan.janus.base.device.jdo.QDataExchange;
import com.cynovan.janus.base.device.jdo.QDeviceUserActionLog;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.activemq.command.ActiveMQTextMessage;
import org.apache.commons.collections4.MapUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;

import javax.jms.JMSException;
import javax.jms.TextMessage;
import java.util.Map;

@Service
public class DevicePushService {

    private static final String PTP_CLIENTID = "PTP_CLIENTID";

    @Autowired
    @Qualifier("jmsTopicTemplate")
    private JmsTemplate jmsTemplate;

    @Autowired
    private MessageService messageService;
    @Autowired
    private I18nService i18nService;

    public boolean pushToDevice(String uuid, String action, Map<String, String> valueMap) {
        ObjectNode pushObject = JsonLib.createObjNode();
        pushObject.put("uuid", uuid);
        if (StringLib.isEmpty(action)) {
            action = "update";
        }
        pushObject.put("action", action);

        ObjectNode pushData = JsonLib.createObjNode();
        if (MapUtils.isNotEmpty(valueMap)) {
            valueMap.forEach((key, value) -> {
                pushData.put(key, value);
            });
        }
        pushObject.set("data", pushData);
        return pushToDevice(pushObject);
    }

    public boolean pushToDevice(String uuid, String action) {
        return pushToDevice(uuid, action, null);
    }

    public boolean pushToDevice(ObjectNode pushObject) {
        return pushToDevice(pushObject, null);
    }

    public boolean pushToDevice(ObjectNode pushObject, String callback) {
        String uuid = JsonLib.getString(pushObject, "uuid");

        ObjectNode pushData = (ObjectNode) pushObject.get("data");
        if (pushData == null) {
            pushData = JsonLib.createObjNode();
            pushObject.set("data", pushData);
        }

        String operation_id = QDeviceUserActionLog.save(pushObject, callback);
        pushByType(pushObject);
        return true;
    }

    private boolean pushByMqtt(ObjectNode pushObject) {
        TextMessage textMessage = new ActiveMQTextMessage();
        String uuid = JsonLib.getString(pushObject, "uuid");
        try {
            textMessage.setStringProperty(PTP_CLIENTID, uuid);
            textMessage.setText(pushObject.toString());
            jmsTemplate.convertAndSend("VirtualTopic.devicesub", textMessage);
        } catch (JMSException e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }

    // triton
    // mqtt_client
    // modbus_slave
    // modbus_master
    // tcp_client
    // udp_client
    // http_rest

    private void pushByType(ObjectNode actionNode) {
        boolean success = true;

        ObjectNode dataNode = JsonLib.getObjectNode(actionNode, "data");
        String uuid = JsonLib.getString(actionNode, "uuid");
        Document dataExchange = DBUtils.find(QDataExchange.collectionName, DocumentLib.newDoc("uuid", uuid));
        String conn_type = DocumentLib.getString(dataExchange, "conn_type");
        if (StringLib.equals(conn_type, "modbus_slave")) {
            ModbusSlaveService modbusSlaveService = SpringContext.getBean(ModbusSlaveService.class);
            success = modbusSlaveService.writeData(dataExchange, actionNode);
        } else if (StringLib.equals(conn_type, "modbus_master")) {
            ModbusMasterService modbusMasterService = SpringContext.getBean(ModbusMasterService.class);
            success = modbusMasterService.writeData(dataExchange, actionNode);
        } else if (StringLib.equals(conn_type, "tcp_client")) {
            DeviceAsTcpClientService tcpPushService = SpringContext.getBean(DeviceAsTcpClientService.class);
            success = tcpPushService.push(actionNode);
        } else if (StringLib.equals(conn_type, "tcp_server")) {
            SocketTCPClientService socketTCPClientService = SpringContext.getBean(SocketTCPClientService.class);
            String data = JsonLib.getString(dataNode, "data");
            success = socketTCPClientService.push(uuid, data);
        } else if (StringLib.equals(conn_type, "udp_client")) {
            DeviceAsUdpClientService udpPushService = SpringContext.getBean(DeviceAsUdpClientService.class);
            success = udpPushService.push(actionNode);
        } else if (StringLib.equals(conn_type, "udp_server")) {
            SocketUDPClientService socketUDPClientService = SpringContext.getBean(SocketUDPClientService.class);
            String data = JsonLib.getString(dataNode, "data");
            success =socketUDPClientService.push(uuid, data);
        } else if (StringLib.equals(conn_type, "http_rest")) {
            HttpConnector httpConnector = SpringContext.getBean(HttpConnector.class);
            success = httpConnector.push(dataExchange, actionNode);
        } else if (StringLib.equals(conn_type, "opc_ua_server")) {
            DeviceAsOPCServerService deviceAsOPCServerService = SpringContext.getBean(DeviceAsOPCServerService.class);
            deviceAsOPCServerService.write(actionNode);
        } else {
            success = pushByMqtt(actionNode);
        }

        if (!success) {
            MessageDto messageDto = new MessageDto();
            messageDto.setTitle(i18nService.getValue("命令推送失败", "action.send.fail", "system"));

            StringBuilder contentBuilder = new StringBuilder();
            contentBuilder.append("设备 ");
            contentBuilder.append("%s");
            contentBuilder.append(" 命令推送失败!");
            messageDto.setContent(String.format(i18nService.getValue(contentBuilder.toString(), "action.send.tip", "system"), uuid));
            messageDto.addParam(i18nService.getValue("密令", "secret_code", "system"), actionNode.toString());
            messageDto.addParam(i18nService.getValue("设备连接方式", "device.connect.style", "system"), conn_type);
            messageService.send(messageDto);
        }
    }
}
