package com.cynovan.janus.addons.press.listener;

import com.cynovan.janus.addons.press.listener.service.PressDataService;
import com.cynovan.janus.base.appstore.service.AppStoreService;
import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

/**
 * @author Aric.Chen
 * @date 2020/3/27 18:04
 */
@Component
public class PressDataListener implements ApplicationListener<DeviceDataEvent> {

    @Autowired
    private AppStoreService appStoreService;

    @Autowired
    private PressDataService pressDataService;

    @Override
    public void onApplicationEvent(DeviceDataEvent deviceDataEvent) {
        if (appStoreService.checkAppInstall("app_press") == true) {
            pressDataService.process(deviceDataEvent);
        }
    }
}
