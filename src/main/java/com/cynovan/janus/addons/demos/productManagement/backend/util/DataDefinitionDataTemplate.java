package com.cynovan.janus.addons.demos.productManagement.backend.util;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;


@ColumnWidth(20)
public class DataDefinitionDataTemplate {
//    @ExcelProperty("数据ID")
//    private String id;
    @ExcelProperty("产品型号")
    private String modoel;
    @ExcelProperty("产品类型")
    private String type;
    @ExcelProperty("产品名称")
    private String productName;
    @ExcelProperty("产品价格")
    private String price;
    @ExcelProperty("最近的更新时间")
    private String time;

//    public String getId() {
//        return id;
//    }

//    public void setId(String id) {
//        this.id = id;
//    }

    public String getModoel() {
        return modoel;
    }

    public void setModoel(String modoel) {
        this.modoel = modoel;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    @Override
    public String toString() {
        return "DataDefinitionDataTemplate{" +
                "modoel='" + modoel + '\'' +
                ", type='" + type + '\'' +
                ", productName='" + productName + '\'' +
                ", price='" + price + '\'' +
                ", time='" + time + '\'' +
                '}';
    }
}
