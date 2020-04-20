package com.cynovan.janus.base.devicedata.processor;

import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.neptune.inter.AbstractPipelineProcess;
import com.cynovan.janus.base.neptune.inter.PipelineStream;
import com.cynovan.janus.base.service.executor.ExecutorTaskService;
import com.cynovan.janus.base.utils.CacheUtils;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.RateLimiterUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class DeviceDataAttachProcessor extends AbstractPipelineProcess {

    @Autowired
    private DeviceDataService deviceDataService;

    @Autowired
    private ExecutorTaskService executorTaskService;

    @Override
    public void process(PipelineStream pipelineStream) {
        Document objectData = pipelineStream.getDeviceData();
        String uuid = null;
        if (objectData != null && objectData.containsKey("uuid")) {
            uuid = DocumentLib.getString(objectData, "uuid");
        }
        if (uuid != null && objectData.containsKey("data")) {
            Document data = DocumentLib.getDocument(objectData, "data");
            // 上一次最新数据
            Document lastData = deviceDataService.loadDeviceLatestData(uuid);
            if (lastData != null && !lastData.isEmpty()) {
                Set<String> dataKeys = data.keySet();
                Set<String> lastDataKeys = lastData.keySet();

                lastDataKeys.stream().forEach(key -> {
                    if (!dataKeys.contains(key)) {
                        data.put(key, lastData.get(key));
                    }
                });
            }

            CacheUtils.set("dynamic_" + uuid, data);

            boolean success = RateLimiterUtils.tryAcquire("DYNAMIC_UPDATE_" + uuid, RateLimiterUtils.PER_EVERY_3_MINUTES);
            if (success) {
                DBUtils.updateOne(QDevice.collectionName, DocumentLib.newDoc("uuid", uuid),
                        DocumentLib.new$Set("dynamicData", data));
            }
        }
    }

    @Override
    public Integer getPipelineOrder() {
        return ORDER_AFTER_EXCHANGE + 10000;
    }
}
