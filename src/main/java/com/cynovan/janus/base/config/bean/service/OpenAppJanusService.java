package com.cynovan.janus.base.config.bean.service;

import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.utils.HttpLib;
import com.cynovan.janus.base.utils.RequestLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.collect.Maps;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@Component
public class OpenAppJanusService {

    public JsonNode callJanusApi(String appId, String api, String method, Map<String, String> params, HttpServletRequest request) {
        if (params == null) {
            params = Maps.newHashMap();
        }
        params.put("token", QJanus.getToken());
        String url = RequestLib.getCompleteUrl(request, api);
        JsonNode result = null;
        if (StringLib.equalsAnyIgnoreCase(method, "post")) {
            result = HttpLib.post(url, params);
        } else {
            result = HttpLib.get(url, params);
        }
        return result;
    }
}
