package com.cynovan.janus.base.connection.service;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.conns.device_as_bacnet_ip_server.DeviceAsBacnetIPService;
import com.cynovan.janus.base.connection.conns.device_as_opcserver.DeviceAsOPCServerService;
import com.cynovan.janus.base.connection.conns.device_as_tcpclient.DeviceAsTcpClientService;
import com.cynovan.janus.base.connection.conns.device_as_tcpserver.SocketTCPClientService;
import com.cynovan.janus.base.connection.conns.device_as_udp_server.SocketUDPClientService;
import com.cynovan.janus.base.connection.conns.device_as_udpclient.DeviceAsUdpClientService;
import com.cynovan.janus.base.connection.conns.serialport.SerialPortService;
import com.cynovan.janus.base.connection.service.base.DeviceConnBaseService;
import com.cynovan.janus.base.connection.service.job.DataAccessScheduleJob;
import com.cynovan.janus.base.device.jdo.QDataExchange;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.schedule.service.SchedulerService;
import com.cynovan.janus.base.utils.CacheUtils;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Sets;
import com.mongodb.client.model.Projections;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Component
public class DataAccessCreateService implements ApplicationRunner {

    private Set<String> runningDevice = Sets.newConcurrentHashSet();

    @Override
    public void run(ApplicationArguments args) throws Exception {
        initAllDeviceDataExchangeService();
    }

    /*当读取遇见Exception的时候,会直接停掉读取线程，这里每4分钟检查启动一次*/
    @Scheduled(cron = "0 */4 * * * ?")
    private void scheduleStart() {
        List<Document> list = DBUtils.list(QDevice.collectionName, null, Projections.include("uuid"));
        Set<String> uuidSet = Sets.newHashSet();
        list.stream().forEach(device -> {
            uuidSet.add(DocumentLib.getString(device, "uuid"));
        });

        uuidSet.stream().forEach(uuid -> {
            if (runningDevice.contains(uuid) == false) {
                createDeviceDataExchangeService(uuid);
            }
        });
    }

    public void unregister(String uuid) {
        runningDevice.remove(uuid);
        SchedulerService schedulerService = SpringContext.getBean(SchedulerService.class);
        String scheduleId = getScheduleName(uuid);
        schedulerService.unScheduleJob(scheduleId);
        schedulerService.deleteJob(scheduleId);

        DBUtils.updateOne(QDevice.collectionName, DocumentLib.newDoc("uuid", uuid), DocumentLib.new$Set("dynamicData", DocumentLib.newDoc()));
        CacheUtils.delete("dynamic_" + uuid);

        List<DeviceConnBaseService> beanList = SpringContext.getBeans(DeviceConnBaseService.class);
        if (CollectionUtils.isNotEmpty(beanList)) {
            beanList.stream().forEach(cls -> {
                cls.unregister(uuid);
            });
        }
    }

    public void restart(String uuid) {
        unregister(uuid);
        createDeviceDataExchangeService(uuid);
    }

    private void initAllDeviceDataExchangeService() {
        /*加载所有的设备 & 所有的设备配置*/
        List<Document> deviceList = DBUtils.list(QDevice.collectionName, null, DocumentLib.newDoc("uuid", 1));

        deviceList.stream().forEach(device -> {
            String uuid = DocumentLib.getString(device, "uuid");
            if (StringLib.isNotEmpty(uuid)) {
                if (!runningDevice.contains(uuid)) {
                    createDeviceDataExchangeService(uuid);
                }
            }
        });
    }

    public void createDeviceDataExchangeService(String uuid) {
        Document dataAccessConfig = DBUtils.find(QDataExchange.collectionName, DocumentLib.newDoc("uuid", uuid));
        if (dataAccessConfig == null) {
            return;
        }
        String conn_type = DocumentLib.getString(dataAccessConfig, "conn_type");

        boolean createSchedule = false;
        String timer = null;
        if (StringLib.equals(conn_type, "triton")) {
            /*使用Triton接入时，不需要启动任何服务*/
        } else if (StringLib.equals(conn_type, "modbus_slave")) {
            timer = DocumentLib.getString(dataAccessConfig, "conn_info_modbus_slave.timer");
            createSchedule = true;
        } else if (StringLib.equals(conn_type, "modbus_master")) {
            timer = DocumentLib.getString(dataAccessConfig, "conn_info_modbus_master.timer");
            createSchedule = true;
        } else if (StringLib.equals(conn_type, "udp_server")) {
            SocketUDPClientService socketUDPClientService = SpringContext.getBean(SocketUDPClientService.class);
            socketUDPClientService.create(dataAccessConfig);
            /*UDP Server 的时候，需要创建UDP Client，并保存下来*/
            boolean timer_switch = DocumentLib.getBoolean(dataAccessConfig, "conn_info_udp_server.timer_switch");
            if (timer_switch) {
                timer = DocumentLib.getString(dataAccessConfig, "conn_info_udp_server.timer");
                createSchedule = true;
            }
        } else if (StringLib.equals(conn_type, "serial_port")) {
            SerialPortService serialPortService = SpringContext.getBean(SerialPortService.class);
            serialPortService.create(dataAccessConfig);

            timer = DocumentLib.getString(dataAccessConfig, "conn_info_serial_port.timer");
            createSchedule = true;
        } else if (StringLib.equals(conn_type, "tcp_server")) {
            SocketTCPClientService socketTCPClientService = SpringContext.getBean(SocketTCPClientService.class);
            socketTCPClientService.create(dataAccessConfig);
            timer = DocumentLib.getString(dataAccessConfig, "conn_info_tcp_server.timer");
            createSchedule = true;
        } else if (StringLib.equals(conn_type, "opc_ua_server")) {
            DeviceAsOPCServerService deviceAsOPCServerService = SpringContext.getBean(DeviceAsOPCServerService.class);
            deviceAsOPCServerService.create(dataAccessConfig);
            timer = DocumentLib.getString(dataAccessConfig, "conn_info_opc_ua_server.timer");
            createSchedule = true;
        } else if (StringLib.equals(conn_type, "http_server")) {
            timer = DocumentLib.getString(dataAccessConfig, "conn_info_http_server.timer");
            createSchedule = true;
        } else if (StringLib.equals(conn_type, "tcp_client")) {
            /*设备作为TCP Socket Client接入*/
            DeviceAsTcpClientService deviceAsTcpClientService = SpringContext.getBean(DeviceAsTcpClientService.class);
            deviceAsTcpClientService.initTcpClientService(dataAccessConfig);

            Document tcpClient = DocumentLib.getDocument(dataAccessConfig, "conn_info_tcp_client");

            String serverIp = DocumentLib.getString(tcpClient, "servce_ip");
            if (StringLib.isNotEmpty(serverIp)) {
                SocketTCPClientService socketTCPClientService = SpringContext.getBean(SocketTCPClientService.class);
                socketTCPClientService.create(dataAccessConfig);
            }

        } else if (StringLib.equals(conn_type, "udp_client")) {
            /*设备作为udp Client接入*/
            DeviceAsUdpClientService deviceAsUdpClientService = SpringContext.getBean(DeviceAsUdpClientService.class);
            deviceAsUdpClientService.initUdpClientService(dataAccessConfig);
        } else if (StringLib.equals(conn_type, "bacnet_ip")) {
            DeviceAsBacnetIPService deviceAsBacnetIPService = SpringContext.getBean(DeviceAsBacnetIPService.class);
            deviceAsBacnetIPService.create(dataAccessConfig);
            timer = DocumentLib.getString(dataAccessConfig, "conn_info_bacnet_ip.timer");
            createSchedule = true;
        }
        if (createSchedule == true) {
            createSchedule(dataAccessConfig, timer);
        }
        runningDevice.add(uuid);
    }

    private void createSchedule(Document dataAccessObject, String timer) {
        long millsecond = getIntervalWithMillsecond(timer);
        if (millsecond > 0) {
            String uuid = DocumentLib.getString(dataAccessObject, "uuid");
            DataAccessScheduleJob scheduleJob = new DataAccessScheduleJob();
            scheduleJob.setInterval(millsecond);
            scheduleJob.setName(getScheduleName(uuid));
            scheduleJob.addJobData("data", dataAccessObject);
            scheduleJob.start();
        }
    }

    private String getScheduleName(String uuid) {
        return StringLib.join(uuid, "_data_access");
    }

    private long getIntervalWithMillsecond(String timer) {
        long time = 0l;
        TimeUnit timeUnit = TimeUnit.MILLISECONDS;
        if (StringLib.contains(timer, "ms")) {
            timeUnit = TimeUnit.MILLISECONDS;
        } else if (StringLib.contains(timer, "s")) {
            timeUnit = TimeUnit.SECONDS;
        } else if (StringLib.contains(timer, "m")) {
            timeUnit = TimeUnit.MINUTES;
        } else if (StringLib.contains(timer, "h")) {
            timeUnit = TimeUnit.HOURS;
        }
        time = timeUnit.toMillis(StringLib.toInteger(StringLib.replaceAll(timer, "[A-Za-z]", "")));
        return time;
    }
}
