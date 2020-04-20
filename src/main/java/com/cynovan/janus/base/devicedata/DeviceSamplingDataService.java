package com.cynovan.janus.base.devicedata;

import com.cynovan.janus.base.device.service.DeviceService;
import com.cynovan.janus.base.devicedata.jdo.QDeviceSampling;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.*;
import org.apache.commons.lang3.tuple.MutablePair;
import org.apache.commons.lang3.tuple.Pair;
import org.bson.Document;
import org.joda.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Component
public class DeviceSamplingDataService {

    @Autowired
    private DeviceService deviceService;

    public void onSampling(Document samplingData) {
        String uuid = DocumentLib.getString(samplingData, "uuid");
        if (StringLib.isEmpty(uuid)) {
            return;
        }
        Document messageData = DocumentLib.getDocument(samplingData, "data");
        /*取出特定的栏位*/
        Object time_start = messageData.get("time_start");
        Date timeStartDate = deviceService.processDataTime(time_start);

        LocalDateTime timeStartDateTime = LocalDateTime.fromDateFields(timeStartDate);

        int interval = DocumentLib.getInt(messageData, "interval");

        Table<String, Integer, String> fieldDataTable = HashBasedTable.create();

        Set<String> dataKeys = messageData.keySet();
        if (dataKeys != null && dataKeys.size() > 0) {
            dataKeys.stream().forEach(fieldName -> {
                Pair<Integer, String> pair = getCombinationField(fieldName);
                if (pair.getLeft() != null) {
                    fieldDataTable.put(pair.getRight(), pair.getLeft(), DocumentLib.getString(messageData, fieldName));
                }
            });

            /*解析数据格式为Array*/
            Multimap<String, String> fieldMultimap = ArrayListMultimap.create();
            Set<String> rowKeys = fieldDataTable.rowKeySet();
            rowKeys.stream().forEach(rowKey -> {
                Map<Integer, String> colMap = fieldDataTable.row(rowKey);
                List<Integer> sortColList = Lists.newArrayList(colMap.keySet());
                sortColList.sort((o1, o2) -> {
                    return o1.compareTo(o2);
                });
                List<String> valueList = Lists.newArrayList();
                sortColList.stream().forEach(colKey -> {
                    String value = fieldDataTable.get(rowKey, colKey);
                    if (StringLib.isNotEmpty(value)) {
                        valueList.add(value);
                    }
                });

                String fieldValue = StringLib.join(valueList, "");
                if (StringLib.isNotEmpty(fieldValue)) {
                    List<String> fieldValueList = Arrays.asList(StringLib.split(fieldValue, "#"));
                    fieldValueList = fieldValueList.stream().filter(item -> {
                        return StringLib.isNotEmpty(item);
                    }).collect(Collectors.toList());
                    fieldMultimap.putAll(rowKey, fieldValueList);
                }
            });

            /*转换格式到每一行数据*/
            Set<String> fieldKeys = fieldMultimap.keySet();
            AtomicInteger maxSize = new AtomicInteger(0);
            fieldKeys.stream().forEach(field -> {
                int size = fieldMultimap.get(field).size();
                int maxValue = Math.max(maxSize.get(), size);
                maxSize.set(maxValue);
            });

            List<Document> dataList = Lists.newArrayList();
            int maxLoopTimes = maxSize.get();

            Document deviceData = DocumentLib.newDoc();
            deviceData.put("uuid", uuid);
            deviceData.put("time", deviceService.processDataTime(deviceData.get("time")));
            deviceData.put("create_date", new Date());
            deviceData.put("action", "sampling");
            for (int i = 0; i < maxLoopTimes; i++) {
                Document dataItem = DocumentLib.newDoc();
                dataItem.put("index", i);
                for (String fieldKey : fieldKeys) {
                    List<String> valueList = (List<String>) fieldMultimap.get(fieldKey);
                    if (i < maxLoopTimes) {
                        dataItem.put(fieldKey, valueList.get(i));
                    } else {
                        dataItem.put(fieldKey, "");
                    }
                }
                dataItem.put("time", timeStartDateTime.toDate());
                timeStartDateTime = timeStartDateTime.plusMillis(interval);
                dataList.add(dataItem);
            }
            deviceData.put("data", dataList);

            DBUtils.save(QDeviceSampling.collectionName, deviceData);
        }
    }

    private MutablePair<Integer, String> getCombinationField(String fieldName) {
        MutablePair<Integer, String> pair = new MutablePair<Integer, String>();
        if (StringLib.contains(fieldName, "_")) {
            int lastIdx = StringLib.lastIndexOf(fieldName, "_");
            if (lastIdx != -1) {
                String combinationIdx = StringLib.substring(fieldName, lastIdx + 1);
                if (StringLib.isNumeric(combinationIdx)) {
                    int comIdx = StringLib.toInteger(combinationIdx);
                    if (comIdx > -1) {
                        pair.setLeft(comIdx);
                        pair.setRight(StringLib.substring(fieldName, 0, lastIdx));
                    }
                }
            }
        }
        return pair;
    }
}
