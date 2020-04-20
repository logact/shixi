package com.cynovan.janus.addons.triton.device.controller.state.bean;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.jms.WebSocketService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

public class ReadExcelOfAlarmDataListener extends AnalysisEventListener<AlarmDataEntity> {

    private String classificationId;
    private static final Logger LOGGER = LoggerFactory.getLogger(ReadExcelOfAlarmDataListener.class);

    List<AlarmDataEntity> list = new ArrayList<AlarmDataEntity>();
    private WebSocketService webSocketService;


    public ReadExcelOfAlarmDataListener(String classificationId) {
        this.classificationId = classificationId;
        this.webSocketService = SpringContext.getBean(WebSocketService.class);
        sendMessage("开始解析数据", "success");
    }

    @Override
    public void invoke(AlarmDataEntity alarmDataEntity, AnalysisContext analysisContext) {
        if (alarmDataEntity.isEmpty()) {
            return;
        }
        if (null == alarmDataEntity.getAlarmName()) {
            sendMessage("数据不完整", "error");
        } else {
            list.add(alarmDataEntity);
        }
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext analysisContext) {
        saveData();
        LOGGER.info("数据解析完成,已全部存入数据库！");
        sendMessage("导入数据成功!", "finished");
    }

    public String getClassificationId() {
        return classificationId;
    }

    public void saveData() {
        LOGGER.info("已解析{}条数据，开始存储数据库！", list.size());
        Document save = DocumentLib.newDoc();
        List<Document> itemList = new ArrayList<Document>();
        list.forEach(item -> {
            Document d = DocumentLib.newDoc();
            d.put("alarmName", item.getAlarmName());
            d.put("alarmValue", item.getAlarmValue());
            d.put("stateSetting", item.getStateSetting());

            itemList.add(d);
        });
        save.put("alarm.alarmList", itemList);
        DBUtils.updateOne("deviceClassification", DocumentLib.newDoc("id", classificationId), DocumentLib.new$Set(save));
    }

    private void sendMessage(String mess, String state) {
        ObjectNode message = JsonLib.createObjNode();
        message.put("message", mess);
        message.put("state", state);
        webSocketService.pushMessage("importDataStruct/" + this.classificationId, message);
    }

}
