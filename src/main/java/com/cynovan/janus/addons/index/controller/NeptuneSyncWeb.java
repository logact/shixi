package com.cynovan.janus.addons.index.controller;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.neptune.mq.NeptuneMQConnService;
import com.cynovan.janus.base.neptune.service.NeptuneMessageService;
import com.cynovan.janus.base.utils.JsonLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping(value = "/neptuneSync")
public class NeptuneSyncWeb extends BaseWeb {

    @Autowired
    private NeptuneMQConnService neptuneMQConnService;

    @Autowired
    private NeptuneMessageService neptuneMessageService;

    @ResponseBody
    @RequestMapping(value = "getStatus")
    public String getStatus() {
        ObjectNode nowStatus = JsonLib.createObjNode();
        nowStatus.set("status", JsonLib.toJSON(neptuneMQConnService.isConnection() ? "已连接" : "未连接"));
        if (neptuneMQConnService.isConnection()) {
            neptuneMessageService.syncNeptuneCompanyInfo();
        }
        return nowStatus.toString();
    }

    @ResponseBody
    @RequestMapping(value = "tryConnection")
    public String tryConnection() {
        neptuneMQConnService.conn();
        return getStatus();
    }


    @ResponseBody
    @RequestMapping(value = "syncDevice")
    public String syncDevice() {
        neptuneMessageService.syncDevice();
        return CheckMessage.newInstance().toString();
    }

}
