package com.cynovan.janus.base.connection.conns.activemq;

import com.cynovan.janus.base.device.jdo.QDeviceUserActionLog;
import com.cynovan.janus.base.neptune.mq.NeptuneMQConnService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.HttpLib;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ApiCallbackService {

    @Autowired
    private NeptuneMQConnService neptuneMQConnService;

    public boolean process(Document data) {
        Document dataNode = DocumentLib.getDocument(data, "data");
        String operation_id = DocumentLib.getString(dataNode, "operation_id");
        // find api push log by operation_id
        if (operation_id != null) {
            Document userActionLog = QDeviceUserActionLog.findByOperationID(operation_id);
            boolean fromNeptune = DocumentLib.getBoolean(userActionLog, "neptune");
            if (fromNeptune == false) {
                // callback
                String callback_url = DocumentLib.getString(userActionLog, "callback");
                if (StringLib.isNotEmpty(callback_url)) {
                    // do callback
                    callback_url = StringLib.decodeURI(callback_url);
                    HttpLib.post(callback_url, data);
                    return true;
                }
            } else {
                /*从Neptune下发的数据，需要把该条条数转至Neptune*/
                neptuneMQConnService.sendDeviceMessageToNeptune(data);
            }
        }
        return false;
    }
}
