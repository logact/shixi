package com.cynovan.janus.base.connection.conns.device_as_bacnet_ip_server.utils;

import com.cynovan.janus.base.connection.conns.activemq.DeviceOnlineService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import com.serotonin.bacnet4j.LocalDevice;
import com.serotonin.bacnet4j.RemoteDevice;
import com.serotonin.bacnet4j.exception.BACnetException;
import com.serotonin.bacnet4j.npdu.ip.IpNetwork;
import com.serotonin.bacnet4j.npdu.ip.IpNetworkBuilder;
import com.serotonin.bacnet4j.service.acknowledgement.ReadPropertyMultipleAck;
import com.serotonin.bacnet4j.service.confirmed.ReadPropertyMultipleRequest;
import com.serotonin.bacnet4j.transport.DefaultTransport;
import com.serotonin.bacnet4j.transport.Transport;
import com.serotonin.bacnet4j.type.constructed.ReadAccessResult.Result;
import com.serotonin.bacnet4j.type.constructed.ReadAccessSpecification;
import com.serotonin.bacnet4j.type.constructed.SequenceOf;
import com.serotonin.bacnet4j.type.enumerated.PropertyIdentifier;
import com.serotonin.bacnet4j.type.primitive.ObjectIdentifier;
import com.serotonin.bacnet4j.util.RequestUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.net.*;
import java.util.List;

@Component
public class BacnetIPUtil {

    @Autowired
    private DeviceOnlineService deviceOnlineService;

    public static LocalDevice createLocalDevice(Document dataInit) throws UnknownHostException, SocketException {
        System.out.println(dataInit);
        LocalDevice localDevice = null;
        InetAddress localHost = Inet4Address.getLocalHost();
        NetworkInterface networkInterface = NetworkInterface.getByInetAddress(localHost);

        int port = DocumentLib.getInt(dataInit, "portNum");
        int deviceNumber = DocumentLib.getInt(dataInit, "deviceNumber");
        String broadcastAddress = networkInterface.getInterfaceAddresses().get(0).getBroadcast().getHostAddress();
        int networkPrefixLength = networkInterface.getInterfaceAddresses().get(0).getNetworkPrefixLength();
        try {
            IpNetwork network = new IpNetworkBuilder()
                    .withBroadcast(broadcastAddress, networkPrefixLength)
                    .withPort(port)
                    .build();
            Transport transport = new DefaultTransport(network);
            localDevice = new LocalDevice(deviceNumber + 1, transport);
            localDevice.initialize();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return localDevice;
    }


    //获取设备所有对象
    public static SequenceOf<ObjectIdentifier> getDeviceAllObjectIdentifier(LocalDevice localDevice, RemoteDevice remoteDevice) throws BACnetException {
        SequenceOf<ObjectIdentifier> oids = RequestUtils.getProperty(localDevice, remoteDevice, PropertyIdentifier.objectList);
        return oids;
    }

    //遍历对象下的属性集合
    public static SequenceOf<Result> getObjectAllProperties(LocalDevice localDevice, RemoteDevice remoteDevice, ObjectIdentifier objectIdentifier)
            throws BACnetException {
        SequenceOf<ReadAccessSpecification> list = new SequenceOf<>(new ReadAccessSpecification(objectIdentifier, PropertyIdentifier.all));
        ReadPropertyMultipleAck acks = localDevice.send(remoteDevice, new ReadPropertyMultipleRequest(list)).get();
        SequenceOf<Result> result = acks.getListOfReadAccessResults().get(0).getListOfResults();
        return result;
    }

    private static Document createDocByObjectIdentifier(ObjectIdentifier objectIdentifier) {
        Document oDoc = DocumentLib.newDoc();
        String id = StringLib.join(
                objectIdentifier.getObjectType().intValue(),
                "_",
                objectIdentifier.getInstanceNumber()
        );
        String name = StringLib.join(
                objectIdentifier.getObjectType().toString(),
                "-",
                objectIdentifier.getInstanceNumber()
        );
        oDoc.put("id", id);
        oDoc.put("name", name);
        oDoc.put("objectTypeName", objectIdentifier.getObjectType().toString());
        oDoc.put("objectTypeId", objectIdentifier.getObjectType().intValue());
        oDoc.put("objectInstanceNum", objectIdentifier.getInstanceNumber());
        oDoc.put("isParent", true);
        return oDoc;
    }

    private static Document createDocByPropertyIdentifier(PropertyIdentifier propertyIdentifier, Document oDoc) {
        Document pDoc = DocumentLib.newDoc();
        String pId = DocumentLib.getString(oDoc, "id");
        String id = StringLib.join(
                pId,
                "_",
                propertyIdentifier.intValue()
        );
        pDoc.put("id", id);
        pDoc.put("name", propertyIdentifier.toString());
        pDoc.put("propertyTypeId", propertyIdentifier.intValue());
        pDoc.put("objectTypeName", DocumentLib.getString(oDoc, "objectTypeName"));
        pDoc.put("objectTypeId", DocumentLib.getInt(oDoc, "objectTypeId"));
        pDoc.put("objectInstanceNum", DocumentLib.getInt(oDoc, "objectInstanceNum"));
        pDoc.put("isParent", false);
        pDoc.put("pId", pId);
        return pDoc;
    }

    public static List<Document> readAllNode(LocalDevice localDevice, RemoteDevice remoteDevice) throws BACnetException {
        List<Document> nodeList = Lists.newArrayList();

        SequenceOf<ObjectIdentifier> oids = BacnetIPUtil.getDeviceAllObjectIdentifier(localDevice, remoteDevice);
        for (int i = 0; i < oids.size(); i++) {
            Document oDoc = createDocByObjectIdentifier(oids.get(i));
            nodeList.add(oDoc);

            SequenceOf<Result> result = BacnetIPUtil.getObjectAllProperties(localDevice, remoteDevice, oids.get(i));
            for (int j = 0; j < result.size(); j++) {
                Document pDoc = createDocByPropertyIdentifier(result.get(j).getPropertyIdentifier(), oDoc);
                nodeList.add(pDoc);
            }
        }
        return nodeList;
    }

    public static String removeLine(String str) {
        String[] objectNames = StringLib.split(str, "-");
        String objectName = objectNames[0];
        if (objectNames.length > 1) {
            String name2 = objectNames[1].substring(0, 1).toUpperCase() + objectNames[1].substring(1);
            objectName = StringLib.join(objectName, name2);
        }
        return objectName;
    }

    public static Document readValues(LocalDevice localDevice, RemoteDevice remoteDevice, List<Document> nodeList) throws BACnetException {
        Document document = DocumentLib.newDoc();
        int objectTypeId = -1;
        for (int i = 0; i < nodeList.size(); i++) {
            int nowId = DocumentLib.getInt(nodeList.get(i), "objectTypeId");
            if (nowId == objectTypeId) {
            } else {
                // 得到每个对象下的所有属性
                objectTypeId = nowId;
                ObjectIdentifier oid = new ObjectIdentifier(objectTypeId, DocumentLib.getInt(nodeList.get(i), "objectInstanceNum"));
                SequenceOf<ReadAccessSpecification> list = new SequenceOf<>(new ReadAccessSpecification(oid, PropertyIdentifier.all));
                ReadPropertyMultipleAck acks = localDevice.send(remoteDevice, new ReadPropertyMultipleRequest(list)).get();
                SequenceOf<Result> result = acks.getListOfReadAccessResults().get(0).getListOfResults();
                // 寻找需要的属性
                for (int nodeListIndex = 0; nodeListIndex < nodeList.size(); nodeListIndex++) {
                    for (int resultIndex = 0; resultIndex < result.size(); resultIndex++) {
                        int propertyTypeId = DocumentLib.getInt(nodeList.get(nodeListIndex), "propertyTypeId");
                        int nodeOId = DocumentLib.getInt(nodeList.get(nodeListIndex), "objectTypeId");
                        if (result.get(resultIndex).getPropertyIdentifier().intValue() == propertyTypeId && nowId == nodeOId) {
                            Result nowResult = result.get(resultIndex);
                            String objectName = removeLine(oid.getObjectType().toString());
                            String propertyName = removeLine(nowResult.getPropertyIdentifier().toString());
                            document.put(propertyName, nowResult.getReadResult().toString());
                        }
                    }
                }
            }
        }
        return document;
    }

}

