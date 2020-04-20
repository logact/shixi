package com.cynovan.janus.base.device.eventbus;

import org.bson.Document;
import org.springframework.context.ApplicationEvent;

public class DeviceDataEvent extends ApplicationEvent {

    private Document toDbData;

    private Document originalData;

    private String uuid;

    public DeviceDataEvent(Object source, String _uuid, Document _originalData, Document _toDbData) {
        super(source);
        this.uuid = _uuid;
        this.toDbData = _toDbData;
        this.originalData = _originalData;
    }

    public Document getToDbData() {
        return toDbData;
    }

    public void setToDbData(Document toDbData) {
        this.toDbData = toDbData;
    }

    public Document getOriginalData() {
        return originalData;
    }

    public void setOriginalData(Document originalData) {
        this.originalData = originalData;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }
}
