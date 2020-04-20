package com.cynovan.janus.base.message.entity;

import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import org.bson.Document;

import java.util.Date;
import java.util.List;
import java.util.Map;

public class MessageDto {

    private String title;
    private String content;
    private Date create_date = new Date();
    private Boolean read;
    private String type = "normal";
    private String uuid;
    private Map<String, String> paramMap = Maps.newHashMap();
    private List<MessageLinkDto> linkList = Lists.newArrayList();

    public List<MessageLinkDto> getLinkList() {
        return linkList;
    }

    public void setLinkList(List<MessageLinkDto> linkList) {
        this.linkList = linkList;
    }

    public void addLink(String name, String url) {
        this.linkList.add(new MessageLinkDto(name, url));
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Date getCreate_date() {
        return create_date;
    }

    public void setCreate_date(Date create_date) {
        this.create_date = create_date;
    }

    public Boolean getRead() {
        return read;
    }

    public void setRead(Boolean read) {
        this.read = read;
    }

    public Document toDocument() {
        return DocumentLib.parse(JsonLib.toString(this));
    }

    public String toString() {
        return toDocument().toJson();
    }

    public Map<String, String> getParamMap() {
        return paramMap;
    }

    public void setParamMap(Map<String, String> paramMap) {
        this.paramMap = paramMap;
    }

    public void addParam(String name, String param) {
        this.paramMap.put(name, param);
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }
}
