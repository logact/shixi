package com.cynovan.janus.base.connection.conns.activemq;

import com.cynovan.janus.base.device.push.DevicePushService;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.devicedata.DeviceSamplingDataService;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.jms.WebSocketService;
import com.cynovan.janus.base.message.entity.DeviceConnExceptionMessageBuilder;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.MQTTLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.activemq.command.ActiveMQBytesMessage;
import org.bson.Document;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import javax.jms.Message;
import javax.jms.MessageListener;

/**
 * Created by Aric on 2016/12/14.
 */
public class MqttDataListener implements MessageListener {

    protected Logger logger = LoggerFactory.getLogger(getClass());

    private static final DateTimeZone timezone = DateTimeZone.forID("Asia/Shanghai");
    public static final String DateFormat = "yyyyMMddHHmmss";

    @Value("${debug}")
    private Boolean debug;

    @Autowired
    private DeviceDataService deviceDataService;

    @Autowired
    private DeviceOnlineService deviceOnlineService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private WebSocketService webSocketService;

    @Autowired
    private DeviceSamplingDataService deviceSamplingDataService;

    @Autowired
    private DevicePushService devicePushService;

    @Autowired
    private I18nService i18nService;

    @Override
    public void onMessage(Message message) {
        if (message instanceof ActiveMQBytesMessage) {
            ActiveMQBytesMessage m = (ActiveMQBytesMessage) message;
            try {
                String data = MQTTLib.getData(m.getContent().getData());
                if (StringLib.isNotEmpty(data)) {
                    Document deviceData = null;
                    try {
                        deviceData = Document.parse(data);
                    } catch (Exception e) {
                        /*json 存在问题*/
                        MessageDto messageDto = DeviceConnExceptionMessageBuilder.build("mqtt",
                                StringLib.join(i18nService.getValue("数据解析为JSON时异常：", "data.tojson.exception", "system"), e.getMessage()),
                                data);
                        messageService.send(messageDto);
                        return;
                    }

                    String action = DocumentLib.getString(deviceData, "action");
                    String uuid = DocumentLib.getString(deviceData, "uuid");
                    uuid = StringLib.trim(uuid);
                    if (StringLib.isEmpty(action)) {
                        action = "data";
                    }

                    if (StringLib.isNotEmpty(action)) {
                        if (StringLib.equals(action, "data")) {
                            deviceDataService.onData(deviceData);
                        } else if (StringLib.equals(action, "sync_time")) {
                            ObjectNode dataNode = JsonLib.createObjNode();
                            dataNode.put("action", "sync_time");
                            dataNode.put("uuid", uuid);
                            dataNode.put("datetime", DateTime.now().withZone(timezone).toString(DateFormat));
                            dataNode.put("timestamp", DateTime.now().getMillis());
                            devicePushService.pushToDevice(dataNode);
                        } else if (StringLib.equals(action, "query_config")) {
                            webSocketService.pushMessage("queryconfig/" + uuid, JsonLib.toJSON(deviceData).toString());
                        } else if (StringLib.equals(action, "cloud_download")) {
                            webSocketService.pushMessage("cloud/" + uuid, JsonLib.toJSON(deviceData).toString());
                        } else if (StringLib.equals(action, "sampling")) {
//                            deviceSamplingDataService.onSampling(deviceData);
                            webSocketService.pushMessage("sampling/" + uuid, JsonLib.toJSON(deviceData).toString());
                        } else {
                            deviceOnlineService.online(uuid);
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
