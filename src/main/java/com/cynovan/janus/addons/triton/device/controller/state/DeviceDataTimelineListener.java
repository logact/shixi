package com.cynovan.janus.addons.triton.device.controller.state;

import com.cynovan.janus.addons.triton.device.controller.state.bean.DeviceTimelineProcessorBean;
import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import org.bson.Document;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class DeviceDataTimelineListener implements ApplicationListener<DeviceDataEvent> {

    @Override
    public void onApplicationEvent(DeviceDataEvent deviceDataEvent) {
        DeviceTimelineProcessorBean processorBean = new DeviceTimelineProcessorBean(deviceDataEvent.getOriginalData());
        processorBean.update();
    }

    public void offline(String uuid) {
        Document offlineData = new Document();
        offlineData.put("uuid", uuid);
        offlineData.put("time", new Date());
        DeviceTimelineProcessorBean processorBean = new DeviceTimelineProcessorBean(offlineData, "offline");
        processorBean.update();
    }
}
