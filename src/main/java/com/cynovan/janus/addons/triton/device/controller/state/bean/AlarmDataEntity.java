package com.cynovan.janus.addons.triton.device.controller.state.bean;


import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import com.cynovan.janus.base.utils.StringLib;

public class AlarmDataEntity {

    @ColumnWidth(15)
    @ExcelProperty("状态")
    private String shouldAlarm;
    @ColumnWidth(25)
    @ExcelProperty("状态值")
    private String alarmValue;
    @ColumnWidth(25)
    @ExcelProperty("状态描述")
    private String alarmName;

    public String getAlarmValue() {
        return alarmValue;
    }

    public void setAlarmValue(String alarmValue) {
        this.alarmValue = alarmValue;
    }

    public String getAlarmName() {
        return alarmName;
    }

    public void setAlarmName(String alarmName) {
        this.alarmName = alarmName;
    }

    public String getShouldAlarm() {
        return shouldAlarm;
    }

    public void setShouldAlarm(String shouldAlarm) {
        this.shouldAlarm = shouldAlarm;
    }

    public boolean isEmpty() {
        return shouldAlarm == null || alarmValue == null || alarmName == null;
    }

    public String getStateSetting() {
        if (StringLib.equals(shouldAlarm, "正常")) {
            return "normal";
        } else if (StringLib.equals(shouldAlarm, "警告")) {
            return "warning";
        } else if (StringLib.equals(shouldAlarm, "报警")) {
            return "alarm";
        } else {
            return "normal";
        }
    }
}
