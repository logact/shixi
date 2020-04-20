package com.cynovan.janus.addons.monitor.guacamole.config.rdp;

import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfig;


/**
 * Created by ian on 4/6/16.
 */
public class GuacamoleRDPAuthenticationSetting extends GuacamoleConfig {

    /**
     * username
     */
    private String username;

    /**
     * password
     */
    private String password;

    /**
     * domain
     */
    private String domain;

    /**
     * security type ( rdp, nla, tls, any)
     */
    private String security;

    /**
     * ignore cert or not
     */
    private Boolean ignore_cert;

    /**
     * if security is nla, authentication must be enable
     */
    private Boolean disable_auth;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public String getSecurity() {
        return security;
    }

    public void setSecurity(String security) {
        this.security = security;
    }

    public Boolean getIgnore_cert() {
        return ignore_cert;
    }

    public void setIgnore_cert(Boolean ignore_cert) {
        this.ignore_cert = ignore_cert;
    }

    public Boolean getDisable_auth() {
        return disable_auth;
    }

    public void setDisable_auth(Boolean disable_auth) {
        this.disable_auth = disable_auth;
    }
}
