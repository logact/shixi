package com.cynovan.janus.base.message.entity;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.utils.StringLib;

public class DeviceConnExceptionMessageBuilder {

    public static MessageDto build(String connType, String exception, String data) {
        return build(connType, exception, data, null);
    }

    public static MessageDto build(String connType, String exception, String data, String uuid) {
        I18nService i18nService = SpringContext.getBean(I18nService.class);
        MessageDto messageDto = new MessageDto();
        if (StringLib.isNotEmpty(uuid)) {
            messageDto.addParam(i18nService.getValue("设备", "device", "system"), uuid);
        }
        messageDto.setTitle(i18nService.getValue("数据解析异常", "action.send.fail", "system"));
        if (StringLib.isNotEmpty(data)) {
            messageDto.addParam(i18nService.getValue("数据", "data", "system"), data);
        }
        if (StringLib.isNotEmpty(exception)) {
            messageDto.addParam(i18nService.getValue("异常", "exception", "system"), exception);
        }
        messageDto.addParam(i18nService.getValue("设备连接方式", "device.connect.style", "system"), connType);
        StringBuilder contentBuilder = new StringBuilder();
        if (StringLib.isNotEmpty(connType)) {
            contentBuilder.append("%s");
            contentBuilder.append("协议");
        }
        contentBuilder.append("数据解析异常");
        messageDto.setContent(String.format(i18nService.getValue(contentBuilder.toString(), "data.analyze.exception", "system"), connType));
        return messageDto;
    }
}
