package com.cynovan.janus.addons.bi.utils;

import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;
import org.joda.time.LocalDateTime;

public class BIUtils {

    public static Document getQueryFilter(ObjectNode chartSettingBox) {
        String type = JsonLib.getString(chartSettingBox, "date_type");
        Document filter = new Document();
        filter.put("uuid", JsonLib.getString(chartSettingBox, "uuid"));

        Document timeFilter = DocumentLib.newDoc();
        if (StringLib.equals(type, "D100")) {
            String start = JsonLib.getString(chartSettingBox, "start");
            String end = JsonLib.getString(chartSettingBox, "end");
            if (StringLib.isNotEmpty(start)) {
                LocalDateTime startDate = LocalDateTime.parse(start);
                if (startDate != null) {
                    startDate = startDate.withTime(0, 0, 0, 0);
                    timeFilter.put("$gte", startDate.toDate());
                }
            }
            if (StringLib.isNotEmpty(end)) {
                LocalDateTime endDate = LocalDateTime.parse(end);
                if (endDate != null) {
                    endDate = endDate.plusDays(1).withTime(0, 0, 0, 0);
                    timeFilter.put("$lte", endDate.toDate());
                }
            }

        } else {
            int diffDay = 0;
            if (StringLib.equals(type, "D1")) {

            } else if (StringLib.equals(type, "D2")) {
                diffDay = 1;
            } else if (StringLib.equals(type, "D3")) {
                diffDay = 7;
            } else if (StringLib.equals(type, "D4")) {
                diffDay = 30;
            } else if (StringLib.equals(type, "D5")) {
                diffDay = 60;
            } else if (StringLib.equals(type, "D6")) {
                diffDay = 90;
            } else if (StringLib.equals(type, "D7")) {
                diffDay = 180;
            }
            LocalDateTime startDate = LocalDateTime.now().minusDays(diffDay).withTime(0, 0, 0, 0);
            timeFilter.put("$gte", startDate.toDate());
        }
        filter.append("time", timeFilter);
        return filter;
    }
}
