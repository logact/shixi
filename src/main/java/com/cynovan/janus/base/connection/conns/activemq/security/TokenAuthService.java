package com.cynovan.janus.base.connection.conns.activemq.security;

import com.cynovan.janus.base.connection.conns.activemq.ActiveMQConfiguration;
import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import org.springframework.stereotype.Component;

@Component
public class TokenAuthService {

    public boolean checkToken(String checkedToken) {
        String janusToken = DocumentLib.getString(QJanus.get(), "token");
        return StringLib.equalsAny(checkedToken, ActiveMQConfiguration.SYSTEM_TOKEN, janusToken);
    }
}
