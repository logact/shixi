package com.cynovan.janus.addons.triton.classification.backend.util;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;


@ColumnWidth(20)
public class DataDefinitionDataTemplate {
    @ExcelProperty("数据ID")
    private String dataId;
    @ExcelProperty("数据名称")
    private String dataName;
    @ExcelProperty("数据类型")
    private String dateType;
    @ExcelProperty("单位符号")
    private String unitSymbol;
    @ExcelProperty("保留小数位")
    private String decimalPlace;
    @ColumnWidth(40)
    @ExcelProperty("枚举数据")
    private String enumerationData;

    public void setDataId(String dataId) {
        this.dataId = subZeroAndDot(dataId);
    }

    public void setDataName(String dataName) {
        this.dataName = dataName;
    }

    public void setDateType(String dateType) {
        this.dateType = dateType;
    }

    public void setUnitSymbol(String unitSymbol) {
        this.unitSymbol = unitSymbol;
    }

    public void setDecimalPlace(String decimalPlace) {
        this.decimalPlace = decimalPlace;
    }

    public void setEnumerationData(String enumerationData) {
        this.enumerationData = enumerationData;
    }

    public String getDataId() {
        return dataId;
    }

    public String getDataName() {
        return dataName;
    }

    public String getDateType() {
        return dateType;
    }

    public String getUnitSymbol() {
        return unitSymbol == null ? "" : this.unitSymbol;
    }

    public String getDecimalPlace() {
        return decimalPlace == null ? "" : this.decimalPlace;
    }

    public String getEnumerationData() {
        return enumerationData == null ? "[]" : this.enumerationData;
    }

    public String getRule() {
        String rule = "str";
        switch (dateType) {
            case "布尔类型":
                rule = "boo";
                break;
            case "数字":
                rule = "number";
                break;
            case "枚举":
                rule = "enum";
                break;
        }
        return rule;
    }

    /**
     * 使用java正则表达式去掉多余的.与0
     *
     * @param s
     * @return s
     */
    public static String subZeroAndDot(String s) {
        if (s.indexOf(".") > 0) {
            s = s.replaceAll("0+?$", "");
            s = s.replaceAll("[.]$", "");
        }
        return s;
    }

    public boolean isEmpty() {
        if (dataId == null || dataName == null || dateType == null) {
            return true;
        }
        return false;
    }

    public String getDecimalCount() {
        String decimal_place = this.getDecimalPlace();
        String decimal = "0";
        switch (decimal_place) {
            case "保留1位小数":
                decimal = "1";
                break;
            case "保留2位小数":
                decimal = "2";
                break;
            case "保留3位小数":
                decimal = "3";
                break;
            case "保留4位小数":
                decimal = "4";
                break;
            case "保留5位小数":
                decimal = "5";
                break;
        }
        return decimal;
    }

}
