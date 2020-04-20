package com.cynovan.janus.base.device.service;

import com.cynovan.janus.base.arch.controller.BaseService;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.service.DataAccessCreateService;
import com.cynovan.janus.base.device.jdo.QDataExchange;
import com.cynovan.janus.base.device.jdo.QDataPush;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.device.jdo.QUuidList;
import com.cynovan.janus.base.utils.*;
import org.bson.Document;
import org.springframework.stereotype.Component;

import java.text.ParseException;
import java.util.Arrays;
import java.util.Date;

@Component
public class DeviceService extends BaseService {

    private static final String MillSecondFormat = "yyyyMMddHHmmssSSS";

    public void removeDeviceByUUID(String uuid) {
        Document uuidQuery = DocumentLib.newDoc(QDevice.uuid, uuid);
        String tablesNames[] = new String[]{
                QDevice.collectionName,
                QDataExchange.collectionName,
                QDataPush.collectionName
        };
        Document query = new Document();
        query.put("uuid", uuid);
        DBUtils.updateOne(QUuidList.collectionName, query, DocumentLib.new$Set(QUuidList.use, false));

        /*删除设备对应的Schedule*/
        DataAccessCreateService service = SpringContext.getBean(DataAccessCreateService.class);
        service.unregister(uuid);

        Arrays.stream(tablesNames).forEach(collName -> {
            DBUtils.deleteMany(collName, uuidQuery);
        });
        CacheUtils.deleteLike(uuid);
    }

    public Date processDataTime(Object dateValue) {
        Date date = null;
        if (dateValue != null) {
            if (dateValue instanceof Date) {
                date = (Date) dateValue;
            } else if (dateValue instanceof String) {
                String time = StringLib.toString(dateValue);
                if (StringLib.isNotEmpty(time)) {
                    try {
                        date = DateUtils.parseDate(time, MillSecondFormat);
                    } catch (ParseException e) {
                        try {
                            long unixMillis = Long.parseLong(time);
                            date = new Date(unixMillis);
                        } catch (NumberFormatException ex) {
                            e.printStackTrace();
                            ex.printStackTrace();
                        }
                    }
                }
            }
        }
        if (date == null) {
            date = new Date();
        }
        return date;
    }

}
