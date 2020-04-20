package com.cynovan.janus.base.config.auth.service;

import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.DigestLib;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;

public class AuthToken {

    public static String getAuthToken() {
        Document janus = QJanus.get();
        String encodedPassword = DocumentLib.getString(janus, QJanus.password);
        String janusToken = DigestLib.md5Hex(DocumentLib.getString(janus, QJanus.token));
        String authToken = DigestLib.md5Hex(StringLib.join(janusToken, StringLib.SPLIT_1, encodedPassword));

        return authToken;
    }

}
