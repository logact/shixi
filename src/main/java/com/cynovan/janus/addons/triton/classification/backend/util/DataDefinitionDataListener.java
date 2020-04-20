package com.cynovan.janus.addons.triton.classification.backend.util;

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

import java.util.ArrayList;
import java.util.List;


public class DataDefinitionDataListener extends AnalysisEventListener<DataDefinitionDataTemplate> {

    public DataDefinitionDataListener(String classificationId) {
        this.classificationId = classificationId;
        this.webSocketService = SpringContext.getBean(WebSocketService.class);
    }

    private static final Logger LOGGER = LoggerFactory.getLogger(DataDefinitionDataListener.class);
    /**
     * 每隔5条存储数据库，实际使用中可以3000条，然后清理list ，方便内存回收
     */
    private static final int BATCH_COUNT = 3000;
    List<DataDefinitionDataTemplate> list = new ArrayList<DataDefinitionDataTemplate>();
    private String classificationId;
    private WebSocketService webSocketService;

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
     * 加上存储数据库
     */
    private void saveData() {
        LOGGER.info("{}条数据，开始存储数据库！", list.size());
        Document details = DocumentLib.newDoc();
        List detailsArray = new ArrayList();
        for (DataDefinitionDataTemplate dataDefinitionDataTemplate : list) {
            if (dataDefinitionDataTemplate.isEmpty()) {
                continue;
            }

            Document d = DocumentLib.newDoc();
            String rule = dataDefinitionDataTemplate.getRule();
            String uuid = RandomUtils.uuid8char();
            d.put("id", uuid);
            d.put("name", dataDefinitionDataTemplate.getDataName());
            d.put("key", dataDefinitionDataTemplate.getDataId());
            d.put("suffix", dataDefinitionDataTemplate.getUnitSymbol());
            d.put("rule_name", dataDefinitionDataTemplate.getDateType());
            d.put("rule", rule);

            if (rule.equals("number")) {
                String decimal = dataDefinitionDataTemplate.getDecimalCount();
                d.put("decimal", decimal);
            } else if (rule.equals("enum")) {
                String enumeration_data = dataDefinitionDataTemplate.getEnumerationData();
                List values = JsonLib.parseArray(enumeration_data, Document.class);
                d.put("values", values);
            }
            detailsArray.add(d);
        }

        details.put("details", list);
        DBUtils.updateOne(
                QDeviceClassification.collectionName,
                DocumentLib.newDoc("_id", classificationId),
                DocumentLib.new$Set("data_definition.details", detailsArray)
        );
        LOGGER.info("存储数据库成功！");
    }

    private void sendMessage(String mess, String state) {
        ObjectNode message = JsonLib.createObjNode();
        message.put("message", mess);
        message.put("state", state);
        webSocketService.pushMessage("importDataStruct/" + this.classificationId, message);
    }

}
