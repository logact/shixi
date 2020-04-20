package com.cynovan.janus.base.neptune.mq;

import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.neptune.jdo.QNeptuneSync;
import com.cynovan.janus.base.neptune.service.NeptuneMQMessageListener;
import com.cynovan.janus.base.neptune.service.NeptuneMessageService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.MQTTLib;
import com.cynovan.janus.base.utils.RandomUtils;
import com.cynovan.janus.base.utils.StringLib;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.RemovalCause;
import com.github.benmanes.caffeine.cache.RemovalListener;
import com.google.common.collect.Maps;
import org.bson.Document;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class NeptuneMQConnService {

    @Value("${neptune_mq}")
    private String broker;

    private MqttClient neptuneMqttClient;

    @Autowired
    private NeptuneMessageService neptuneMessageService;

    @Autowired
    private NeptuneMQMessageListener neptuneMQMessageListener;

    private Map<String, MqttClient> deviceMqttClientMap = Maps.newConcurrentMap();

    private Cache<String, String> deviceMqttClientUsedCache = Caffeine.newBuilder().maximumSize(500)
            .expireAfterAccess(3l, TimeUnit.MINUTES).removalListener(new RemovalListener<String, String>() {
                @Override
                public void onRemoval(@Nullable String key, @Nullable String value, @Nonnull RemovalCause cause) {
                    if (StringLib.isNotEmpty(key)) {
                        /*当三分钟客户端设备都没有发数据的时候，直接销毁MQTT的客户端*/
                        MqttClient deviceMqttClient = deviceMqttClientMap.get(key);
                        deviceMqttClientMap.remove(key);
                        if (deviceMqttClient != null) {
                            try {
                                deviceMqttClient.disconnect();
                                deviceMqttClient.close();
                            } catch (MqttException e) {
                                e.printStackTrace();
                            }
                        }
                    }
                }
            }).build();

    /*每30分钟执行一次连接状态*/
    @Scheduled(cron = "0 */30 * * * ?")
    private void schedule() {
        conn();
    }

    @Scheduled(cron = "0 */1 * * * ?")
    private void sendHeartBeat() {
        if (isConnection()) {
            Document sendData = DocumentLib.newDoc();
            sendData.put("action", "heartbeat");
            sendData.put("token", QJanus.getToken());
            sendMessageToNeptune(sendData);
        }

        deviceMqttClientUsedCache.cleanUp();
    }

    public boolean isConnection() {
        if (neptuneMqttClient == null || !neptuneMqttClient.isConnected()) {
            return false;
        }
        return true;
    }

    /*启动时直接尝试连接*/
    public void conn() {
        /*在该方法中判断，JANUS是否注册完成，如果注册完成，则启用MQTT Client，如果没有则放弃*/
        /*当注册成功后，重新调用该方法*/
        Document janus = QJanus.get();
        // janus 是否已注册
        if (DocumentLib.getBoolean(janus, QJanus.initialize)) {
            if (!isConnection()) {
                if (neptuneMqttClient == null) {
                    String token = DocumentLib.getString(janus, QJanus.token);
                    String company_token = DocumentLib.getString(janus, QJanus.company_token);
                    initMqttClient(token, company_token);
                } else {
                    try {
                        neptuneMqttClient.reconnect();
                    } catch (MqttException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }

    /*
        create a mqttclient and start it
     */
    private void initMqttClient(String janus_token, String company_token) {
        MemoryPersistence persistence = new MemoryPersistence();
        MqttConnectOptions connOpts = new MqttConnectOptions();
        connOpts.setUserName(company_token);
        connOpts.setPassword(company_token.toCharArray());
        connOpts.setAutomaticReconnect(true);
        if (StringLib.isNotEmpty(broker)) {
            try {
                if (neptuneMqttClient != null) {
                    neptuneMqttClient.close();
                }
                neptuneMqttClient = new MqttClient(broker, "JANUS_" + janus_token, persistence);
                neptuneMqttClient.setTimeToWait(5 * 1000);
                neptuneMqttClient.setCallback(new MqttCallbackExtended() {
                    @Override
                    public void connectComplete(boolean reconnect, String serverURI) {
                        subscribeData();
                        Document messageObject = new Document();
                        messageObject.put(QNeptuneSync.create_time, new Date());
                        messageObject.put(QNeptuneSync.status, QNeptuneSync.status_online);
                        QNeptuneSync.save(messageObject);

                        neptuneMessageService.syncDevice();
                    }

                    @Override
                    public void connectionLost(Throwable cause) {
//                        断线时，创建断线记录 时间，状态(连接丢失)
                        Document syncInfo = new Document();
                        syncInfo.put(QNeptuneSync.create_time, new Date());
                        syncInfo.put(QNeptuneSync.status, QNeptuneSync.status_lost_line);
                        syncInfo.put(QNeptuneSync.message, "连接丢失");
                        QNeptuneSync.save(syncInfo);
                    }

                    @Override
                    public void messageArrived(String topic, MqttMessage message) throws Exception {
                    }

                    @Override
                    public void deliveryComplete(IMqttDeliveryToken token) {
                    }
                });
                neptuneMqttClient.connect(connOpts);
                /*TODO Aricchen,成功则创建成功记录，时间，状态(连接成功)*/
            } catch (MqttException e) {
                e.printStackTrace();
                /*TODO Aricchen,成功则创建成功记录，时间，状态(连接失败),备注(失败原因，exception.getMessage)*/
                Document syncInfo = new Document();
                syncInfo.put(QNeptuneSync.create_time, new Date());
                syncInfo.put(QNeptuneSync.status, QNeptuneSync.status_Offline);
                syncInfo.put(QNeptuneSync.message, e.getMessage());
                QNeptuneSync.save(syncInfo);
            }
        }
    }

    private void subscribeData() {
        try {
            neptuneMqttClient.subscribe("janussub", 0, new IMqttMessageListener() {
                @Override
                public void messageArrived(String topic, MqttMessage message) throws Exception {
                    String valueData = MQTTLib.getData(message.getPayload());
                    /*on neptune push message*/
                    Document data = DocumentLib.parse(valueData);
                    neptuneMQMessageListener.onMessage(data);
                }
            });
        } catch (MqttException e) {
            e.printStackTrace();
        }
    }

    public void sendDeviceMessageToNeptune(Document data) {
        if (data != null) {
            String uuid = DocumentLib.getString(data, "uuid");
            if (isConnection()) {
                if (QDevice.checkDataToNeptune(uuid)) {
                    MqttClient deviceMqttClient = getDeviceMqttClient(uuid);
                    deviceMqttClientUsedCache.getIfPresent(uuid);

                    if (deviceMqttClient != null) {
                        if (deviceMqttClient.isConnected() == false) {
                            try {
                                deviceMqttClient.reconnect();
                            } catch (MqttException e) {
                                e.printStackTrace();
                            }
                        }
                        if (deviceMqttClient.isConnected() == true) {
                            data.remove("id");
                            data.remove("create_date");
                            MqttMessage mqttMessage = new MqttMessage();
                            mqttMessage.setPayload(data.toJson().getBytes());
                            try {
                                deviceMqttClient.publish("devicepub", mqttMessage);
                            } catch (MqttException e) {
                                e.printStackTrace();
                            }
                        }
                    }
                }
            }
        }
    }

    private MqttClient getDeviceMqttClient(String uuid) {
        /*给每一个设备创建向Neptune的客户端*/
        if (!deviceMqttClientMap.containsKey(uuid)) {
            deviceMqttClientUsedCache.put(uuid, uuid);
            Document janus = QJanus.get();
            String company_token = DocumentLib.getString(janus, QJanus.company_token);
            MqttConnectOptions connOpts = new MqttConnectOptions();
            connOpts.setUserName(company_token);
            connOpts.setPassword(company_token.toCharArray());
            connOpts.setAutomaticReconnect(true);
            connOpts.setMaxInflight(100);
            try {
                String clientID = StringLib.join("JANUS_DEVICE_", uuid, "_", RandomUtils.uuid());
                MqttClient deviceMqttClient = new MqttClient(broker, clientID, new MemoryPersistence());
                deviceMqttClient.setTimeToWait(3 * 1000);
                deviceMqttClient.connect(connOpts);
                if (deviceMqttClient != null) {
                    deviceMqttClientMap.put(uuid, deviceMqttClient);
                }
            } catch (MqttException e) {
                e.printStackTrace();
            }
        }
        return deviceMqttClientMap.get(uuid);
    }

    public void sendMessageToNeptune(Document data) {
        if (data != null) {
            if (isConnection()) {
                MqttMessage mqttMessage = new MqttMessage();
                try {
                    mqttMessage.setPayload(data.toJson().getBytes("utf-8"));
                    neptuneMqttClient.publish("januspub", mqttMessage);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}

