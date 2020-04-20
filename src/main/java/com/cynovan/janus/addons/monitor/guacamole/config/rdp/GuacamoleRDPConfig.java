package com.cynovan.janus.addons.monitor.guacamole.config.rdp;

import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfig;
import com.cynovan.janus.addons.monitor.guacamole.config.sftp.GuacamoleSFTPConfig;

/**
 * Created by ian on 4/6/16.
 */
public class GuacamoleRDPConfig extends GuacamoleConfig {

    private GuacamoleRDPConnectionSetting connectionSetting;

    private GuacamoleRDPAuthenticationSetting authenticationSetting;

    private GuacamoleRDPDisplaySetting displaySetting;

    private GuacamoleRDPSessionSetting sessionSetting;

    private GuacamoleRDPDeviceRedirectionSetting deviceRedirectionSetting;

    private GuacamoleRDPPerformanceFlags performanceFlags;

    /**
     * SFTP setting
     */
    private GuacamoleSFTPConfig sftpConfig;

    public GuacamoleRDPConfig() {

    }

    public GuacamoleRDPConnectionSetting getConnectionSetting() {
        return connectionSetting;
    }

    public void setConnectionSetting(GuacamoleRDPConnectionSetting connectionSetting) {
        this.connectionSetting = connectionSetting;
    }

    public GuacamoleSFTPConfig getSftpConfig() {
        return sftpConfig;
    }

    public void setSftpConfig(GuacamoleSFTPConfig sftpConfig) {
        this.sftpConfig = sftpConfig;
    }

    public GuacamoleRDPAuthenticationSetting getAuthenticationSetting() {
        return authenticationSetting;
    }

    public void setAuthenticationSetting(GuacamoleRDPAuthenticationSetting authenticationSetting) {
        this.authenticationSetting = authenticationSetting;
    }

    public GuacamoleRDPDisplaySetting getDisplaySetting() {
        return displaySetting;
    }

    public void setDisplaySetting(GuacamoleRDPDisplaySetting displaySetting) {
        this.displaySetting = displaySetting;
    }

    public GuacamoleRDPSessionSetting getSessionSetting() {
        return sessionSetting;
    }

    public void setSessionSetting(GuacamoleRDPSessionSetting sessionSetting) {
        this.sessionSetting = sessionSetting;
    }

    public GuacamoleRDPDeviceRedirectionSetting getDeviceRedirectionSetting() {
        return deviceRedirectionSetting;
    }

    public void setDeviceRedirectionSetting(GuacamoleRDPDeviceRedirectionSetting deviceRedirectionSetting) {
        this.deviceRedirectionSetting = deviceRedirectionSetting;
    }

    public GuacamoleRDPPerformanceFlags getPerformanceFlags() {
        return performanceFlags;
    }

    public void setPerformanceFlags(GuacamoleRDPPerformanceFlags performanceFlags) {
        this.performanceFlags = performanceFlags;
    }

    @Override
    public void buildParameters() {
        addParameters(connectionSetting);
        addParameters(authenticationSetting);
        addParameters(displaySetting);
        addParameters(sessionSetting);
        addParameters(deviceRedirectionSetting);
        addParameters(performanceFlags);
        addParameters(sftpConfig);
    }
}
