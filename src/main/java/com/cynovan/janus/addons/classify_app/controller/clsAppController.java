package com.cynovan.janus.addons.classify_app.controller;

import com.cynovan.janus.addons.triton.classification.backend.jdo.QDeviceClassification;
import com.cynovan.janus.addons.triton.view.backend.jdo.QDeviceView;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import org.bson.Document;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping(value = "clsApp")
public class clsAppController {
    @RequestMapping(value = "getViewcode")
    public CheckMessage getViewcode(String code) {
        CheckMessage checkmessage = CheckMessage.newInstance();
        Document projection = DocumentLib.newDoc();
        projection.put("view", 1);
        projection.put("name", 1);
        Document cls = DBUtils.find(QDeviceClassification.collectionName, DocumentLib.newDoc("code", code), projection);
        String viewcode = DocumentLib.getString(cls, "view.viewCode");
        String typename = DocumentLib.getString(cls, "name");
        if (viewcode.length() == 0) {
            checkmessage.addData("viewid", "0");
            checkmessage.addData("name", typename);
            return checkmessage;
        }
        Document viewprojection = DocumentLib.newDoc();
        viewprojection.put("id", 1);
        Document dview = DBUtils.find(QDeviceView.collectionName, DocumentLib.newDoc("code", viewcode), viewprojection);
        checkmessage.addData("viewid", DocumentLib.getString(dview, "id"));
        checkmessage.addData("name", typename);
        return checkmessage;
    }
}
