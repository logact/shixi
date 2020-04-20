package com.cynovan.janus.addons.data_monitor.listener;

import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.utils.JavaScriptUtils;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.service.changed.JanusChangeCheckService;
import com.cynovan.janus.base.utils.*;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Aric.chen 数据监控器的数据处理逻辑
 */

@Component
public class DataMonitorProcessService {

    @Autowired
    private JanusChangeCheckService janusChangeCheckService;

    public void process(DeviceDataEvent deviceDataEvent) {
        Document objectData = deviceDataEvent.getToDbData();
        Document messageData = DocumentLib.getDocument(objectData, "data");
        String uuid = DocumentLib.getString(objectData, "uuid");
        if (StringLib.isNotEmpty(uuid)) {
            List<Document> monitorList = getDeviceMonitorList(uuid);
            if (CollectionUtils.isNotEmpty(monitorList)) {
                for (int i = 0; i < monitorList.size(); i++) {
                    Document monitor = monitorList.get(i);
                    String monitorId = DocumentLib.getID(monitor);
                    /*检查是否被触发*/
                    boolean monitorTriggered = isMonitorTriggered(monitor, messageData);

                    /*检查触发的状态是否一直是触发的*/
                    String flagKey = DigestLib.md5Hex(StringLib.join(monitorId, StringLib.SPLIT_1, uuid));
                    Pair<Boolean, Integer> pair = janusChangeCheckService.check(flagKey, monitorTriggered);
                    if (monitorTriggered == true && pair.getLeft()) {
                        sendMessage(monitor, uuid);
                    }
                }
            }
        }
    }

    @Autowired
    private MessageService messageService;

    private void sendMessage(Document monitor, String uuid) {
        String deviceName = QDevice.getDeviceName(uuid);
        String monitorName = DocumentLib.getString(monitor, "name");
        deviceName = StringLib.join(deviceName, "(", uuid, ")");
        String title = StringLib.join("设备", deviceName, "触发数据监控(", monitorName, ") ");
        MessageDto messageDto = new MessageDto();
        messageDto.setTitle(title);

        StringBuilder content = new StringBuilder();
        content.append(title);
        content.append("<br/>");
        content.append("设备 : " + deviceName);
        content.append("<br/>");
        content.append("数据监控 : " + monitorName);
        content.append("<br/>");
        content.append("数据监控标签 : " + DocumentLib.getString(monitor, "tag"));
        content.append("<br/>");

        messageDto.setContent(content.toString());
        messageDto.setUuid(uuid);
        messageDto.setType("DataMonitor");
        messageDto.addParam("数据监控", monitorName);
        messageDto.addParam("触发设备", deviceName);
        String tag = DocumentLib.getString(monitor, "tag");
        if (StringLib.isNotEmpty(tag)) {
            messageDto.addParam("监控标签", tag);
        }
        messageService.send(messageDto);
    }

    private boolean isMonitorTriggered(Document monitor, Document messageData) {
        Map<String, Document> parameters = Maps.newHashMap();
        parameters.put("$data$", messageData);
        String express = DocumentLib.getString(monitor, "express");

        return JavaScriptUtils.runGetBoolean(express, parameters);
    }

    public List<Document> getDeviceMonitorList(String uuid) {
        /*检查缓存中是否有*/
        String cacheKey = StringLib.join("DEVICE_MONITOR_List_", uuid);
        List<Document> cacheMonitorList = JsonLib.parseArray(CacheUtils.get(cacheKey), Document.class);
        if (cacheMonitorList != null) {
            return cacheMonitorList;
        } else {
            Document device = DBUtils.find(QDevice.collectionName, DocumentLib.newDoc("uuid", uuid), DocumentLib.newDoc("team", 1));
            String teamCode = DocumentLib.getString(device, "team.code");

            Document monitorQuery = DocumentLib.newDoc();
            List<Document> orQueryArr = Lists.newArrayList();
            /*所有设备适用*/
            orQueryArr.add(DocumentLib.newDoc("adapt", "3"));
            /*指定团队*/
            orQueryArr.add(DocumentLib.newDoc("adapt", "2").append("relatedTeam", teamCode));
            /*指定设备*/
            orQueryArr.add(DocumentLib.newDoc("adapt", "1").append("relatedDevice", uuid));
            monitorQuery.put("$or", orQueryArr);

            List<Document> monitorList = DBUtils.list("dataMonitor", monitorQuery);
            CacheUtils.set(cacheKey, JsonLib.toString(monitorList));
            return monitorList;
        }
    }
}
