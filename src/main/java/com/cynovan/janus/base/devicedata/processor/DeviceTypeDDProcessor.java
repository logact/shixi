package com.cynovan.janus.base.devicedata.processor;

import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.neptune.inter.AbstractPipelineProcess;
import com.cynovan.janus.base.neptune.inter.PipelineStream;
import com.cynovan.janus.base.utils.*;
import com.google.common.collect.Lists;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeviceTypeDDProcessor extends AbstractPipelineProcess {

    public void process(PipelineStream pipelineStream) {
        Document objectData = pipelineStream.getDeviceData();
        String uuid = DocumentLib.getString(objectData, "uuid");
        if (StringLib.isEmpty(uuid)) {
            return;
        }

        Document data = DocumentLib.getDocument(objectData, "data");
        List<Document> dataStrucList = getDeviceDataStruc(uuid);
        if (CollectionUtils.isNotEmpty(dataStrucList)) {
            // 遍历数据定义列表
            for (int i = 0; i < dataStrucList.size(); i++) {
                Document strcObject = dataStrucList.get(i);
                String key = DocumentLib.getString(strcObject, "key");
                if (StringLib.isNotEmpty(key)) {
                    if (data.containsKey(key)) {
                        Object itemValue = data.get(key);
                        if (itemValue != null) {
                            Object parseValue = null;
                            String rule = DocumentLib.getString(strcObject, "rule");
                            if (StringLib.equals(rule, "boo")) {
                                String strValue = StringLib.lowerCase(StringLib.toString(itemValue));
                                if (StringLib.equalsAnyIgnoreCase(strValue, "false", "0", "")) {
                                    parseValue = false;
                                } else {
                                    parseValue = true;
                                }
                            } else if (StringLib.equals(rule, "number")) {
                                int decimal = 2;
                                if (strcObject.containsKey("decimal")) {
                                    decimal = DocumentLib.getInt(strcObject, "decimal");
                                }
                                String strValue = StringLib.toString(itemValue);
                                int idx = StringLib.indexOf(strValue, "-", 1);
                                if (idx > 0) {
                                    strValue = StringLib.substring(strValue, 0, idx);
                                }
                                int pointIdx = StringLib.indexOf(strValue, ".");
                                if (pointIdx > 0) {
                                    int point2Idx = StringLib.indexOf(strValue, ".", pointIdx + 1);
                                    if (point2Idx > 0) {
                                        strValue = StringLib.substring(strValue, 0, point2Idx);
                                    }
                                }
                                parseValue = NumberLib.formatDouble(StringLib.toDouble(strValue), decimal);
                            } else if (StringLib.equals(rule, "enum")) {
                                parseValue = StringLib.toString(itemValue);
                                List<Document> valuesList = DocumentLib.getList(strcObject, "values");
                                String parseStrValue = StringLib.toString(parseValue);
                                if (CollectionUtils.isNotEmpty(valuesList)) {
                                    for (int j = 0; j < valuesList.size(); j++) {
                                        Document valueNode = valuesList.get(j);
                                        String valueNodeValue = DocumentLib.getString(valueNode, "value");
                                        if (StringLib.equals(valueNodeValue, parseStrValue)) {
                                            String valueNodeDesc = DocumentLib.getString(valueNode, "desc");
                                            parseValue = valueNodeDesc;
                                            break;
                                        }
                                    }
                                }
                            } else {
                                parseValue = StringLib.toString(itemValue);
                            }
                            data.put(key, parseValue);
                        } else {
                            data.put(key, "");
                        }
                    }
                }
            }
        }
    }

    private List<Document> getDeviceDataStruc(String uuid) {
        String cacheKey = StringLib.join("classification_datastruc_", uuid);
        String cacheValue = CacheUtils.getString(cacheKey);
        List<Document> dataStrucList = Lists.newArrayList();
        if (StringLib.isNotEmpty(cacheValue)) {
            dataStrucList = JsonLib.parseArray(cacheValue, Document.class);
        }
        if (StringLib.isEmpty(cacheValue)) {
            dataStrucList = Lists.newArrayList();
            Document device = DBUtils.find(QDevice.collectionName, Filters.eq("uuid", uuid),
                    Projections.include("classification"));
            if (device != null) {
                String clasCode = DocumentLib.getString(device, "classification.classificationCode");
                if (StringLib.isNotEmpty(clasCode)) {
                    Document classification = DBUtils.find("deviceClassification",
                            DocumentLib.newDoc("code", clasCode),
                            Projections.include("data_definition"));
                    if (classification != null) {
                        dataStrucList = DocumentLib.getList(classification, "data_definition.details");
                    }
                }
            }
            CacheUtils.set(cacheKey, JsonLib.toString(dataStrucList));
        }
        return dataStrucList;
    }
}
