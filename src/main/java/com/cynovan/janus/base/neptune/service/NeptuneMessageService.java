package com.cynovan.janus.base.neptune.service;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.device.jdo.QUuidList;
import com.cynovan.janus.base.device.push.DevicePushService;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.neptune.mq.NeptuneMQConnService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NeptuneMessageService {

    @Autowired
    private DevicePushService devicePushService;

    @Autowired
    private NeptuneMQConnService neptuneMQConnService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private I18nService i18nService;

    public void changePassword(Document data, CheckMessage message) {
        String token = DocumentLib.getString(data, "token");
        if (token == null) {
            message.setSuccess(false);
            message.addMessage("token 不能为空");
        }
        Document query = new Document();
        query.put("token", token);
        Document janus = DBUtils.find(QJanus.collectionName, query);
        String password = DocumentLib.getString(data, "password");
        String control_password = DocumentLib.getString(data, "control_password");
        janus.put("password", password);
        janus.put("control_password", control_password);
        DBUtils.save(QJanus.collectionName, janus);
        MessageDto msg = new MessageDto();
        msg.setTitle(i18nService.getValue("安全通知", "security_noty", "system"));
        msg.setContent(i18nService.getValue("Janus平台密码已被重置！", "reset_password", "system"));
        messageService.send(msg);
    }

    public void addLicences(Document data, CheckMessage message) {
        String token = DocumentLib.getString(data, "token");
        if (token == null) {
            message.setSuccess(false);
            message.addMessage("token 不能为空");
        }
        Document query = new Document();
        query.put("token", token);
        Document janus = DBUtils.find(QJanus.collectionName, query);
        janus.put("licences", DocumentLib.getInt(data, "licences"));
        DBUtils.save(QJanus.collectionName, janus);

        JsonNode uuidsNode = JsonLib.toJSON(DocumentLib.getList(data, "uuids"));
        List<Document> newList = Lists.newArrayList();
        for (Integer i = 0; i < uuidsNode.size(); i++) {
            Document uuidObject = new Document();
            uuidObject.put("uuid", uuidsNode.get(i).textValue());
            uuidObject.put("use", false);
            newList.add(uuidObject);
        }

        DBUtils.insertMany(QUuidList.collectionName, newList);
        MessageDto msg = new MessageDto();
        msg.setTitle(i18nService.getValue("Janus设备分配数通知", "janus.device_count", "system"));
        msg.setContent(i18nService.getValue("新增了设备分配数！", "add.device.count", "system"));
        messageService.send(msg);
    }

    /**
     * 将 Neptune 下发的密令 转发到Janus 的对应设备
     */
    public void pushAction(Document neptunePushObject, CheckMessage message) {
        String token = DocumentLib.getString(neptunePushObject, "token");
        if (token == null) {
            message.setSuccess(false);
            message.addMessage("token 不能为空");
            return;
        }

        ObjectNode pushDeviceObject = (ObjectNode) JsonLib.parseJSON(DocumentLib.getDocument(neptunePushObject, "data").toJson());
        pushDeviceObject.put("neptune", true);
        devicePushService.pushToDevice(pushDeviceObject);
        // 消息
        MessageDto msg = new MessageDto();
        msg.setTitle(i18nService.getValue("Neptune远程控制通知", "neptune.noty", "system"));
        StringBuffer buffer = new StringBuffer();
        buffer.append("Neptune远程控制设备");
        buffer.append("%s");
        buffer.append("，下发值为：");
        buffer.append("%s");
        msg.setContent(String.format(i18nService.getValue(buffer.toString(), "neptune.control.issue", "system"), JsonLib.getString(pushDeviceObject, "uuid"), pushDeviceObject.toString()));
        messageService.send(msg);
    }

    public void changeCompanyInfo(Document data) {
        String neptuneString = DocumentLib.getString(data, "neptuneInfo");
        Document neptuneInfo = Document.parse(neptuneString);
        Document janus = DocumentLib.newDoc();
        String company_name = DocumentLib.getString(neptuneInfo, "name");
        String company_email = DocumentLib.getString(neptuneInfo, "email");
        String company_mobile = DocumentLib.getString(neptuneInfo, "mobile");
        janus.put("company_name", company_name);
        janus.put("company_email", company_email);
        janus.put("company_mobile", company_mobile);
        DBUtils.updateOne(QJanus.collectionName, DocumentLib.newDoc(), DocumentLib.new$Set(janus));
    }

    public void syncDevice() {
        Document janus = DBUtils.find(QJanus.collectionName, null,
                DocumentLib.newDoc("name", 1)
                        .append("token", 1)
                        .append("licence", 1)
                        .append("company_id", 1)
                        .append("company_name", 1));

        Document deviceProjector = DocumentLib.newDoc();
        deviceProjector.put("uuid", 1);
        deviceProjector.put("baseInfo", 1);
        deviceProjector.put("group", 1);

        List<Document> deviceList = DBUtils.list(QDevice.collectionName, null, deviceProjector);

        Document sendData = DocumentLib.newDoc();
        Document dataObject = new Document();
        dataObject.put("janusInfo", janus);
        dataObject.put("deviceInfo", deviceList);
        sendData.put("data", dataObject);
        sendData.put("action", "syncDevice");
        sendData.put("token", QJanus.getToken());
        neptuneMQConnService.sendMessageToNeptune(sendData);
    }

    public void syncNeptuneCompanyInfo() {
        Document janus = DBUtils.find(QJanus.collectionName, null,
                DocumentLib.newDoc("name", 1)
                        .append("token", 1)
                        .append("licence", 1)
                        .append("company_id", 1)
                        .append("company_name", 1));

        Document sendData = DocumentLib.newDoc();
        Document dataObject = new Document();
        dataObject.put("janusInfo", janus);
        sendData.put("data", dataObject);
        sendData.put("action", "sync_neptune_info");
        sendData.put("token", QJanus.getToken());
        neptuneMQConnService.sendMessageToNeptune(sendData);
    }


}
