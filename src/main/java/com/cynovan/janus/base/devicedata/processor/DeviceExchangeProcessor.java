package com.cynovan.janus.base.devicedata.processor;

import com.cynovan.janus.base.device.jdo.QDataExchange;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.device.jdo.QDeviceClassification;
import com.cynovan.janus.base.utils.JavaScriptUtils;
import com.cynovan.janus.base.neptune.inter.AbstractPipelineProcess;
import com.cynovan.janus.base.neptune.inter.PipelineStream;
import com.cynovan.janus.base.utils.*;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import org.bson.Document;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
public class DeviceExchangeProcessor extends AbstractPipelineProcess {

    @Override
    public void process(PipelineStream pipelineStream) {
        Document deviceData = pipelineStream.getDeviceData();
        Document messageData = DocumentLib.getDocument(deviceData, "data");

        String uuid = DocumentLib.getString(deviceData, "uuid");
        if (StringLib.isNotEmpty(uuid)) {
            String classCode = getDeviceClassificationExchangeCode(uuid);
            if (StringLib.isNotEmpty(classCode)) {
                messageData = runScript(messageData, classCode);
            }

            String code = getDeviceDataExchangeCode(uuid);
            if (StringLib.isNotEmpty(code)) {
                messageData = runScript(messageData, code);
            }
        }
        deviceData.put("data", messageData);
        processNanValue(messageData);
    }

    private Document runScript(Document messageData, String code) {
        Map<String, Document> param = Maps.newHashMap();
        param.put("data", messageData);
        messageData = JavaScriptUtils.runGetDocument(code, param);
        return messageData;
    }

    private void processNanValue(Document messageData) {
        if (messageData != null) {
            Set<String> keySet = Sets.newHashSet(messageData.keySet());
            keySet.stream().forEach(fieldName -> {
                Object value = messageData.get(fieldName);
                if (value instanceof Number) {
                    Double doubleValue = StringLib.toDouble(value);
                    if (doubleValue.isNaN()) {
                        messageData.put(fieldName, "0");
                    }
                }
            });
        }
    }

    private String getDeviceClassificationExchangeCode(String uuid) {
        String cacheKey = StringLib.join("DEVICE_CLASS_EXCHANGE_", uuid);
        Document exchangeDoc = CacheUtils.getDocument(cacheKey);
        if (exchangeDoc == null) {
            /*获取设备对应的Exchange*/
            Document device = DBUtils.find(QDevice.collectionName,
                    Filters.eq("uuid", uuid),
                    Projections.include("classification"));
            String classificationCode =
                    DocumentLib.getString(device, "classification.classificationCode");
            if (StringLib.isNotEmpty(classificationCode)) {
                Document classification = DBUtils.find(QDeviceClassification.collectionName,
                        Filters.eq("code", classificationCode),
                        Projections.include("exchange"));
                if (classification != null) {
                    boolean open = DocumentLib.getBoolean(classification, "exchange.open");
                    if (open == true) {
                        exchangeDoc = DocumentLib.getDocument(classification, "exchange");
                    }
                }
            }
            if (exchangeDoc == null) {
                exchangeDoc = new Document();
            }
            CacheUtils.set(cacheKey, exchangeDoc);
        }
        return DocumentLib.getString(exchangeDoc, "code");
    }

    private String getDeviceDataExchangeCode(String uuid) {
        String cacheKey = StringLib.join("EXCHANGE_" + uuid);
        Document cacheDocument = CacheUtils.getDocument(cacheKey);
        Document deviceExchange = null;
        if (cacheDocument == null) {
            Document dataExchange = DBUtils.find(QDataExchange.collectionName,
                    DocumentLib.newDoc("uuid", uuid).append("open", true),
                    DocumentLib.newDoc("code", 1));
            if (dataExchange != null) {
                deviceExchange = dataExchange;
            } else {
                deviceExchange = DocumentLib.newDoc();
            }
            CacheUtils.set(cacheKey, deviceExchange);
        } else {
            deviceExchange = cacheDocument;
        }

        if (deviceExchange != null) {
            return DocumentLib.getString(deviceExchange, "code");
        }

        return null;
    }

    @Override
    public Integer getPipelineOrder() {
        return ORDER_EXCHANGE;
    }
}
