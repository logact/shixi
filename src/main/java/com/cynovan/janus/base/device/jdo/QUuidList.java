package com.cynovan.janus.base.device.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;

public class QUuidList extends BaseJDO {

    public static final String collectionName = "uuidList";

    public static final String uuid = "uuid";
    public static final String use = "use";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("uuid", 1));
    }

}
