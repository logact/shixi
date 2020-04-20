package com.cynovan.janus.base.controlling.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QControllingLog extends BaseJDO {

    public static final String collectionName = "controlling_log";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("create_date", 1));
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("key", 1));
    }


    @Override
    public boolean autoRemoveData() {
        return true;
    }
}
