package com.cynovan.janus.addons.systeminfo.controller;

import com.cynovan.janus.addons.systeminfo.service.JanusInfoService;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Properties;

@RestController
@RequestMapping(value = "janusInfo")
public class JanusInfoWeb {

    private Logger logger = LoggerFactory.getLogger(JanusInfoWeb.class);

    @Autowired
    private JanusInfoService janusInfoService;

    @RequestMapping(value = "hardwareInfo")
    public String getHardwareInfo() {
        ObjectNode valueNode = JsonLib.createObjNode();

        ObjectNode os = janusInfoService.getOsInfo();
        ObjectNode memory = janusInfoService.getMemoryInfo();
        ArrayNode disk = janusInfoService.getDiskInfo();
        ArrayNode ni = janusInfoService.getNetworkInterfaceInfo();
        ObjectNode storage = janusInfoService.getStorageInfo();

        valueNode.set("os", os);
        valueNode.set("memory", memory);
        valueNode.set("disk", disk);
        valueNode.set("ni", ni);
        valueNode.set("storage", storage);

        return valueNode.toString();
    }

    @ResponseBody
    @RequestMapping(value = "asideStatus")
    public String updateAsideStatus(@RequestParam String asideStatus) {
        CheckMessage checkMessage = CheckMessage.newInstance();

        Document updateField = DocumentLib.newDoc("asideStatus", asideStatus);
        DBUtils.updateOne(QJanus.collectionName, DocumentLib.newDoc(),
                DocumentLib.new$Set("config", updateField));

        return checkMessage.toString();
    }

    @ResponseBody
    @RequestMapping(value = "buildInfo")
    public String buildInfo() {
        ObjectNode buildInfo = JsonLib.createObjNode();
        String propertiesStr = FileUtils.getClassPathFileContent("git.properties");
        if (StringLib.isNotEmpty(propertiesStr)) {
            Properties prop = new Properties();
            try {
                prop.load(new ByteArrayInputStream(propertiesStr.getBytes()));
                /*build时branch名称*/
                buildInfo.put("branch", StringLib.toString(prop.get("git.branch")));
                /*build的时间*/
                buildInfo.put("time", StringLib.toString(prop.get("git.build.time")));
                /*build的电脑名称*/
                buildInfo.put("pc", StringLib.toString(prop.get("git.build.host")));
                /*最后提交ID*/
                buildInfo.put("last_commit_id", StringLib.toString(prop.get("git.commit.id.abbrev")));
                /*最后提交名称*/
                buildInfo.put("last_commit_name", StringLib.toString(prop.get("git.commit.message.full")));
                /*最后提交时间*/
                buildInfo.put("last_commit_time", StringLib.toString(prop.get("git.commit.time")));
                /*本地是否有未提交代码*/
                buildInfo.put("git_dirty", StringLib.toString(prop.get("git.dirty")));
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return buildInfo.toString();
    }
}


