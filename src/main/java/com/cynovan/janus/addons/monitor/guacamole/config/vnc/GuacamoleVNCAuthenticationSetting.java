package com.cynovan.janus.addons.monitor.guacamole.config.vnc;


import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfig;

/**
 * Created by ian on 4/6/16.
 */
public class GuacamoleVNCAuthenticationSetting extends GuacamoleConfig {

    /**
     * password used to connect
     */
    private String password;

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Override
    public void buildParameters() {
        setParameter("password", password);
    }
}
