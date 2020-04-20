package com.cynovan.janus.base.connection.conns.activemq;

import com.cynovan.janus.base.utils.DigestLib;
import org.apache.activemq.ActiveMQConnectionFactory;
import org.apache.activemq.ActiveMQPrefetchPolicy;
import org.apache.activemq.RedeliveryPolicy;
import org.apache.activemq.advisory.AdvisorySupport;
import org.apache.activemq.command.ActiveMQTopic;
import org.apache.activemq.jms.pool.PooledConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.jms.config.DefaultJmsListenerContainerFactory;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.listener.DefaultMessageListenerContainer;

@Configuration
@EnableJms
public class ActiveMQConfiguration {

    private static final String DeviceSubTopic = "VirtualTopic.devicesub";

    public static final String SYSTEM_TOKEN = DigestLib.md5Hex("SYS_TOKEN_NEPTUNE");

    @Value("${broker-tcp}")
    private String broker;

    @Bean
    public ActiveMQConnectionFactory activeMQConnectionFactory() {
        ActiveMQConnectionFactory connectionFactory = new ActiveMQConnectionFactory();
        connectionFactory.setBrokerURL(broker);
        connectionFactory.setTrustAllPackages(true);
        connectionFactory.setUserName(SYSTEM_TOKEN);
        connectionFactory.setWatchTopicAdvisories(true);

        ActiveMQPrefetchPolicy prefetchPolicy = new ActiveMQPrefetchPolicy();
        prefetchPolicy.setAll(20);
        connectionFactory.setPrefetchPolicy(prefetchPolicy);

        /*消费端优化，确认收到消息使用批量确定，减少和MQ之间的IO操作*/
        connectionFactory.setOptimizeAcknowledge(true);

        RedeliveryPolicy redeliveryPolicy = connectionFactory.getRedeliveryPolicy();
        redeliveryPolicy.setMaximumRedeliveries(1);
        return connectionFactory;
    }

    @Bean
    public PooledConnectionFactory pooledConnectionFactory() {
        PooledConnectionFactory connectionFactory = new PooledConnectionFactory();
        connectionFactory.setConnectionFactory(activeMQConnectionFactory());
        return connectionFactory;
    }

    @Bean
    public DefaultJmsListenerContainerFactory jmsListenerContainerFactory() {
        DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
        factory.setConnectionFactory(pooledConnectionFactory());
        factory.setConcurrency("5-10");
        return factory;
    }

    @Bean
    public ActiveMQTopic deviceSubTopic() {
        ActiveMQTopic topic = new ActiveMQTopic(DeviceSubTopic);
        return topic;
    }

    @Bean
    public ActiveMQTopic advisoryTopic() {
        ActiveMQTopic destination = AdvisorySupport.getConnectionAdvisoryTopic();
        return destination;
    }

    @Bean
    public ActiveMQTopic devicepubTopic() {
        ActiveMQTopic destination = new ActiveMQTopic("devicepub");
        return destination;
    }

    @Bean
    public JmsTemplate jmsTemplate() {
        JmsTemplate template = new JmsTemplate();
        template.setConnectionFactory(pooledConnectionFactory());
        return template;
    }

    @Bean
    public MqttDataListener deviceDataListener() {
        return new MqttDataListener();
    }

    @Bean
    public DefaultMessageListenerContainer deviceDataLisnterContainer() {
        DefaultMessageListenerContainer container = new DefaultMessageListenerContainer();
        container.setConnectionFactory(pooledConnectionFactory());
        container.setMessageListener(deviceDataListener());
        container.setDestinationName("Consumer.janus.VirtualTopic.devicepub");
        container.setConcurrency("5-100");
        return container;
    }

    @Bean(name = "jmsTopicTemplate")
    public JmsTemplate jmsTopicTemplate() {
        JmsTemplate template = new JmsTemplate();
        template.setConnectionFactory(pooledConnectionFactory());
        template.setDefaultDestinationName(DeviceSubTopic);
        template.setPubSubDomain(true);
        return template;
    }
}
