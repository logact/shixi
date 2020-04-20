package com.cynovan.janus.base.appstore.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QOpenApps extends BaseJDO {

    public static final String collectionName = "open_apps";
    public static final String name = "name";
    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("key", 1));
    }
}
