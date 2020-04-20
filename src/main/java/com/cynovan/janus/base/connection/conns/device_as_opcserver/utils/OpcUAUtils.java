package com.cynovan.janus.base.connection.conns.device_as_opcserver.utils;

import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.eclipse.milo.opcua.sdk.client.OpcUaClient;
import org.eclipse.milo.opcua.sdk.client.api.config.OpcUaClientConfig;
import org.eclipse.milo.opcua.sdk.client.api.identity.AnonymousProvider;
import org.eclipse.milo.opcua.sdk.client.api.identity.IdentityProvider;
import org.eclipse.milo.opcua.sdk.client.api.identity.UsernameProvider;
import org.eclipse.milo.opcua.sdk.client.api.nodes.Node;
import org.eclipse.milo.opcua.sdk.client.nodes.UaVariableNode;
import org.eclipse.milo.opcua.stack.client.UaTcpStackClient;
import org.eclipse.milo.opcua.stack.core.Identifiers;
import org.eclipse.milo.opcua.stack.core.security.SecurityPolicy;
import org.eclipse.milo.opcua.stack.core.types.builtin.*;
import org.eclipse.milo.opcua.stack.core.types.builtin.unsigned.UByte;
import org.eclipse.milo.opcua.stack.core.types.builtin.unsigned.UInteger;
import org.eclipse.milo.opcua.stack.core.types.builtin.unsigned.ULong;
import org.eclipse.milo.opcua.stack.core.types.builtin.unsigned.UShort;
import org.eclipse.milo.opcua.stack.core.types.enumerated.TimestampsToReturn;
import org.eclipse.milo.opcua.stack.core.types.structured.EndpointDescription;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.eclipse.milo.opcua.stack.core.types.builtin.unsigned.Unsigned.uint;

public class OpcUAUtils {

    public static OpcUaClient createOpcUaClient(Document dataAccessObject) {
        String uuid = DocumentLib.getString(dataAccessObject, "uuid");
        EndpointDescription[] endpoints = null;

        String endpoint_url = DocumentLib.getString(dataAccessObject, "endpoint_url");
        try {
            endpoints = UaTcpStackClient
                    .getEndpoints(endpoint_url)
                    .get();
        } catch (Throwable ex) {

        }
        if (endpoints == null) {
            try {
                String discoveryUrl = endpoint_url + "/discovery";
                endpoints = UaTcpStackClient
                        .getEndpoints(discoveryUrl)
                        .get();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        if (endpoints == null) {
            return null;
        }
        SecurityPolicy securityPolicy = null;
        String securityPolicyStr = DocumentLib.getString(dataAccessObject, "securityPolicy");
        if (StringLib.equalsIgnoreCase(securityPolicyStr, SecurityPolicy.Basic128Rsa15.name())) {
            securityPolicy = SecurityPolicy.Basic128Rsa15;
        } else if (StringLib.equalsIgnoreCase(securityPolicyStr, SecurityPolicy.Basic256.name())) {
            securityPolicy = SecurityPolicy.Basic256;
        } else if (StringLib.equalsIgnoreCase(securityPolicyStr, SecurityPolicy.Basic256Sha256.name())) {
            securityPolicy = SecurityPolicy.Basic256Sha256;
        } else {
            securityPolicy = SecurityPolicy.None;
        }
        SecurityPolicy finalSecurityPolicy = securityPolicy;
        EndpointDescription endpoint = Arrays.stream(endpoints)
                .filter(e -> e.getSecurityPolicyUri().equals(finalSecurityPolicy.getSecurityPolicyUri()))
                .findFirst().get();

        if (endpoint == null) {
            return null;
        }

        IdentityProvider identityProvider = null;
        String identityType = DocumentLib.getString(dataAccessObject, "auth_type");
        if (StringLib.equals(identityType, "username")) {
            identityProvider = new UsernameProvider(DocumentLib.getString(dataAccessObject, "username"), DocumentLib.getString(dataAccessObject, "password"));
        } else {
            identityProvider = new AnonymousProvider();
        }

        OpcUaClientConfig config = OpcUaClientConfig.builder()
                .setApplicationName(LocalizedText.english("OPC_UA_CLIENT_" + uuid))
                .setEndpoint(endpoint)
                .setIdentityProvider(identityProvider)
                .setRequestTimeout(uint(5000))
                .build();

        OpcUaClient opcUaClient = new OpcUaClient(config);
//        opcUaClient.readValues()
        return opcUaClient;
    }

    public static void writeValues(OpcUaClient opcUaClient, Map<String, Object> values) {
        /*transfer the value to opc value */
        List<NodeId> opcNodeIdList = Lists.newArrayList();
        List<DataValue> opcValueList = Lists.newArrayList();
        values.forEach((key, value) -> {
            opcNodeIdList.add(parseByString(key));
            Variant v = new Variant(value);
            DataValue dv = new DataValue(v, null, null);
            opcValueList.add(dv);
        });

        try {
            List<StatusCode> statusCodeList = opcUaClient.writeValues(opcNodeIdList, opcValueList).get();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static Document readValues(OpcUaClient opcUaClient, List<String> nodeList) {
        List<NodeId> list = Lists.newArrayList();
        nodeList.stream().forEach(nodeId -> {
            NodeId opcNodeId = parseByString(nodeId);
            list.add(opcNodeId);
        });
        Document document = DocumentLib.newDoc();
        try {
            List<DataValue> valueList = opcUaClient.readValues(0, TimestampsToReturn.Neither, list).get();
            for (int i = 0; i < valueList.size(); i++) {
                DataValue valueItem = valueList.get(i);
                if (valueItem.getStatusCode().isGood()) {
                    Variant variant = valueItem.getValue();
                    String keyName = nodeList.get(i);
                    Object value = variant.getValue();
                    value = valueToJava(value);
                    if (value != null) {
                        document.put(keyName, value);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return document;
    }

    private static Object valueToJava(Object value) {
        value = parseSingleValue(value);
        if (value != null && value.getClass().isArray()) {
            Object[] objArr = (Object[]) value;
            List list = Arrays.asList(objArr);
            List valueList = Lists.newArrayList();
            list.stream().forEach(item -> {
                item = parseSingleValue(item);
                if (item != null) {
                    valueList.add(item);
                }
            });
            if (valueList.size() > 0) {
                value = valueList;
            } else {
                value = null;
            }
        }
        return value;
    }

    private static Object parseSingleValue(Object value) {
        if (value == null || value instanceof ByteString || value instanceof XmlElement) {
            return null;
        }
        if (value instanceof UShort
                || value instanceof UInteger
                || value instanceof ULong) {
            return StringLib.toLong(value);
        } else if (value instanceof UByte) {
            return StringLib.toString(value);
        } else if (value instanceof DateTime) {
            DateTime dateTime = (DateTime) value;
            return dateTime.getJavaDate();
        } else if (value instanceof LocalizedText) {
            LocalizedText localizedText = (LocalizedText) value;
            return localizedText.getText();
        } else if (value instanceof QualifiedName) {
            QualifiedName qualifiedName = (QualifiedName) value;
            return qualifiedName.getName();
        } else if (value instanceof Variant) {
            Variant variant = (Variant) value;
            return variant.getValue();
        } else if (value instanceof NodeId) {
            NodeId nodeId = (NodeId) value;
            return nodeId.getIdentifier().toString();
        }
        return value;
    }

    private static NodeId parseByString(String str) {
        int splitIdx = StringLib.indexOf(str, "_");
        NodeId opcNodeId = new NodeId(
                StringLib.toInteger(StringLib.substring(str, 0, splitIdx)),
                StringLib.toString(StringLib.substring(str, splitIdx + 1)));
        return opcNodeId;
    }

    public static List<Document> readAllNodes(OpcUaClient opcUaClient) {
        List<Document> nodeList = Lists.newArrayList();
        /*取得所有的父节点*/
        try {
            List<Node> parentNodes = opcUaClient.getAddressSpace().browse(Identifiers.ObjectsFolder).get();
            if (CollectionUtils.isNotEmpty(parentNodes)) {
                for (int i = 0; i < parentNodes.size(); i++) {
                    Node pNode = parentNodes.get(i);
                    Document pDoc = createDocByNode(pNode, null);
                    nodeList.add(pDoc);
                    /*得到所有的下级节点*/
                    readNodes(opcUaClient, DocumentLib.getID(pDoc), nodeList);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return nodeList;
    }

    private static void readNodes(OpcUaClient opcUaClient, String pNodeId, List<Document> nodeList) {
        try {
            NodeId opcNodeId = parseByString(pNodeId);
            List<Node> parentNodes = opcUaClient.getAddressSpace().browse(opcNodeId).get();
            if (CollectionUtils.isNotEmpty(parentNodes)) {
                for (int i = 0; i < parentNodes.size(); i++) {
                    Node pNode = parentNodes.get(i);
                    Document pDoc = createDocByNode(pNode, pNodeId);
                    nodeList.add(pDoc);
                    readNodes(opcUaClient, DocumentLib.getID(pDoc), nodeList);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static Document createDocByNode(Node node, String pId) throws Exception {
        QualifiedName qualifiedName = node.getBrowseName().get();
        Document pDoc = DocumentLib.newDoc();
        String id = StringLib.join(node.getNodeId().get().getNamespaceIndex(), "_", node.getNodeId().get().getIdentifier().toString());
        pDoc.put("id", id);
        pDoc.put("name", qualifiedName.getName());
        pDoc.put("namespace", StringLib.toString(qualifiedName.getNamespaceIndex()));
        pDoc.put("node_class", node.getNodeClass().get().getValue());
        if (node.getNodeClass().get().getValue() == 1) {
            pDoc.put("isParent", true);//配合页面上显示文件夹
        }
        if (node instanceof UaVariableNode) {
            UaVariableNode uaVariableNode = (UaVariableNode) node;
            String dataType = uaVariableNode.getDataType().get().getIdentifier().toString();
            pDoc.put("dataType", dataType);
        }
        if (StringLib.isNotEmpty(pId)) {
            pDoc.put("pId", pId);
        }
        return pDoc;
    }
}
