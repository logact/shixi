package com.cynovan.janus.addons.data_monitor.controller;

import com.cynovan.janus.addons.data_monitor.jdo.QDataMonitor;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.utils.*;
import org.bson.Document;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "dataMonitor")
public class DataMonitorWeb extends BaseWeb {

    @RequestMapping(value = "remove")
    public String remove(@RequestParam String id) {
        DBUtils.deleteOne(QDataMonitor.collectionName, DocumentLib.newDoc("id", id));
        CacheUtils.deleteLike("DEVICE_MONITOR_List_");
        return new CheckMessage().toString();
    }

    @RequestMapping(value = "save")
    public String save(@RequestParam String data) {
        data = StringLib.decodeURI(data);
        Document monitor = DocumentLib.parse(data);
        DBUtils.save(QDataMonitor.collectionName, monitor);
        CacheUtils.deleteLike("DEVICE_MONITOR_List_");

        CheckMessage checkMessage = CheckMessage.newInstance();
        checkMessage.addData("id", DocumentLib.getID(monitor));
        return checkMessage.toString();
    }
}
