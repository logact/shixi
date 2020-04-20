package com.cynovan.janus.base.neptune.jdo;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import org.bson.Document;

import java.util.Date;

public class QNeptuneExec extends BaseJDO {

    public static final String collectionName = "neptune_exec";

    public static final String token = "token";
    public static final String action = "action";
    public static final String result = "result";
    public static final String message = "message";
    public static final String operation_id = "operation_id";
    public static final String create_time = "create_time";

    public static Document save(Document neptunePushObject, CheckMessage checkMessage) {
        String operationId = DocumentLib.getString(neptunePushObject, "operation_id");
        String token = DocumentLib.getString(neptunePushObject, "token");

        Document execObject = DocumentLib.newDoc();
        execObject.put(QNeptuneExec.action, DocumentLib.getString(neptunePushObject, "type"));
        execObject.put(QNeptuneExec.token, token);
        execObject.put(QNeptuneExec.operation_id, operationId);
        execObject.put(QNeptuneExec.result, checkMessage.isSuccess());
        if (checkMessage.getMessages().size() > 0) {
            execObject.put(QNeptuneExec.message, checkMessage.getMessages().get(0));
        }
        execObject.put(QNeptuneExec.create_time, new Date());
        DBUtils.save(QNeptuneExec.collectionName, execObject);
        return execObject;

    }
}
