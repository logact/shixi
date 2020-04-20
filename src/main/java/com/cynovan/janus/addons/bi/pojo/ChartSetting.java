package com.cynovan.janus.addons.bi.pojo;

import com.cynovan.janus.addons.bi.constant.AggregationSettingDateTypeEnum;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.util.List;

/**
 * @author ian.lan@cynovan.com
 */
public class ChartSetting implements Serializable {

    private String uuid;
    @JsonProperty("data_mode")
    private String dataMode;
    private String type;
    private String theme;
    @JsonProperty("date_type")
    private AggregationSettingDateTypeEnum dateType;
    private String start;
    private String end;
    private String chart;
    private String title;
    private Integer width;
    private Integer height;
    private Boolean remove;
    private Boolean setting;

    private List<AxisItem> xAxisItems;
    private List<AxisItem> yAxisItems;

    public String getUuid() {
        return uuid;
    }

    public String getDataMode() {
        return dataMode;
    }

    public String getType() {
        return type;
    }

    public String getTheme() {
        return theme;
    }

    public AggregationSettingDateTypeEnum getDateType() {
        return dateType;
    }

    public String getStart() {
        return start;
    }

    public String getEnd() {
        return end;
    }

    public String getChart() {
        return chart;
    }

    public String getTitle() {
        return title;
    }

    public Integer getWidth() {
        return width;
    }

    public Integer getHeight() {
        return height;
    }

    public Boolean getRemove() {
        return remove;
    }

    public Boolean getSetting() {
        return setting;
    }

    public List<AxisItem> getxAxisItems() {
        return xAxisItems;
    }

    public List<AxisItem> getyAxisItems() {
        return yAxisItems;
    }

}
