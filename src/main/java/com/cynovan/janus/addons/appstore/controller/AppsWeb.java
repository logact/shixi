package com.cynovan.janus.addons.appstore.controller;

import com.cynovan.janus.base.appstore.jdo.QOpenApps;
import com.cynovan.janus.base.appstore.service.AppDataService;
import com.cynovan.janus.base.appstore.service.AppStoreService;
import com.cynovan.janus.base.appstore.service.OpenAppStoreService;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.device.database.jdo.QAppInfo;
import com.cynovan.janus.base.device.database.jdo.QApps;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.Sorts;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping(value = "/app")
public class AppsWeb extends BaseWeb {

    @Autowired
    private AppDataService appDataService;

    @Autowired
    private AppStoreService appStoreService;

    @Autowired
    private OpenAppStoreService openAppStoreService;

    @RequestMapping(value = "loadAll")
    public String loadAll() {
        CheckMessage cm = CheckMessage.newInstance();

        /*查询系统自带的App*/
        List<Document> apps = DBUtils.list(QApps.collectionName);
        Document appInfo = DBUtils.find(QAppInfo.collectionName, DocumentLib.newDoc());
        List installed = DocumentLib.getList(appInfo, "installed");
        apps.stream().forEach(app -> {
            app.put("installed", installed.contains(DocumentLib.getString(app, "appId")));
        });

        // 查询所有的开放平台应用
        List<Document> openApps = DBUtils.list(QOpenApps.collectionName, null, Projections.exclude("appJson"), Sorts.descending("publish_date"));
        apps.addAll(openApps);

        cm.addData("apps", JsonLib.toJSON(apps));

        return cm.toString();
    }

    @RequestMapping(value = "install")
    public String install(String name, HttpServletRequest request) {
        //如果是open平台上的App
        Document openApp = DBUtils.find(QOpenApps.collectionName, DocumentLib.newDoc("appId", name));
        if (openApp != null) {
            String type = DocumentLib.getString(openApp, "type");
            String appId = DocumentLib.getString(openApp, "appId");
            if (StringLib.equals(type, "deviceview")) {
                openAppStoreService.installOpenDeviceViewApp(appId, 0, request.getContextPath());
                return CheckMessage.newInstance().toString();
            }
            openAppStoreService.installOpenApp(appId, 0, request.getContextPath());
        } else {
            appStoreService.installApp(name);
        }
        return CheckMessage.newInstance().toString();
    }

    @RequestMapping(value = "uninstall")
    public String uninstall(String name) {
        //如果是open app,需要删除相应menu
        Document openApp = DBUtils.find(QOpenApps.collectionName, DocumentLib.newDoc("appId", name));
        if (null != openApp) {
            String type = DocumentLib.getString(openApp, "type");
            if (StringLib.equals(type, "deviceview")) {
                openAppStoreService.uninstallOpenDvApp(name);
                return CheckMessage.newInstance().toString();
            }
            openAppStoreService.uninstallOpenApp(name);
        } else {
            appStoreService.uninstallApp(name);
        }
        return CheckMessage.newInstance().toString();
    }

    @RequestMapping(value = "data/get")
    public String getdata(String app_key, String data_key) {
        List<String> keys = Lists.newArrayList();
        if (StringLib.isNotEmpty(app_key)) {
            keys.add(app_key);
        }
        if (StringLib.isNotEmpty(data_key)) {
            keys.add(data_key);
        }
        String dataKey = StringLib.join(keys, StringLib.SPLIT_1);
        return appDataService.get(dataKey).toJson();
    }

    @RequestMapping(value = "data/set")
    public String setdata(String app_key, String data_key, String value) {
        CheckMessage checkMessage = CheckMessage.newInstance();

        List<String> keys = Lists.newArrayList();
        if (StringLib.isNotEmpty(app_key)) {
            keys.add(app_key);
        }
        if (StringLib.isNotEmpty(data_key)) {
            keys.add(data_key);
        }

        String dataKey = StringLib.join(keys, StringLib.SPLIT_1);

        if (StringLib.isNotEmpty(value)) {
            Document data = Document.parse(StringLib.decodeURI(value));
            appDataService.set(dataKey, data);
        } else {

        }
        return checkMessage.toString();
    }

    @GetMapping(value = "importApp")
    public String getAppInfo(@RequestParam String fileId) {
        CheckMessage checkMessage = openAppStoreService.importOpenApp(fileId);
        return checkMessage.toString();
    }
}
