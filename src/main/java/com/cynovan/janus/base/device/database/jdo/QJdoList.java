package com.cynovan.janus.base.device.database.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QJdoList extends BaseJDO {

    public static final String collectionName = "jdoList";

    public static final String collection = "collection";
    public static final String instance = "instance";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("collection", 1));
    }
}
