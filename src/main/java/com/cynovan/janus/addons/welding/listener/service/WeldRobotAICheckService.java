package com.cynovan.janus.addons.welding.listener.service;

import com.cynovan.janus.base.appstore.service.AppDataService;
import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import com.cynovan.janus.base.utils.DigestLib;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.joda.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class WeldRobotAICheckService {

    @Autowired
    private AppDataService appDataService;

    public void process(DeviceDataEvent deviceDataEvent) {
        Document deviceData = deviceDataEvent.getToDbData();
        String uuid = DocumentLib.getString(deviceData, "uuid");
        if (StringLib.isEmpty(uuid)) {
            return;
        }
        /*检查数据是否符合AI的处理样本*/
        Document messageData = DocumentLib.getDocument(deviceData, "data");
        String fileId_preprocess = DocumentLib.getString(messageData, "fileId_preprocess");
        String fileId_postprocess = DocumentLib.getString(messageData, "fileId_postprocess");
        String analysis_duration = DocumentLib.getString(messageData, "analysis_duration");
        String analysis_result = DocumentLib.getString(messageData, "analysis_result");
        if (messageData.containsKey("tags") && StringLib.isNotEmpty(fileId_preprocess)
                && StringLib.isNotEmpty(fileId_postprocess)
                && StringLib.isNotEmpty(analysis_duration)
                && StringLib.isNotEmpty(analysis_result)) {
            /*符合数据样本后，进行统一处理*/
            LocalDate localDate = LocalDate.now();

            List<String> tagList = Lists.newArrayList();
            Object tagsValue = messageData.get("tags");
            if (tagsValue instanceof String) {
                tagList.addAll(JsonLib.parseArray(StringLib.toString(tagsValue), String.class));
            } else if (tagsValue instanceof List) {
                List checkItemTags = DocumentLib.getList(messageData, "tags");
                checkItemTags.stream().forEach(item -> {
                    tagList.add(StringLib.toString(item));
                });
            }
            if (CollectionUtils.isNotEmpty(tagList) && tagList.size() > 2) {
                /*取得设置设备的UUID*/

                String deviceUuid = StringLib.toString(tagList.get(0));
                String arcTag = StringLib.toString(tagList.get(1));
                if (StringLib.isNotEmpty(deviceUuid) && StringLib.isNotEmpty(arcTag)) {
                    String md5 = DigestLib.md5Hex(StringLib.join(fileId_preprocess, StringLib.SPLIT_1, fileId_postprocess, StringLib.SPLIT_1, analysis_result, StringLib.SPLIT_1, arcTag));
                    Document checkItem = DocumentLib.newDoc();
                    checkItem.put("fileId_preprocess", fileId_preprocess);
                    checkItem.put("fileId_postprocess", fileId_postprocess);
                    checkItem.put("analysis_duration", analysis_duration);
                    checkItem.put("analysis_result", analysis_result);
                    checkItem.put("md5", md5);
                    checkItem.put("uuid", deviceUuid);
                    checkItem.put("arcTag", arcTag);
                    checkItem.put("create_date", new Date());

                    String appDataKey = StringLib.join(new String[]{"weld_robot_ai_check", deviceUuid, StringLib.toString(localDate.getYear()), StringLib.toString(localDate.getMonthOfYear()), StringLib.toString(localDate.getDayOfMonth())}, "_");
                    Document appData = appDataService.get(appDataKey);
                    List<Document> list = DocumentLib.getList(appData, "list");
                    if (CollectionUtils.isNotEmpty(list)) {
                        /*删除所有和本次MD5相同的数据*/
                        list = list.stream().filter(item -> {
                            String itemMd5 = DocumentLib.getString(item, "md5");
                            return !StringLib.equals(itemMd5, md5);
                        }).collect(Collectors.toList());
                    }
                    list.add(checkItem);
                    appData.put("list", list);
                    appDataService.set(appDataKey, appData);
                }
            }
        }
    }
}
