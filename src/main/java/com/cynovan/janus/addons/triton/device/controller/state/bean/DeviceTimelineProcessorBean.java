package com.cynovan.janus.addons.triton.device.controller.state.bean;

import com.cynovan.janus.addons.triton.device.controller.state.QDeviceTimeline;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.utils.CacheUtils;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.Sorts;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.joda.time.LocalDateTime;
import org.joda.time.Minutes;

import java.util.Date;
import java.util.List;

public class DeviceTimelineProcessorBean {

    private Document deviceData = null;

    private String uuid = null;

    private String cacheKey = null;
    private String deviceStateRuleCacheKey = null;

    private Document stateDocument = new Document();
    private String currentState = "";

    private Document prevStateDocument = null;

    private Date currentTime = null;

    private String prevId = null;
    private String prevState = null;
    private Date prevStartDate = null;
    private Date prevEndDate = null;

    private Document device = null;

    private MessageService messageService;

    /*针对offline，可以手动传入状态*/
    public DeviceTimelineProcessorBean(Document _deviceData, String state) {
        this(_deviceData);
        this.prevState = state;
    }

    public DeviceTimelineProcessorBean(Document _deviceData) {
        this.deviceData = _deviceData;
        this.messageService = SpringContext.getBean(MessageService.class);
        initVariable();
        calcCurrentState();
    }

    private void calcCurrentState() {
        /*计算当前的状态*/
        Document alarmDoc = CacheUtils.getDocument(deviceStateRuleCacheKey);
        if (alarmDoc == null) {
            alarmDoc = new Document();
            /*获得设备*/
            String classificationCode = DocumentLib.getString(device, "classification.classificationCode");

            Document alarmMap = new Document();
            if (StringLib.isNotEmpty(classificationCode)) {
                Document classification = DBUtils.find("deviceClassification", DocumentLib.newDoc("code", classificationCode));
                Document alarm = DocumentLib.getDocument(classification, "alarm");
                if (alarm != null) {
                    alarmDoc.put("column", DocumentLib.getString(alarm, "column"));
                    List<Document> alarmList = DocumentLib.getList(alarm, "alarmList");
                    if (CollectionUtils.isNotEmpty(alarmList)) {
                        alarmList.stream().forEach(row -> {
                            String alarmValue = DocumentLib.getString(row, "alarmValue");
                            alarmValue = StringLib.lowerCase(StringLib.trim(alarmValue));
                            alarmMap.put(alarmValue, row);
                        });
                    }
                }
            }
            if (!alarmMap.isEmpty()) {
                alarmDoc.put("ruleMap", alarmMap);
                CacheUtils.set(deviceStateRuleCacheKey, alarmDoc);
            }
        }

        /*获得设备的状态*/
        String column = DocumentLib.getString(alarmDoc, "column");
        String fieldValue = DocumentLib.getString(deviceData, "data." + column);
        Document ruleMap = DocumentLib.getDocument(alarmDoc, "ruleMap");
        if (ruleMap != null) {
            Document stateDoc = DocumentLib.getDocument(ruleMap, fieldValue);
            if (stateDoc != null) {
                stateDocument = stateDoc;
            }
        }
        currentState = DocumentLib.getString(stateDocument, "alarmValue");
    }

    private void initVariable() {
        uuid = DocumentLib.getString(this.deviceData, "uuid");
        uuid = StringLib.replace(this.uuid, "\t", "");
        uuid = StringLib.replace(uuid, "\n", "");
        cacheKey = StringLib.join("DeviceTimeline@", uuid);
        deviceStateRuleCacheKey = StringLib.join("DeviceState@", uuid);
        currentTime = DocumentLib.getDate(deviceData, "time");

        device = CacheUtils.getDocument(StringLib.join("DeviceTimelineInfo@", uuid));
        if (device == null) {
            device = DBUtils.find(QDevice.collectionName, Filters.eq("uuid", uuid),
                    Projections.include("baseInfo", "classification"));
            if (device == null) {
                device = new Document();
            }
            CacheUtils.set(StringLib.join("DeviceTimelineInfo@", uuid), device);
        }

        loadPrevTimeline();
    }

    private void loadPrevTimeline() {
        prevStateDocument = CacheUtils.getDocument(cacheKey);

        if (prevStateDocument == null) {
            /*取得数据库最后一条记录*/
            prevStateDocument = DBUtils.find(QDeviceTimeline.collectionName, Filters.eq("uuid", uuid), null,
                    Sorts.descending("start_date"));
        }

        prevId = DocumentLib.getID(prevStateDocument);
        prevState = DocumentLib.getString(prevStateDocument, "state");
        prevStartDate = DocumentLib.getDate(prevStateDocument, "start_date");
        prevEndDate = DocumentLib.getDate(prevStateDocument, "end_date");
    }

    private void updateDeviceState() {
        /*从缓存中获得设备状态*/
        String stateCacheKey = StringLib.join("DeviceState_", uuid);
        String deviceState = CacheUtils.getString(stateCacheKey);
        if (StringLib.isEmpty(deviceState)) {
            Document deviceStateDoc = DBUtils.find(QDevice.collectionName, Filters.eq("uuid", uuid), Projections.include("state"));
            deviceState = DocumentLib.getString(deviceStateDoc, "state");
            CacheUtils.set(stateCacheKey, deviceState);
        }
        String currentStateType = DocumentLib.getString(stateDocument, "stateSetting");
        if (!StringLib.equalsIgnoreCase(deviceState, currentStateType)) {
            /*当状态栏位不相同时，才需要更新*/
            Document update = new Document();
            update.put("state", currentStateType);
            DBUtils.updateOne(QDevice.collectionName, Filters.eq("uuid", uuid), DocumentLib.new$Set(update));

            MessageDto messageDto = new MessageDto();
            messageDto.setTitle("设备状态改变");
            messageDto.addParam("id", uuid);
            messageDto.addParam("state", currentStateType);
            messageDto.setType("deviceStatusChange");
            messageService.send(messageDto);
            CacheUtils.set(stateCacheKey, currentStateType);
        }
    }

    public void update() {
        // 删除设备视图 设备时间轴 缓存
        CacheUtils.deleteLike("timeline_cache_");
        if (StringLib.isEmpty(currentState)) {
            /*当获得状态为空，则不继续处理*/
            return;
        }
        /*更新Janus的设备状态*/
        updateDeviceState();
        /*上一条记录为空，代表设备无timeline信息,则直接*/
        if (StringLib.isEmpty(prevId)) {
            newTimeline();
        } else {
            int diffMinutes = diffMinutes(prevEndDate, currentTime);
            if (diffMinutes > 3) {
                if (StringLib.equals(prevState, "offline")) {
                    /*如果上一条已经是offline，则更新offline的时间*/
                    updateDeviceTimeline(prevId, prevStartDate, currentTime);
                } else {
                    /*如果原来的数据不为offline,则代表着相同断掉的情况，则进行创建offline数据*/
                    newOffline();
                }
                /*开始新的状态记录*/
                newTimeline();
            } else {
                /*更新上次的记录信息*/
                updateDeviceTimeline(prevId, prevStartDate, currentTime);
                prevStateDocument.put("end_date", currentTime);
                CacheUtils.set(cacheKey, prevStateDocument);

                /*记录的状态不同，则新建记录*/
                if (StringLib.equals(prevState, currentState) == false) {
                    newTimeline();
                }
            }
        }
    }

    private void updateDeviceTimeline(String id, Date start, Date end) {
        long millsecondDuration = Math.abs(diffMillSeconds(start, end));
        Document update = new Document();
        update.put("end_date", end);
        update.put("duration", millsecondDuration);
        DBUtils.updateOne(QDeviceTimeline.collectionName, Filters.eq("id", id),
                DocumentLib.new$Set(update));
    }

    private void newOffline() {
        Document offlineTimeline = new Document();
        String devicename = DocumentLib.getString(device, "baseInfo.name");
        Document type = DocumentLib.getDocument(device, "classification");
        offlineTimeline.put("device_name", devicename);
        offlineTimeline.put("type", type);
        offlineTimeline.put("uuid", uuid);
        offlineTimeline.put("start_date", prevEndDate);
        offlineTimeline.put("end_date", currentTime);
        offlineTimeline.put("state", "offline");
        offlineTimeline.put("stateName", "离线");
        offlineTimeline.put("stateType", "offline");
        offlineTimeline.put("duration", diffMillSeconds(prevStartDate, currentTime));
        DBUtils.save(QDeviceTimeline.collectionName, offlineTimeline);
        DBUtils.updateOne(QDevice.collectionName, DocumentLib.newDoc("uuid", uuid), DocumentLib.new$Set("state", "offline"));
    }

    private void newTimeline() {
        Document newTimeline = new Document();
        String devicename = DocumentLib.getString(device, "baseInfo.name");
        Document type = DocumentLib.getDocument(device, "classification");
        newTimeline.put("device_name", devicename);
        newTimeline.put("type", type);
        newTimeline.put("uuid", uuid);
        newTimeline.put("start_date", currentTime);
        newTimeline.put("end_date", currentTime);
        newTimeline.put("duration", 0);
        /*用户设置的状态值*/
        newTimeline.put("state", currentState);
        /*用户设置的状态描述*/
        newTimeline.put("stateName", DocumentLib.getString(stateDocument, "alarmName"));
        /*用户设置的状态类型:正常/警告/报警*/
        newTimeline.put("stateType", DocumentLib.getString(stateDocument, "stateSetting"));
        DBUtils.save(QDeviceTimeline.collectionName, newTimeline);
        DBUtils.updateOne(QDevice.collectionName, DocumentLib.newDoc("uuid", uuid), DocumentLib.new$Set("state",
                DocumentLib.getString(stateDocument, "stateSetting")));
        CacheUtils.set(cacheKey, newTimeline);
    }


    private int diffMinutes(Date start, Date end) {
        return Minutes.minutesBetween(LocalDateTime.fromDateFields(start), LocalDateTime.fromDateFields(end)).getMinutes();
    }

    private Long diffMillSeconds(Date start, Date end) {
        return Math.abs(end.getTime() - start.getTime());
    }
}
