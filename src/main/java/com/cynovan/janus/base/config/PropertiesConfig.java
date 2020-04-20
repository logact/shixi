package com.cynovan.janus.base.config;

import com.cynovan.janus.base.utils.StringLib;
import com.mongodb.MongoClientURI;
import org.jasypt.encryption.pbe.StandardPBEByteEncryptor;
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertiesPropertySource;

import java.util.Properties;

public class PropertiesConfig implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    private static StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();

    private static final String Prefix = "JANUS#";

    static {
        encryptor.setAlgorithm(StandardPBEByteEncryptor.DEFAULT_ALGORITHM);
        encryptor.setPassword("janus_cynovan");
    }

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent applicationEnvironmentPreparedEvent) {
        ConfigurableEnvironment environment = applicationEnvironmentPreparedEvent.getEnvironment();
        String mongoURI = environment.getProperty("spring.data.mongodb.uri");
        if (StringLib.isNotEmpty(mongoURI)) {
            MongoClientURI clientURI = new MongoClientURI(mongoURI);
            String username = clientURI.getUsername();
            String password = "";
            if (clientURI.getPassword() != null && clientURI.getPassword().length > 0) {
                password = new String(clientURI.getPassword());
            }

            String newUserName = "";
            String newPassword = "";
            try {
                if (StringLib.startsWithIgnoreCase(username, Prefix)) {
                    String encryUserName = StringLib.substring(username, Prefix.length());
                    if (StringLib.isNotEmpty(encryUserName)) {
                        newUserName = encryptor.decrypt(encryUserName);
                    }
                }

                if (StringLib.isNotEmpty(password)) {
                    String strPassword = new String(password);
                    if (StringLib.startsWithIgnoreCase(strPassword, Prefix)) {
                        String encryPassword = StringLib.substring(strPassword, Prefix.length());
                        if (StringLib.isNotEmpty(encryPassword)) {
                            newPassword = encryptor.decrypt(encryPassword);
                        }
                    }
                }
            } catch (Exception e) {
            }

            if (StringLib.isEmpty(newUserName) && StringLib.isEmpty(newPassword)) {
                mongoURI = StringLib.replace(mongoURI, StringLib.join(username, ":", password, "@"), "");
            } else {
                mongoURI = StringLib.replace(mongoURI, username, newUserName);
                mongoURI = StringLib.replace(mongoURI, password, newPassword);
            }
            Properties props = new Properties();
            props.put("spring.data.mongodb.uri", mongoURI);
            environment.getPropertySources().addFirst(new PropertiesPropertySource("myProps", props));
        }
    }


    /*public static void main(String[] args) {
        System.out.println(encryptor.encrypt("janus"));
        System.out.println(encryptor.encrypt("9234"));
    }*/
}
