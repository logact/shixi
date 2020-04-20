package com.cynovan.janus.addons.monitor.guacamole.config.vnc;


import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfig;
import com.cynovan.janus.addons.monitor.guacamole.config.sftp.GuacamoleSFTPConfig;

/**
 * Created by ian on 4/6/16.
 */
public class GuacamoleVNCConfig extends GuacamoleConfig {

    /**
     *  Connection
     */
    private GuacamoleVNCConnectionSetting connectionSetting;

    /**
     *  Authentication
     */
    private GuacamoleVNCAuthenticationSetting authenticationSetting;

    /**
     * Display setting
     */
    private GuacamoleVNCDisplaySetting displaySetting;

    /**
     * SFTP setting
     */
    private GuacamoleSFTPConfig sftpConfig;

    public GuacamoleVNCConfig() {
    }

    public GuacamoleVNCConnectionSetting getConnectionSetting() {
        return connectionSetting;
    }

    public void setConnectionSetting(GuacamoleVNCConnectionSetting connectionSetting) {
        this.connectionSetting = connectionSetting;
    }

    public GuacamoleVNCAuthenticationSetting getAuthenticationSetting() {
        return authenticationSetting;
    }

    public void setAuthenticationSetting(GuacamoleVNCAuthenticationSetting authenticationSetting) {
        this.authenticationSetting = authenticationSetting;
    }

    public GuacamoleVNCDisplaySetting getDisplaySetting() {
        return displaySetting;
    }

    public void setDisplaySetting(GuacamoleVNCDisplaySetting displaySetting) {
        this.displaySetting = displaySetting;
    }

    public GuacamoleSFTPConfig getSftpConfig() {
        return sftpConfig;
    }

    public void setSftpConfig(GuacamoleSFTPConfig sftpConfig) {
        this.sftpConfig = sftpConfig;
    }

    @Override
    public void buildParameters() {
        addParameters(connectionSetting);
        addParameters(authenticationSetting);
        addParameters(displaySetting);
        addParameters(sftpConfig);
    }
}
