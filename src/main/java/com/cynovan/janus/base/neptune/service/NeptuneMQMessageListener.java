package com.cynovan.janus.base.neptune.service;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.neptune.jdo.QNeptuneExec;
import com.cynovan.janus.base.neptune.mq.NeptuneMQConnService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class NeptuneMQMessageListener {

    @Autowired
    private NeptuneMessageService neptuneMessageService;

    @Autowired
    private NeptuneMQConnService neptuneMQConnService;

    public void onMessage(Document messageObject) {
        String type = DocumentLib.getString(messageObject, "type");
        CheckMessage checkMessage = CheckMessage.newInstance();
        if (StringLib.equals(type, "change_pwd")) {
            neptuneMessageService.changePassword(messageObject, checkMessage);
        } else if (StringLib.equals(type, "add_licences")) {
            neptuneMessageService.addLicences(messageObject, checkMessage);
        } else if (StringLib.equals(type, "janus_device_action")) {
            // 转发 Neptune 转发过来的密令
            neptuneMessageService.pushAction(messageObject, checkMessage);
        } else if (StringLib.equals(type, "sync_neptune_info")) {
            neptuneMessageService.changeCompanyInfo(messageObject);
        }

        String token = DocumentLib.getString(messageObject, "token");
        if (StringLib.isNotEmpty(token)) {
            Document execObject = QNeptuneExec.save(messageObject, checkMessage);
            neptuneMQConnService.sendMessageToNeptune(execObject);
        }
    }
}
