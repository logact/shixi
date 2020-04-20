package com.cynovan.janus.addons.fanuc_cnc.listener;

import com.cynovan.janus.addons.fanuc_cnc.listener.service.FanucCncService;
import com.cynovan.janus.base.appstore.service.AppStoreService;
import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

/**
 * @author Aric.Chen
 * @date 2020/3/27 17:59
 */
@Component
public class FanucDeviceDataListener implements ApplicationListener<DeviceDataEvent> {

    @Autowired
    private AppStoreService appStoreService;

    @Autowired
    private FanucCncService fanucCncService;

    @Override
    public void onApplicationEvent(DeviceDataEvent deviceDataEvent) {
        if (appStoreService.checkAppInstall("fanuc_cnc_app") == true) {
            fanucCncService.process(deviceDataEvent);
        }
    }
}
