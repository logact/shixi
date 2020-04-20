package com.cynovan.janus.addons.triton.classification.backend.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QDeviceClassification extends BaseJDO {
    public static final String collectionName = "deviceClassification";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("code", 1));
    }
}
