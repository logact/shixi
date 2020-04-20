package com.cynovan.janus.base.controlling.service;

import com.cynovan.janus.addons.production_line_automation.dto.ControllingLogDto;
import com.cynovan.janus.base.controlling.jdo.QControllingLog;
import com.cynovan.janus.base.device.push.DevicePushService;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.utils.JavaScriptUtils;
import com.cynovan.janus.base.service.changed.JanusChangeCheckService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Maps;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.Sorts;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.tuple.MutablePair;
import org.apache.commons.lang3.tuple.Pair;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class ControllingRunService {

    @Autowired
    private ControllingStateService controllingStateService;

    @Autowired
    private DeviceDataService deviceDataService;

    @Autowired
    private DevicePushService devicePushService;

    @Autowired
    private JanusChangeCheckService janusChangeCheckService;

    public void run(String controllingId, String ruleId) {
        /*检查触发条件*/
        ControllingLogDto controllingLogDto = new ControllingLogDto();
        controllingLogDto.setControlling_id(controllingId);
        controllingLogDto.setRule_id(ruleId);
        Document controlling = controllingStateService.getControlling(controllingId);
        controllingLogDto.setControlling(controlling);

        boolean flag = checkTriggerCondition(controllingId, ruleId, controllingLogDto);
        controllingLogDto.setConditionResult(flag);
        if (flag == true) {
            /*代表条件检查通过*/
            /*检查数据处理*/

            ObjectNode pushData = runPushExpression(controllingId, ruleId, controllingLogDto);
            if (pushData != null) {
                controllingLogDto.setPushData(DocumentLib.parse(pushData.toString()));
                /*检查数据是否符合下发的数据格式*/
                if (!pushData.has("action")) {
                    pushData.put("action", "update");
                }
                if (!pushData.has("data")) {
                    pushData.set("data", JsonLib.createObjNode());
                }

                /*数据处理完成后，检索本次要下发的设备，循环下发至设备*/
                List<String> pushList = controllingStateService.getPushDeviceList(controllingId, ruleId);
                if (CollectionUtils.isNotEmpty(pushList)) {
                    pushList.stream().forEach(alias -> {
                        ObjectNode cloneData = pushData.deepCopy();
                        String dataUuid = controllingStateService.getUuidByAlias(controllingId, alias);
                        cloneData.put("uuid", dataUuid);
                        devicePushService.pushToDevice(cloneData);
                    });
                }
            }
        }
        /*check Log save*/
        String checkChangeKey = DigestLib.md5Hex(StringLib.join(controllingId, StringLib.SPLIT_1, ruleId, "_log"));
        Pair<Boolean, Integer> pair = janusChangeCheckService.check(checkChangeKey, controllingLogDto.getConditionResult());
        if (pair.getLeft()) {
            controllingLogDto.setKey(checkChangeKey);
            /*先更新上一次的记录信息*/
            Document leastDoc = DBUtils.find(QControllingLog.collectionName,
                    Filters.eq("key", checkChangeKey),
                    Projections.include("_id"),
                    Sorts.descending("create_date"));
            if (leastDoc != null) {
                String id = DocumentLib.getID(leastDoc);
                DBUtils.updateOne(QControllingLog.collectionName, Filters.eq("id", id), DocumentLib.new$Set("times", pair.getRight()));
            }
            /*触发结果变化的时候才存储到数据库*/
            DBUtils.save(QControllingLog.collectionName, DocumentLib.parse(JsonLib.toJSON(controllingLogDto).toString()));
        }
    }

    private ObjectNode runPushExpression(String controllingId, String ruleId, ControllingLogDto controllingLogDto) {
        String expressionMD5 = controllingStateService.getRulePushExpression(controllingId, ruleId);
        if (StringLib.isNotEmpty(expressionMD5)) {
            MutablePair<Object, Map<String, Document>> pair = runExpression(controllingId, expressionMD5);
            Object result = pair.getLeft();
            controllingLogDto.setPushParam(pair.getRight());
            if (result != null) {
                if (result instanceof Document) {
                    /*只有当返回值为json{}时，才继续处理*/
                    return (ObjectNode) JsonLib.toJSON(result);
                }
            }
        }
        return null;
    }

    private boolean checkTriggerCondition(String controllingId, String ruleId, ControllingLogDto controllingLogDto) {
        boolean triggered = true;
        String expressionMD5 = controllingStateService.getRuleConditionExpressionMD5(controllingId, ruleId);
        if (StringLib.isNotEmpty(expressionMD5)) {
            MutablePair<Object, Map<String, Document>> pair = runExpression(controllingId, expressionMD5);
            controllingLogDto.setConditionParamMap(pair.getRight());
            Object result = pair.getLeft();

            if (result != null) {
                if (result instanceof Boolean) {
                    triggered = (Boolean) result;
                } else {
                    String strResult = StringLib.toString(result);
                    strResult = StringLib.lowerCase(strResult);
                    triggered = !StringLib.equalsAny(strResult, "false", "0", "");
                }
            }
        }
        return checkTriggerTypeWithChanged(controllingId, ruleId, triggered);
    }

    private boolean checkTriggerTypeWithChanged(String controllingId, String ruleId, boolean triggered) {
        /*检查变更时触发的逻辑*/
        Document ruleObj = controllingStateService.getRule(controllingId, ruleId);
        String triggerType = DocumentLib.getString(ruleObj, "triggerType");
        if (StringLib.equalsIgnoreCase(triggerType, "changed")) {
            String flagKey = DigestLib.md5Hex(StringLib.join(controllingId, StringLib.SPLIT_1, ruleId));
            Pair<Boolean, Integer> pair = janusChangeCheckService.check(flagKey, triggered);
            if (triggered == true && pair.getLeft() == true) {
                return true;
            }
            return false;
        }
        return triggered;
    }

    private MutablePair runExpression(String controllingId, String expressionMD5) {
        MutablePair<Object, Map<String, Document>> pair = new MutablePair<>();
        Document controllingConfig = controllingStateService.getControllingConfig(controllingId);
        Map<String, Document> parameters = Maps.newHashMap();
        Map<String, Document> aliasParameters = Maps.newHashMap();
        addParameter(parameters, "config", controllingConfig);

        aliasParameters.put("config", controllingConfig);
        Set<String> uuidSet = controllingStateService.getExpressionUuid(expressionMD5);
        for (String uuidChar : uuidSet) {
            /*config作为数据配置，不作为设备数据处理*/
            if (StringLib.equals(uuidChar, "$config$")) {
                continue;
            }
            String alias = StringLib.replace(uuidChar, "$", "");
            String uuid = controllingStateService.getUuidByAlias(controllingId, alias);
            /*得到设备最后一次的数据，作为当前数据的状态*/
            Document uuidData = deviceDataService.loadDeviceLatestData(uuid);
            if (uuidData == null) {
                uuidData = DocumentLib.newDoc();
            }
            uuidData.put("uuid", uuid);
            aliasParameters.put(alias, uuidData);
            addParameter(parameters, uuidChar, uuidData);
        }
        /*调用数据处理器，处理数据*/
        String expression = controllingStateService.getExpressionByMd5(expressionMD5);
        Object returnValue = JavaScriptUtils.runGetObject(expression, parameters);
        pair.setLeft(returnValue);
        pair.setRight(aliasParameters);
        return pair;
    }

    private void addParameter(Map<String, Document> parameters, String key, Document value) {
        if (!StringLib.contains(key, "$")) {
            key = StringLib.join("$", key, "$");
        }
        String paramKey = StringLib.join("P", DigestLib.md5Hex(key));
        parameters.put(paramKey, value);
    }
}
