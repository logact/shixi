package com.cynovan.janus;

import com.cynovan.janus.base.config.PropertiesConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jms.activemq.ActiveMQAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;

import java.util.TimeZone;

@EnableWebMvc
@EnableScheduling
@EnableWebSecurity
@EnableWebSocketMessageBroker
@EnableJms
@SpringBootApplication(exclude = {ActiveMQAutoConfiguration.class,
        SecurityAutoConfiguration.class})
public class Application {

    public static void main(String[] args) throws Exception {
        TimeZone.setDefault(TimeZone.getDefault());
        //这里的启动方式
        SpringApplicationBuilder builder = new SpringApplicationBuilder(Application.class);
        SpringApplication springApplication = builder.application();
        springApplication.addListeners(new PropertiesConfig());
        springApplication.run(args);
    }
}
