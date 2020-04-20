package com.cynovan.janus.addons.wrench.listener;

import com.cynovan.janus.addons.wrench.listener.service.WrenchDataService;
import com.cynovan.janus.base.appstore.service.AppStoreService;
import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

/**
 * @author Aric.Chen
 * @date 2020/3/27 18:01
 */
@Component
public class WrenchDataListener implements ApplicationListener<DeviceDataEvent> {

    @Autowired
    private AppStoreService appStoreService;

    @Autowired
    private WrenchDataService wrenchDataService;

    @Override
    public void onApplicationEvent(DeviceDataEvent deviceDataEvent) {
        if (appStoreService.checkAppInstall("wrench_mgr") == true) {
            wrenchDataService.process(deviceDataEvent);
        }
    }
}
