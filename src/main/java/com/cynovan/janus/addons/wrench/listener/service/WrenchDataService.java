package com.cynovan.janus.addons.wrench.listener.service;

import com.cynovan.janus.addons.wrench.jdo.QWrenchRequestLog;
import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.device.push.DevicePushService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Maps;
import com.google.common.collect.Multimap;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.IntStream;

@Service
public class WrenchDataService {

    @Autowired
    private DevicePushService devicePushService;

    public void process(DeviceDataEvent deviceDataEvent) {
        Document deviceData = deviceDataEvent.getToDbData();
        Document dataObject = DocumentLib.getDocument(deviceData, "data");
        String fieldPage = DocumentLib.getString(dataObject, "page");
        String fieldCount = DocumentLib.getString(dataObject, "count");
        /*没有该参数，代表此设备不是一个扭力扳手，直接退出*/
        if (StringLib.isEmpty(fieldPage) || StringLib.isEmpty(fieldCount)) {
            return;
        }

        if (!StringLib.contains(fieldPage, "|")) {
            return;
        }

        String fieldPageArr[] = StringLib.split(fieldPage, "|");
        String fieldCountArr[] = StringLib.split(fieldCount, "|");

        String uuid = DocumentLib.getString(deviceData, "uuid");

        int currentPage = StringLib.toInteger(fieldPageArr[0]);
        int totalPage = StringLib.toInteger(fieldPageArr[1]);

        int currentCount = StringLib.toInteger(fieldCountArr[0]);
        int totalCount = StringLib.toInteger(fieldCountArr[1]);

        boolean isLastData = (currentPage == totalPage) && (currentCount == totalCount);
        /*不是最后一页数据的时候，直接退回*/
        if (isLastData == false) {
            return;
        }

        Document cloneDataObject = DocumentLib.copy(dataObject);
        if (totalPage != 0 && totalCount != 0) {
            if (!cloneDataObject.isEmpty()) {
                int maxIdx = totalCount + 1;
                while (maxIdx < 20000) {
                    String idxField = StringLib.toString(maxIdx);
                    if (cloneDataObject.containsKey(idxField)) {
                        cloneDataObject.remove(idxField);
                        maxIdx++;
                    } else {
                        break;
                    }
                }

                /*列转行，把电流电压的组合数据修改为一个列*/
                Multimap<String, String> listMap = ArrayListMultimap.create();
                IntStream.range(1, maxIdx).forEach(idx -> {
                    String idxField = StringLib.toString(idx);
                    if (cloneDataObject.containsKey(idxField)) {
                        String fieldValue = DocumentLib.getString(cloneDataObject, idxField);
                        if (StringLib.isNotEmpty(fieldValue) && StringLib.contains(fieldValue, ";")) {
                            String fieldValueArr[] = StringLib.split(fieldValue, ";");
                            for (int i = 0; i < fieldValueArr.length; i++) {
                                String valueItem = fieldValueArr[i];
                                String valueKey = StringLib.join("key", i + 1);
                                listMap.put(valueKey, valueItem);
                            }
                        }
                        cloneDataObject.remove(idxField);
                    }
                });

                Set<String> keys = listMap.keySet();
                for (String key : keys) {
                    cloneDataObject.put(key, listMap.get(key));
                }
            }
        }
        /*call python 程序*/
        /*加载设备信息，拼接参数信息*/
        Document device = DBUtils.find(QDevice.collectionName, DocumentLib.newDoc("uuid", uuid));
        String url = DocumentLib.getString(device, "wrench.remote_url");
        if (StringLib.isNotEmpty(url)) {
            /*基材,螺丝，配置等信息的append*/

            String screw_id = DocumentLib.getString(device, "wrench.screw_id");
            appendScrew(cloneDataObject, screw_id);

            String material_id = DocumentLib.getString(device, "wrench.material_id");
            appendMaterial(cloneDataObject, material_id);

            int testNumber = calcTestnumber(device, material_id, screw_id);
            cloneDataObject.put("testNumber", testNumber);

            List items = DocumentLib.getList(DocumentLib.getDocument(device, "wrench"), "items");
            if (items != null && items.size() > 0) {
                items.stream().forEach(item -> {
                    Document itemObj = (Document) item;
                    String itemKey = DocumentLib.getString(itemObj, "key");
                    Object itemValue = itemObj.get("value");
                    cloneDataObject.put(itemKey, itemValue);
                });
            }
            Document wrenchRequestLog = DocumentLib.newDoc();
            wrenchRequestLog.put("uuid", uuid);
            wrenchRequestLog.put("create_date", new Date());

            String requestData = cloneDataObject.toJson();
            Map<String, String> params = Maps.newHashMap();
            params.put("data", requestData);
            wrenchRequestLog.put("request_data", requestData);
            wrenchRequestLog.put("url", url);

            String returnString = HttpLib.postReturnString(url, params);
            wrenchRequestLog.put("response", returnString);
            ObjectNode returnNode = null;
            try {
                returnNode = (ObjectNode) JsonLib.parseJSON(returnString);
            } catch (Exception e) {
                wrenchRequestLog.put("msg", "获得数据失败,返回数据不是JSON格式");
                wrenchRequestLog.put("state", "error");
            }

            if (returnNode != null) {
                String type = JsonLib.getString(returnNode, "Type");
                if (StringLib.equals(type, "success")) {
                    wrenchRequestLog.put("msg", "优化程序返回结果显示为成功");
                    wrenchRequestLog.put("state", "success");

                    ObjectNode pushData = JsonLib.createObjNode();
                    pushData.put("action", "update");
                    pushData.put("uuid", uuid);

                    Iterator<String> paramFieldNames = returnNode.fieldNames();
                    while (paramFieldNames.hasNext()) {
                        String fieldName = paramFieldNames.next();
                        dataObject.put(fieldName, returnNode.get(fieldName));
                    }

                    ObjectNode pushDataValues = returnNode.deepCopy();
                    pushDataValues.put("type", "canbus");
                    pushDataValues.put("datatype", "wrench");
                    pushDataValues.put("command", "PutCraftPara");
                    pushData.set("data", pushDataValues);
                    devicePushService.pushToDevice(pushData);
                } else {
                    wrenchRequestLog.put("msg", "优化程序返回结果显示为失败");
                    wrenchRequestLog.put("state", "error");
                }
            }
            DBUtils.save(QWrenchRequestLog.collectionName, wrenchRequestLog);
        }
    }

    private static Map<String, String> screwParamMap = Maps.newHashMap();
    private static Map<String, String> materialParamMap = Maps.newHashMap();

    static {
        screwParamMap.put("code", "ScrewNumber");
        screwParamMap.put("name", "ScrewName");
        screwParamMap.put("standard", "ScrewStandard");
        screwParamMap.put("size", "ScrewSize");
        screwParamMap.put("length", "ScrewLength");
        screwParamMap.put("pitch", "ScrewPitch");
        screwParamMap.put("material", "ScrewMaterial");
        screwParamMap.put("torque", "ScrewTorque");

        materialParamMap.put("code", "MaterialNumber");
        materialParamMap.put("name", "MaterialName");
        materialParamMap.put("PoissonRatio", "PoissonRatio");
        materialParamMap.put("ShearModulus", "ShearModulus");
        materialParamMap.put("YieldStrength", "YieldStrength");
        materialParamMap.put("SpecificHeat", "SpecificHeat");
        materialParamMap.put("ElasticModulus", "ElasticModulus");
        materialParamMap.put("MassDensity", "MassDensity");
        materialParamMap.put("TensionStrength", "TensionStrength");
        materialParamMap.put("ThermalExpansionCoefficient", "ThermalExpansionCoefficient");
        materialParamMap.put("ThermalConductivity", "ThermalConductivity");
    }

    private void appendScrew(Document params, String screwId) {
        if (StringLib.isNotEmpty(screwId)) {
            Document screw = DBUtils.findByID("wrench_screw", screwId);
            if (screw != null) {
                screwParamMap.forEach((key, value) -> {
                    params.put(value, screw.get(key));
                });
            }
        }
    }

    private void appendMaterial(Document params, String materialId) {
        if (StringLib.isNotEmpty(materialId)) {
            Document material = DBUtils.findByID("wrench_material", materialId);
            if (material != null) {
                materialParamMap.forEach((key, value) -> {
                    params.put(value, material.get(key));
                });
            }
        }
    }

    private Integer calcTestnumber(Document device, String materialId, String screwId) {
        String uuid = DocumentLib.getString(device, "uuid");
        String hashKey = DigestLib.md5Hex(StringLib.join(uuid, StringLib.SPLIT_1, materialId, screwId));
        String valueKey = StringLib.join("testnumber.", hashKey);
        int testNumber = DocumentLib.getInt(DocumentLib.getDocument(device, "wrench"), valueKey);
        if (testNumber <= 0) {
            testNumber = 0;
        }
        testNumber++;
        DBUtils.updateOne(QDevice.collectionName, DocumentLib.newDoc("uuid", uuid), DocumentLib.new$Set("wrench." + valueKey, testNumber));
        return testNumber;
    }
}
