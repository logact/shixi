package com.cynovan.janus.base.connection.conns.modbus.device_as_master;

import com.cynovan.janus.base.connection.conns.activemq.DeviceOnlineService;
import com.cynovan.janus.base.connection.service.base.DeviceConnBaseService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.BooleanNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import com.ghgande.j2mod.modbus.Modbus;
import com.ghgande.j2mod.modbus.ModbusException;
import com.ghgande.j2mod.modbus.procimg.*;
import com.ghgande.j2mod.modbus.slave.ModbusSlave;
import com.ghgande.j2mod.modbus.slave.ModbusSlaveFactory;
import com.ghgande.j2mod.modbus.util.SerialParameters;
import com.google.common.collect.Maps;
import org.bson.Document;
import org.codehaus.jackson.node.IntNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PreDestroy;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

@Component
public class ModbusSlaveService extends DeviceConnBaseService {

    @Autowired
    private DeviceOnlineService deviceOnlineService;

    Map<String, Object> deviceSlaveMap = Maps.newConcurrentMap();

    public Document readData(Document config) {
        String uuid = DocumentLib.getString(config, "uuid");
        try {
            Document slaveConfig = DocumentLib.getDocument(config, "conn_info_modbus_slave");
            ProcessImage basicProcessImage = getModbusProcessImage(config);
            if (basicProcessImage != null) {
                List rows = DocumentLib.getList(slaveConfig, "rows");
                if (rows != null && rows.size() > 0) {
                    Document deviceData = DocumentLib.newDoc();
                    deviceData.put("uuid", uuid);
                    deviceData.put("time", new Date());
                    deviceData.put("action", "data");

                    Document deviceDataObject = DocumentLib.newDoc();
                    for (int i = 0; i < rows.size(); i++) {
                        Document row = (Document) rows.get(i);
                        int area = DocumentLib.getInt(row, "area");
                        int start = DocumentLib.getInt(row, "start");
                        int end = DocumentLib.getInt(row, "end");
                        if (start <= end) {
                            for (int idx = start; idx <= end; idx++) {
                                String valueKey = new StringBuilder().append(area).append("_").append(idx).toString();
                                if (!deviceDataObject.containsKey(valueKey)) {
                                    Object value = null;
                                    try {
                                        if (area == 1) {
                                            DigitalOut digitalOut = basicProcessImage.getDigitalOut(idx);
                                            value = digitalOut.isSet();
                                        } else if (area == 2) {
                                            DigitalIn digitalIn = basicProcessImage.getDigitalIn(idx);
                                            value = digitalIn.isSet();
                                        } else if (area == 3) {
                                            Register register = basicProcessImage.getRegister(idx);
                                            value = register.getValue();
                                        } else {
                                            InputRegister inputRegister = basicProcessImage.getInputRegister(idx);
                                            value = inputRegister.getValue();
                                        }
                                    } catch (Exception e) {
                                        value = null;
                                    }
                                    if (value != null) {
                                        deviceDataObject.put(valueKey, value);
                                    }
                                }
                            }
                        }
                    }
                    if (deviceDataObject.isEmpty()) {
                        return null;
                    }
                    deviceData.put("data", deviceDataObject);
                    return deviceData;
                }
            }
        } catch (Exception e) {
            Map<String, String> params = Maps.newHashMap();
            params.put("异常类型", "Modbus连接异常");
            params.put("异常详情", e.getMessage());
            deviceOnlineService.readDataException(uuid, params);
            return null;
        }
        return null;
    }

    @Override
    public void unregister(String uuid) {
        if (deviceSlaveMap.containsKey(uuid)) {
            Object portValue = deviceSlaveMap.get(uuid);

            ModbusSlave modbusSlave = null;
            if (portValue instanceof Integer) {
                modbusSlave = ModbusSlaveFactory.getSlave(StringLib.toInteger(portValue));
            } else if (portValue instanceof String) {
                modbusSlave = ModbusSlaveFactory.getSlave(StringLib.toString(portValue));
            }
            if (modbusSlave != null) {
                modbusSlave.close();
            }
        }
    }

    private ProcessImage getModbusProcessImage(Document config) {
        ModbusSlave modbusSlave = getModbusSlaveSet(config);
        Document slaveConfig = DocumentLib.getDocument(config, "conn_info_modbus_slave");
        int slave = DocumentLib.getInt(slaveConfig, "slave");

        SimpleProcessImage processImage = (SimpleProcessImage) modbusSlave.getProcessImage(slave);
        if (processImage == null) {
            processImage = new SimpleProcessImage();
            modbusSlave.addProcessImage(slave, processImage);

            /*针对Modbus的各个区域做初始化(默认情况下，Modbus不会自动对数据进行初始化)*/
            List rows = DocumentLib.getList(slaveConfig, "rows");

            Map<String, Integer[]> readIndexMap = Maps.newHashMap();
            if (rows != null && rows.size() > 0) {
                for (int i = 0; i < rows.size(); i++) {
                    Document row = (Document) rows.get(i);
                    String area = DocumentLib.getString(row, "area");
                    int start = DocumentLib.getInt(row, "start");
                    int end = DocumentLib.getInt(row, "end");
                    if (start <= end) {
                        Integer[] pros = new Integer[2];
                        if (readIndexMap.containsKey(area)) {
                            Integer[] prosClone = readIndexMap.get(area);
                            start = Math.min(prosClone[0], start);
                            end = Math.max(prosClone[1], end);
                        }
                        pros[0] = start;
                        pros[1] = end;
                        readIndexMap.put(area, pros);
                    }
                }
                for (Entry<String, Integer[]> entry : readIndexMap.entrySet()) {
                    int area = StringLib.toInteger(entry.getKey());
                    int start = entry.getValue()[0];
                    int end = entry.getValue()[1];

                    for (int valueIdx = start; valueIdx <= end; valueIdx++) {
                        if (area == 1) {
                            processImage.addDigitalOut(valueIdx, new SimpleDigitalOut(false));
                        } else if (area == 2) {
                            processImage.addDigitalIn(valueIdx, new SimpleDigitalIn(false));
                        } else if (area == 3) {
                            processImage.addRegister(valueIdx, new SimpleRegister(0));
                        } else if (area == 4) {
                            processImage.addInputRegister(valueIdx, new SimpleInputRegister(0));
                        }
                    }
                }
            }
        }

        return processImage;
    }

    private ModbusSlave getModbusSlaveSet(Document config) {
        Document slaveConfig = DocumentLib.getDocument(config, "conn_info_modbus_slave");
        String uuid = DocumentLib.getString(config, "uuid");
        String modbus_slave_type = DocumentLib.getString(slaveConfig, "modbus");
        int port = DocumentLib.getInt(slaveConfig, "port");
        if (port <= 0) {
            port = 502;
        }
        ModbusSlave slaveSet = null;
        Object portValue = null;
        try {
            if (StringLib.equals(modbus_slave_type, "tcp")) {
                slaveSet = ModbusSlaveFactory.getSlave(port);
                if (slaveSet == null) {
                    slaveSet = ModbusSlaveFactory.createTCPSlave(port, 3);
                    portValue = port;
                }
            } else if (StringLib.equals(modbus_slave_type, "rtu")) {
                String commPort = DocumentLib.getString(slaveConfig, "commPortId");
                slaveSet = ModbusSlaveFactory.getSlave(commPort);
                if (slaveSet == null) {
                    portValue = commPort;
                    SerialParameters parameters = new SerialParameters();
                    parameters.setPortName(commPort);
                    parameters.setBaudRate(DocumentLib.getInt(slaveConfig, "baudRate"));
                    parameters.setDatabits(DocumentLib.getInt(slaveConfig, "dataBits"));
                    parameters.setParity(DocumentLib.getInt(slaveConfig, "parity"));
                    parameters.setStopbits(DocumentLib.getInt(slaveConfig, "stopBits"));

                    String mode = DocumentLib.getString(slaveConfig, "encodingMode");
                    if (StringLib.equalsIgnoreCase(mode, "ascii")) {
                        parameters.setEncoding(Modbus.SERIAL_ENCODING_ASCII);
                    } else {
                        parameters.setEncoding(Modbus.SERIAL_ENCODING_RTU);
                    }
                    parameters.setEcho(false);
                    slaveSet = ModbusSlaveFactory.createSerialSlave(parameters);
                }
            }
            slaveSet.open();
        } catch (ModbusException e) {
            e.printStackTrace();
        }
        if (portValue != null) {
            deviceSlaveMap.put(uuid, portValue);
        }
        return slaveSet;
    }

    public boolean writeData(Document config, ObjectNode update) {
        boolean success = false;
        /*提供下发数据的接口*/
        if (update != null && update.has("data")) {
            ObjectNode values = (ObjectNode) update.get("data");
            if (values != null && values.size() > 0) {
                SimpleProcessImage basicProcessImage = (SimpleProcessImage) getModbusProcessImage(config);
                Iterator<String> iterator = values.fieldNames();
                try {
                    while (iterator.hasNext()) {
                        String fieldName = iterator.next();
                        if (fieldName.contains("_")) {
                            String fieldNameArr[] = StringLib.split(fieldName, "_");
                            if (fieldNameArr.length > 1) {
                                int area = StringLib.toInteger(fieldNameArr[0]);
                                if (area > 0) {
                                    int position = StringLib.toInteger(fieldNameArr[1]);
                                    Object value = values.get(fieldName);
                                    if (area == 1 || area == 2) {
                                        if (value instanceof BooleanNode) {
                                            value = ((BooleanNode) value).booleanValue();
                                        } else if (value instanceof String) {
                                            String valueStr = StringLib.lowerCase(StringLib.toString(value));
                                            if (StringLib.equalsAny(valueStr, "false", "0", "")) {
                                                value = false;
                                            } else {
                                                value = true;
                                            }
                                        } else if (value instanceof TextNode) {
                                            value = ((TextNode) value).textValue();
                                            String valueStr = StringLib.lowerCase(StringLib.toString(value));
                                            if (StringLib.equalsAny(valueStr, "false", "0", "")) {
                                                value = false;
                                            } else {
                                                value = true;
                                            }
                                        } else if (value instanceof Number || value instanceof IntNode) {
                                            int valueInt = StringLib.toInteger(value);
                                            if (valueInt > 0) {
                                                value = true;
                                            } else {
                                                value = false;
                                            }
                                        }
                                        if (area == 1) {
                                            basicProcessImage.addDigitalIn(position, new SimpleDigitalIn((Boolean) value));
                                        } else if (area == 2) {
                                            basicProcessImage.addDigitalOut(position, new SimpleDigitalOut((Boolean) value));
                                        }
                                    } else if (area == 3) {
                                        basicProcessImage.addRegister(position, new SimpleRegister(StringLib.toInteger(value)));
                                    } else if (area == 4) {
                                        basicProcessImage.addInputRegister(position, new SimpleRegister(StringLib.toInteger(value)));
                                    }
                                }
                            }
                        }
                    }
                    success = true;
                } catch (Exception e) {
                    success = false;
                } finally {
                }
            }
        }
        return success;
    }

    @PreDestroy
    public void destroy() {
        ModbusSlaveFactory.close();
    }
}
