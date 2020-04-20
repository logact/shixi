package com.cynovan.janus.addons.bi.constant;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * @author ian.lan@cynovan.com
 */

public enum AggregationSettingDateTypeEnum {


    /**
     * D1: 今天， D2: 昨天， D3: 过去7天， D4: 过去30天， D5: 过去60天， D6: 过去90天， D7：过去180天， D100：指定日期范围
     */

    @JsonProperty("D1")
    TODAY("D1", 0),

    @JsonProperty("D2")
    YESTERDAY("D2", 1),

    @JsonProperty("D3")
    LAST7DAYS("D2", 7),

    @JsonProperty("D4")
    LAST30DAYS("D2", 30),

    @JsonProperty("D5")
    LAST60DAYS("D2", 60),

    @JsonProperty("D6")
    LAST90DAYS("D2", 90),

    @JsonProperty("D7")
    LAST180DAYS("D2", 180),

    @JsonProperty("D100")
    RANGES("D100", 0);

    private String type;
    private Integer days;

    AggregationSettingDateTypeEnum(String type, Integer days) {
        this.type = type;
        this.days = days;
    }

    public String getType() {
        return type;
    }

    public Integer getDays() {
        return days;
    }
}
