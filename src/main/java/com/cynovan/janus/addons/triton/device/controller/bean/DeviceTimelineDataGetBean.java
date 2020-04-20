package com.cynovan.janus.addons.triton.device.controller.bean;

import com.cynovan.janus.addons.triton.device.controller.state.QDeviceTimeline;
import com.cynovan.janus.base.utils.*;
import com.google.common.collect.Lists;
import com.mongodb.client.model.Sorts;
import org.bson.Document;
import org.joda.time.LocalDateTime;

import java.util.Date;
import java.util.List;

public class DeviceTimelineDataGetBean {

    private List<Document> timelineDataList = null;

    private String cacheKey = null;

    private String uuid;
    private String date_type;
    private Date start;
    private Date end;

    private Document filter = new Document();

    /**
     * @param _uuid      时间轴的设备UUID，如果获取所有，则传入null
     * @param _date_type 时间筛选范围, 可选项
     */
    public DeviceTimelineDataGetBean(String _uuid, String _date_type, String _start, String _end) {
        this.uuid = _uuid;
        this.date_type = _date_type;
        if (StringLib.isNotEmpty(_start)) {
            this.start = DateUtils.parseDate(_start);
        }
        loadTimeLine();
    }

    private void init() {
        if (StringLib.isNotEmpty(date_type)) {
            LocalDateTime endTime = LocalDateTime.now()
                    .withTime(23, 59, 59, 59);
            LocalDateTime startTime = endTime.withTime(0, 0, 0, 0);
            if (StringLib.equalsIgnoreCase(date_type, "today")) {
            } else if (StringLib.equalsIgnoreCase(date_type, "yesterday")) {
                endTime = endTime.plusDays(-1);
                startTime = startTime.plusDays(-1);
            }
            start = startTime.toDate();
            end = endTime.toDate();
        } else {
            /*检查start和end是否符合格式*/
            start = LocalDateTime.fromDateFields(start)
                    .withTime(0, 0, 0, 0).toDate();
            end = LocalDateTime.fromDateFields(start)
                    .withTime(23, 59, 59, 59).toDate();
        }
    }

    private void loadTimeLine() {
        init();
        initFilter();
        cacheKey = StringLib.join("timeline_cache_", DigestLib.md5Hex(filter.toJson()));
        load();
    }

    private void initFilter() {
        if (StringLib.isNotEmpty(uuid)) {
            filter.put("uuid", uuid);
        }
        /*开始日期或结束日期 落在时间范围内即符合条件*/
        List<Document> orFilter = Lists.newArrayList();
        orFilter.add(new Document("start_date", new Document("$gte", start).append("$lte", end)));
        orFilter.add(new Document("end_date", new Document("$gte", start).append("$lte", end)));
        filter.put("$or", orFilter);
    }

    private void load() {
        timelineDataList = DBUtils.list(QDeviceTimeline.collectionName,
                filter,
                null, Sorts.ascending("start_date"));
        // 截掉非今天的数据
        timelineDataList.forEach(item -> {
            Date start_date = DocumentLib.getDate(item, "start_date");
            Date end_date = DocumentLib.getDate(item, "end_date");
            if (start.compareTo(start_date) > 0) {
                item.put("start_date", start);
                item.put("duration", end_date.getTime() - start.getTime());
            } else if (end.compareTo(end_date) < 0) {
                item.put("end_date", end);
                item.put("duration", end.getTime() - start_date.getTime());
            }
        });
    }

    public List<Document> getTimelineDataList() {
        return timelineDataList;
    }
}
