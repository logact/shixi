package com.cynovan.janus.base.appstore.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QAppDataConfig extends BaseJDO {
    public static final String collectionName = "appDataConfig";

    public static final String app = "app";
    public static final String dialogTitle = "dialogTitle";
    public static final String fields = "fields";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("app", -1));
    }
}
