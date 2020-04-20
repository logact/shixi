package com.cynovan.janus.base.connection.conns.activemq;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.service.DataAccessCreateService;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.RateLimiterUtils;
import com.cynovan.janus.base.utils.StringLib;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.RemovalCause;
import com.github.benmanes.caffeine.cache.RemovalListener;
import com.mongodb.client.model.Projections;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class DeviceOnlineService implements ApplicationRunner {

    @Autowired
    private I18nService i18nService;

//    @Autowired
//    private DeviceTimelineProcessor deviceStateProcessor;

    private Cache<String, String> deviceOnlineCache = Caffeine.newBuilder()
            .expireAfterWrite(3l, TimeUnit.MINUTES).removalListener(new RemovalListener<String, String>() {
                @Override
                public void onRemoval(@Nullable String key, @Nullable String value, @Nonnull RemovalCause cause) {
                    if (StringLib.equals(value, "true")) {
                        DBUtils.updateOne(QDevice.collectionName, DocumentLib.newDoc("uuid", key),
                                DocumentLib.new$Set(DocumentLib.newDoc("online", false)));

                        MessageDto offDto = new MessageDto();
                        offDto.setTitle(i18nService.getValue("设备下线通知", "device.offline.noty", "system"));
                        offDto.setContent(String.format(i18nService.getValue("设备 %s 下线", "device.offline", "system"), key));
                        offDto.setType("deviceOnlineChange");
                        offDto.addParam("设备", key);
                        MessageService ms = SpringContext.getBean(MessageService.class);
                        ms.send(offDto);

                        /*设备下线时，需要处理它的状态信息*/
                    }
                }
            }).build();

    @Autowired
    private MessageService messageService;


    @Override
    public void run(ApplicationArguments args) throws Exception {
        initDeviceStateOnStartup();
    }

    private void initDeviceStateOnStartup() {
        List<Document> deviceList = DBUtils.list(QDevice.collectionName,
                DocumentLib.newDoc("online", true), Projections.include("uuid"));
        deviceList.stream().forEach(device -> {
            String uuid = DocumentLib.getString(device, "uuid");
            if (StringLib.isNotEmpty(uuid)) {
                deviceOnlineCache.put(uuid, "true");
            }
        });
    }

    @Scheduled(cron = "0 */2 * * * ?")
    private void scheduleCleanUp() {
        deviceOnlineCache.cleanUp();
    }

    /*创建连接存在错误，直接提示用户，并发消息给系统*/
    public void connException(String uuid, Map<String, String> params) {
        MessageDto messageDto = new MessageDto();
        messageDto.setTitle(i18nService.getValue("设备接入异常", "device.connect.bad", "system"));
        messageDto.setContent(String.format(i18nService.getValue("设备 %s 接入异常，请检查", "device.connect.exception", "system"), uuid));
        messageDto.addParam(i18nService.getValue("设备", "device", "system"), uuid);
        messageDto.getParamMap().putAll(params);
        messageService.send(messageDto);
    }

    @Autowired
    private DataAccessCreateService dataAccessCreateService;

    /*读取数据过程中存在异常，异常的时候,3分钟后再次读取*/
    public void readDataException(String uuid, Map<String, String> params) {
        DataAccessCreateService dataAccessCreateService = SpringContext.getBean(DataAccessCreateService.class);
        dataAccessCreateService.unregister(uuid);

        MessageDto messageDto = new MessageDto();
        messageDto.setTitle(i18nService.getValue("设备读取数据异常", "device.connect.bad", "system"));
        messageDto.setContent(String.format(i18nService.getValue("设备 %s 读取数据异常；预计于3分钟后尝试再次读取", "device.read.exception", "system"), uuid));
        messageDto.addParam(i18nService.getValue("设备", "device", "system"), uuid);
        messageDto.getParamMap().putAll(params);
        messageService.send(messageDto);

        dataAccessCreateService.unregister(uuid);
    }

    public void online(String uuid) {
        boolean online = StringLib.isNotEmpty(deviceOnlineCache.getIfPresent(uuid));
        if (!online) {
            /*设备存在的时候才会提示用户*/
            MessageDto msgDto = new MessageDto();
            msgDto.setTitle(i18nService.getValue("设备上线通知", "device.online.noty", "system"));
            msgDto.setContent(String.format(i18nService.getValue("设备 %s 上线", "device.online", "system"), uuid));
            msgDto.setType("deviceOnlineChange");
            msgDto.addParam(i18nService.getValue("设备", "device", "system"), uuid);

            messageService.send(msgDto);
        }

        deviceOnlineCache.put(uuid, "true");

        /*此处做限流处理，即每1分钟执行该方法一次而已*/
        boolean success = RateLimiterUtils.tryAcquire("ONLINE_UPDATE_" + uuid, RateLimiterUtils.PER_EVERY_1_MINUTES);
        if (success) {
            DBUtils.updateOne(QDevice.collectionName, DocumentLib.newDoc("uuid", uuid),
                    DocumentLib.new$Set(DocumentLib.newDoc("online", true)));
        }
    }
}
