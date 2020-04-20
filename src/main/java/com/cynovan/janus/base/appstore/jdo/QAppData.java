package com.cynovan.janus.base.appstore.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QAppData extends BaseJDO {

    public static final String collectionName = "appData";

    public static final String key = "key";
    public static final String data = "data";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("key", 1));
    }
}
