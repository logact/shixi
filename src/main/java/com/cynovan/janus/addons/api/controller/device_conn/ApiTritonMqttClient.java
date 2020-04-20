package com.cynovan.janus.addons.api.controller.device_conn;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import org.springframework.core.env.Environment;

import javax.servlet.http.HttpServletRequest;

public class ApiTritonMqttClient extends ApiConnection {

    private String broker_mqtt;

    ApiTritonMqttClient(String token) {
        super(token);

        Environment env = SpringContext.getBean(Environment.class);
        this.broker_mqtt = env.getProperty("broker-mqtt");
    }

    @Override
    public Document getConnInfo(HttpServletRequest request, CheckMessage message) {

        conn.put("broker", StringLib.join(StringLib.getIPAddresses(), ", "));
        conn.put("port", StringLib.substring(broker_mqtt, StringLib.lastIndexOf(broker_mqtt, ":") + 1));
        conn.put("userName", token);
        conn.put("topic", "devicepub");
        conn.put("pushtopic", "devicesub");
        return conn;
    }
}
