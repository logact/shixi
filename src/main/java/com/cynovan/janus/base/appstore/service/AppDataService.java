package com.cynovan.janus.base.appstore.service;

import com.cynovan.janus.base.appstore.jdo.QAppData;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import org.springframework.stereotype.Service;

@Service
public class AppDataService {

    public Document get(String dataKey) {
        if (StringLib.isNotEmpty(dataKey)) {
            Document query = DocumentLib.newDoc("key", dataKey);
            Document dataObject = DBUtils.find(QAppData.collectionName, query);
            Document data = null;
            if (dataObject != null && dataObject.containsKey("data")) {
                data = DocumentLib.getDocument(dataObject, "data");
            } else {
                data = DocumentLib.newDoc();
            }
            return data;
        }
        return DocumentLib.newDoc();
    }

    public void set(String dataKey, Document data) {
        if (StringLib.isNotEmpty(dataKey)) {
            Document query = DocumentLib.newDoc("key", dataKey);

            Document update = DocumentLib.newDoc();
            update.put("$set", DocumentLib.newDoc("data", data));
            DBUtils.updateOne(QAppData.collectionName, query, update, true);
        }
    }
}
