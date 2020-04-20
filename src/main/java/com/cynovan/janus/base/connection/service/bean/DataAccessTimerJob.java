package com.cynovan.janus.base.connection.service.bean;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.conns.device_as_tcpserver.SocketTCPClientService;
import com.cynovan.janus.base.connection.conns.device_as_udp_server.SocketUDPClientService;
import com.cynovan.janus.base.connection.conns.modbus.device_as_master.ModbusSlaveService;
import com.cynovan.janus.base.connection.conns.modbus.device_as_slave.ModbusMasterService;
import com.cynovan.janus.base.connection.conns.serialport.SerialPortService;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class DataAccessTimerJob implements Job {

    @Autowired
    private DeviceDataService deviceDataService;

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        Document config = (Document) jobExecutionContext.getMergedJobDataMap().get("data");

        String conn_type = DocumentLib.getString(config, "conn_type");
        if (StringLib.equals(conn_type, "modbus_slave")) {
            ModbusSlaveService modbusSlaveService = SpringContext.getBean(ModbusSlaveService.class);
            Document deviceData = modbusSlaveService.readData(config);
            if (deviceData != null) {
                deviceDataService.onData(deviceData);
            }
        } else if (StringLib.equals(conn_type, "modbus_master")) {
            ModbusMasterService modbusMasterService = SpringContext.getBean(ModbusMasterService.class);
            Document deviceData = modbusMasterService.readData(config);
            if (deviceData != null) {
                deviceDataService.onData(deviceData);
            }
        } else if (StringLib.equals(conn_type, "udp_server")) {
            SocketUDPClientService socketUDPClientService = SpringContext.getBean(SocketUDPClientService.class);
            socketUDPClientService.timerSendMessage(config);
        } else if (StringLib.equals(conn_type, "serial_port")) {
            SerialPortService serialPortService = SpringContext.getBean(SerialPortService.class);
            serialPortService.timerSendMessage(config);
        } else if (StringLib.equals(conn_type, "tcp_server")) {
            SocketTCPClientService socketTCPClientService = SpringContext.getBean(SocketTCPClientService.class);
            socketTCPClientService.timerSendMessage(config);
        }
    }
}

