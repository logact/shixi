package com.cynovan.janus.base.connection.conns.device_as_httpserver;

import com.cynovan.janus.base.connection.conns.activemq.DeviceOnlineService;
import com.cynovan.janus.base.connection.service.base.DeviceConnBaseService;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.HttpLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Maps;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DeviceAsHttpServerService extends DeviceConnBaseService {

    @Autowired
    private DeviceOnlineService deviceOnlineService;

    @Autowired
    private DeviceDataService deviceDataService;

    public void execute(Document dataAccessObject) {
        String uuid = DocumentLib.getString(dataAccessObject, "uuid");
        try {
            Document httpServerConfig = DocumentLib.getDocument(dataAccessObject, "conn_info_http_server");
            String url = DocumentLib.getString(httpServerConfig, "address");
            String request_type = DocumentLib.getString(httpServerConfig, "request_type");
            Map<String, String> paramsMap = Maps.newHashMap();
            List<Document> paramsList = DocumentLib.getList(httpServerConfig, "rows");
            if (CollectionUtils.isNotEmpty(paramsList)) {
                paramsList.stream().forEach(param -> {
                    String key = DocumentLib.getString(param, "paramkey");
                    String value = DocumentLib.getString(param, "paramvalue");
                    paramsMap.put(key, value);
                });
            }

            String data = null;
            if (StringLib.equalsIgnoreCase(request_type, "post")) {
                data = HttpLib.postReturnString(url, paramsMap);
            } else {
                data = HttpLib.getReturnString(url, paramsMap);
            }

            if (StringLib.isNotEmpty(data)) {
                Document jsonData = null;
                try {
                    jsonData = Document.parse(data);
                    if (!jsonData.containsKey("uuid")) {
                        jsonData.put("uuid", uuid);
                    }
                } catch (Exception e) {
                    jsonData = new Document();
                    jsonData.put("uuid", uuid);
                    jsonData.put("action", "data");
                    jsonData.put("data", DocumentLib.newDoc("data", data));
                }
                if (jsonData != null) {
                    deviceDataService.onData(jsonData);
                }
            }
        } catch (Exception e) {
            Map<String, String> params = Maps.newHashMap();
            params.put("异常类型", "Http Server连接异常");
            params.put("异常详情", e.getMessage());
            deviceOnlineService.readDataException(uuid, params);
        }

    }

    public void timerSendMessage(Document exchangeConfig) {
        execute(exchangeConfig);
    }

    @Override
    public void unregister(String uuid) {

    }

}
