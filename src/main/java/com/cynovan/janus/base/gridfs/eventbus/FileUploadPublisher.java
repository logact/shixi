package com.cynovan.janus.base.gridfs.eventbus;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class FileUploadPublisher {

    @Autowired
    private ApplicationContext applicationContext;

    public void publish(Document file) {
        applicationContext.publishEvent(new FileUploadEvent(this, file));
    }
}
