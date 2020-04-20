package com.cynovan.janus.base.neptune.inter;

import org.bson.Document;

public class PipelineStream {

    private Document deviceData;

    private boolean shouldToMongoDB = true;

    private boolean shouldToNeptune = true;

    private boolean shouldToWebsocket = true;

    public Document getDeviceData() {
        return deviceData;
    }

    public void setDeviceData(Document deviceData) {
        this.deviceData = deviceData;
    }

    public boolean isShouldToMongoDB() {
        return shouldToMongoDB;
    }

    public void setShouldToMongoDB(boolean shouldToMongoDB) {
        this.shouldToMongoDB = shouldToMongoDB;
    }

    public boolean isShouldToNeptune() {
        return shouldToNeptune;
    }

    public void setShouldToNeptune(boolean shouldToNeptune) {
        this.shouldToNeptune = shouldToNeptune;
    }

    public boolean isShouldToWebsocket() {
        return shouldToWebsocket;
    }

    public void setShouldToWebsocket(boolean shouldToWebsocket) {
        this.shouldToWebsocket = shouldToWebsocket;
    }
}
