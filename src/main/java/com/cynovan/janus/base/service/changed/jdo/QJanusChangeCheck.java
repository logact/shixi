package com.cynovan.janus.base.service.changed.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QJanusChangeCheck extends BaseJDO {

    public static final String collectionName = "janusChangeCheck";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("key", 1));
    }
}
