package com.cynovan.janus.base.connection.service.job;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.conns.device_as_bacnet_ip_server.DeviceAsBacnetIPService;
import com.cynovan.janus.base.connection.conns.device_as_httpserver.DeviceAsHttpServerService;
import com.cynovan.janus.base.connection.conns.device_as_opcserver.DeviceAsOPCServerService;
import com.cynovan.janus.base.connection.conns.device_as_tcpserver.SocketTCPClientService;
import com.cynovan.janus.base.connection.conns.device_as_udp_server.SocketUDPClientService;
import com.cynovan.janus.base.connection.conns.modbus.device_as_master.ModbusSlaveService;
import com.cynovan.janus.base.connection.conns.modbus.device_as_slave.ModbusMasterService;
import com.cynovan.janus.base.connection.conns.serialport.SerialPortService;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.schedule.service.JanusScheduleJobBase;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.serotonin.bacnet4j.exception.BACnetException;
import org.bson.Document;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

public class DataAccessScheduleJob extends JanusScheduleJobBase {

    @Override
    protected void executeInternal(JobExecutionContext jobExecutionContext) throws JobExecutionException {

        DeviceDataService deviceDataService = SpringContext.getBean(DeviceDataService.class);

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
        } else if (StringLib.equals(conn_type, "http_server")) {
            DeviceAsHttpServerService deviceAsHttpServerService = SpringContext.getBean(DeviceAsHttpServerService.class);
            deviceAsHttpServerService.timerSendMessage(config);
        } else if (StringLib.equals(conn_type, "opc_ua_server")) {
            DeviceAsOPCServerService deviceAsOPCServerService = SpringContext.getBean(DeviceAsOPCServerService.class);
            Document deviceData = deviceAsOPCServerService.read(config);
            if (deviceData != null) {
                deviceDataService.onData(deviceData);
            }
        }else if (StringLib.equals(conn_type,"bacnet_ip")){
            DeviceAsBacnetIPService deviceAsBacnetIPService = SpringContext.getBean(DeviceAsBacnetIPService.class);
            Document deviceData = null;
            try {
                deviceData = deviceAsBacnetIPService.read(config);
            } catch (BACnetException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
            if(deviceData != null){
                deviceDataService.onData(deviceData);
            }
        }
    }
}
