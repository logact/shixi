package com.cynovan.janus.addons.triton.view.backend.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QDeviceView extends BaseJDO {

    public static final String collectionName = "deviceView";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("code", 1));
    }
}
