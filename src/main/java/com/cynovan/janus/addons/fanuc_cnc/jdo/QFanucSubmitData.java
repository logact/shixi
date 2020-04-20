package com.cynovan.janus.addons.fanuc_cnc.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QFanucSubmitData extends BaseJDO {

    public static final String collectionName = "fanuc_cnc";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName,DocumentLib.newDoc("uuid", 1));
    }

    @Override
    public boolean autoRemoveData() {
        return true;
    }
}
