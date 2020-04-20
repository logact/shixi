package com.cynovan.janus.base.connection.service.bean;

import com.serotonin.bacnet4j.LocalDevice;

import java.util.Collection;
import java.util.HashSet;

public class PortAndUUID {
    int port;
    private Collection<String> uuids = new HashSet<>();
    LocalDevice localDevice;

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public Collection<String> getUuids() {
        return uuids;
    }

    public void setUuids(Collection<String> uuids) {
        this.uuids = uuids;
    }

    public LocalDevice getLocalDevice() {
        return localDevice;
    }

    public void setLocalDevice(LocalDevice localDevice) {
        this.localDevice = localDevice;
    }

    public void addUUID(String uuid){
        this.uuids.add(uuid);
    }

    public void removeUUId(String uuid){
        this.uuids.remove(uuid);
    }
}













