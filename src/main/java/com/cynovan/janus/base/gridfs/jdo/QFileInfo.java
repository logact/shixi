package com.cynovan.janus.base.gridfs.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QFileInfo extends BaseJDO {

    public static final String collectionName = "fileInfo";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("fileId", 1));
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("tags", 1));
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("md5", 1));
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("create_date", 1));
    }
}
