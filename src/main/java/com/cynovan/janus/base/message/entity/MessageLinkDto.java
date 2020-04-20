package com.cynovan.janus.base.message.entity;

public class MessageLinkDto {

    public MessageLinkDto(String _name, String _url) {
        this.name = _name;
        this.url = _url;
    }

    private String name;
    private String url;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
