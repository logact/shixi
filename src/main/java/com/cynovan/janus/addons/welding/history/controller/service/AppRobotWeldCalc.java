package com.cynovan.janus.addons.welding.history.controller.service;

import com.cynovan.janus.base.appstore.service.AppDataService;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.utils.*;
import com.google.common.collect.*;
import com.mongodb.client.model.Sorts;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.joda.time.LocalDate;
import org.joda.time.LocalDateTime;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

public class AppRobotWeldCalc {

    private String uuid;

    private int year;
    private int month;
    private int day;

    private LocalDate queryDate;
    private String appDataKey;

    private Date dateStart;
    private Date dateEnd;
    private Document configDocument;
    private Document dayData;
    private boolean isPassedDay = false;
    private List<Document> aggregateNewDataValues = Lists.newArrayList();
    private Multimap<String, Document> aiResultMap = ArrayListMultimap.create();
    private AppDataService appDataService;

    public AppRobotWeldCalc(String _uuid, String _date) {
        uuid = _uuid;
        initialize(_date);
    }

    private void initialize(String _date) {
        initializeVar(_date);
        if (DocumentLib.getBoolean(dayData, "diffed") == false) {
            queryBaseData();
            aggregateValues();
            /*有实际焊接数据的时候才要继续计算*/
            if (aggregateNewDataValues.size() > 0) {
                calcAiResultMap();

                List<Document> newDataList = Lists.newArrayList();
                Document newData = DocumentLib.newDoc("arr", newDataList).append("diffed", isPassedDay);

                aggregateNewDataValues.stream().forEach(obj -> {
                    Date start = DocumentLib.getDate(obj, "start");
                    Date end = DocumentLib.getDate(obj, "end");
                    double delta = (end.getTime() - start.getTime()) / 1000;
                    String barcode = DocumentLib.getString(obj, "_id.barcode");

                    double wireLength = DocumentLib.getDouble(obj, "show_data.176_WireFeedLengthSingleWelding");
                    if (wireLength == 0) {
                        wireLength = DocumentLib.getDouble(obj, "wire.176_WireFeedLengthSingleWelding");
                    }

                    double wireDensity = DocumentLib.getDouble(obj, "show_data.178_WireDensity");
                    if (wireDensity == 0) {
                        wireDensity = DocumentLib.getDouble(obj, "wire.178_WireDensity");
                    }
                    wireDensity = wireDensity * wireLength;

                    String arcTag = DocumentLib.getString(obj, "show_data.141_ArcOn_Time");

                    String start_id = DocumentLib.getString(obj, "start_id");
                    String end_id = DocumentLib.getString(obj, "end_id");
                    Document dataItem = DocumentLib.newDoc();
                    dataItem.put("start", DateUtils.formatDateTime(start));
                    dataItem.put("end", DateUtils.formatDateTime(end));
                    dataItem.put("barcode", barcode);
                    dataItem.put("period", Math.floor(delta * 100) / 100);
                    dataItem.put("uuid", uuid);
                    dataItem.put("start_id", start_id);
                    dataItem.put("end_id", end_id);
                    dataItem.put("wire_length", wireLength);
                    dataItem.put("wire_density", wireDensity);
                    dataItem.put("weldingId", DigestLib.md5Hex(StringLib.joinWith("_", start_id, end_id)));
                    dataItem.put("show_data", DocumentLib.getDocument(obj, "show_data"));
                    dataItem.put("arcTag", arcTag);
                    newDataList.add(dataItem);
                });

                List<Document> existsData = DocumentLib.getList(dayData, "arr");
                if (CollectionUtils.isNotEmpty(existsData)) {
                    Set<String> existsWeldingIds = existsData.stream().map(item -> {
                        return DocumentLib.getString(item, "weldingId");
                    }).collect(Collectors.toSet());

                    Map<String, Document> startIdMap = Maps.newHashMap();
                    existsData.stream().forEach(item -> {
                        startIdMap.put(DocumentLib.getString(item, "start_id"), item);
                    });
                    newDataList.stream().forEach(newItem -> {
                        String start_id = DocumentLib.getString(newItem, "start_id");
                        String weldingId = DocumentLib.getString(newItem, "weldingId");
                        Document oldItem = startIdMap.get(start_id);
                        if (oldItem != null) {
                            if (!StringLib.equalsIgnoreCase(weldingId, DocumentLib.getString(oldItem, "weldingId"))) {
                                existsData.remove(oldItem);
                            }
                            startIdMap.remove(start_id);
                        }
                        if (!existsWeldingIds.contains(weldingId)) {
                            existsWeldingIds.add(weldingId);
                            existsData.add(newItem);
                        }
                    });
                    setAiResult(existsData);
                    appDataService.set(appDataKey, DocumentLib.newDoc("arr", existsData).append("diffed", isPassedDay));
                } else {
                    setAiResult(newDataList);
                    appDataService.set(appDataKey, newData);
                }
            }
        }
    }

    private void setAiResult(List<Document> newDataList) {
        if (!aiResultMap.isEmpty()) {
            if (CollectionUtils.isNotEmpty(newDataList)) {
                newDataList.stream().forEach(item -> {
                    String arcTag = DocumentLib.getString(item, "arcTag");
                    List<Document> aiList = (List<Document>) aiResultMap.get(arcTag);
                    if (CollectionUtils.isNotEmpty(aiList)) {
                        List<String> preFileIdList = Lists.newArrayList();
                        Map<String, String> afterFileIdMap = Maps.newHashMap();
                        List<Document> afterFileIdList = Lists.newArrayList();
                        aiList.stream().forEach(aiItem -> {
                            String fileId_preprocess = DocumentLib.getString(aiItem, "fileId_preprocess");
                            if (StringLib.isNotEmpty(fileId_preprocess)) {
                                if (!preFileIdList.contains(fileId_preprocess)) {
                                    preFileIdList.add(fileId_preprocess);
                                }
                            }

                            String fileId_postprocess = DocumentLib.getString(aiItem, "fileId_postprocess");
                            if (StringLib.isNotEmpty(fileId_postprocess)) {
                                if (!afterFileIdMap.containsKey(fileId_postprocess)) {
                                    afterFileIdMap.put(fileId_postprocess, "1");
                                    afterFileIdList.add(aiItem);
                                }
                            }
                        });

                        List<String> image_ids = DocumentLib.getList(item, "image_ids");
                        int diff = 4 - image_ids.size();
                        if (diff > 0) {
                            int preIdLength = preFileIdList.size();
                            for (int i = 0; i < diff; i++) {
                                if (preIdLength > i) {
                                    String fileId = preFileIdList.get(i);
                                    if (StringLib.isNotEmpty(fileId)) {
                                        if (!image_ids.contains(fileId)) {
                                            image_ids.add(fileId);
                                        }
                                    }
                                } else {
                                    break;
                                }
                            }
                        }
                        item.put("image_ids", image_ids);
                        item.put("ai_images", afterFileIdList);

                        if (!item.containsKey("man_made_result")) {
                            item.put("man_made_result", DocumentLib.getString(item, "result"));
                        }
                        String aiResult = "";
                        if (CollectionUtils.isNotEmpty(afterFileIdList)) {
                            long okSize = afterFileIdList.stream().filter(aiItem -> {
                                return StringLib.equalsIgnoreCase(DocumentLib.getString(aiItem, "analysis_result"), "ok");
                            }).count();
                            if (okSize == afterFileIdList.size()) {
                                aiResult = "OK";
                            } else {
                                aiResult = "NG";
                            }
                        }
                        item.put("ai_made_result", aiResult);
                        if (StringLib.equalsIgnoreCase(DocumentLib.getString(configDocument, "check_result"), "ai")) {
                            if (StringLib.isEmpty(DocumentLib.getString(item, "man_made_result"))) {
                                item.put("result", DocumentLib.getString(item, "ai_made_result"));
                            } else {
                                item.put("result", DocumentLib.getString(item, "man_made_result"));
                            }
                        } else {
                            item.put("result", DocumentLib.getString(item, "man_made_result"));
                        }
                    }
                });
            }
        }
    }

    private void initializeVar(String _date) {
        queryDate = LocalDate.fromDateFields(DateUtils.parseDate(_date));
        year = queryDate.getYear();
        month = queryDate.getMonthOfYear();
        day = queryDate.getDayOfMonth();

        appDataKey = StringLib.join("weld_robot_history_", uuid, "_", year, "_", month, "_", day);
        dateStart = LocalDateTime.fromDateFields(queryDate.toDate()).withTime(0, 0, 0, 0).toDate();
        dateEnd = LocalDateTime.fromDateFields(queryDate.toDate()).withTime(23, 59, 59, 999).toDate();

        isPassedDay = queryDate.toDate().getTime() < LocalDate.now().toDate().getTime();

        appDataService = SpringContext.getBean(AppDataService.class);
        dayData = appDataService.get(appDataKey);
    }

    private void queryBaseData() {
        configDocument = appDataService.get("weld_robot_history_config");
    }

    private void aggregateValues() {

        List<Document> aggregateList = Lists.newArrayList();

        Document match = DocumentLib.newDoc();
        match.put("uuid", uuid);
        match.put("time", DocumentLib.newDoc().append("$gte", dateStart)
                .append("$lte", dateEnd));
        match.put("$or", Lists.newArrayList(
                DocumentLib.newDoc("data.101_Status_DI_ArcWeldingStart", DocumentLib.newDoc("$in", Lists.newArrayList("TRUE", "1", "true"))),
                DocumentLib.newDoc("data.173_Status_DI_ArcWeldingStart_DataCollect", DocumentLib.newDoc("$in", Lists.newArrayList("TRUE", "1", "true")))));

        aggregateList.add(DocumentLib.newDoc("$match", match));

        aggregateList.add(DocumentLib.newDoc("$sort", DocumentLib.newDoc("time", 1)));

        Document group = DocumentLib.newDoc();
        Document groupID = DocumentLib.newDoc();
        groupID.put("year", DocumentLib.newDoc("$year", DocumentLib.newDoc("date", "$time").append("timezone", "Asia/Shanghai")));
        groupID.put("month", DocumentLib.newDoc("$month", DocumentLib.newDoc("date", "$time").append("timezone", "Asia/Shanghai")));
        groupID.put("date", DocumentLib.newDoc("$dayOfMonth", DocumentLib.newDoc("date", "$time").append("timezone", "Asia/Shanghai")));
        groupID.put("barcode", "$data.168_MaterialBarcode");
        groupID.put("tag", "$data.141_ArcOn_Time");
        group.put("_id", groupID);
        group.put("start", DocumentLib.newDoc("$first", "$time"));
        group.put("end", DocumentLib.newDoc("$last", "$time"));
        group.put("start_id", DocumentLib.newDoc("$first", "$_id"));
        group.put("end_id", DocumentLib.newDoc("$last", "$_id"));

        Document paramDocument = DocumentLib.newDoc();
        paramDocument.put("119_Par_WeldingVoltage", "$data.119_Par_WeldingVoltage");
        paramDocument.put("121_Status_WeldingVoltage", "$data.121_Status_WeldingVoltage");
        paramDocument.put("118_Par_WeldingCurrent", "$data.118_Par_WeldingCurrent");
        paramDocument.put("120_Status_WeldingCurrent", "$data.120_Status_WeldingCurrent");
        paramDocument.put("101_Status_DI_ArcWeldingStart", "$data.101_Status_DI_ArcWeldingStart");
        paramDocument.put("128_Par_WelderType", "$data.128_Par_WelderType");
        paramDocument.put("130_Par_MaterialType", "$data.130_Par_MaterialType");
        paramDocument.put("131_Par_WireType", "$data.131_Par_WireType");
        paramDocument.put("132_Par_GasType", "$data.132_Par_GasType");
        paramDocument.put("141_ArcOn_Time", "$data.141_ArcOn_Time");
        paramDocument.put("MaterialName", "$data.166_MaterialName");
        paramDocument.put("MaterialBatch", "$data.167_MaterialBatch");
        paramDocument.put("182_TCP_X", "$data.182_TCP_X");
        paramDocument.put("183_TCP_Y", "$data.183_TCP_Y");
        paramDocument.put("184_TCP_Z", "$data.184_TCP_Z");
        paramDocument.put("199_M_TCP_X", "$data.199_M_TCP_X");
        paramDocument.put("200_M_TCP_Y", "$data.200_M_TCP_Y");
        paramDocument.put("201_M_TCP_Z", "$data.201_M_TCP_Z");
        /*load the config param*/
        List<Document> fields = DocumentLib.getList(configDocument, "fields");
        fields.stream().forEach(field -> {
            String r_option = DocumentLib.getString(field, "r_option");
            String bind = DocumentLib.getString(field, "bind");
            int bindLength = StringLib.length(bind);
            if (StringLib.equals(r_option, "data") && bindLength > 4) {
                paramDocument.put(bind, "$data." + bind);
            } else if (StringLib.equals(r_option, "input")) {
                String dft = DocumentLib.getString(field, "default");
                if (StringLib.isNotEmpty(dft)) {
                    paramDocument.put(bind, DocumentLib.newDoc("$ifNull", Lists.newArrayList("$data." + bind, dft)));
                } else {
                    paramDocument.put(bind, "$data." + bind);
                }
            }
        });
        group.put("show_data", DocumentLib.newDoc("$first", paramDocument));
        group.put("wire", DocumentLib.newDoc("$last", DocumentLib
                .newDoc("176_WireFeedLengthSingleWelding", "$data.176_WireFeedLengthSingleWelding")
                .append("178_WireDensity", "$data.178_WireDensity")));
        group.put("count", DocumentLib.newDoc("$sum", 1));
        aggregateList.add(DocumentLib.newDoc("$group", group));
        aggregateNewDataValues = DBUtils.aggregate("deviceData", aggregateList);
    }

    private void calcAiResultMap() {
        /*加载所有的FileInfo*/
        Document filter = DocumentLib.newDoc();
        filter.put("create_date", DocumentLib.newDoc("$gte", dateStart));
        filter.put("$and", Lists.newArrayList(DocumentLib.newDoc("tags", uuid), DocumentLib.newDoc("tags", "vision_preprocess")));
        List<Document> fileInfoList = DBUtils.list("fileInfo", filter, null, Sorts.ascending("create_date"));

        Multimap<String, Document> fileInfoMap = ArrayListMultimap.create();
        fileInfoList.stream().forEach(fileInfo -> {
            List<String> tags = DocumentLib.getList(fileInfo, "tags");
            if (tags.size() > 2) {
                String arcTag = tags.get(1);
                if (StringLib.isNotEmpty(arcTag)) {
                    fileInfoMap.put(arcTag, fileInfo);
                }
            }
        });
        Multimap<String, Document> aiMap = ArrayListMultimap.create();
        String aiDataKey = StringLib.join("weld_robot_ai_check_", uuid, "_", year, "_", month, "_", day);
        Document aiDataDoc = appDataService.get(aiDataKey);
        List<Document> aiList = DocumentLib.getList(aiDataDoc, "list");
        aiList.stream().forEach(ai -> {
            String arcTag = DocumentLib.getString(ai, "arcTag");
            if (StringLib.isNotEmpty(arcTag)) {
                aiMap.put(arcTag, ai);
            }
        });

        Multimap<String, Document> resultMapClone = ArrayListMultimap.create();
        if (fileInfoMap.isEmpty()) {
            resultMapClone = ArrayListMultimap.create(aiMap);
        }

        Multimap<String, Document> resultMap = ArrayListMultimap.create(resultMapClone);
        if (!fileInfoMap.isEmpty()) {
            Set<String> fileInfoKeys = fileInfoMap.keySet();
            fileInfoKeys.stream().forEach(fileKey -> {
                List<Document> sublist = (List<Document>) fileInfoMap.get(fileKey);

                AtomicInteger hasAi = new AtomicInteger(0);
                Set<String> aiFieldMap = Sets.newHashSet();
                List<Document> aiTagList = (List<Document>) aiMap.get(fileKey);
                if (CollectionUtils.isNotEmpty(aiTagList)) {
                    aiTagList.stream().forEach(aiItem -> {
                        String fileId_preprocess = DocumentLib.getString(aiItem, "fileId_preprocess");
                        aiFieldMap.add(fileId_preprocess);
                        hasAi.incrementAndGet();
                    });
                }
                List<Document> storeTagList = Lists.newArrayList(aiTagList);

                AtomicInteger storeTagSize = new AtomicInteger(storeTagList.size());

                sublist.stream().forEach(fileInfoItem -> {
                    String fileId = DocumentLib.getString(fileInfoItem, "fileId");
                    if (StringLib.isNotEmpty(fileId) && !aiFieldMap.contains(fileId)) {
                        if (storeTagSize.get() < 4) {
                            Document storeItem = DocumentLib.newDoc();
                            Optional<Document> optional = aiTagList.stream().filter(item -> {
                                return StringLib.equals(DocumentLib.getString(item, "fileId_preprocess"), fileId);
                            }).findFirst();
                            if (optional.isPresent()) {
                                storeItem = optional.get();
                            } else {
                                storeItem.put("arcTag", fileKey);
                                storeItem.put("uuid", uuid);
                                storeItem.put("fileId_preprocess", fileId);
                            }
                            storeTagList.add(storeItem);
                        }
                    }
                });

                resultMap.putAll(fileKey, storeTagList);
            });

            aiResultMap = resultMap;
        }
    }
}
