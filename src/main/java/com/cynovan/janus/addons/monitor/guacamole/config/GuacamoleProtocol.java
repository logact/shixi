package com.cynovan.janus.addons.monitor.guacamole.config;

/**
 * Created by ian on 2/15/17.
 */
public enum GuacamoleProtocol {
    vnc("vnc"),
    rdp("rdp");

    private String value;

    private GuacamoleProtocol(String i) {
        this.setValue(i);
    }

    public String getValue() {
        return this.value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
