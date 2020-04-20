package com.cynovan.janus.base.devicedata.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QDeviceSampling extends BaseJDO {

    public static final String collectionName = "deviceSampling";

    @Override
    public void createIndex() {
        /*组合索引，只需要根据数据的密集采样进行搜索*/
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("uuid", 1).append("data.time", 1));
    }

    @Override
    public boolean autoRemoveData() {
        return true;
    }
}
