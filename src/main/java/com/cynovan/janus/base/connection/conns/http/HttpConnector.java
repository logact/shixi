package com.cynovan.janus.base.connection.conns.http;

import com.cynovan.janus.base.connection.conns.http.dto.DeviceHttpApiResponse;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.HttpLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

@Controller
@RequestMapping(value = "httpapi")
public class HttpConnector {

    @ResponseBody
    @PostMapping(value = "data")
    public String data(@RequestParam String data) {
        DeviceHttpApiResponse response = DeviceHttpApiResponse.check(data, "http");
        return response.toString();
    }

    public boolean push(Document config, ObjectNode pushObject) {
        String uuid = DocumentLib.getString(config, "uuid");
        Document httpConfig = DocumentLib.getDocument(config, "conn_info_http_rest");
        String url = DocumentLib.getString(httpConfig, "url");
        if (StringLib.isEmpty(url)) {
            return false;
        } else {
            JsonNode jsonNode = HttpLib.post(url, JsonLib.parseJSON(pushObject, Map.class));
            return jsonNode != null;
        }
    }
}
