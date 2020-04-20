package com.cynovan.janus.addons.api.dto;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * @author noone
 */
public class HttpApiResponse {

    public static final int SUCCESS = 200;         // 成功
    public static final int AUTH_FAILED = 401;     // 授权失败
    public static final int NO_ACCESS_WAY = 1000;  // 接入方式不存在
    public static final int PARAM_MISSING = 1001;  // 缺少参数
    public static final int PARAM_INVALID = 1002;  // 参数错误
    public static final int NOT_EXISTS = 1003;     // 设备不存在
    public static final int DATETIME_ERROR = 1004;     // 时间格式错误
    public static final int ARRIVE_UPPER_LIMIT = 1005; // 设备可接入数量已达到上限
    public static final int USED_NOT_BELONG = 1006;    // 传入的UUID不属于该Janus或已经被使用
    public static final int JSON_EXCEPTION = 1020;    // 传入的UUID不属于该Janus或已经被使用

    private I18nService i18nService = SpringContext.getBean(I18nService.class);

    private int code = ResponseCodeEnum.SUCCESS.getCode();

    private String message;

    private ObjectNode data = null;

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

    public ObjectNode getData() {
        return data;
    }

    public void setData(ObjectNode data) {
        this.data = data;
    }

    public static HttpApiResponse newInstance() {
        return new HttpApiResponse();
    }

    public static HttpApiResponse checkToken(String token) {
        HttpApiResponse httpApiResponse = new HttpApiResponse();
        String checkedToken = DocumentLib.getString(QJanus.get(), "token");
        if (StringLib.equals(checkedToken, token)) {
            httpApiResponse.setResponseCode(ResponseCodeEnum.SUCCESS);
            return httpApiResponse;
        }
        httpApiResponse.setResponseCode(ResponseCodeEnum.AUTH_FAILED);
        return httpApiResponse;
    }

    @JsonIgnore
    public boolean isSuccess() {
        return this.code == ResponseCodeEnum.SUCCESS.getCode();
    }

    public void setResponseCode(ResponseCodeEnum responseCode) {
        this.setCode(responseCode.getCode());
        this.setMessage(i18nService.getValue(responseCode.getMessage(), responseCode.getI18nKey(), "system"));
    }

    @Override
    public String toString() {
        return JsonLib.toJSON(this).toString();
    }
}
