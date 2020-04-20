package com.cynovan.janus.base.connection.conns.serialport;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.conns.activemq.DeviceOnlineService;
import com.cynovan.janus.base.connection.service.base.DeviceConnBaseService;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortEvent;
import com.fazecast.jSerialComm.SerialPortPacketListener;
import com.google.common.collect.Maps;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.lang3.tuple.MutablePair;
import org.apache.commons.lang3.tuple.Pair;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Map;

@Service
public class SerialPortService extends DeviceConnBaseService {

    @Autowired
    private DeviceOnlineService deviceOnlineService;

    private Map<String, SerialPort> serialPortMap = Maps.newConcurrentMap();

    private Map<String, Pair<Boolean, Boolean>> hexDataMap = Maps.newConcurrentMap();

    public void create(Document config) {
        String uuid = DocumentLib.getString(config, "uuid");
        if (!serialPortMap.containsKey(uuid)) {
            openSerialPort(config);
        }
    }

    private SerialPort openSerialPort(Document config) {
        String uuid = DocumentLib.getString(config, "uuid");
        Document serialPortConfig = DocumentLib.getDocument(config, "conn_info_serial_port");

        try {
            String comPort = DocumentLib.getString(serialPortConfig, "commPortId");
            SerialPort serialPort = SerialPort.getCommPort(comPort);
            int baudRate = DocumentLib.getInt(serialPortConfig, "baudRate");
            boolean sendHexData = StringLib.equals(DocumentLib.getString(serialPortConfig, "send_type"), "hex");
            boolean receiveHexData = StringLib.equals(DocumentLib.getString(serialPortConfig, "receive_type"), "hex");
            int dataBits = DocumentLib.getInt(serialPortConfig, "dataBits");
            int stopBits = DocumentLib.getInt(serialPortConfig, "stopBits");
            int parity = DocumentLib.getInt(serialPortConfig, "parity");
            serialPort.setComPortParameters(baudRate, dataBits, stopBits, parity);

            serialPort.openPort();

            String receive_method = DocumentLib.getString(serialPortConfig, "receiveMethod.id");
            if (StringLib.equalsIgnoreCase(receive_method, "active")) {
                int packet = DocumentLib.getInt(serialPortConfig, "datalength");
                if (packet <= 0) {
                    packet = 16;
                }
                final int packetSize = packet;
                serialPort.addDataListener(new SerialPortPacketListener() {
                    @Override
                    public int getPacketSize() {
                        return packetSize;
                    }

                    @Override
                    public int getListeningEvents() {
                        return SerialPort.LISTENING_EVENT_DATA_RECEIVED;
                    }

                    @Override
                    public void serialEvent(SerialPortEvent serialPortEvent) {
                        byte[] newData = serialPortEvent.getReceivedData();
                        onSerialPortData(uuid, newData, 0);
                    }
                });
            } else {
                serialPort.setComPortTimeouts(SerialPort.TIMEOUT_READ_BLOCKING, 100, 100);
            }

            serialPortMap.put(uuid, serialPort);

            MutablePair<Boolean, Boolean> pair = new MutablePair<>();
            pair.setLeft(sendHexData);
            pair.setRight(receiveHexData);
            hexDataMap.put(uuid, pair);
            return serialPort;
        } catch (Exception e) {
            Map<String, String> params = Maps.newHashMap();
            params.put("异常类型", "串口连接异常");
            params.put("异常详情", e.getMessage());
            deviceOnlineService.connException(uuid, params);
        }
        return null;
    }

    public boolean isSendHexData(String uuid) {
        if (hexDataMap.containsKey(uuid)) {
            return hexDataMap.get(uuid).getLeft();
        }
        return false;
    }

    public boolean isReceiveHexData(String uuid) {
        if (hexDataMap.containsKey(uuid)) {
            return hexDataMap.get(uuid).getRight();
        }
        return false;
    }

    private Map<String, Integer> timerSendIndexMap = Maps.newConcurrentMap();

    public void timerSendMessage(Document exchangeConfig) {
        Document serialPortConfig = DocumentLib.getDocument(exchangeConfig, "conn_info_serial_port");
        String receive_method = DocumentLib.getString(serialPortConfig, "receiveMethod.id");
        if (StringLib.equalsIgnoreCase(receive_method, "active") == true) {
            /*被动模式时，不会主动发消息*/
            return;
        }
        String uuid = DocumentLib.getString(exchangeConfig, "uuid");
        String timer_data = DocumentLib.getString(serialPortConfig, "timer_data");
        if (StringLib.isNotEmpty(timer_data)) {
            if (serialPortMap.containsKey(uuid)) {

                String dataArr[] = StringLib.split(timer_data, "\n");
                if (!timerSendIndexMap.containsKey(uuid)) {
                    timerSendIndexMap.put(uuid, 0);
                }
                int index = timerSendIndexMap.get(uuid);
                if (index >= dataArr.length) {
                    index = 0;
                }
                String item = dataArr[index];
                item = StringLib.replace(item, " ", "");
                item = StringLib.replace(item, "\\r", "\r");
                if (StringLib.isNotEmpty(item)) {
                    SerialPort serialPort = serialPortMap.get(uuid);
                    try {
                        byte[] bytes = null;
                        if (isSendHexData(uuid)) {
                            bytes = Hex.decodeHex(item.toCharArray());
                        } else {
                            bytes = item.getBytes();
                        }
                        if (bytes != null) {
                            serialPort.writeBytes(bytes, bytes.length);
                        }

                        byte[] readBuffer = new byte[1024];
                        int numRead = serialPort.readBytes(readBuffer, readBuffer.length);
                        if (numRead > 0) {
                            readBuffer = Arrays.copyOfRange(readBuffer, 0, numRead);
                            onSerialPortData(uuid, readBuffer, index);
                        }

                        index++;
                        timerSendIndexMap.put(uuid, index);
                    } catch (Exception e) {
                        Map<String, String> params = Maps.newHashMap();
                        params.put("异常类型", "使用串口接入设备异常");
                        params.put("异常详情", e.getMessage());
                        deviceOnlineService.readDataException(uuid, params);
                    }
                }
            }
        }
    }

    private void onSerialPortData(String uuid, byte[] readBuffer, int index) {
        String receiveData = null;
        if (isReceiveHexData(uuid)) {
            receiveData = Hex.encodeHexString(readBuffer);
        } else {
            receiveData = StringLib.getDecodeCharset(readBuffer);
        }

        if (StringLib.isNotEmpty(receiveData)) {
            Document jsonData = new Document();
            jsonData.put("uuid", uuid);
            jsonData.put("action", "data");

            Document dataNode = DocumentLib.newDoc();
            dataNode.put("index", index);
            dataNode.put("data", receiveData);
            jsonData.put("data", dataNode);
            DeviceDataService deviceDataService = SpringContext.getBean(DeviceDataService.class);
            deviceDataService.onData(jsonData);
        }
    }

    @Override
    public void unregister(String uuid) {
        if (serialPortMap.containsKey(uuid)) {
            SerialPort serialPort = serialPortMap.get(uuid);
            try {
                serialPort.removeDataListener();
                serialPort.closePort();
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                serialPortMap.remove(uuid);
                hexDataMap.remove(uuid);
                timerSendIndexMap.remove(uuid);
            }
        }
    }
}
