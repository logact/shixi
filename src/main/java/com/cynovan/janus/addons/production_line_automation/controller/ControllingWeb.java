package com.cynovan.janus.addons.production_line_automation.controller;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.controlling.jdo.QControlling;
import com.cynovan.janus.base.controlling.service.ControllingService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(value = "controlling")
public class ControllingWeb extends BaseWeb {

    @Autowired
    private ControllingService controllingService;

    @RequestMapping(value = "save")
    public String saveControlling(@RequestParam String data) {
        data = StringLib.decodeURI(data);
        Document controlling = DocumentLib.parse(data);
        List devices = DocumentLib.getList(controlling, "devices");
        CheckMessage checkMessage = CheckMessage.newInstance();

        String controllingId = DocumentLib.getID(controlling);
        boolean open = DocumentLib.getBoolean(controlling, "open");
        if (StringLib.isNotEmpty(controllingId)) {
            Document oldControlling = DBUtils.findByID(QControlling.collectionName, controllingId);
            controllingService.unregister(oldControlling);
        }
        if (open) {
            ObjectNode checkNode = controllingService.checkDevices(devices, controllingId);
            if (checkNode.get("conflict").size() > 0) {
                checkMessage.addMessage("设备冲突，请检查！");
                checkMessage.addData("conflict", checkNode.get("conflict"));
                return checkMessage.toString();
            }
            DBUtils.save(QControlling.collectionName, controlling);
            controllingService.register(controlling);
        } else {
            DBUtils.save(QControlling.collectionName, controlling);
        }


        checkMessage.addData("id", DocumentLib.getID(controlling));
        return checkMessage.toString();
    }

    @RequestMapping(value = "remove")
    public String removeControlling(@RequestParam String controllingId) {
        Document controlling = DBUtils.findByID(QControlling.collectionName, controllingId);
        controllingService.unregister(controlling);

        DBUtils.deleteOne(QControlling.collectionName, DocumentLib.newDoc("id", controllingId));
        return CheckMessage.newInstance().toString();
    }


}
