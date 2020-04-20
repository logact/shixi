package com.cynovan.janus.base.connection.conns.device_as_bacnet_ip_server;


import com.cynovan.janus.base.connection.conns.activemq.DeviceOnlineService;
import com.cynovan.janus.base.connection.conns.device_as_bacnet_ip_server.utils.BacnetIPUtil;
import com.cynovan.janus.base.connection.service.base.DeviceConnBaseService;
import com.cynovan.janus.base.connection.service.bean.PortAndUUID;
import com.cynovan.janus.base.utils.DocumentLib;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.serotonin.bacnet4j.LocalDevice;
import com.serotonin.bacnet4j.RemoteDevice;
import com.serotonin.bacnet4j.exception.BACnetException;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.List;
import java.util.Map;

@Component
public class DeviceAsBacnetIPService extends DeviceConnBaseService {
    @Autowired
    private DeviceOnlineService deviceOnlineService;

    private Map<String, Integer> bacnetDeviceMap = Maps.newConcurrentMap();

    private Map<Integer, PortAndUUID> portUUIDMap = Maps.newConcurrentMap();

    public void create(Document dataAccessObject) {
        createBacnetDevice(dataAccessObject);
    }

    private void createBacnetDevice(Document dataAccessObject) {
        String uuid = DocumentLib.getString(dataAccessObject, "uuid");
        int targetPort = DocumentLib.getInt(dataAccessObject, "conn_info_bacnet_ip.portNum");

        try {
            if (portUUIDMap.containsKey(targetPort)) {
                PortAndUUID portAndUUID = portUUIDMap.get(targetPort);
                portAndUUID.addUUID(uuid);
                LocalDevice localDevice = portAndUUID.getLocalDevice();
                bacnetDeviceMap.put(uuid, targetPort);
            } else {
                Document dataObject = DocumentLib.getDocument(dataAccessObject, "conn_info_bacnet_ip");
                dataObject.put("uuid", uuid);
                LocalDevice localDevice = BacnetIPUtil.createLocalDevice(dataObject);
                // 将信息放到一个类中
                PortAndUUID portAndUUID = new PortAndUUID();
                portAndUUID.setLocalDevice(localDevice);
                portAndUUID.addUUID(uuid);
                portAndUUID.setPort(targetPort);

                portUUIDMap.put(targetPort, portAndUUID);
                bacnetDeviceMap.put(uuid, targetPort);
            }
        } catch (Exception e) {
            Map<String, String> params = Maps.newHashMap();
            params.put("异常类型", "Bacnet设备创建失败");
            params.put("异常详情", e.getMessage());
            deviceOnlineService.connException(uuid, params);
        }
    }

    public List<Document> readAllNode(Document d) throws BACnetException, SocketException, UnknownHostException {
        String uuid = d.getString("uuid");
        int targetPort = DocumentLib.getInt(d, "portNum");
        List<Document> nodeList = null;
        LocalDevice localDevice = null;
        PortAndUUID portAndUUId;
        if (portUUIDMap.containsKey(targetPort)) {
            // 在此端口下找到运行的设备,直接读取目标数据
            portAndUUId = portUUIDMap.get(targetPort);
            localDevice = portAndUUId.getLocalDevice();
            RemoteDevice remoteDevice = localDevice.getRemoteDevice(DocumentLib.getInt(d, "deviceInstance")).get();
            nodeList = BacnetIPUtil.readAllNode(localDevice, remoteDevice);
        } else {
            // 在此端口下没有设备运行,新建设备,读取目标数据之后关闭设备
            localDevice = BacnetIPUtil.createLocalDevice(d);
            RemoteDevice remoteDevice = localDevice.getRemoteDevice(DocumentLib.getInt(d, "deviceInstance")).get();
            nodeList = BacnetIPUtil.readAllNode(localDevice, remoteDevice);
            localDevice.terminate();
        }
        return nodeList;
    }

    //读取目标设备上所有的对象,以及其下面的属性
    /*public List<Document> readAllNode(Document d) {
        String uuid = d.getString("uuid");
        int targetPort = DocumentLib.getInt(d, "portNum");
        List<Document> nodeList = null;
        LocalDevice localDevice = null;


        *//* 判断map中是否有uuid所对应的bacnet设备
     * 有则说明设备正在工作
     * 需要判断端口号是否一致,不一致则新建设备
     * 没有则新建设备,读取目标设备的对象属性
     * *//*
        // uuid对应的设备正在工作
        if (bacnetDeviceMap.containsKey(uuid))  {
            localDevice = bacnetDeviceMap.get(uuid);
            int localDevicePort = Integer.parseInt(localDevice.getAllLocalAddresses()[0].getMacAddress().getDescription().split(":")[1]);
            try {
                // 判断端口号是否相等
                if(targetPort==localDevicePort){
                    RemoteDevice remoteDevice = localDevice.getRemoteDevice(DocumentLib.getInt(d, "deviceInstance")).get();
                    nodeList = BacnetIPUtil.readAllNode(localDevice, remoteDevice);
                }else{
                    localDevice = BacnetIPUtil.createLocalDevice(d);
                    RemoteDevice remoteDevice = null;
                    try {
                        remoteDevice = localDevice.getRemoteDevice(DocumentLib.getInt(d, "deviceInstance")).get();
                        nodeList = BacnetIPUtil.readAllNode(localDevice,remoteDevice);
                        localDevice.terminate();
                    } catch (BACnetException e) {
                        e.printStackTrace();
                        localDevice.terminate();
                    }
                }
            } catch (SocketException | BACnetException | UnknownHostException e) {
                e.printStackTrace();
            }
        } else {
            try {

*//*                Collection<String> portUUidCollection = new HashSet<>();
                portUUidCollection.add(uuid);
                portUUIDMap.put(new Integer(targetPort),portUUidCollection);*//*
                localDevice = BacnetIPUtil.createLocalDevice(d);
                RemoteDevice remoteDevice = localDevice.getRemoteDevice(DocumentLib.getInt(d, "deviceInstance")).get();
                nodeList = BacnetIPUtil.readAllNode(localDevice, remoteDevice);
            } catch (UnknownHostException | SocketException | BACnetException e) {
                e.printStackTrace();
                Map<String, String> params = Maps.newHashMap();
                params.put("异常类型", "Bacnet设备创建失败");
                params.put("异常详情", e.getMessage());
                deviceOnlineService.connException(uuid, params);
                if(localDevice!= null)
                    localDevice.terminate();
            }
        }
        return nodeList;
    }*/

    public Document read(Document dataAccessObject) throws Exception {
        String uuid = DocumentLib.getString(dataAccessObject, "uuid");
        if (bacnetDeviceMap.containsKey(uuid)) {
            PortAndUUID p = portUUIDMap.get(bacnetDeviceMap.get(uuid));
            //LocalDevice localDevice = bacnetDeviceMap.get(uuid);
            LocalDevice localDevice = p.getLocalDevice();

            int remoteDeviceInstanceNumber = DocumentLib.getInt(dataAccessObject, "conn_info_bacnet_ip.deviceNumber");
            RemoteDevice remoteDevice = localDevice.getRemoteDevice(remoteDeviceInstanceNumber).get();

            List<Document> nodeIdList = Lists.newArrayList();
            List<Document> rowList = DocumentLib.getList(dataAccessObject, "conn_info_bacnet_ip.rows");
            for (Document row : rowList) {
                int objectTypeId = DocumentLib.getInt(row, "objectTypeId");
                int objectInstanceNum = DocumentLib.getInt(row, "objectInstanceNum");
                int propertyTypeId = DocumentLib.getInt(row, "propertyTypeId");

                Document objectData = DocumentLib.newDoc();
                objectData.put("objectTypeId", objectTypeId);
                objectData.put("objectInstanceNum", objectInstanceNum);
                objectData.put("propertyTypeId", propertyTypeId);
                nodeIdList.add(objectData);
            }
            Document document = BacnetIPUtil.readValues(localDevice, remoteDevice, nodeIdList);
            if (document != null && !document.isEmpty()) {
                document.put("uuid", uuid);
                document.put("action", "data");
                System.out.println(document);
                return document;
            }
        }
        return null;
    }

    @Override
    public void unregister(String uuid) {
        Integer port = bacnetDeviceMap.get(uuid);
        if (port != null) {
            PortAndUUID portAndUUID = portUUIDMap.get(port);
            bacnetDeviceMap.remove(uuid);
            portAndUUID.removeUUId(uuid);
            if (portAndUUID.getUuids().size() == 0) {
                LocalDevice localDevice = portAndUUID.getLocalDevice();
                portUUIDMap.remove(port);
                localDevice.terminate();
            }
        }
    }
}
