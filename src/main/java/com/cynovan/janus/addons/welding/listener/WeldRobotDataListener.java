package com.cynovan.janus.addons.welding.listener;

import com.cynovan.janus.addons.welding.listener.service.WeldRobotAICheckService;
import com.cynovan.janus.addons.welding.listener.service.WeldRobotErrorCodeService;
import com.cynovan.janus.base.appstore.service.AppStoreService;
import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

/**
 * @author Aric.Chen
 * @date 2020/3/27 17:54
 */
@Component
public class WeldRobotDataListener implements ApplicationListener<DeviceDataEvent> {

    @Autowired
    private WeldRobotAICheckService weldRobotAICheckService;

    @Autowired
    private WeldRobotErrorCodeService weldRobotErrorCodeService;

    @Autowired
    private AppStoreService appStoreService;

    @Override
    public void onApplicationEvent(DeviceDataEvent deviceDataEvent) {
        if (appStoreService.checkAppInstall("welding") == true) {
            weldRobotAICheckService.process(deviceDataEvent);
            weldRobotErrorCodeService.process(deviceDataEvent);
        }
    }
}
