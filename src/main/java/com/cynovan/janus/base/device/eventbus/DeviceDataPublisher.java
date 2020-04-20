package com.cynovan.janus.base.device.eventbus;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class DeviceDataPublisher {

    @Autowired
    private ApplicationContext applicationContext;

    public void publish(String uuid, Document originalData, Document toDbData) {
        applicationContext.publishEvent(new DeviceDataEvent(this, uuid, originalData, toDbData));
    }
}
