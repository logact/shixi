package com.cynovan.janus.addons.welding.listener.service;

import com.cynovan.janus.base.appstore.service.AppDataService;
import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.IterableUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WeldRobotErrorCodeService {

    @Autowired
    private DeviceDataService deviceDataService;

    @Autowired
    private AppDataService appDataService;

    public void process(DeviceDataEvent deviceDataEvent) {
        Document deviceData = deviceDataEvent.getToDbData();
        String uuid = DocumentLib.getString(deviceData, "uuid");
        if (StringLib.isNotEmpty(uuid)) {
            Document messageData = DocumentLib.getDocument(deviceData, "data");
            Document lastData = deviceDataService.loadDeviceLatestData(uuid);

            /*错误的Code*/
            String errorCode = DocumentLib.getString(messageData, "069_ERRORCode");
            if (StringLib.isNotEmpty(errorCode)) {
                String lastErrorCode = DocumentLib.getString(lastData, "069_ERRORCode");
                if (!StringLib.equalsIgnoreCase(errorCode, lastErrorCode)) {
                    /*不相等的时候才会添加报警记录*/
                    Document errorCodeConfig = appDataService.get("welding_device_error_code");
                    if (errorCodeConfig != null) {
                        List errorList = DocumentLib.getList(errorCodeConfig, "list");
                        if (CollectionUtils.isNotEmpty(errorList)) {
                            Object targetItem = IterableUtils.find(errorList, item -> {
                                Document itemObj = (Document) item;
                                return StringLib.equalsIgnoreCase(errorCode, DocumentLib.getString(itemObj, "code"));
                            });
                            if (targetItem != null) {
                                sendMessage(uuid, (Document) targetItem);
                            }
                        }
                    }
                }
            }
        }
    }

    @Autowired
    private MessageService messageService;

    private void sendMessage(String uuid, Document errorCodeItem) {
        String deviceName = QDevice.getDeviceName(uuid);
        deviceName = StringLib.join(deviceName, "(", uuid, ")");
        deviceName = StringLib.join(deviceName, "(", uuid, ")");

        String errorCode = DocumentLib.getString(errorCodeItem, "code");

        String title = StringLib.join("设备", deviceName, "报警");

        StringBuilder content = new StringBuilder();
        content.append(title);
        content.append("<br/>");
        content.append("报警代码 : " + errorCode);
        content.append("<br/>");
        content.append("错误信息 : " + DocumentLib.getString(errorCodeItem, "info"));
        content.append("<br/>");
        content.append("错误分析 : " + DocumentLib.getString(errorCodeItem, "reason"));
        content.append("<br/>");
        content.append("解决办法 : " + DocumentLib.getString(errorCodeItem, "solution"));
        content.append("<br/>");

        MessageDto messageDto = new MessageDto();
        messageDto.setTitle(title);
        messageDto.setContent(content.toString());
        messageDto.setUuid(uuid);
        messageDto.setType("DataMonitor");
        messageDto.addParam("触发设备", deviceName);
        messageService.send(messageDto);
    }
}
