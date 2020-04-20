package com.cynovan.janus.base.config.auth.dto;

import com.cynovan.janus.base.utils.StringLib;

public class JanusToken implements java.io.Serializable {

    public static final String SUPER_USER_NAME = "^_^_JANUS_SUPER_USER_JANUS_^_^";

    public JanusToken(String id, String token, String username) {
        this.id = id;
        this.token = token;
        if (StringLib.isEmpty(username)) {
            this.username = SUPER_USER_NAME;
        } else {
            this.username = username;
        }
    }

    private String id;
    private String token;
    private String username;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
