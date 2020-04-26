package com.cynovan.janus.addons.demos.productManagement.backend.util;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;
import com.cynovan.janus.addons.triton.classification.backend.jdo.QDeviceClassification;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.jms.WebSocketService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.RandomUtils;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.DomainCombiner;
import java.util.ArrayList;
import java.util.List;


public class DataDefinitionDataListener extends AnalysisEventListener<DataDefinitionDataTemplate> {



    private static final Logger LOGGER = LoggerFactory.getLogger(DataDefinitionDataListener.class);
    /**
     * 每隔5条存储数据库，实际使用中可以3000条，然后清理list ，方便内存回收
     */
    private static final int BATCH_COUNT = 3000;
    List<DataDefinitionDataTemplate> list = new ArrayList<DataDefinitionDataTemplate>();
    private WebSocketService webSocketService;


    public DataDefinitionDataListener() {
        this.webSocketService = SpringContext.getBean(WebSocketService.class);
    }

    @Override
    public void invoke(DataDefinitionDataTemplate data, AnalysisContext context) {
        list.add(data);
        if (list.size() >= BATCH_COUNT) {
            saveData();
            list.clear();
        }
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext context) {
        saveData();
        LOGGER.info("数据定义所有数据解析完成！");
        sendMessage("导入数据成功!", "success");
    }

    /**
     * 这里存储数据将所有的从excle中传上来的数据存入这个mongodb中
     */
    private void saveData() {

        LOGGER.info("{}条数据，开始存储数据库！", list.size());
        for (DataDefinitionDataTemplate dataDefinitionDataTemplate : list) {
            Document product= DocumentLib.newDoc();
            String  model= dataDefinitionDataTemplate.getModoel();
            String type=dataDefinitionDataTemplate.getType();
            String productName=dataDefinitionDataTemplate.getProductName();
            String  price =dataDefinitionDataTemplate.getPrice();
            String time =dataDefinitionDataTemplate.getPrice();
            product.put("model",model);
            product.put("type", type);
            product.put("productName", productName);
            product.put("price",price);
            product.put("time", time);
            DBUtils.save("product",product);
            LOGGER.info("产品数据从excel读入成功！产品的值是：  "+product);
        }
    }

    private void sendMessage(String mess, String state) {
        ObjectNode message = JsonLib.createObjNode();
        message.put("message", mess);
        message.put("state", state);
        webSocketService.pushMessage("importDataStruct/productImport" , message);
    }

}
