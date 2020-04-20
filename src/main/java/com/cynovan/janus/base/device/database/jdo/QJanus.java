package com.cynovan.janus.base.device.database.jdo;

import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import org.bson.Document;

public class QJanus {
    public static final String collectionName = "janus";
    public static final String initialize = "initialize";

    public static final String password = "password";
    public static final String control_password = "control_password";

    public static final String token = "token";
    public static final String bind_date = "bind_date";
    // 设备可接入数量
    public static final String licences = "licences";
    public static final String uuids = "uuids";
    public static final String name = "name";
    public static final String remarks = "remarks";
    public static final String company_id = "company_id";
    public static final String company_name = "company_name";
    public static final String company_token = "company_token";

    public static Document get() {
        Document janus = DBUtils.find(QJanus.collectionName, null);
        return janus;
    }

    public static String getToken() {
        Document janus = get();
        return DocumentLib.getString(janus, "token");
    }

    public static String getCompanyId(){
        Document janus = get();
        return DocumentLib.getString(janus, "company_id");
    }
}
