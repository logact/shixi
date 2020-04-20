package com.cynovan.janus.addons.api.controller.device_conn;

import com.cynovan.janus.addons.api.dto.HttpApiResponse;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.i18n.service.I18nService;
import org.bson.Document;

import javax.servlet.http.HttpServletRequest;

public class ApiConnection {
    String token;
    Document conn;
    private I18nService i18nService = SpringContext.getBean(I18nService.class);

    public ApiConnection(String token) {
        this.token = token;
        this.conn = new Document();
    }

    public Document getConn() {
        return conn;
    }

    public void setConn(Document conn) {
        this.conn = conn;
    }

    public Document getConnInfo (HttpServletRequest request, CheckMessage message){
        message.setSuccess(false);
        message.addData("code", HttpApiResponse.NO_ACCESS_WAY);
        message.addMessage(i18nService.getValue("接入方式不存在", "api.connect.null", "system"));

        return conn;
    }
}
