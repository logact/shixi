package com.cynovan.janus.base.connection.conns.activemq.security;

import org.apache.activemq.broker.Broker;
import org.apache.activemq.broker.BrokerPlugin;

/**
 * Created by Aric on 2017/7/4.
 */
public class TokenAuthenticationPlugin implements BrokerPlugin {
    @Override
    public Broker installPlugin(Broker broker) throws Exception {
        return new TokenAuthenticationBroker(broker);
    }
}
