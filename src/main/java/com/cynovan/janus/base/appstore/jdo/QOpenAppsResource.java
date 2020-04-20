package com.cynovan.janus.base.appstore.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QOpenAppsResource extends BaseJDO {
    public static final String collectionName = "open_apps_resource";
    public static final String appId = "appId";
    public static final String path = "path";
    public static final String fileId = "fileId";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("appId", 1).append("path", 1));
    }
}
