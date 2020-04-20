package com.cynovan.janus.addons.device_preview.preview.controller;

import com.cynovan.janus.addons.triton.view.backend.jdo.QDeviceView;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.google.common.collect.Maps;
import com.mongodb.client.model.Projections;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * @author ian
 * @date 2019-11-15
 */
@RestController
@RequestMapping(value = "deviceTreePreview")
public class DevicePreviewWeb {

    @GetMapping(value = "getTreeNodes")
    public String getTreeNodes() {

        List<Document> adt = DBUtils.list("areaDeviceTree");

        if (CollectionUtils.isEmpty(adt)) {
            // init adt
            Document root = DocumentLib.newDoc();
            root.put("name", "列表");
            root.put("code", "root");
            root.put("open", true);
            root.put("isParent", true);

            DBUtils.save("areaDeviceTree", root);
            adt.add(root);
        }

        List<Document> classificationList = DBUtils.list("deviceClassification", DocumentLib.newDoc(),
                Projections.include("name", "view", "code"));
        List<Document> viewList = DBUtils.list(QDeviceView.collectionName, DocumentLib.newDoc(),
                Projections.include("name", "code"));

        Map<String, String> classificationMap = Maps.newHashMap();
        Map<String, String> viewCode_viewId_map = Maps.newHashMap();

        classificationList.stream().forEach(classification -> {
            classificationMap.put(classification.getString("code"), DocumentLib.getString(classification, "view.viewCode"));
        });
        viewList.stream().forEach(view->{
            viewCode_viewId_map.put(view.getString("code"), view.getString("id"));
        });

        List<Document> deviceList = DBUtils.list("device");

        deviceList.stream().forEach(device -> {
            String classificationCode = DocumentLib.getString(device, "classification.classificationCode");
            String previewCode = classificationMap.get(classificationCode);
            String previewId = viewCode_viewId_map.get(previewCode);

            Document baseInfo = DocumentLib.getDocument(device, "baseInfo");
            Document group = DocumentLib.getDocument(device, "group");

            Document newNode = DocumentLib.newDoc();
            newNode.put("name", DocumentLib.getString(baseInfo, "name"));
            newNode.put("code", DocumentLib.getString(device, "uuid"));
            newNode.put("pCode", DocumentLib.getString(group, "groupCode"));
            newNode.put("id", DocumentLib.getID(device));
            newNode.put("isParent", false);
            newNode.put("open", false);
            newNode.put("previewId", previewId);
            newNode.put("iconSkin", "device");

            adt.add(newNode);
        });


        return JsonLib.toJSON(adt).toString();
    }

}
