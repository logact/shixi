package com.cynovan.janus.addons.bi.bean;

import com.cynovan.janus.addons.bi.utils.BIUtils;
import com.cynovan.janus.base.devicedata.jdo.QDeviceData;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Lists;
import com.mongodb.client.model.Sorts;
import org.bson.Document;

import java.text.ParseException;
import java.util.Date;
import java.util.List;

public class OriginValueChartBean {

    private ObjectNode chartSettingBox;
    private String uuid;

    private Document data = DocumentLib.newDoc();
    private List<List<Object>> dataList = Lists.newArrayList();

    private List<String> fieldList = Lists.newArrayList();

    public OriginValueChartBean(ObjectNode _chartSettingBox) {
        chartSettingBox = _chartSettingBox;
        initialize();
    }

    private void initialize() {
        uuid = JsonLib.getString(chartSettingBox, "uuid");
        loadData();
    }

    private Document getProjector() {
        Document projector = DocumentLib.newDoc();
        projector.put("time", 1);
        projector.put("create_time", 1);

        fieldList.add("time");

        ArrayNode yAxisItems = JsonLib.getArrayNode(chartSettingBox, "yAxisItems");
        if (yAxisItems != null && yAxisItems.size() > 0) {
            yAxisItems.forEach(yItem -> {
                String field = JsonLib.getString(yItem, "id");
                if (StringLib.isNotEmpty(field)) {
                    fieldList.add(field);
                    projector.put(StringLib.join("data.", field), 1);
                }
            });
        }
        return projector;
    }

    private void loadData() {
        Document filter = BIUtils.getQueryFilter(chartSettingBox);
        Document projector = getProjector();
        long total = DBUtils.count(QDeviceData.collectionName, filter);


        data.put("total", total);

        int pageSize = JsonLib.getInteger(chartSettingBox, "pageSize");
        if (pageSize <= 0) {
            /*默认一万条数据*/
            pageSize = 10000;
        }

        int page = JsonLib.getInteger(chartSettingBox, "page");
        if (page <= 0) {
            page = 1;
        }

        Date recordLastTime = null;
        String lastTimeParam = JsonLib.getString(chartSettingBox, "last_time");
        if (StringLib.isNotEmpty(lastTimeParam)) {
            try {
                recordLastTime = DateUtils.parseDate(lastTimeParam, DateUtils.DateTimePattern);
            } catch (ParseException e) {

            }
        }

        int skip = (page - 1) * pageSize;
        if (recordLastTime != null) {
            /*如果用户传入了最后一页data，则不skip*/
            if (filter.containsKey("time")) {
                Document timeFilter = (Document) filter.get("time");
                timeFilter.put("$gte", recordLastTime);
                skip = 0;
            }
        }

        data.put("page", page);
        data.put("pageSize", pageSize);

        ArrayListMultimap<String, Object> valueMultiMap = ArrayListMultimap.create();
        List<Document> originList = DBUtils.list(QDeviceData.collectionName, filter, projector, Sorts.ascending("time"), pageSize, skip);
        originList.stream().forEach(row -> {
            Document rowData = DocumentLib.getDocument(row, "data");
            fieldList.stream().forEach(field -> {
                if (StringLib.equals(field, "time")) {
                    valueMultiMap.put(field, processTimeFormat(row));
                } else {
                    Object value = rowData.get(field);
                    valueMultiMap.put(field, value);
                }
            });
        });

        if (originList.size() > 0) {
            Document lastObject = originList.get(originList.size() - 1);
            try {
                Date time = (Date) lastObject.getDate("time");
                if (time != null) {
                    data.put("last_time", DateUtils.formatDateTime(time));
                }
            } catch (Exception e) {
            }
        }

        fieldList.stream().forEach(field -> {
            dataList.add(valueMultiMap.get(field));
        });
    }

    private String processTimeFormat(Document row) {
        String value = null;
        Object timeObj = row.get("time");
        if (timeObj == null) {
            timeObj = row.get("create_time");
        }
        if (timeObj != null) {
            if (timeObj instanceof String) {
                return timeObj.toString();
            }

            if (timeObj instanceof Date) {
                return DateUtils.formatDate((Date) timeObj, "HH:mm:ss.SSS");
            }
        }
        return value;
    }

    public Document getData() {
        data.put("data", dataList);
        return data;
    }
}
