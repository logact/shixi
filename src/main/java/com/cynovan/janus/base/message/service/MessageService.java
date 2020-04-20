package com.cynovan.janus.base.message.service;

import com.cynovan.janus.base.jms.WebSocketService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.entity.QMessage;
import com.cynovan.janus.base.utils.DBUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MessageService {

    @Autowired
    WebSocketService webSocketService;

    public void send(MessageDto messageDto) {
        Document doc = messageDto.toDocument();
        if (doc.size() > 0) {
            DBUtils.save(QMessage.collectionName, doc);
        }
        webSocketService.pushMessage("/message", doc.toJson());
    }
}
