package com.cynovan.janus.base.neptune.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import org.bson.Document;

public class QNeptuneSync extends BaseJDO {
    public static final String collectionName = "neptune_sync";

    public static final Integer status_Offline = 0;
    public static final Integer status_online = 1;
    public static final Integer status_lost_line = 2;


    public static final String status = "status";

    public static final String create_time = "create_time";

    public static final String message = "message";


    public static void save(Document object) {
        DBUtils.save(collectionName, object);
    }
}
