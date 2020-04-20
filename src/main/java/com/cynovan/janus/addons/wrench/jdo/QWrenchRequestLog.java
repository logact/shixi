package com.cynovan.janus.addons.wrench.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QWrenchRequestLog extends BaseJDO {

    public static final String collectionName = "wrenchLog";
    public static final String uuid = "uuid";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("uuid", 1));
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("create_date", 1));
    }

    @Override
    public boolean autoRemoveData() {
        return true;
    }
}
