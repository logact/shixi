package com.cynovan.janus.addons.prototype.backend;

import com.cynovan.janus.addons.triton.view.backend.jdo.QDeviceView;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.gridfs.service.FileStorageService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping(value = "monitor_developer")
public class MonitorDeveloperWeb {

    @Autowired
    private FileStorageService fileStorageService;

    @RequestMapping(value = "")
    public String toStudioIndex(HttpServletRequest request, Model model) {
        
        model.addAllAttributes(HttpLib.pageAttributes(request));
        return "prototype/monitor/prototype";
    }

    @RequestMapping(value = "preview")
    public String preview(HttpServletRequest request, Model model) {
        model.addAllAttributes(HttpLib.pageAttributes(request));
        return "prototype/monitor/prototype_preview";
    }

    @PostMapping(value = "saveDevicePlaceholders")
    @ResponseBody
    public String saveDevicePlaceHolders(@RequestParam String id, @RequestParam String placeholders) {
        placeholders = StringLib.decodeURI(placeholders);
        List<Document> placeholderList = JsonLib.parseArray(placeholders, Document.class);
        DBUtils.updateOne(QDeviceView.collectionName, Filters.eq("id", id),
                DocumentLib.new$Set("placeholders", placeholderList));
        return CheckMessage.newInstance().toString();
    }

    @GetMapping(value = "getDevicePlaceholders")
    @ResponseBody
    public String loadDevicePlaceholders(@RequestParam String id) {
        Document view = DBUtils.find(QDeviceView.collectionName, Filters.eq("id", id), Projections.include("placeholders"));
        List<Document> placeholders = DocumentLib.getList(view, "placeholders");
        CheckMessage checkMessage = CheckMessage.newInstance();
        checkMessage.addData("placeholders", placeholders);
        return checkMessage.toString();
    }

    @GetMapping(value = "loadDevicePoi")
    @ResponseBody
    public String loadDevicePoi(@RequestParam String clsCodes) {
        String[] clsCodeArray = clsCodes.split(",");
        List<Document> list = DBUtils.list(QDevice.collectionName, Filters.in("classification.classificationCode", clsCodeArray), Projections.include(Lists.newArrayList("uuid", "online", "poi", "baseInfo.name")));
        Map<String, Document> resultMap = new HashMap<>();
        for (Document item : list) {
            resultMap.put(DocumentLib.getString(item, "uuid"), item);
        }

        CheckMessage checkMessage = CheckMessage.newInstance();
        checkMessage.addData("poiMap", resultMap);
        return checkMessage.toString();
    }

    @ResponseBody
    @GetMapping(value = "loadMonitor")
    public String loadMonitorXml(@RequestParam String id) {
        ObjectNode data = JsonLib.createObjNode();
        Document view = DBUtils.findByID(QDeviceView.collectionName, id);
        String xml = DocumentLib.getString(view, "xml");
        if (StringLib.isEmpty(xml)) {
            xml = "<mxfile host=\"www.neptune-iiot.net\" modified=\"2019-11-13T08:28:49.245Z\" agent=\"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36\" etag=\"XYePoMK70gipPVLqn110\" version=\"12.2.4\" type=\"device\" pages=\"1\"><diagram id=\"Tfa6pH4gMQtoZwrT1CMw\" name=\"第1页\">ddHNEoIgEADgp+Gu0KSdzerSyUNnRjZhBl0GabSePh0wY6wTy7cLyw9hRTueLTfyigI0oYkYCTsSStNdkk/DLE8vGUs9NFaJULRCpV4QMAn6UAL6qNAhaqdMjDV2HdQuMm4tDnHZHXXc1fAGNlDVXG/1poSTXnOarX4B1cilc7o/+EzLl+Jwk15ygcMXsZKwwiI6H7VjAXp+vOVd/LrTn+znYBY692PBFKx7T5Poh1j5Bg==</diagram></mxfile>";
        }
        data.put("xml", xml);
        data.put("name", DocumentLib.getString(view, "name"));
        return data.toString();
    }

    @ResponseBody
    @PostMapping(value = "saveMonitor")
    public String saveMonitorXml(@RequestParam String xml, @RequestParam String id) {
        xml = StringLib.decodeURI(xml);
        ObjectNode result = JsonLib.createObjNode();
        DBUtils.updateOne(QDeviceView.collectionName, Filters.eq("id", id),
                DocumentLib.new$Set("xml", xml));
        return result.toString();
    }

    @ResponseBody
    @GetMapping(value = "loadDevices")
    public String loadDevices() {
        CheckMessage checkMessage = CheckMessage.newInstance();
        // 设备分类
        Document projector = DocumentLib.newDoc();
        projector.put("id", 1);
        projector.put("name", 1);
        projector.put("code", 1);
        //appId:去除导入的设备视图所添加的分类
        List<Document> classificationList = DBUtils.list("deviceClassification", Filters.eq("appId", null), projector);
        // 设备列表
        List<Document> deviceList = DBUtils.list(QDevice.collectionName, null, Projections.include("uuid", "baseInfo.name", "classification"));
        ObjectNode deviceClsMap = JsonLib.createObjNode();
        // 创建device cls map
        classificationList.forEach(cls -> {
            ArrayNode devices = JsonLib.createArrNode();
            //String clsId = DocumentLib.getString(cls, "id");
            String clsCode = DocumentLib.getString(cls, "code");
            deviceList.forEach(device -> {
                // String device_clsId = DocumentLib.getString(device, "classification.classificationId");
                String device_clsCode = DocumentLib.getString(device, "classification.classificationCode");
                if (StringLib.equals(clsCode, device_clsCode)) {
                    JsonNode d = JsonLib.parseJSON(device.toJson());
                    devices.add(d);
                }
            });
            deviceClsMap.set(clsCode, devices);
        });
        checkMessage.addData("clsList", JsonLib.toJSON(classificationList));
        checkMessage.addData("deviceClsMap", deviceClsMap);
        return checkMessage.toString();
    }

    @ResponseBody
    @GetMapping(value = "loadClsDDList")
    public String loadClsDDList(@RequestParam String clsCode) {
        CheckMessage checkMessage = CheckMessage.newInstance();

        if (StringLib.equalsAny(clsCode, "", null)) {
            List<Document> clsDDList = new ArrayList<>();
            checkMessage.addData("list", JsonLib.toJSON(clsDDList));
            return checkMessage.toString();
        }
        Document clsDDList = DBUtils.find("deviceClassification", Filters.eq("code", clsCode));
        checkMessage.addData("list", JsonLib.toJSON(clsDDList));
        return checkMessage.toString();
    }

    public ArrayNode getStaticColumns() {
        String[] names = new String[]{"设备UUID", "设备名称", "在线状态", "设备状态", "设备描述"};
        String[] keys = new String[]{"uuid", "baseInfo.name", "online", "state", "baseInfo.remarks"};
        ArrayNode static_keys = JsonLib.createArrNode();
        for (int i = 0; i < names.length; i++) {
            ObjectNode item = JsonLib.createObjNode();
            item.put("name", names[i]);
            item.put("key", keys[i]);
            item.put("iconSkin", "iconSkin1");
            item.put("deviceDataType", "static");
            static_keys.add(item);
        }
        return static_keys;
    }

    public ArrayNode getEfficiencyColumns() {
        ArrayNode static_keys = JsonLib.createArrNode();
        String[] names = new String[]{"今日报警时间(秒)", "今日警告时间(秒)", "今日正常时间(秒)", "今日在线总时长(秒)", "今日时间效率(百分比)"};
        String[] keys = new String[]{"today_error_duration", "today_warning_duration", "today_ok_duration", "today_online_duration", "today_time_oee"};
        for (int i = 0; i < names.length; i++) {
            ObjectNode item = JsonLib.createObjNode();
            item.put("name", names[i]);
            item.put("key", keys[i]);
            item.put("iconSkin", "iconSkin1");
            item.put("deviceDataType", "efficiency");
            static_keys.add(item);
        }
        return static_keys;
    }

    @ResponseBody
    @RequestMapping(value = "getDeviceFieldsData")
    public String getAllClsDDList(String id) {
        Document view = DBUtils.find(QDeviceView.collectionName, Filters.eq("id", id), Projections.include("placeholders"));
        List<Document> placeholders = DocumentLib.getList(view, "placeholders");

        Document projector = DocumentLib.newDoc();
        projector.put("id", 1);
        projector.put("name", 1);
        projector.put("data_definition", 1);
        projector.put("code", 1);
        ArrayNode return_list = JsonLib.createArrNode();

        /*Aric.chen.增加搜索条件进行数据筛选*/
        List<String> deviceClassCodeList = Lists.newArrayList();
        placeholders.stream().forEach(p -> {
            String clsCode = DocumentLib.getString(p, "clsCode");
            if (StringLib.isNotEmpty(clsCode)) {
                deviceClassCodeList.add(clsCode);
            }
        });
        List<Document> clsList = DBUtils.list("deviceClassification",
                new Document("code", new Document("$in", deviceClassCodeList)), projector);

        /*把List转换为Map格式，方便后面查找使用*/
        Map<String, Document> clsMap = Maps.newHashMap();
        clsList.stream().forEach(doc -> {
            String clsCode = DocumentLib.getString(doc, "code");
            clsMap.put(clsCode, doc);
        });

        for (Document p : placeholders) {
            Document cls = clsMap.get(DocumentLib.getString(p, "clsCode"));
            ObjectNode return_cls = JsonLib.createObjNode();
            ArrayNode return_data_type = JsonLib.createArrNode();
            String clsName = DocumentLib.getString(p, "name");
            return_cls.put("name", clsName);
            // 静态数据
            ObjectNode return_static = JsonLib.createObjNode();
            return_static.put("name", "静态数据");
            ArrayNode return_static_keys = getStaticColumns();
            return_static.set("children", return_static_keys);
            return_data_type.add(return_static);
            // 动态数据-数据定义
            ObjectNode return_dynamic = JsonLib.createObjNode();
            ArrayNode return_ddList = JsonLib.createArrNode();
            return_dynamic.put("name", "动态数据");
            List<Document> ddListDocument = DocumentLib.getList(cls, "data_definition.details");
            if (!ddListDocument.isEmpty()) {
                for (Document ddDocument : ddListDocument) {
                    ObjectNode ddItem = JsonLib.createObjNode();
                    String key = DocumentLib.getString(ddDocument, "key");
                    String name = DocumentLib.getString(ddDocument, "name");
                    ddItem.put("key", key);
                    ddItem.put("name", name);
                    ddItem.put("iconSkin", "iconSkin1");
                    ddItem.put("deviceDataType", "dynamic");
                    return_ddList.add(ddItem);
                }
            }
            return_dynamic.set("children", return_ddList);
            return_data_type.add(return_dynamic);
            // 设备效率
            ObjectNode return_efficiency = JsonLib.createObjNode();
            return_efficiency.put("name", "设备效率");
            ArrayNode return_efficiency_keys = getEfficiencyColumns();
            return_efficiency.set("children", return_efficiency_keys);
            return_data_type.add(return_efficiency);

            return_cls.set("children", return_data_type);
            return_list.add(return_cls);

        }
        return return_list.toString();
    }

    @Autowired
    private DeviceDataService deviceDataService;

    @ResponseBody
    @PostMapping(value = "loadRootData")
    public String loadRootData(@RequestParam String uuids) {
        uuids = StringLib.decodeURI(uuids);
        List<String> uuidList = JsonLib.parseArray(uuids, String.class);
        List<Document> deviceList = DBUtils.list(QDevice.collectionName, Filters.in("uuid", uuidList),
                Projections.include("uuid", "baseInfo", "dynamicData", "tag"));
        Document root = DocumentLib.newDoc();

        deviceList.stream().forEach(device -> {
            String uuid = DocumentLib.getString(device, "uuid");
            Document staticData = DocumentLib.newDoc();
            staticData.put("uuid", uuid);
            staticData.put("baseInfo", DocumentLib.getDocument(device, "baseInfo"));
            staticData.put("tag", DocumentLib.getList(device, "tag"));
            staticData.put("online", DocumentLib.getBoolean(device, "online"));

            Document deviceData = DocumentLib.newDoc();
            deviceData.put("static", staticData);
            deviceData.put("dynamic", DocumentLib.getDocument(device, "dynamicData"));
            root.put(uuid, deviceData);
        });

        return JsonLib.toJSON(root).toString();
    }
}
