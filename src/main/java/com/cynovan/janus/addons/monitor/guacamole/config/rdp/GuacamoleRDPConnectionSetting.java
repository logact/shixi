package com.cynovan.janus.addons.monitor.guacamole.config.rdp;


import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfig;

/**
 * Created by ian on 4/6/16.
 */
public class GuacamoleRDPConnectionSetting extends GuacamoleConfig {

    private String protocol = "rdp";

    /**
     *  Connection
     */

    /**
     *   hostname or IP address
     */
    private String hostname;

    /**
     * ussually 5900 or 5900 + display number (5901, 5902 ...)
     */
    private String port;

    public String getProtocol() {
        return protocol;
    }

    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }

    public String getPort() {
        return port;
    }

    public void setPort(String port) {
        this.port = port;
    }
}
