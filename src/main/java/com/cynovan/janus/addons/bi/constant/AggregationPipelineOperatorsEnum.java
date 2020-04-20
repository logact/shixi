package com.cynovan.janus.addons.bi.constant;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * mongodb aggregation pipeline operators
 *
 * @author ian.lan@cynovan.com
 */

public enum AggregationPipelineOperatorsEnum {

    /**
     * COUNT: 计数
     * AVG: 平均值
     * SUM: 求和
     * MIN: 最小值
     * MAX: 最大值
     */
    @JsonProperty("$count")
    COUNT("$count"),
    @JsonProperty("$avg")
    AVG("$avg"),
    @JsonProperty("$sum")
    SUM("$sum"),
    @JsonProperty("$min")
    MIN("$min"),
    @JsonProperty("$max")
    MAX("$max");

    private String operator;

    AggregationPipelineOperatorsEnum(String operator) {
        this.operator = operator;
    }
}
