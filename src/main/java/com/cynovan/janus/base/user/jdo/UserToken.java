package com.cynovan.janus.base.user.jdo;

import org.bson.Document;

public class UserToken implements java.io.Serializable {

    public static final String SUPER_USER_NAME = "^_^_JANUS_SUPER_USER_JANUS_^_^";

    public UserToken(){}

    public UserToken(String id, String username, String access_token, String refresh_token) {
        this.id = id;
        this.username = username;
        this.access_token = access_token;
        this.refresh_token = refresh_token;
    }

    private String id;
    private String username;
    private Document userInfo = null;
    private String access_token;
    private String refresh_token;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAccess_token() {
        return access_token;
    }

    public void setAccess_token(String access_token) {
        this.access_token = access_token;
    }

    public String getRefresh_token() {
        return refresh_token;
    }

    public void setRefresh_token(String refresh_token) {
        this.refresh_token = refresh_token;
    }

    public Document getUserInfo() {
        return userInfo;
    }

    public void setUserInfo(Document userInfo) {
        this.userInfo = userInfo;
    }
}
