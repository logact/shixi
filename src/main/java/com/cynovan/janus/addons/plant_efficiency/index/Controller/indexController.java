package com.cynovan.janus.addons.plant_efficiency.index.Controller;

import com.cynovan.janus.addons.plant_efficiency.index.service.EffciencyService;
import com.cynovan.janus.addons.triton.device.controller.state.QDeviceTimeline;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.utils.*;
import com.google.common.collect.Lists;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping(value = "alarmIndex")
public class indexController {
    @Autowired
    private EffciencyService effciencyService;

    @PostMapping(value = "getTenAlarmList")
    public String getTenAlarmList() {
        CheckMessage checkmessage = CheckMessage.newInstance();
        List<Document> aggregateList = Lists.newArrayList();
        Document match = DocumentLib.newDoc("stateType", "alarm");
        aggregateList.add(DocumentLib.newDoc("$match", match));
        aggregateList.add(DocumentLib.newDoc("$sort", DocumentLib.newDoc("start_date", -1)));
        aggregateList.add(DocumentLib.newDoc("$limit", 10));
        List<Document> alarmList = DBUtils.aggregate(QDeviceTimeline.collectionName, aggregateList);
        checkmessage.addData("alarmList", alarmList);
        return checkmessage.toString();
    }

    @PostMapping(value = "dataStatistics")
    public CheckMessage dataStatistics(String startdate) {
        CheckMessage checkMessage = CheckMessage.newInstance();
        String cacheKey = StringLib.join("dataStatistics");
        CheckMessage cacheMessage = JsonLib.parseJSON(BICacheUtils.get(cacheKey), CheckMessage.class);
        if (cacheMessage != null) {
            return cacheMessage;
        }
        List<Document> alarmNum = effciencyService.getAlarmList(startdate);
        List<Document> deviceonlinetime = effciencyService.getDailyOnlineTime(startdate);
        List<Document> devicenormaltime = effciencyService.getDailyNormalOnlinetime(startdate);
        checkMessage.addData("alarmNum", alarmNum);
        checkMessage.addData("deviceonlinetime", deviceonlinetime);
        checkMessage.addData("devicenormaltime", devicenormaltime);
        BICacheUtils.set(cacheKey, JsonLib.toString(checkMessage));
        return checkMessage;
    }

}

