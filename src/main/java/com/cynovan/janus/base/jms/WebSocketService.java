package com.cynovan.janus.base.jms;

import com.cynovan.janus.base.arch.controller.BaseService;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Created by Aric on 2016/12/27.
 */
@Component
public class WebSocketService extends BaseService {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    public void pushMessage(String topic, String data) {
        if (StringLib.indexOf(topic, "ws/") == -1) {
            topic = "/ws/" + topic;
        }
        simpMessagingTemplate.convertAndSend(topic, data);
    }

    public void pushMessage(String topic, JsonNode dataNode) {
        pushMessage(topic, dataNode.toString());
    }
}
