package com.cynovan.janus.addons.bi.pojo;

import com.cynovan.janus.addons.bi.constant.AggregationPipelineOperatorsEnum;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * @author ian.lan@cynovan.com
 */
public class AxisItem {

    private String id;
    private String name;
    @JsonProperty("time_format")
    private String timeFormat;
    private String type;
    private AggregationPipelineOperatorsEnum statis;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTimeFormat() {
        return timeFormat;
    }

    public void setTimeFormat(String timeFormat) {
        this.timeFormat = timeFormat;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public AggregationPipelineOperatorsEnum getStatis() {
        return statis;
    }

    public void setStatis(AggregationPipelineOperatorsEnum statis) {
        this.statis = statis;
    }

    public Boolean isTimeAxis() {
        return StringLib.equals("time", id);
    }
}
