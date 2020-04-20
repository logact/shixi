package com.cynovan.janus.addons.production_line_automation.dto;

import com.cynovan.janus.base.utils.DocumentLib;
import com.google.common.collect.Maps;
import org.bson.Document;

import java.util.Date;
import java.util.Map;

public class ControllingLogDto {

    private Date create_date = new Date();
    private Document controlling;
    private String controlling_id;
    private String rule_id;

    private String key;

    private Map<String, Document> conditionParamMap = Maps.newHashMap();

    private Map<String, Document> pushParam = Maps.newHashMap();

    private Document pushData = DocumentLib.newDoc();

    private Boolean conditionResult = true;

    public void addConditionParam(String key, Document value) {
        conditionParamMap.put(key, value);
    }

    public Date getCreate_date() {
        return create_date;
    }

    public void setCreate_date(Date create_date) {
        this.create_date = create_date;
    }

    public String getControlling_id() {
        return controlling_id;
    }

    public void setControlling_id(String controlling_id) {
        this.controlling_id = controlling_id;
    }

    public void addPushParam(String key, Document value) {
        pushParam.put(key, value);
    }

    public Map<String, Document> getPushParam() {
        return pushParam;
    }

    public void setPushParam(Map<String, Document> pushParam) {
        this.pushParam = pushParam;
    }

    public String getRule_id() {
        return rule_id;
    }

    public void setRule_id(String rule_id) {
        this.rule_id = rule_id;
    }

    public Map<String, Document> getConditionParamMap() {
        return conditionParamMap;
    }

    public void setConditionParamMap(Map<String, Document> conditionParamMap) {
        this.conditionParamMap = conditionParamMap;
    }

    public Document getPushData() {
        return pushData;
    }

    public void setPushData(Document pushData) {
        this.pushData = pushData;
    }

    public Boolean getConditionResult() {
        return conditionResult;
    }

    public void setConditionResult(Boolean conditionResult) {
        this.conditionResult = conditionResult;
    }

    public Document getControlling() {
        return controlling;
    }

    public void setControlling(Document controlling) {
        this.controlling = controlling;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }
}
