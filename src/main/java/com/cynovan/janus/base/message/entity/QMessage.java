package com.cynovan.janus.base.message.entity;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QMessage extends BaseJDO {

    public static final String collectionName = "messages";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("type", 1));
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("uuid", 1));
    }

    @Override
    public boolean autoRemoveData() {
        return true;
    }
}