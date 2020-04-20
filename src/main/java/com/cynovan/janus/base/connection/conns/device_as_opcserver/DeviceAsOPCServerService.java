package com.cynovan.janus.base.connection.conns.device_as_opcserver;

import com.cynovan.janus.base.connection.conns.activemq.DeviceOnlineService;
import com.cynovan.janus.base.connection.conns.device_as_opcserver.utils.OpcUAUtils;
import com.cynovan.janus.base.connection.service.base.DeviceConnBaseService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import org.bson.Document;
import org.eclipse.milo.opcua.sdk.client.OpcUaClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Component
public class DeviceAsOPCServerService extends DeviceConnBaseService {

    @Autowired
    private DeviceOnlineService deviceOnlineService;

    private Map<String, OpcUaClient> opcUaClientMap = Maps.newConcurrentMap();

    public void create(Document dataAccessObject) {
        createOPC_UA_Client(dataAccessObject);
    }

    private void createOPC_UA_Client(Document dataAccessObject) {
        String uuid = DocumentLib.getString(dataAccessObject, "uuid");

        if (opcUaClientMap.containsKey(uuid)) {
            return;
        }
        try {
            Document dataObject = DocumentLib.getDocument(dataAccessObject, "conn_info_opc_ua_server");
            dataObject.put("uuid", uuid);
            OpcUaClient opcUaClient = OpcUAUtils.createOpcUaClient(dataObject);

            opcUaClient.connect().get();
            opcUaClientMap.put(uuid, opcUaClient);
        } catch (Exception e) {
            Map<String, String> params = Maps.newHashMap();
            params.put("异常类型", "OPC UA Server连接异常");
            params.put("异常详情", e.getMessage());
            deviceOnlineService.connException(uuid, params);
        }
    }

    @Override
    public void unregister(String uuid) {
        OpcUaClient opcUaClient = opcUaClientMap.get(uuid);
        if (opcUaClient != null) {
            opcUaClientMap.remove(uuid);
            opcUaClient.disconnect();
        }
    }

    public Document read(Document dataAccessObject) {
        String uuid = DocumentLib.getString(dataAccessObject, "uuid");
        if (opcUaClientMap.containsKey(uuid)) {
            OpcUaClient opcUaClient = opcUaClientMap.get(uuid);

            List<String> nodeIdList = Lists.newArrayList();
            /*从配置中读取*/
            List<Document> rowList = DocumentLib.getList(dataAccessObject, "conn_info_opc_ua_server.rows");
            for (int i = 0, len = rowList.size(); i < len; i++) {
                Document row = rowList.get(i);
                String id = DocumentLib.getString(row, "id");
                if (StringLib.isNotEmpty(id)) {
                    nodeIdList.add(id);
                }
            }

            Document document = OpcUAUtils.readValues(opcUaClient, nodeIdList);
            if (document != null && !document.isEmpty()) {
                document.put("uuid", uuid);
                document.put("action", "data");
                return document;
            }
        }
        return null;
    }

    public void write(ObjectNode pushNode) {
        String uuid = JsonLib.getString(pushNode, "uuid");
        if (opcUaClientMap.containsKey(uuid)) {
            OpcUaClient opcUaClient = opcUaClientMap.get(uuid);
            Map<String, Object> pushValues = Maps.newHashMap();
            ObjectNode dataNode = JsonLib.getObjectNode(pushNode, "data");
            Iterator<String> fieldIterable = dataNode.fieldNames();
            while (fieldIterable.hasNext()) {
                String fieldName = fieldIterable.next();
                if (!StringLib.equals(fieldName, "operation_id")) {
                    pushValues.put(fieldName, JsonLib.getString(dataNode, fieldName));
                }
            }
            OpcUAUtils.writeValues(opcUaClient, pushValues);
        }
    }
}
