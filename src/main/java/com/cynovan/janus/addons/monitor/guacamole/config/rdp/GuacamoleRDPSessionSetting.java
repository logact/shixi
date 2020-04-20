package com.cynovan.janus.addons.monitor.guacamole.config.rdp;


import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfig;

/**
 * Created by ian on 4/6/16.
 */
public class GuacamoleRDPSessionSetting extends GuacamoleConfig {

    /**
     * client name , default hostname
     */
    private String client_name;

    /**
     * whether connect to console session of RDP
     */
    private Boolean console;

    public String getClient_name() {
        return client_name;
    }

    public void setClient_name(String client_name) {
        this.client_name = client_name;
    }

    public Boolean getConsole() {
        return console;
    }

    public void setConsole(Boolean console) {
        this.console = console;
    }
}
