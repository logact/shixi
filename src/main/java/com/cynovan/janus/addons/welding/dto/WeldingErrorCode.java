package com.cynovan.janus.addons.welding.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.metadata.BaseRowModel;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.apache.poi.ss.usermodel.CellStyle;

import java.util.HashMap;
import java.util.Map;

/**
 * @author ian.lan@cynovan.com
 * @date 2018-11-07
 */
public class WeldingErrorCode extends BaseRowModel {

    @ExcelProperty(index = 0)
    public String code;
    @ExcelProperty(index = 1)
    public String info;
    @ExcelProperty(index = 2)
    public String reason;
    @ExcelProperty(index = 3)
    public String solution;

    @JsonIgnore
    private Map<Integer, CellStyle> cellStyleMap = new HashMap();

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getInfo() {
        return info;
    }

    public void setInfo(String info) {
        this.info = info;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getSolution() {
        return solution;
    }

    public void setSolution(String solution) {
        this.solution = solution;
    }
}
