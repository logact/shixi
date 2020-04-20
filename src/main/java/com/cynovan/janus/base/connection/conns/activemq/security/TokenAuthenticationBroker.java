package com.cynovan.janus.base.connection.conns.activemq.security;

import com.cynovan.janus.base.config.bean.SpringContext;
import org.apache.activemq.broker.Broker;
import org.apache.activemq.broker.BrokerFilter;
import org.apache.activemq.broker.ConnectionContext;
import org.apache.activemq.command.ConnectionInfo;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Aric on 2017/7/4.
 */
public class TokenAuthenticationBroker extends BrokerFilter {

    protected Logger logger = LoggerFactory.getLogger(getClass());

    public TokenAuthenticationBroker(Broker next) {
        super(next);
    }

    @Override
    public void addConnection(ConnectionContext context, ConnectionInfo info) throws Exception {

        String token = context.getUserName();

        boolean checked = false;
        if (StringUtils.isNotEmpty(token)) {
            TokenAuthService authService = SpringContext.getBean(TokenAuthService.class);
            if (authService.checkToken(token)) {
                checked = true;
            }
        }
        if (checked) {
            super.addConnection(context, info);
        } else {
            throw new SecurityException("Token not not found in the data store");
        }
    }
}
