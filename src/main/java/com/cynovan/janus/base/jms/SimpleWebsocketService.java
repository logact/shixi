package com.cynovan.janus.base.jms;

import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class SimpleWebsocketService {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    public void pushMessage(String topic, String data) {
        if (StringLib.indexOf(topic, "websocket/") == -1) {
            topic = "/websocket/" + topic;
        }
        simpMessagingTemplate.convertAndSend(topic, data);
    }

    public void pushMessage(String topic, JsonNode dataNode) {
        pushMessage(topic, dataNode.toString());
    }
}
