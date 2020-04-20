package com.cynovan.janus.addons.triton.view.backend.controller;


import com.cynovan.janus.addons.triton.classification.backend.jdo.QDeviceClassification;
import com.cynovan.janus.addons.triton.view.backend.jdo.QDeviceView;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.RandomUtils;
import com.cynovan.janus.base.utils.StringLib;
import com.mongodb.client.model.Projections;
import org.bson.Document;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Date;
import java.util.List;

@Controller
@RequestMapping(value = "deviceView")
public class DeviceViewController extends BaseWeb {

    @ResponseBody
    @RequestMapping(value = "saveView")
    public String saveView(String id, String entity) {
        CheckMessage cm = new CheckMessage();
        Document viewEntity = DocumentLib.parse(entity);
        viewEntity.put("create_time",new Date());
        String viewName = DocumentLib.getString(viewEntity, "name");
        String cls_code = DocumentLib.getString(viewEntity, "classification.classificationCode");
        // 名称是否重复
        if (this.isViewNameRepeat(viewName)) {
            if (StringLib.isEmpty(id)) {
                cm.addMessage("设备视图名字重复,请重新输入!");
                cm.setSuccess(false);
                return cm.toString();
            } else {
                Document view = DBUtils.find(QDeviceView.collectionName, DocumentLib.newDoc("id", id),
                        Projections.include("name", "classification"));
                String name = DocumentLib.getString(view, "name");
                if (!StringLib.equals(name, viewName)) {
                    cm.addMessage("设备视图名字重复,请重新输入!");
                    cm.setSuccess(false);
                    return cm.toString();
                }
            }
        }
        // 所选的设备分类是否被绑定
        if (!StringLib.isEmpty(cls_code) && this.isCheckedClsBind(cls_code)) {
            if (StringLib.isEmpty(id)) {
                cm.addMessage("选中的设备分类已被其他设备视图绑定,请重新选择!");
                cm.setSuccess(false);
                return cm.toString();
            } else {
                Document view = DBUtils.find(QDeviceView.collectionName, DocumentLib.newDoc("id", id),
                        Projections.include("name", "classification"));
                String code = DocumentLib.getString(view, "classification.classificationCode");
                if (!StringLib.equals(cls_code, code)) {
                    cm.addMessage("选中的设备分类已被其他设备视图绑定,请重新选择!");
                    cm.setSuccess(false);
                    return cm.toString();
                }
            }
        }
        String viewCode = "";
        if (StringLib.isEmpty(id)) {
            viewCode = RandomUtils.uuid();
            viewEntity.put("code", viewCode);
            DBUtils.save(QDeviceView.collectionName, viewEntity);
        } else {
            viewCode = DocumentLib.getString(viewEntity, "code");
            DBUtils.updateOne(QDeviceView.collectionName, DocumentLib.newDoc("code", viewCode), DocumentLib.new$Set(viewEntity));
        }
        // 1.将原来的设备分类view置为空
        Document oldUpdate = DocumentLib.newDoc("view", DocumentLib.newDoc());
        DBUtils.updateMany(QDeviceClassification.collectionName, DocumentLib.newDoc("view.viewCode", viewCode),
                DocumentLib.new$Set(oldUpdate));
        // 2.将view放到新的设备分类
        Document newUpdate = DocumentLib.newDoc();
        newUpdate.put("view.viewName", viewName);
        newUpdate.put("view.viewCode", viewCode);
        if (!StringLib.isEmpty(cls_code)) {
            DBUtils.updateOne(QDeviceClassification.collectionName, DocumentLib.newDoc("code", cls_code),
                    DocumentLib.new$Set(newUpdate));
        }
        return cm.toString();
    }

    @ResponseBody
    @RequestMapping(value = "copyView")
    public  String copyView(String id){
        CheckMessage cm = new CheckMessage();
        Document view=DBUtils.find(QDeviceView.collectionName,DocumentLib.newDoc("id",id));
        view.remove("classification");
        view.remove("id");
        view.replace("name",DocumentLib.getString(view,"name")+" Copied");
        view.replace("create_time",new Date());
        view.replace("code",RandomUtils.uuid());
        DBUtils.save(QDeviceView.collectionName,view);
        return cm.toString();
    }

    @ResponseBody
    @RequestMapping(value = "getViewListSimple")
    public String getViewListSimple() {
        CheckMessage cm = new CheckMessage();
        Document query = DocumentLib.newDoc();
        query.put("id", 1);
        query.put("name", 1);
        query.put("code", 1);
        query.put("classification", 1);
        List<Document> viewList = DBUtils.list("deviceView", DocumentLib.newDoc(), query);
        cm.addData("viewList", viewList);
        return cm.toString();
    }

    @ResponseBody
    @RequestMapping(value = "deleteView")
    public String deleteView(String viewCode, String clsCode) {
        CheckMessage cm = new CheckMessage();
        if (!StringLib.isEmpty(viewCode)) {
            DBUtils.deleteOne(QDeviceView.collectionName, DocumentLib.newDoc("code", viewCode));
        }
        if (!StringLib.isEmpty(clsCode)) {
            DBUtils.updateOne(QDeviceClassification.collectionName, DocumentLib.newDoc("code", clsCode),
                    DocumentLib.new$Set("view", DocumentLib.newDoc()));
        }
        return cm.toString();
    }

    private boolean isViewNameRepeat(String viewName) {
        Document query = DocumentLib.newDoc();
        query.put("name", viewName);
        long count = DBUtils.count(QDeviceView.collectionName, query);
        return count > 0;
    }

    private boolean isCheckedClsBind(String clsCode) {
        Document query = DocumentLib.newDoc();
        query.put("code", clsCode);
        Document cls = DBUtils.find(QDeviceClassification.collectionName, query, Projections.include("view", "code"));
        String cls_code = DocumentLib.getString(cls, "view.viewCode");
        return !StringLib.isEmpty(cls_code);
    }
}




