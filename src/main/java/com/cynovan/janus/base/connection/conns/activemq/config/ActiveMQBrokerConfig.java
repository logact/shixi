package com.cynovan.janus.base.connection.conns.activemq.config;

import com.cynovan.janus.base.connection.conns.activemq.policy.ClientIdDispatchPolicy;
import com.cynovan.janus.base.connection.conns.activemq.security.TokenAuthenticationPlugin;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import org.apache.activemq.broker.BrokerPlugin;
import org.apache.activemq.broker.BrokerService;
import org.apache.activemq.broker.region.policy.PolicyEntry;
import org.apache.activemq.broker.region.policy.PolicyMap;
import org.apache.activemq.broker.region.virtual.VirtualDestination;
import org.apache.activemq.broker.region.virtual.VirtualDestinationInterceptor;
import org.apache.activemq.broker.region.virtual.VirtualTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.annotation.EnableJms;

import java.util.List;

@Configuration
@EnableJms
public class ActiveMQBrokerConfig {

    @Value("${broker-tcp}")
    private String brokerTCP;

    @Value("${broker-mqtt}")
    private String brokerMQTT;
    @Value("${broker-amqp}")
    private String brokerAmqp;

    @Bean
    public BrokerService startBrokerService() {
        BrokerService service = new BrokerService();
        service.setUseJmx(true);
        try {
            service.setUseShutdownHook(false);
            /*MQTT的Token验证*/
            service.setPlugins(new BrokerPlugin[]{new TokenAuthenticationPlugin()});
            /*设置policyMap*/
            setPolicyEntry(service);
            setDestinationInterceptors(service);
            /*设置针对MQTT进行监控*/
            service.setAdvisorySupport(true);
            /*mqtt的消息存储方式*/
            service.setPersistent(false);

            /*增加多个协议，使用TCP 和 MQTT*/
            service.addConnector(brokerTCP);

            service.setUseVirtualTopics(true);

            if (StringLib.isNotEmpty(brokerMQTT)) {
                String mqVirtual = "?transport.subscriptionStrategy=mqtt-virtual-topic-subscriptions&transport.defaultKeepAlive=60000";
                service.addConnector(brokerMQTT + mqVirtual);
            }
            if (StringLib.isNotEmpty(brokerAmqp)) {
                service.addConnector(brokerAmqp);
            }
            service.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return service;
    }

    private void setDestinationInterceptors(BrokerService service) {
        VirtualDestinationInterceptor interceptor = new VirtualDestinationInterceptor();

        VirtualTopic virtualTopic = new VirtualTopic();
        virtualTopic.setName(">");
        virtualTopic.setPrefix("Consumer.*.");
        virtualTopic.setSelectorAware(false);
        interceptor.setVirtualDestinations(new VirtualDestination[]{virtualTopic});
        service.setDestinationInterceptors(new VirtualDestinationInterceptor[]{interceptor});
    }

    private void setPolicyEntry(BrokerService service) {
        PolicyMap policyMap = new PolicyMap();

        List<PolicyEntry> policyEntryList = Lists.newArrayList();

        PolicyEntry devicesubPolicy = new PolicyEntry();
        devicesubPolicy.setTopic("VirtualTopic.devicesub");
        devicesubPolicy.setDispatchPolicy(new ClientIdDispatchPolicy());
        policyEntryList.add(devicesubPolicy);

        policyMap.setPolicyEntries(policyEntryList);
        service.setDestinationPolicy(policyMap);
    }
}
