package com.cynovan.janus.addons.data_monitor.listener;

import com.cynovan.janus.base.appstore.service.AppStoreService;
import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

/**
 * @author Aric.Chen
 * @date 2020/3/27 17:47
 */
@Component
public class DataMonitorDataListener implements ApplicationListener<DeviceDataEvent> {

    @Autowired
    private AppStoreService appStoreService;

    @Autowired
    private DataMonitorProcessService dataMonitorProcessService;

    @Override
    public void onApplicationEvent(DeviceDataEvent deviceDataEvent) {
        if (appStoreService.checkAppInstall("data_monitor")) {
            dataMonitorProcessService.process(deviceDataEvent);
        }
    }
}
