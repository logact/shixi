package com.cynovan.janus.base.controlling.service;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.controlling.jdo.QControlling;
import com.cynovan.janus.base.controlling.job.ControllingScheduleJob;
import com.cynovan.janus.base.schedule.service.SchedulerService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import com.google.common.collect.Table;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/*
    该类处理所有的总控处理逻辑，包含两大块: 数据驱动和定时处理
* */

@Component
public class ControllingService implements ApplicationRunner {

    @Autowired
    private ControllingStateService controllingStateService;

    @Autowired
    private ControllingRunService controllingRunService;

    private String schedulerGroupName = "JanusDefaultQuartzGroup";

    @Override
    public void run(ApplicationArguments args) throws Exception {
        init();
    }

    /*
        系统启动时，加载所有的总控，然后启动
        该自动加载的方法在SpringContext中调用(不能使用@PostContruct,因为SpringContext getBean为空，原因未明)
        * */
    private void init() {
        List<Document> controllingList = DBUtils.list(QControlling.collectionName, DocumentLib.newDoc("open", true));
        controllingList.stream().forEach(controlling -> {
            controllingStateService.registerControlling(controlling);
        });
        createSchedule();
    }

    public void onData(String uuid) {
        Table<String, String, List<String>> ruleTable = controllingStateService.getDeviceDataDriveRuleTable();
        if (ruleTable.containsRow(uuid)) {
            Map<String, List<String>> ruleMap = ruleTable.rowMap().get(uuid);
            ruleMap.forEach((controllingId, ruleList) -> {
                ruleList.stream().forEach(ruleId -> {
                    controllingRunService.run(controllingId, ruleId);
                });
            });
        }
    }

    public void register(Document controlling) {
        controllingStateService.registerControlling(controlling);
        createSchedule();
    }

    /*保存或者删除的时候，拿原来的总控信息传入反注册。然后再使用新的总控信息进行注册*/
    public void unregister(Document controlling) {
        String controllingId = DocumentLib.getID(controlling);

        controllingStateService.unregisterControlling(controllingId);
        /*删除对应总控规则的schedule信息*/
        SchedulerService schedulerService = SpringContext.getBean(SchedulerService.class);
        if (controlling.containsKey("rules")) {
            Object rulesObject = controlling.get("rules");
            if (rulesObject instanceof List) {
                List rules = (List) rulesObject;
                rules.stream().forEach(rule -> {
                    Document ruleObj = (Document) rule;
                    String ruleId = DocumentLib.getString(ruleObj, "rule_id");
                    String jobName = getJobName(controllingId, ruleId);
                    schedulerService.deleteJob(jobName, schedulerGroupName);
                });
            }
        }
    }

    private void createSchedule() {
        /*schedule 会根据名称判断是否存在，存在则不会再次生成*/
        Table<String, String, Document> scheduleTable = controllingStateService.getScheduleTable();
        Map<String, Map<String, Document>> scheduleMap = scheduleTable.rowMap();
        scheduleMap.forEach((controllingId, controllingMap) -> {
            controllingMap.forEach((ruleId, ruleObj) -> {
                long interval = getIntervalWithMillsecond(ruleObj);
                if (interval > 0) {
                    String jobName = getJobName(controllingId, ruleId);
                    ControllingScheduleJob scheduleJob = new ControllingScheduleJob();
                    scheduleJob.setInterval(interval);
                    scheduleJob.setName(jobName);
                    scheduleJob.addJobData("controllingId", controllingId);
                    scheduleJob.addJobData("ruleId", ruleId);
                    scheduleJob.setGroup("JanusDefaultQuartzGroup");
                    scheduleJob.start();
                }
            });
        });
    }

    private String getJobName(String controllingId, String ruleId) {
        return StringLib.join(controllingId, "_", ruleId, "_controlling_interval");
    }

    private long getIntervalWithMillsecond(Document ruleObj) {
        long time = 0l;
        TimeUnit timeUnit = TimeUnit.MILLISECONDS;

        String unit = DocumentLib.getString(ruleObj, "timeUnit");
        if (StringLib.contains(unit, "ms")) {
            timeUnit = TimeUnit.MILLISECONDS;
        } else if (StringLib.contains(unit, "s")) {
            timeUnit = TimeUnit.SECONDS;
        } else if (StringLib.contains(unit, "m")) {
            timeUnit = TimeUnit.MINUTES;
        } else if (StringLib.contains(unit, "h")) {
            timeUnit = TimeUnit.HOURS;
        }
        time = timeUnit.toMillis(DocumentLib.getLong(ruleObj, "time"));
        return time;
    }

    public ObjectNode checkDevices(List<Document> devices, String controllingId) {
        ObjectNode objectNode = JsonLib.createObjNode();

        List<String> uniqueList = Lists.newArrayList();
        List<String> otherList = Lists.newArrayList();
        for (int i = 0; i < devices.size(); i++) {
            Document device = devices.get(i);
            boolean unique = DocumentLib.getBoolean(device, "unique");
            if (unique) {
                uniqueList.add(DocumentLib.getString(device, "uuid"));
            } else {
                otherList.add(DocumentLib.getString(device, "uuid"));
            }
        }

        List<Document> aggregateList = Lists.newArrayList();

        Document project = DocumentLib.newDoc("name", 1).append("devices", 1);
        aggregateList.add(DocumentLib.newDoc("$project", project));

        Document unwind = DocumentLib.newDoc("$unwind", "$devices");
        aggregateList.add(unwind);

        ArrayNode arrayNode = JsonLib.createArrNode();
        if (StringLib.isNotEmpty(controllingId)) {
            if (uniqueList.size() > 0) {
                Document match = DocumentLib.newDoc();
                match.append("devices.uuid", DocumentLib.newDoc("$in", uniqueList));
                match.append("_id", DocumentLib.newDoc("$ne", new ObjectId(controllingId)));
                aggregateList.add(DocumentLib.newDoc("$match", match));
                List<Document> iterable = DBUtils.aggregate(QControlling.collectionName, aggregateList);
                addArray(iterable, arrayNode);
            }
            if (otherList.size() > 0) {
                aggregateList.remove(aggregateList.size() - 1);
                Document match = DocumentLib.newDoc();
                match.append("devices.uuid", DocumentLib.newDoc("$in", otherList));
                match.append("devices.unique", DocumentLib.newDoc("$eq", true));
                match.append("_id", DocumentLib.newDoc("$ne", new ObjectId(controllingId)));
                aggregateList.add(DocumentLib.newDoc("$match", match));
                List<Document> list = DBUtils.aggregate(QControlling.collectionName, aggregateList);
                addArray(list, arrayNode);
            }
        } else {
            if (uniqueList.size() > 0) {
                Document match = DocumentLib.newDoc();
                match.append("devices.uuid", DocumentLib.newDoc("$in", uniqueList));
                aggregateList.add(DocumentLib.newDoc("$match", match));
                List<Document> list = DBUtils.aggregate(QControlling.collectionName, aggregateList);
                addArray(list, arrayNode);
            }
            if (otherList.size() > 0) {
                aggregateList.remove(aggregateList.size() - 1);
                Document match = DocumentLib.newDoc();
                match.append("devices.uuid", DocumentLib.newDoc("$in", otherList));
                match.append("devices.unique", DocumentLib.newDoc("$eq", true));
                aggregateList.add(DocumentLib.newDoc("$match", match));
                List<Document> list = DBUtils.aggregate(QControlling.collectionName, aggregateList);
                addArray(list, arrayNode);
            }
        }
        objectNode.set("conflict", arrayNode);
        return objectNode;
    }

    private void addArray(List<Document> list, ArrayNode arrayNode) {
        list.stream().forEach(doc -> {
            String cName = DocumentLib.getString(doc, "name");
            Document device = DocumentLib.getDocument(doc, "devices");
            String dName = DocumentLib.getString(device, "name");
            ObjectNode companyObject = JsonLib.createObjNode();
            companyObject.put("controlName", cName);
            companyObject.put("deviceName", dName);
            arrayNode.add(companyObject);
        });
    }
}
