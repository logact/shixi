package com.cynovan.janus.addons.plant_efficiency.alarm_list.web.controller;

import com.cynovan.janus.addons.triton.device.controller.state.QDeviceTimeline;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DateUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.google.common.collect.Lists;
import org.bson.Document;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping(value = "alarmList")
public class alarmlistController {

    @RequestMapping(value = "getRecentAlarmNum")
    public CheckMessage getRecentAlarmNum(String startdate) {
        CheckMessage checkmessage = CheckMessage.newInstance();
        Date startDate = DateUtils.parseDate(startdate + " 00:00:00");
        List<Document> aggregateList = Lists.newArrayList();
        Document match= DocumentLib.newDoc();
        match.put("stateType", "alarm");
        match.put("start_date", DocumentLib.newDoc("$gte", startDate));
        Document project = DocumentLib.newDoc();
        Document dateTostring = DocumentLib.newDoc();
        dateTostring.put("format", "%Y-%m-%d");
        dateTostring.put("date", "$start_date");
        project.put("alarmday", DocumentLib.newDoc("$dateToString", dateTostring));
        Document group = DocumentLib.newDoc();
        group.put("_id", "$alarmday");
        group.put("alarmnum", DocumentLib.newDoc("$sum", 1));
        aggregateList.add(DocumentLib.newDoc("$match", match));
        aggregateList.add(DocumentLib.newDoc("$project", project));
        aggregateList.add(DocumentLib.newDoc("$group", group));
        aggregateList.add(DocumentLib.newDoc("$sort", DocumentLib.newDoc("_id", 1)));
        List<Document> alarmList = DBUtils.aggregate(QDeviceTimeline.collectionName, aggregateList);
        checkmessage.addData("alarmList", alarmList);
        return checkmessage;
    }
}
