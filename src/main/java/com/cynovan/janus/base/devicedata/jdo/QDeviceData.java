package com.cynovan.janus.base.devicedata.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QDeviceData extends BaseJDO {

    public static final String collectionName = "deviceData";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("uuid", 1).append("time", 1));
    }

    @Override
    public boolean autoRemoveData() {
        return true;
    }
}
