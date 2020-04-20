package com.cynovan.janus.base.device.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;

import java.util.Date;

/**
 * Created by Aric on 2017/4/28.
 */
public class QDeviceUserActionLog extends BaseJDO {

    public static final String collectionName = "deviceUserActionLog";

    @Override
    public void createIndex() {
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("uuid", 1));
        DBUtils.createIndex(collectionName, DocumentLib.newDoc("operation_id", 1));
    }

    public static String save(ObjectNode pushObject, String callback) {
        Document userActionLog = DocumentLib.parse(pushObject.toString());
        if (StringLib.isNotEmpty(callback)) {
            userActionLog.put("callback", callback);
        }

        ObjectNode pushData = JsonLib.getObjectNode(pushObject, "data");

        Document userInfo = UserUtils.getUser();
        if (userInfo != null) {
            userActionLog.put("user_id", DocumentLib.getID(userInfo));
            userActionLog.put("user_name", DocumentLib.getString(userInfo, "name"));
        }
        userActionLog.put("create_date", new Date());
        /*operation_id采用自己生成的规则，如果用ID，需要在多个表中使用时就会产生冲突*/
        String operation_id = DocumentLib.getString(userActionLog, "operation_id");
        if (StringLib.isEmpty(operation_id)) {
            operation_id = JsonLib.getString(pushData, "operation_id");
        }
        if (StringLib.isEmpty(operation_id)) {
            operation_id = DigestLib.md5Hex(StringLib.join(pushObject.toString(), new Date().getTime(), QJanus.getToken()));

            /*把operation_id放入下发的数据中*/
            pushData.put("operation_id", operation_id);
            pushObject.set("data", pushData);
        }
        userActionLog.put("operation_id", operation_id);

        DBUtils.save(QDeviceUserActionLog.collectionName, userActionLog);
        return operation_id;
    }

    public static Document findByOperationID(String operation_id) {
        return DBUtils.find(collectionName, DocumentLib.newDoc("operation_id", operation_id));
    }
}
