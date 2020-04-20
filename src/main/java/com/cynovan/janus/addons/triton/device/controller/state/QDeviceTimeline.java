package com.cynovan.janus.addons.triton.device.controller.state;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import org.bson.Document;

public class QDeviceTimeline extends BaseJDO {

    public static final String collectionName = "device_timeline";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, new Document("uuid", 1));
        DBUtils.createIndex(collectionName, new Document("start_date", -1));
        DBUtils.createIndex(collectionName, new Document("state", 1));
        DBUtils.createIndex(collectionName, new Document("stateType", 1));
    }
}
