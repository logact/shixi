package com.cynovan.janus.base.connection.conns.modbus.device_as_slave;

import com.cynovan.janus.base.connection.conns.activemq.DeviceOnlineService;
import com.cynovan.janus.base.connection.service.base.DeviceConnBaseService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.RateLimiterUtils;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.BooleanNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import com.ghgande.j2mod.modbus.Modbus;
import com.ghgande.j2mod.modbus.facade.AbstractModbusMaster;
import com.ghgande.j2mod.modbus.facade.ModbusSerialMaster;
import com.ghgande.j2mod.modbus.facade.ModbusTCPMaster;
import com.ghgande.j2mod.modbus.procimg.InputRegister;
import com.ghgande.j2mod.modbus.procimg.SimpleInputRegister;
import com.ghgande.j2mod.modbus.util.BitVector;
import com.ghgande.j2mod.modbus.util.SerialParameters;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.codehaus.jackson.node.IntNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Component
public class ModbusMasterService extends DeviceConnBaseService {

    @Autowired
    private DeviceOnlineService deviceOnlineService;

    private Map<String, AbstractModbusMaster> modbusMasterMap = Maps.newConcurrentMap();

    public Document readData(Document config) {
        Document slaveConfig = DocumentLib.getDocument(config, "conn_info_modbus_master");
        String uuid = DocumentLib.getString(config, "uuid");
        try {
            AbstractModbusMaster master = getModbusMaster(config);
            if (master != null) {
                String ip = DocumentLib.getString(slaveConfig, "ip");
                int port = DocumentLib.getInt(slaveConfig, "port");
                String masterKey = StringLib.join("modbus_read_", ip, "_", port);
                /*每秒最多5个请求,没200MS最多1个请求*/
                if (RateLimiterUtils.tryAcquire(masterKey, 5) == false) {
                    return null;
                }

                List rows = DocumentLib.getList(slaveConfig, "rows");
                if (rows != null && rows.size() > 0) {
                    int slave = DocumentLib.getInt(slaveConfig, "slave");
                    Document deviceData = DocumentLib.newDoc();
                    deviceData.put("uuid", uuid);
                    deviceData.put("time", new Date());
                    deviceData.put("action", "data");

                    List<Document> readList = Lists.newArrayList();
                    for (int i = 0; i < rows.size(); i++) {
                        Document row = (Document) rows.get(i);
                        int start = DocumentLib.getInt(row, "start");
                        int end = DocumentLib.getInt(row, "end");
                        if (start <= end) {
                            readList.add(row);
                        }
                    }

                    Document deviceDataObject = DocumentLib.newDoc();

                    if (CollectionUtils.isNotEmpty(readList)) {
                        Iterator<Document> iterator = readList.iterator();
                        while (iterator.hasNext()) {
                            Document readRow = iterator.next();
                            try {
                                int area = DocumentLib.getInt(readRow, "area");
                                int start = DocumentLib.getInt(readRow, "start");
                                int end = DocumentLib.getInt(readRow, "end");
                                int readCount = end - start + 1;
                                if (area == 1 || area == 2) {
                                    BitVector bitVector = null;
                                    if (area == 1) {
                                        bitVector = master.readCoils(slave, start, readCount);
                                    } else {
                                        bitVector = master.readInputDiscretes(slave, start, readCount);
                                    }
                                    if (bitVector != null) {
                                        int valueSize = bitVector.size();
                                        for (int valueIdx = 0; valueIdx < valueSize; valueIdx++) {
                                            String valueKey = StringLib.join(area, "_", start + valueIdx);
                                            boolean value = bitVector.getBit(valueIdx);
                                            deviceDataObject.put(valueKey, value);
                                        }
                                    }
                                } else if (area == 3 || area == 4) {
                                    InputRegister input[] = null;
                                    if (area == 3) {
                                        input = master.readMultipleRegisters(slave, start, readCount);
                                    } else {
                                        input = master.readInputRegisters(slave, start, readCount);
                                    }
                                    if (input != null) {
                                        int valueSize = input.length;
                                        for (int valueIdx = 0; valueIdx < valueSize; valueIdx++) {
                                            String valueKey = StringLib.join(area, "_", start + valueIdx);
                                            InputRegister value = input[valueIdx];
                                            deviceDataObject.put(valueKey, value.getValue());
                                        }
                                    }
                                }
                            } catch (Exception e) {
                                e.printStackTrace();
                            } finally {
                                Thread.sleep(50);
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
        } finally {

        }
        return null;
    }

    private AbstractModbusMaster getModbusMaster(Document config) throws Exception {
        String uuid = DocumentLib.getString(config, "uuid");
        AbstractModbusMaster master = null;
        if (!modbusMasterMap.containsKey(uuid)) {
            Document masterConfig = DocumentLib.getDocument(config, "conn_info_modbus_master");
            String modbus_master_type = DocumentLib.getString(masterConfig, "modbus");
            String ip = DocumentLib.getString(masterConfig, "ip");
            int port = DocumentLib.getInt(masterConfig, "port");
            if (StringLib.equals(modbus_master_type, "tcp")) {
                master = new ModbusTCPMaster(ip, port);
            } else if (StringLib.equals(modbus_master_type, "rtu")) {
                SerialParameters parameters = new SerialParameters();
                parameters.setPortName(DocumentLib.getString(masterConfig, "commPortId"));
                parameters.setBaudRate(DocumentLib.getInt(masterConfig, "baudRate"));
                parameters.setDatabits(DocumentLib.getInt(masterConfig, "dataBits"));
                parameters.setParity(DocumentLib.getInt(masterConfig, "parity"));
                parameters.setStopbits(DocumentLib.getInt(masterConfig, "stopBits"));
                String mode = DocumentLib.getString(masterConfig, "encodingMode");
                if (StringLib.equalsIgnoreCase(mode, "ascii")) {
                    parameters.setEncoding(Modbus.SERIAL_ENCODING_ASCII);
                } else {
                    parameters.setEncoding(Modbus.SERIAL_ENCODING_RTU);
                }
                parameters.setEcho(false);

                master = new ModbusSerialMaster(parameters, 300, 50);
            }
            master.setTimeout(300);
            master.setRetries(0);
            master.connect();
            modbusMasterMap.put(uuid, master);
        } else {
            master = modbusMasterMap.get(uuid);
        }
        return master;
    }

    public boolean writeData(Document config, ObjectNode update) {
        boolean success = false;
        /*提供下发数据的接口*/
        try {
            AbstractModbusMaster master = getModbusMaster(config);
            if (master != null) {
                if (update != null && update.has("data")) {
                    ObjectNode values = (ObjectNode) update.get("data");
                    if (values != null && values.size() > 0) {
                        Document slaveConfig = DocumentLib.getDocument(config, "conn_info_modbus_master");
                        int slave = DocumentLib.getInt(slaveConfig, "slave");
                        Iterator<String> iterator = values.fieldNames();

                        while (iterator.hasNext()) {
                            String fieldName = iterator.next();
                            if (fieldName.contains("_")) {
                                String fieldNameArr[] = StringLib.split(fieldName, "_");
                                if (fieldNameArr.length > 1) {
                                    int area = StringLib.toInteger(fieldNameArr[0]);
                                    if (area > 0) {
                                        int position = StringLib.toInteger(fieldNameArr[1]);
                                        Object value = values.get(fieldName);
                                        if (area == 1) {
                                            boolean booValue = false;
                                            if (value instanceof BooleanNode) {
                                                booValue = ((BooleanNode) value).booleanValue();
                                            } else if (value instanceof String) {
                                                String valueStr = StringLib.lowerCase(StringLib.toString(value));
                                                if (StringLib.equalsAny(valueStr, "false", "0", "")) {
                                                    booValue = false;
                                                } else {
                                                    booValue = true;
                                                }
                                            } else if (value instanceof TextNode) {
                                                value = ((TextNode) value).textValue();
                                                String valueStr = StringLib.lowerCase(StringLib.toString(value));
                                                if (StringLib.equalsAny(valueStr, "false", "0", "")) {
                                                    booValue = false;
                                                } else {
                                                    booValue = true;
                                                }
                                            } else if (value instanceof Number || value instanceof IntNode) {
                                                int valueInt = StringLib.toInteger(value);
                                                if (valueInt > 0) {
                                                    booValue = true;
                                                } else {
                                                    booValue = false;
                                                }
                                            }
                                            master.writeCoil(slave, position, booValue);
                                        } else if (area == 3) {
                                            master.writeSingleRegister(slave, position, new SimpleInputRegister(StringLib.toInteger(value)));
                                        }
                                    }
                                }
                            }
                        }
                        success = true;
                    }
                }
            }
        } catch (Exception e) {
            success = false;
        }
        return success;
    }

    @Override
    public void unregister(String uuid) {
        if (modbusMasterMap.containsKey(uuid)) {
            AbstractModbusMaster master = modbusMasterMap.get(uuid);
            if (master != null) {
                modbusMasterMap.remove(uuid);
                master.disconnect();
            }
        }
    }
}
