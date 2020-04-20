package com.cynovan.janus.base.controlling.service;

import com.cynovan.janus.base.utils.DigestLib;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.*;
import com.google.re2j.Matcher;
import com.google.re2j.Pattern;
import org.bson.Document;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

/*
为了分离总控的逻辑复杂性
该Service只保留所有的总控数据解析以及状态信息，不处理任何逻辑

总控配置有任何变动，通知该类即可
*/

@Component
public class ControllingStateService {

    /*设备别名的映射,key1为别名，key2位controllingID,value为uuid,通过该Table，可以使用别名+总控ID，获得对应的UUID*/
    private static Table<String, String, String> deviceAliasTable = HashBasedTable.create();

    private static Map<String, Document> controllingMap = Maps.newHashMap();

    /*设备别名的映射,key1为uuid，key2位controllingID,value为别名,通过该Table，可以使用uuid+总控ID，获得对应的别名*/
    private static Table<String, String, String> deviceAliasTable2 = HashBasedTable.create();

    /*设备UUID以及要计算的规则的Table。 key1为UUID，key2为Controlling ID， value为RuleID*/
    private static Table<String, String, List<String>> deviceDataDriveRuleTable = HashBasedTable.create();

    /*规则触发条件的公式，key1为总控ID，key2为RuleID，value为公式的MD5*/
    private static Table<String, String, String> ruleConditionExpressionTable = HashBasedTable.create();

    /*下发数据的公式，key1为总控ID，key2位RuleID，value为公式的MD5*/
    private static Table<String, String, String> rulePushExpressionTable = HashBasedTable.create();

    /*key1为controlling id,key2 为rule id , value 为下发数据的设备别名列表*/
    private static Table<String, String, List<String>> rulePushDeviceTable = HashBasedTable.create();

    /*key为公式的MD5，value为公式本身*/
    private static Map<String, String> expressionMap = Maps.newHashMap();

    /*key1为公式的MD5值，value为公式中所有的uuid列表set*/
    private static HashMultimap<String, String> expressionUuidMap = HashMultimap.create();

    /*设备UUID以及要计算的规则的Table。 key1为controllingId，ruleId， value为Rule的配置*/
    private static Table<String, String, Document> deviceTimePushRuleTable = HashBasedTable.create();

    /*key1 为controllingId，key2为ruleId，value为rule*/
    public static Table<String, String, Document> controllingRuleTable = HashBasedTable.create();

    /*每个总控都会有config的配置，总控在计算时，使用总控对应的config*/
    private static Map<String, Document> controllingConfigMap = Maps.newHashMap();

    public Set<String> getExpressionUuid(String expressionMd5) {
        return expressionUuidMap.get(expressionMd5);
    }

    public Document getControllingConfig(String controllingId) {
        Document config = controllingConfigMap.get(controllingId);
        if (config == null) {
            return DocumentLib.newDoc();
        }
        return config;
    }

    public Table<String, String, List<String>> getDeviceDataDriveRuleTable() {
        return deviceDataDriveRuleTable;
    }

    public String getRuleConditionExpressionMD5(String controllingId, String ruleId) {
        return ruleConditionExpressionTable.get(controllingId, ruleId);
    }

    public String getRulePushExpression(String controllingId, String ruleId) {
        return rulePushExpressionTable.get(controllingId, ruleId);
    }

    public String getUuidByAlias(String controllingId, String alias) {
        return deviceAliasTable.get(alias, controllingId);
    }

    public String getAliasByUuid(String controllingId, String uuid) {
        return deviceAliasTable2.get(uuid, controllingId);
    }

    public String getExpressionByMd5(String md5) {
        return expressionMap.get(md5);
    }

    public List<String> getPushDeviceList(String controllingId, String ruleId) {
        return rulePushDeviceTable.get(controllingId, ruleId);
    }

    public Document getControlling(String controllingId) {
        return controllingMap.get(controllingId);
    }

    /*总控失效时，调用该方法即可*/
    public void unregisterControlling(String controllingId) {
        controllingConfigMap.remove(controllingId);
        controllingMap.remove(controllingId);
        removeByColKey(deviceAliasTable, controllingId);
        removeByColKey(deviceAliasTable2, controllingId);
        removeByColKey(deviceDataDriveRuleTable, controllingId);

        removeByRowKey(ruleConditionExpressionTable, controllingId);
        removeByRowKey(rulePushExpressionTable, controllingId);
        removeByRowKey(rulePushDeviceTable, controllingId);
        removeByRowKey(deviceTimePushRuleTable, controllingId);

        removeByRowKey(controllingRuleTable, controllingId);

        unregisterExpression();
    }

    public Table<String, String, Document> getScheduleTable() {
        return deviceTimePushRuleTable;
    }

    /*所有的总控，公式是使用一份，所以每次反注册之后，要检查公式的内容，防止公式列表冗余过多*/
    private void unregisterExpression() {
        Set<String> totalList = Sets.newHashSet();
        totalList.addAll(ruleConditionExpressionTable.values());
        totalList.addAll(rulePushExpressionTable.values());

        Set<String> storeList = expressionMap.keySet();
        Sets.newHashSet(storeList).stream().forEach(storeKey -> {
            if (!totalList.contains(storeKey)) {
                expressionMap.remove(storeKey);
                expressionUuidMap.removeAll(storeKey);
            }
        });
    }

    private void removeByRowKey(Table table, String rowKey) {
        Set colKeySet = table.columnKeySet();
        if (!colKeySet.isEmpty()) {
            Object[] a = colKeySet.toArray();
            for (int i = 0, len = a.length; i < len; i++) {
                table.remove(rowKey, a[i]);
            }
        }
    }

    private void removeByColKey(Table table, String colKey) {
        Set rowKeySet = table.rowKeySet();
        if (!rowKeySet.isEmpty()) {
            Object[] a = rowKeySet.toArray();
            for (int i = 0, len = a.length; i < len; i++) {
                table.remove(a[i], colKey);
            }
        }
    }

    /*总控生效时，调用该方法即可*/
    public void registerControlling(Document controlling) {
        String controllingId = DocumentLib.getID(controlling);

        controllingMap.put(controllingId, controlling);

        /*配置文件*/
        String configStr = DocumentLib.getString(controlling, "config");
        Document config = null;
        if (StringLib.isNotEmpty(configStr)) {
            config = DocumentLib.parse(configStr);
        }
        if (config == null) {
            config = DocumentLib.newDoc();
        }
        controllingConfigMap.put(controllingId, config);

        /*别名的映射*/
        List deviceAliasList = DocumentLib.getList(controlling, "devices");
        if (deviceAliasList != null && deviceAliasList.size() > 0) {
            deviceAliasList.stream().forEach(alias -> {
                Document aliasItem = (Document) alias;
                String aliasName = DocumentLib.getString(aliasItem, "alias");
                String uuid = DocumentLib.getString(aliasItem, "uuid");
                deviceAliasTable.put(aliasName, controllingId, uuid);
                deviceAliasTable2.put(uuid, controllingId, aliasName);
            });
        }

        /*规则的处理逻辑*/
        List rules = DocumentLib.getList(controlling, "rules");
        if (rules.size() > 0) {
            rules.stream().forEach(ruleItem -> {
                Document ruleItemObj = (Document) ruleItem;
                String ruleId = DocumentLib.getString(ruleItemObj, "rule_id");

                String triggerRule = DocumentLib.getString(ruleItemObj, "triggerRule");
                if (StringLib.equals(triggerRule, "data_drive")) {
                    List relatedDevices = DocumentLib.getList(ruleItemObj, "relatedDevice");
                    if (relatedDevices != null && relatedDevices.size() > 0) {
                        relatedDevices.stream().forEach(device -> {
                            Document relateDeviceItem = (Document) device;
                            String aliasName = DocumentLib.getString(relateDeviceItem, "name");
                            /*通过别名以及总控ID获得设备的UUID*/
                            String uuid = deviceAliasTable.get(aliasName, controllingId);

                            List<String> ruleIdList = deviceDataDriveRuleTable.get(uuid, controllingId);
                            if (ruleIdList == null) {
                                ruleIdList = Lists.newArrayList();
                            }
                            ruleIdList.add(ruleId);
                            deviceDataDriveRuleTable.put(uuid, controllingId, ruleIdList);
                        });
                    }
                } else {
                    /*定时任务*/
                    deviceTimePushRuleTable.put(controllingId, ruleId, ruleItemObj);
                }

                controllingRuleTable.put(controllingId, ruleId, ruleItemObj);

                List pushDeviceList = DocumentLib.getList(ruleItemObj, "pushDevice");
                if (pushDeviceList != null && pushDeviceList.size() > 0) {
                    pushDeviceList.stream().forEach(device -> {
                        Document pushDeviceItem = (Document) device;
                        String aliasName = DocumentLib.getString(pushDeviceItem, "name");
                        /*通过别名以及总控ID获得设备的UUID*/
                        List<String> pushList = rulePushDeviceTable.get(controllingId, ruleId);
                        if (pushList == null) {
                            pushList = Lists.newArrayList();
                        }
                        pushList.add(aliasName);
                        rulePushDeviceTable.put(controllingId, ruleId, pushList);
                    });
                }

                String triggerConditionExpression = DocumentLib.getString(ruleItemObj, "triggerCondition");
                if (StringLib.isNotEmpty(triggerConditionExpression)) {
                    String expressionMd5 = processExpression(triggerConditionExpression);
                    ruleConditionExpressionTable.put(controllingId, ruleId, expressionMd5);
                }

                String pushProcessExpression = DocumentLib.getString(ruleItemObj, "pushProcess");
                if (StringLib.isNotEmpty(pushProcessExpression)) {
                    String expressionMd5 = processExpression(pushProcessExpression);
                    rulePushExpressionTable.put(controllingId, ruleId, expressionMd5);
                }
            });
        }
    }

    public Document getRule(String controllingid, String ruleId) {
        return controllingRuleTable.get(controllingid, ruleId);
    }

    private String processExpression(String processExpression) {
        Set<String> uuidSet = findAllUUID(processExpression);
        /*replace all uuid to target*/
        for (String uuid : uuidSet) {
            String uuidReplace = StringLib.join("P", DigestLib.md5Hex(uuid));
            processExpression = StringLib.replace(processExpression, uuid, uuidReplace);
        }

        String expressionMd5 = DigestLib.md5Hex(processExpression);
        expressionUuidMap.putAll(expressionMd5, uuidSet);
        expressionMap.put(expressionMd5, processExpression);
        return expressionMd5;
    }

    private Set<String> findAllUUID(String processExpression) {
        Pattern pattern = Pattern.compile("\\$(.*?)\\$");
        Matcher matcher = pattern.matcher(processExpression);
        Set<String> uuidSet = Sets.newHashSet();
        while (matcher.find()) {
            uuidSet.add(matcher.group());
        }
        return uuidSet;
    }
}
