package com.cynovan.janus.addons.api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * @author ian.lan@cynovan.com
 */

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum ResponseCodeEnum {

    /**
     * HTTP 接口返回代码
     * 新增提示对应的i18nKey，方便翻译成其他语言
     */

//    @JsonProperty("200")
    SUCCESS(200, "成功", "api.success"),

    //    @JsonProperty("401")
    AUTH_FAILED(401, "Token错误,授权失败", "api.token.fail"),

    //    @JsonProperty("1000")
    NO_ACCESS_WAY(1000, "接入方式不存在", "api.connect.null"),

    //    @JsonProperty("1001")
    PARAM_MISSING(1001, "缺少参数", "api.miss.params"),

    //    @JsonProperty("1002")
    PARAM_INVALID(1002, "参数错误", "api.wrong.params"),

    //    @JsonProperty("1003")
    NOT_EXISTS(1003, "设备不存在", "api.device.null"),

    //    @JsonProperty("1004")
    DATETIME_ERROR(1004, "时间格式不正确", "api.wrong.date"),

    //    @JsonProperty("1005")
    ARRIVE_UPPER_LIMIT(1005, "设备可接入数量已达到上限", "api.device.upper.limit"),

    //    @JsonProperty("1006")
    USED_NOT_BELONG(1006, "传入的UUID不属于该Janus或已被使用", "api.uuid.unavailable"),

    FILE_UPLOAD_FAIL(2001, "文件上传失败", "api.file.upload.fail"),
    FILE_NOT_FOUND(2002, "文件未找到", "api.file.null");

    private int code;
    private String message;
    private String i18nKey;

    ResponseCodeEnum(int code, String message, String i18nKey) {
        this.code = code;
        this.message = message;
        this.i18nKey = i18nKey;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public String getI18nKey() {
        return i18nKey;
    }
}
