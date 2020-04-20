package com.cynovan.janus.addons.api.controller;

import com.cynovan.janus.addons.api.dto.HttpApiResponse;
import com.cynovan.janus.base.config.auth.service.AuthToken;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping(value = "api/janus")
public class JanusApiWeb {

    @Autowired
    private I18nService i18nService;

    @GetMapping(value = "websocket-sockjs")
    public String websocket(@RequestParam String token, @RequestParam String uuid, HttpServletRequest request) {
        HttpApiResponse response = HttpApiResponse.checkToken(token);
        if (response.getCode() > 200) {
            return response.toString();
        }
        Document device = DBUtils.find(QDevice.collectionName, DocumentLib.newDoc(QDevice.uuid, uuid));
        if (device == null) {
            response.setCode(HttpApiResponse.NOT_EXISTS);
            response.setMessage(i18nService.getValue("设备不存在", "api.device.null", "system"));
            return response.toString();
        }

        String authToken = AuthToken.getAuthToken();
        String url = RequestLib.getCompleteUrl(request);
        String websocket = StringLib.join(url, "ws");

        ObjectNode data = JsonLib.createObjNode();
        data.put("websocket", websocket);
        data.put("topic", "/ws/deviceData/" + uuid);
        response.setData(data);

        return response.toString();
    }

    @GetMapping(value = "websocket")
    public String websocket2(@RequestParam String token, @RequestParam String uuid, HttpServletRequest request) {
        HttpApiResponse response = HttpApiResponse.checkToken(token);
        if (response.getCode() > 200) {
            return response.toString();
        }
        Document device = DBUtils.find(QDevice.collectionName, DocumentLib.newDoc(QDevice.uuid, uuid));
        if (device == null) {
            response.setCode(HttpApiResponse.NOT_EXISTS);
            response.setMessage(i18nService.getValue("设备不存在", "api.device.null", "system"));
            return response.toString();
        }

        String url = RequestLib.getCompleteUrl(request);
        url = StringLib.replace(url, "http", "ws");
        String websocket = StringLib.join(url, "websocket");

        ObjectNode data = JsonLib.createObjNode();
        data.put("websocket", websocket);
        data.put("topic", "/websocket/deviceData/" + uuid);
        response.setData(data);

        return response.toString();
    }
}
