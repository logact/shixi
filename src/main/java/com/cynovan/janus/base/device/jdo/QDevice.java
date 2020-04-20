package com.cynovan.janus.base.device.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.CacheUtils;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.mongodb.client.model.Projections;
import org.bson.Document;

/**
 * Created by Aric on 2017/4/26.
 */
public class QDevice extends BaseJDO {

    public static final String collectionName = "device";

    public static final String uuid = "uuid";
    public static final String online = "online";
    public static final String state = "state";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("uuid", 1));
    }

    public static boolean checkDataToNeptune(String uuid) {
        String key = "sync_neptune_" + uuid;
        Boolean send = CacheUtils.getBoolean(key);
        if (send != null) {
            return send;
        } else {
            Document device = DBUtils.find(QDevice.collectionName, DocumentLib.newDoc(QDevice.uuid, uuid),
                    Projections.include("sync_neptune"));
            send = DocumentLib.getBoolean(device, "sync_neptune");
            CacheUtils.set(key, send);
        }
        return send;
    }

    public static String getDeviceName(String uuid) {
        Document device = DBUtils.find(collectionName, DocumentLib.newDoc("uuid", uuid), DocumentLib.newDoc("baseInfo", 1));
        return DocumentLib.getString(device, "baseInfo.name");
    }

}
