package com.cynovan.janus.base.device.database.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.mongodb.DBObject;
import org.bson.Document;

import java.util.List;

public class QAppInfo extends BaseJDO {

    public static final String collectionName = "appInfo";
    public static final String installed = "installed";

    public static Document get() {
        Document info = DBUtils.find(QAppInfo.collectionName, null);
        return info;
    }

    public static List getInstalledInfo() {
        Document info = DBUtils.find(QAppInfo.collectionName, null);
        return DocumentLib.getList(info, QAppInfo.installed);
    }

    @Override
    public void onCollectionUpdate(String exec, DBObject options) {
        super.onCollectionUpdate(exec, options);

    }
}
