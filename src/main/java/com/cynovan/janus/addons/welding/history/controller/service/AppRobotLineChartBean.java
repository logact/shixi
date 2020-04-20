package com.cynovan.janus.addons.welding.history.controller.service;

import com.cynovan.janus.base.appstore.service.AppDataService;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.devicedata.jdo.QDeviceData;
import com.cynovan.janus.base.devicedata.jdo.QDeviceSampling;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.mongodb.client.model.Sorts;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.compress.utils.Lists;
import org.bson.Document;

import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

public class AppRobotLineChartBean {

    private Document params;

    private String uuid;
    private Long start;
    private Long end;

    private Document configDocument;

    private List<Document> dataList = Lists.newArrayList();

    private List<Document> originDataList = Lists.newArrayList();
    private List<Document> samplingDataList = Lists.newArrayList();

    private List<String> chartFields = Lists.newArrayList();

    private Set<String> samplingFields;

    public AppRobotLineChartBean(Document _params) {
        this.params = _params;
        initialize();
    }

    private void initialize() {
        this.uuid = DocumentLib.getString(params, "uuid");
        this.start = DocumentLib.getLong(params, "start");
        this.end = DocumentLib.getLong(params, "end");

        chartFields.add("118_Par_WeldingCurrent");
        chartFields.add("119_Par_WeldingVoltage");
        chartFields.add("191_Status_WeldingCurrent_NoFilter");
        chartFields.add("192_Status_WeldingVoltage_NoFilter");
        chartFields.add("174_WireFeedSpeed");
        chartFields.add("175_WireFeedCurrent");
        chartFields.add("157_WeldingSpeed");
        chartFields.add("076_LineVelocity");
        chartFields.add("180_WelderTemperature");
        chartFields.add("181_WelderFanSpeed");
    }

    public List<Document> getData() {
        loadConfig();
        loadData();
        mergeData();
        return dataList;
    }

    private void loadConfig() {
        AppDataService appDataService = SpringContext.getBean(AppDataService.class);
        configDocument = appDataService.get("weld_robot_history_config");

        Document samplingConfig = DocumentLib.getDocument(configDocument, "sampling_data");
        samplingFields = samplingConfig.keySet();
    }

    private void loadData() {
        loadOriginData();
        loadSampingDataList();
    }

    private void mergeData() {
        /*合并两个密度不一样的数据*/
        dataList.addAll(originDataList);
        dataList.addAll(samplingDataList);

        if (dataList.size() < 2 || originDataList.size() == 0 || samplingDataList.size() == 0) {
            return;
        }
        /*进行数据排序*/
        dataList.sort((o1, o2) -> {
            Date date1 = DocumentLib.getDate(o1, "time");
            Date date2 = DocumentLib.getDate(o2, "time");
            return date1.compareTo(date2);
        });

        /*进行数据补充*/
        Document fullRecord = null;
        for (int i = 0; i < dataList.size(); i++) {
            Document row = dataList.get(i);
            Document rowData = DocumentLib.getDocument(row, "data");
            /*如果是第一条数据，则要合并后一条数据*/
            if (fullRecord != null) {
                Document newRowData = new Document(fullRecord);
                newRowData.putAll(rowData);
                rowData = newRowData;
                row.put("data", rowData);
            }
            fullRecord = new Document(rowData);
        }
    }

    private void loadOriginData() {
        Document query = DocumentLib.newDoc();
        query.put("uuid", uuid);
        Document timeQuery = DocumentLib.newDoc();
        timeQuery.put("$gte", new Date(start));
        timeQuery.put("$lte", new Date(end));
        query.put("time", timeQuery);

        Document projection = DocumentLib.newDoc();
        projection.put("_id", 1);
        projection.put("time", 1);
        projection.put("data.101_Status_DI_ArcWeldingStart", 1);
        projection.put("data.188_Status_DI_ArcWelding_Status", 1);

        chartFields.stream().forEach(field -> {
            if (!samplingFields.contains(field)) {
                projection.put("data." + field, 1);
            }
        });
        originDataList = DBUtils.list(QDeviceData.collectionName, query, projection, Sorts.ascending("time"));
    }

    private void loadSampingDataList() {
        /*找到不同的数据栏位列表*/
        if (CollectionUtils.isNotEmpty(samplingFields)) {
            Document query = DocumentLib.newDoc();
            query.put("uuid", uuid);
            Document timeQuery = DocumentLib.newDoc();
            timeQuery.put("$gte", new Date(start));
            timeQuery.put("$lte", new Date(end));
            query.put("data.time", timeQuery);

            Document projection = DocumentLib.newDoc();
            samplingFields.stream().forEach(field -> {
                if (chartFields.contains(field)) {
                    projection.put("data." + field, 1);
                }
            });
            projection.put("data.time", 1);
            projection.put("_id", 1);
            List<Document> list = DBUtils.list(QDeviceSampling.collectionName, query, projection, Sorts.ascending("time"));

            list.stream().forEach(item -> {
                List<Document> subList = DocumentLib.getList(item, "data");
                String itemId = DocumentLib.getID(item);
                if (CollectionUtils.isNotEmpty(subList)) {
                    AtomicInteger index = new AtomicInteger();
                    subList.stream().forEach(dataItem -> {
                        Document deviceData = DocumentLib.newDoc();
                        deviceData.put("time", DocumentLib.getDate(dataItem, "time"));
                        deviceData.put("id", StringLib.join(itemId, "_", index.get()));
                        DocumentLib.remove(dataItem, "time", "index");
                        deviceData.put("data", dataItem);
                        samplingDataList.add(deviceData);
                        index.incrementAndGet();
                    });
                }
            });
        }
    }
}
