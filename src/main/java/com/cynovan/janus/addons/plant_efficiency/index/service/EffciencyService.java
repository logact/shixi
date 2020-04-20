package com.cynovan.janus.addons.plant_efficiency.index.service;

import com.cynovan.janus.addons.triton.device.controller.state.QDeviceTimeline;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DateUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.google.common.collect.Lists;
import org.bson.Document;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EffciencyService {

    public List<Document> getDailyOnlineTime(String date) {
        List<Document> aggregateList = Lists.newArrayList();
        Document match = DocumentLib.newDoc();
        match.put("stateType", DocumentLib.newDoc("$ne", "offline"));
        match.put("start_date", DocumentLib.newDoc("$gte", DateUtils.parseDate(date)));
        Document project = DocumentLib.newDoc();
        Document dateTostring = DocumentLib.newDoc();
        dateTostring.put("format", "%Y-%m-%d");
        dateTostring.put("date", "$start_date");
        project.put("duration", 1);
        project.put("type", "$type.classificationName");
        project.put("yearmonthday", DocumentLib.newDoc("$dateToString", dateTostring));
        Document group = DocumentLib.newDoc();
        Document id = DocumentLib.newDoc();
        id.put("yearmonthday", "$yearmonthday");
        id.put("type", "$type");
        group.put("_id", id);
        group.put("time", DocumentLib.newDoc("$sum", "$duration"));
        aggregateList.add(DocumentLib.newDoc("$match", match));
        aggregateList.add(DocumentLib.newDoc("$project", project));
        aggregateList.add(DocumentLib.newDoc("$group", group));
        aggregateList.add(DocumentLib.newDoc("$sort", DocumentLib.newDoc("_id", 1)));
        List<Document> alarmLists = DBUtils.aggregate(QDeviceTimeline.collectionName, aggregateList);
        return alarmLists;
    }

    public List<Document> getDailyNormalOnlinetime(String date) {
        List<Document> aggregateList = Lists.newArrayList();
        List<String> unList = Lists.newArrayList("offline", "alarm");
        Document match = DocumentLib.newDoc();
        match.put("stateType", DocumentLib.newDoc("$nin", unList));
        match.put("start_date", DocumentLib.newDoc("$gte", DateUtils.parseDate(date)));
        Document project = DocumentLib.newDoc();
        Document dateTostring = DocumentLib.newDoc();
        dateTostring.put("format", "%Y-%m-%d");
        dateTostring.put("date", "$start_date");
        project.put("duration", 1);
        project.put("type", "$type.classificationName");
        project.put("yearmonthday", DocumentLib.newDoc("$dateToString", dateTostring));
        Document group = DocumentLib.newDoc();
        Document id = DocumentLib.newDoc();
        id.put("yearmonthday", "$yearmonthday");
        id.put("type", "$type");
        group.put("_id", id);
        group.put("time", DocumentLib.newDoc("$sum", "$duration"));
        aggregateList.add(DocumentLib.newDoc("$match", match));
        aggregateList.add(DocumentLib.newDoc("$project", project));
        aggregateList.add(DocumentLib.newDoc("$group", group));
        aggregateList.add(DocumentLib.newDoc("$sort", DocumentLib.newDoc("_id", 1)));
        List<Document> alarmLists = DBUtils.aggregate(QDeviceTimeline.collectionName, aggregateList);
        return alarmLists;
    }

    public List<Document> getAlarmList(String startdate){
        List<Document> aggregateList = Lists.newArrayList();
        Document match = DocumentLib.newDoc();
        match.put("stateType", "alarm");
        match.put("start_date", DocumentLib.newDoc("$gte", DateUtils.parseDate(startdate)));
        Document project = DocumentLib.newDoc();
        Document dateTostring = DocumentLib.newDoc();
        dateTostring.put("format", "%Y-%m-%d");
        dateTostring.put("date", "$start_date");
        project.put("yearmonthday", DocumentLib.newDoc("$dateToString", dateTostring));
        project.put("type", "$type.classificationName");
        Document group = DocumentLib.newDoc();
        Document id = DocumentLib.newDoc();
        id.put("yearmonthday", "$yearmonthday");
        id.put("type", "$type");
        group.put("_id", id);
        group.put("count", DocumentLib.newDoc("$sum", 1));
        aggregateList.add(DocumentLib.newDoc("$match", match));
        aggregateList.add(DocumentLib.newDoc("$project", project));
        aggregateList.add(DocumentLib.newDoc("$group", group));
        aggregateList.add(DocumentLib.newDoc("$sort", DocumentLib.newDoc("_id", 1)));
        List<Document> alarmList = DBUtils.aggregate(QDeviceTimeline.collectionName, aggregateList);
        return  alarmList;
    }
}
