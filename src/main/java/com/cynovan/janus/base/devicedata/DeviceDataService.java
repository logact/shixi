package com.cynovan.janus.base.devicedata;

import com.cynovan.janus.base.connection.conns.activemq.ApiCallbackService;
import com.cynovan.janus.base.connection.conns.activemq.DeviceOnlineService;
import com.cynovan.janus.base.controlling.service.ControllingService;
import com.cynovan.janus.base.device.eventbus.DeviceDataPublisher;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.devicedata.jdo.QDeviceData;
import com.cynovan.janus.base.jms.SimpleWebsocketService;
import com.cynovan.janus.base.jms.WebSocketService;
import com.cynovan.janus.base.neptune.inter.AbstractPipelineProcess;
import com.cynovan.janus.base.neptune.inter.PipelineStream;
import com.cynovan.janus.base.neptune.mq.NeptuneMQConnService;
import com.cynovan.janus.base.utils.*;
import com.google.common.collect.Sets;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.RegExUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

@Service
public class DeviceDataService {

    private static Set<String> invalidKeys = Sets.newHashSet("action", "data", "uuid", "time", "history");

    private static final String TimeFormat = "yyyyMMddHHmmssSSS";

    @Autowired
    private WebSocketService webSocketService;

    @Autowired
    private NeptuneMQConnService neptuneMQConnService;

    @Autowired
    private SimpleWebsocketService simpleWebsocketService;

    @Autowired
    private ApiCallbackService apiCallbackService;

    @Autowired
    private DeviceOnlineService deviceOnlineService;

    @Autowired
    private List<AbstractPipelineProcess> dataProcessList;

    @Autowired
    private ControllingService controllingService;

    @Autowired
    private DeviceDataPublisher deviceDataPublisher;

    @PostConstruct
    public void onInit() {
        if (CollectionUtils.isNotEmpty(dataProcessList)) {
            dataProcessList.sort((a, b) -> {
                return a.getPipelineOrder().compareTo(b.getPipelineOrder());
            });
        }
    }

    public void onData(Document deviceData) {
        boolean callbackHandled = apiCallbackService.process(deviceData);
        if (callbackHandled == true) {
            return;
        }

        formatData(deviceData);

        processDataTime(deviceData);
        String uuid = DocumentLib.getString(deviceData, "uuid");

        if (StringLib.isNotEmpty(uuid)) {
            // uuid去掉空格,换行符,制表符等
            uuid = RegExUtils.replaceAll(uuid, "\\s*|\t|\r|\n", "");
            deviceData.put("uuid", uuid);

            deviceOnlineService.online(uuid);
            Document originalData = new Document(deviceData);

            PipelineStream pipelineStream = new PipelineStream();
            pipelineStream.setDeviceData(deviceData);

            String devicePreDataKey = StringLib.join(uuid, "@", "PRE_DATA");
            Document prevDocument = CacheUtils.getDocument(devicePreDataKey);

            /*要把Time remove掉md5*/
            Document cloneData = new Document(originalData);
            DocumentLib.remove(cloneData, "time");
            String currentMd5 = DigestLib.md5Hex(JsonLib.toString(cloneData));
            String prevMd5 = DocumentLib.getString(prevDocument, "md5");

            if (StringLib.equalsIgnoreCase(currentMd5, prevMd5) == true) {
                /*相等的话，不用解析，直接使用上一次数据*/
                DocumentLib.remove(prevDocument, "md5");
                deviceData = new Document(prevDocument);
            } else {
                if (CollectionUtils.isNotEmpty(dataProcessList)) {
                    for (int i = 0; i < dataProcessList.size(); i++) {
                        AbstractPipelineProcess process = dataProcessList.get(i);
                        try {
                            process.process(pipelineStream);
                        } catch (Exception e) {
                            /*某一个process有Exception不影响整体的运行*/
                        }
                    }
                }
                Document cacheDocument = new Document(pipelineStream.getDeviceData());
                cacheDocument.put("md5", currentMd5);
                CacheUtils.set(devicePreDataKey, cacheDocument);
            }

            boolean history = DocumentLib.getBoolean(deviceData, "history");
            if (history == true) {
                pipelineStream.setShouldToWebsocket(false);
            }

            if (pipelineStream.isShouldToWebsocket()) {
                String ws = "deviceData/" + uuid;
                String jsonStr = JsonLib.toJSON(deviceData).toString();
                webSocketService.pushMessage(ws, jsonStr);
                simpleWebsocketService.pushMessage(ws, jsonStr);
            }

            if (pipelineStream.isShouldToMongoDB()) {
                DBUtils.save(QDeviceData.collectionName, deviceData);
            }

            if (pipelineStream.isShouldToNeptune()) {
                neptuneMQConnService.sendDeviceMessageToNeptune(deviceData);
            }

            controllingService.onData(uuid);
            deviceDataPublisher.publish(uuid, originalData, deviceData);
        }
    }

    private void processDataTime(Document objectData) {
        if (objectData != null) {
            Date date = null;
            Object value = objectData.get("time");
            if (value != null) {
                if (value instanceof Date) {
                    date = (Date) value;
                }
                if (value instanceof String) {
                    try {
                        date = DateUtils.parseDate(StringLib.toString(value), TimeFormat);
                    } catch (Exception e) {
                        try {
                            long unixMillis = StringLib.toLong(value);
                            if (unixMillis > 0) {
                                date = new Date(unixMillis);
                            }
                        } catch (NumberFormatException ex) {

                        }
                    }
                }
            }
            if (date == null) {
                date = new Date();
            }
            objectData.put("time", date);
        }
    }

    /**
     * 转换数据格式 (task 1010)
     * {
     * "uuid": "aricchen",
     * "key1": "data",
     * "key2": "data"
     * }
     * 我们需要在MQTT中，默认处理转换为系统的格式。
     * {
     * "uuid": "aricchen",
     * "data":{
     * "key1":"data",
     * "key2":"data"
     * }
     * }
     */
    private void formatData(Document objectData) {
        Set<String> dataKeys = objectData.keySet();
        Document targetData = DocumentLib.getDocument(objectData, "data");
        Iterator<String> iterator = dataKeys.iterator();
        Set<String> removeKeys = Sets.newHashSet();
        while (iterator.hasNext()) {
            String valueKey = iterator.next();
            if (!invalidKeys.contains(valueKey)) {
                Object value = objectData.get(valueKey);
                targetData.put(valueKey, value);
                removeKeys.add(valueKey);
            }
        }
        for (String key : removeKeys) {
            objectData.remove(key);
        }
        objectData.put("data", targetData);
    }

    public Document loadDeviceLatestData(String uuid) {
        /*find in cache*/
        Document lastData = CacheUtils.getDocument("dynamic_" + uuid);
        if (lastData == null) {
            Document device = DBUtils.find(QDevice.collectionName, DocumentLib.newDoc("uuid", uuid),
                    DocumentLib.newDoc("dynamicData", 1));
            if (device == null) {
                return null;
            }
            Document dynamicData = DocumentLib.getDocument(device, "dynamicData");
            CacheUtils.set("dynamic_" + uuid, dynamicData);
            return dynamicData;
        }
        return lastData;
    }
}
