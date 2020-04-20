package com.cynovan.janus.base.controlling.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QControllingRuleTriggerFlag extends BaseJDO {

    public static final String collectionName = "controllingRuleTriggerFlag";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("key", 1));
    }
}
