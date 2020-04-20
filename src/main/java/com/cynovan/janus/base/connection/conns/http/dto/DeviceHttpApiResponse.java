package com.cynovan.janus.base.connection.conns.http.dto;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.conns.activemq.security.TokenAuthService;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.message.entity.DeviceConnExceptionMessageBuilder;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;

public class DeviceHttpApiResponse {

    private int code = 200;
    private String message = "";

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public ObjectNode toJson() {
        return (ObjectNode) JsonLib.toJSON(this);
    }

    public String toString() {
        return toJson().toString();
    }

    public static DeviceHttpApiResponse check(String data, String protocol) {
        DeviceHttpApiResponse apiResponse = new DeviceHttpApiResponse();
        Document valueData = null;
        try {
            valueData = Document.parse(data);
        } catch (Exception e) {
            apiResponse.setCode(1002);
            apiResponse.setMessage(StringLib.join("数据格式错误", "：" + e.getMessage()));

            MessageDto messageDto = DeviceConnExceptionMessageBuilder.build(protocol, StringLib.join("数据解析为JSON时异常", "：" + e.getMessage()), data);
            MessageService messageService = SpringContext.getBean(MessageService.class);
            messageService.send(messageDto);

            return apiResponse;
        }

        String token = DocumentLib.getString(valueData, "token");
        TokenAuthService tokenAuthService = SpringContext.getBean(TokenAuthService.class);
        if (!tokenAuthService.checkToken(token)) {
            apiResponse.setCode(1003);
            apiResponse.setMessage("数据Token错误,请检查");
            return apiResponse;
        }

        if (!valueData.containsKey("uuid")) {
            apiResponse.setCode(1004);
            apiResponse.setMessage("数据中没有uuid,请检查");
            return apiResponse;
        }
        DeviceDataService deviceDataService = SpringContext.getBean(DeviceDataService.class);
        deviceDataService.onData(valueData);
        return apiResponse;
    }
}
