package com.cynovan.janus.addons.device.controller;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Controller
@RequestMapping(value = "/areaAndDevice")
public class AreaAndDevice extends BaseWeb {

    @Value("${debug}")
    private Boolean debug;

    @Value("${version}")
    private String version;

    @ResponseBody
    @PostMapping(value = "updateGroup")
    public String updateDeviceGroup(String data) {
        Document document = DocumentLib.parse(data);
        List list = DocumentLib.getList(document, "uuidArray");
        String code = DocumentLib.getString(document, "code");
        String name = DocumentLib.getString(document, "name");
        Document match = DocumentLib.newDoc();
        match.put("uuid", DocumentLib.newDoc("$in", list));
        Document update = DocumentLib.newDoc();
        update.put("group.groupCode", code);
        update.put("group.groupName", name);
        DBUtils.updateMany("device", match, DocumentLib.new$Set(update));
        CheckMessage checkMessage = new CheckMessage();
        return checkMessage.toString();
    }

    @ResponseBody
    @PostMapping(value = "alterNodeName1")
    public String alterNodeName1(String code, String name) {
        List<Document> treeNodes = DBUtils.list("areaDeviceTree");
        doAlter(treeNodes, code, name);
        for (Document d : treeNodes) {
            DBUtils.updateOne(
                    "areaDeviceTree",
                    DocumentLib.newDoc("id", d.getString("id")),
                    DocumentLib.new$Set(DocumentLib.newDoc("children", DocumentLib.getList(d, "children"))));
        }
        return new CheckMessage().toString();
    }

    @ResponseBody
    @PostMapping(value = "addTreeNode1")
    public String addTreeNode1(String pCode) {
        ObjectId newNodeId = new ObjectId();
        String newNodeCode = UUID.randomUUID().toString();
        List<Document> treeNodes = DBUtils.list("areaDeviceTree");
        // 创建新节点
        Document newNode = DocumentLib.newDoc();
        newNode.put("name", "NEW NODE");
        newNode.put("id", newNodeId);
        newNode.put("code", newNodeCode);
        newNode.put("pCode", pCode);
        newNode.put("open", true);
        newNode.put("isParent", true);
        // 添加节点
        doAdd(treeNodes, pCode, newNode);
        for (Document d : treeNodes) {
            DBUtils.updateOne(
                    "areaDeviceTree",
                    DocumentLib.newDoc("id", d.getString("id")),
                    DocumentLib.new$Set(DocumentLib.newDoc("children", DocumentLib.getList(d, "children"))));
        }
        // 返回code
        CheckMessage checkMessage = new CheckMessage();
        checkMessage.addData("id", newNodeId.toString());
        checkMessage.addData("code", newNodeCode);
        return checkMessage.toString();
    }

    public void getChildren(List<Document> list, String targetCode) {
        if (list.isEmpty()) {
            return;
        }
        for (Document d : list) {
            String code = d.getString("code");
            if (d.containsKey("children")) {
                getChildren(DocumentLib.getList(d, "children"), targetCode);
            } else {
                return;
            }
        }
    }

    public void doAdd(List<Document> list, String pCode, Document newNode) {
        if (list.isEmpty()) {
            return;
        }
        for (Document d : list) {
            String code = d.getString("code");
            if (StringLib.equals(code, pCode)) {
                List<Document> childrenList = DocumentLib.getList(d, "children");
                childrenList.add(newNode);
                d.put("children", childrenList);
                return;
            }
            if (d.containsKey("children")) {
                doAdd(DocumentLib.getList(d, "children"), pCode, newNode);
            }
        }
    }

    private void doAlter(List<Document> list, String target, String newName) {
        if (list.isEmpty()) {
            return;
        }
        for (Document d : list) {
            String code = d.getString("code");
            if (StringLib.equals(code, target)) {
                d.put("name", newName);
                return;
            }
            if (d.containsKey("children")) {
                doAlter(DocumentLib.getList(d, "children"), target, newName);
            }
        }
    }

    @ResponseBody
    @PostMapping(value = "removeTreeNode1")
    public String removeTreeNode1(String code) {
        CheckMessage checkMessage = new CheckMessage();
        List<Document> treeNodes = DBUtils.list("areaDeviceTree");
        doRemove(treeNodes, code);
        for (Document d : treeNodes) {
            DBUtils.updateOne(
                    "areaDeviceTree",
                    DocumentLib.newDoc("id", d.getString("id")),
                    DocumentLib.new$Set(DocumentLib.newDoc("children", DocumentLib.getList(d, "children"))));
        }
        return checkMessage.toString();
    }

    private void doRemove(List<Document> list, String target) {
        if (list.isEmpty()) {
            return;
        }
        for (Document d : list) {
            String code = d.getString("code");
            if (StringLib.equals(code, target)) {
                int index = list.indexOf(d);
                list.remove(d);
                return;
            }
            if (d.containsKey("children")) {
                doRemove(DocumentLib.getList(d, "children"), target);
            }
        }
    }

    @ResponseBody
    @PostMapping(value = "dropNode1")
    public String dropNode1(String data) {
        // 解析
        Document d = DocumentLib.parse(data);
        List treeNodes = DocumentLib.getList(d, "treeNodes");
        String target = DocumentLib.getString(d, "target");
        String moveType = DocumentLib.getString(d, "moveType");
        // 操作
        List<Document> dataNodes = DBUtils.list("areaDeviceTree");
        List nodes = doDrop_findNodes(dataNodes, treeNodes);
        doDrop_putNodesToParent(dataNodes, nodes, target, moveType);
        for (Document dd : dataNodes) {
            DBUtils.updateOne(
                    "areaDeviceTree",
                    DocumentLib.newDoc("id", dd.getString("id")),
                    DocumentLib.new$Set(DocumentLib.newDoc("children", DocumentLib.getList(dd, "children"))));
        }
        // 返回
        CheckMessage checkMessage = new CheckMessage();
        return checkMessage.toString();
    }

    private List doDrop_findNodes(List<Document> list, List treeNodes) {
        if (list.isEmpty()) {
            return null;
        }
        List<Document> nodes = new ArrayList<Document>();
        // 匹配
        for (Document d : list) {
            System.out.println(d.get("name"));
            String code = d.getString("code");
            for (Object o : treeNodes) {
                if (StringLib.equals(code, o.toString())) {
                    nodes.add(d);
                }
            }
            if (d.containsKey("children")) {
                List result = doDrop_findNodes(DocumentLib.getList(d, "children"), treeNodes);
                if (result != null) {
                    nodes.addAll(result);
                }
            }
        }
        // 移除
        if (nodes.size() > 0) {
            for (Document removed : nodes) {
                list.remove(removed);
            }
        }
        return nodes;
    }

    private void doDrop_putNodesToParent(List<Document> list, List toSaved, String target, String moveType) {
        if (list.isEmpty()) {
            return;
        }
        for (Document d : list) {
            String code = d.getString("code");
            if (StringLib.equals(code, target)) {

                if (StringLib.equals("inner", moveType)) {
                    List childrenList = DocumentLib.getList(d, "children");
                    childrenList.addAll(toSaved);
                    d.put("children", childrenList);
                } else if (StringLib.equals("prev", moveType)) {
                    int index = list.indexOf(d);
                    list.addAll(index, toSaved);
                } else if (StringLib.equals("next", moveType)) {
                    int index = list.indexOf(d);
                    list.addAll(index + 1, toSaved);
                }
                return;
            }
            if (d.containsKey("children")) {
                doDrop_putNodesToParent(DocumentLib.getList(d, "children"), toSaved, target, moveType);
            }
        }
    }


    @ResponseBody
    @PostMapping(value = "dropNode")
    public String dropNode(String data) {
        // 解析
        Document d = DocumentLib.parse(data);
        List treeNodes = DocumentLib.getList(d, "treeNodes");
        String target = DocumentLib.getString(d, "target");
        String moveType = DocumentLib.getString(d, "moveType");
        if (moveType.equals("inner")) {
            treeNodes.forEach(node -> {
                DBUtils.updateOne("areaDeviceTree", DocumentLib.newDoc("code", node.toString()),
                        DocumentLib.new$Set("pCode", target));
            });
        }
        // 返回
        CheckMessage checkMessage = new CheckMessage();
        return checkMessage.toString();
    }

    @ResponseBody
    @PostMapping(value = "alterNodeName")
    public String alterNodeName(String code, String name) {
        DBUtils.updateOne("areaDeviceTree", DocumentLib.newDoc("code", code), DocumentLib.new$Set("name", name));
        DBUtils.updateMany("device", DocumentLib.newDoc("group.groupCode", code), DocumentLib.new$Set("group.groupName", name));
        return new CheckMessage().toString();
    }

    @ResponseBody
    @PostMapping(value = "addTreeNode")
    public String addTreeNode(String pCode) {
        ObjectId newNodeId = new ObjectId();
        String newNodeCode = UUID.randomUUID().toString();
        // 创建新节点
        Document newNode = DocumentLib.newDoc();
        newNode.put("name", "NEW NODE");
        newNode.put("id", newNodeId);
        newNode.put("code", newNodeCode);
        newNode.put("pCode", pCode);
        newNode.put("open", true);
        newNode.put("isParent", true);
        // 添加节点
        DBUtils.save("areaDeviceTree", newNode);
        // 返回code
        CheckMessage checkMessage = new CheckMessage();
        checkMessage.addData("id", newNodeId.toString());
        checkMessage.addData("code", newNodeCode);
        return checkMessage.toString();
    }

    @ResponseBody
    @PostMapping(value = "removeTreeNode")
    public String removeTreeNode(String code) {
        CheckMessage checkMessage = new CheckMessage();
        List<Document> treeNodes = DBUtils.list("areaDeviceTree");
        DBUtils.deleteMany("areaDeviceTree", DocumentLib.newDoc("code", code));
        DBUtils.deleteMany("areaDeviceTree", DocumentLib.newDoc("pCode", code));
        DBUtils.updateMany("device", DocumentLib.newDoc("group.groupCode", code), DocumentLib.new$Set("group", DocumentLib.newDoc()));
        return checkMessage.toString();
    }

    @ResponseBody
    @PostMapping(value = "getAreaDeviceTreeData")
    public String getAreaDeviceTreeData() {
        CheckMessage cm = new CheckMessage();
        List<Document> list = DBUtils.list("areaDeviceTree", DocumentLib.newDoc());
        if (list.isEmpty()) {
            Document root = DocumentLib.newDoc();
            root.put("name", "设备分组");
            root.put("code", "root");
            root.put("open", true);
            root.put("isParent", true);
            list.add(root);
            DBUtils.save("areaDeviceTree", root);
        }
        cm.addData("result", list);
        return cm.toString();
    }


}

















