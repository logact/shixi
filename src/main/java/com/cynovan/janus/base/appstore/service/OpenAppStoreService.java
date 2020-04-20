package com.cynovan.janus.base.appstore.service;

import com.cynovan.janus.addons.triton.classification.backend.jdo.QDeviceClassification;
import com.cynovan.janus.addons.triton.view.backend.jdo.QDeviceView;
import com.cynovan.janus.base.appstore.jdo.QOpenApps;
import com.cynovan.janus.base.appstore.jdo.QOpenAppsResource;
import com.cynovan.janus.base.appstore.jdo.QOpenAppsVersion;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.service.OpenAppDataService;
import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.gridfs.service.FileStorageService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.io.Files;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import net.lingala.zip4j.core.ZipFile;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Component
public class OpenAppStoreService {

    public static final String ZIP_PASSWORD = "neptune-open-app";

    @Autowired
    private OpenAppDataService openAppService;

    @Autowired
    private FileStorageService fileStorageService;

    public CheckMessage importOpenApp(String fileId) {
        CheckMessage checkMessage = CheckMessage.newInstance();

        File extactZipFolder = extractAppZipToFolder(fileId);
        if (extactZipFolder == null) {
            checkMessage.setSuccess(false);
            checkMessage.addMessage("解压应用出现异常");
            return checkMessage;
        }

        String metaInfoJsonFilePath = StringLib.join(extactZipFolder.getAbsolutePath(), File.separator, "meta-info.json");
        String appIconFilePath = StringLib.join(extactZipFolder.getAbsolutePath(), File.separator, "icon.png");

        try {
            File metaInfoFile = new File(metaInfoJsonFilePath);

            Document metaInfo = DocumentLib.parse(FileUtils.readFileToString(metaInfoFile, "UTF-8"));
            metaInfo.put("publish_date", DocumentLib.getDate(metaInfo, "publish_date"));

            File appIconFile = new File(appIconFilePath);
            byte[] fileBytes = org.apache.commons.io.FileUtils.readFileToByteArray(appIconFile);
            InputStream stream = new ByteArrayInputStream(fileBytes);
            ObjectNode objectNode = fileStorageService.storeFile(stream, appIconFile.getName(), null);
            String appIconFileId = JsonLib.getString(objectNode, "fileId");
            metaInfo.put("icon", StringLib.join("gridfs/", appIconFileId));
            metaInfo.put("fromOpen", true);

            /*首先检查团队信息是否匹配*/
            List<String> companyList = JsonLib.parseArray(JsonLib.toJSON(DocumentLib.getList(metaInfo, "company")), String.class);

            if (companyList.contains("all") || companyList.contains(QJanus.getCompanyId())) {
            } else {
                checkMessage.setSuccess(false);
                checkMessage.addMessage("导入失败，Janus所属团队没有权限使用该应用");
                return checkMessage;
            }

            /*删除zip解压文件的父级节点*/
            FileUtils.deleteFile(extactZipFolder.getParentFile().getAbsolutePath());

            String appId = DocumentLib.getString(metaInfo, "appId");
            /*检查App的数据库中是否存在*/
            Document openApp = DBUtils.find(QOpenApps.collectionName, Filters.eq("appId", appId));
            if (openApp == null) {
                /*App不存在，则直接插入*/
                DBUtils.save(QOpenApps.collectionName, metaInfo);
                /*同时更新myAppVersion*/
            } else {
                /*app存在，检查版本号是否是最新的*/
                int currentVersion = DocumentLib.getInt(openApp, "version");
                int importVersion = DocumentLib.getInt(metaInfo, "version");
                if (currentVersion >= importVersion) {
                    /*数据库中的版本大于等于 当前导入的版本，则证明用户在导入旧版本应用，提示用户*/
                    checkMessage.setSuccess(false);
                    checkMessage.addMessage("您导入的应用为旧版本,请检查。");
                    checkMessage.addData("currentVersion", currentVersion);
                    checkMessage.addData("app", metaInfo);
                    return checkMessage;
                }

                /*更新原有的信息*/
                DBUtils.updateOne(QOpenApps.collectionName, Filters.eq("appId", appId), DocumentLib.new$Set(metaInfo));
            }

            /*if (StringLib.equals("type", "deviceview")) {
                String code = DocumentLib.getString(openApp, "code");
                Document deviceClassification = DBUtils.find(QDeviceClassification.collectionName, Filters.eq("code", code));
                if (null != deviceClassification) {
                    *//*已存在，需要覆盖原来的，提示用户*//*
                    String name = DocumentLib.getString(deviceClassification, "name");
                    checkMessage.addMessage("检查到本地已存在相同的设备分类：" + name + "，安装后会覆盖此分类!");
                }
            }*/

            Document appVersionDoc = new Document(metaInfo);
            appVersionDoc.remove("id");
            appVersionDoc.remove("_id");
            appVersionDoc.put("fileId", fileId);
            DBUtils.save(QOpenAppsVersion.collectionName, appVersionDoc);
            checkMessage.addData("app", metaInfo);
        } catch (IOException e) {
            checkMessage.setSuccess(false);
            e.printStackTrace();
        }
        return checkMessage;
    }

    private File extractAppZipToFolder(String fileId) {
        try {
            GridFSFile gridFSFile = fileStorageService.fetchFile(fileId);
            byte[] bytes = fileStorageService.getGridFsByteArray(gridFSFile);
            File baseDir = Files.createTempDir();
            File appZip = new File(baseDir, "app.zip");
            if (!appZip.exists()) {
                appZip.createNewFile();
            }

            Files.write(bytes, appZip);
            ZipFile zFile = new ZipFile(appZip);
            zFile.setPassword(ZIP_PASSWORD);

            String destpath = baseDir.getAbsolutePath() + File.separator + "appZip";
            zFile.extractAll(destpath);
            return new File(destpath);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public CheckMessage uninstallOpenApp(String appId) {
        DBUtils.deleteMany(QOpenAppsResource.collectionName, Filters.eq("appId", appId));

        Document update = DocumentLib.newDoc();
        update.put("appJson", null);
        update.put("installed", false);
        DBUtils.updateOne(QOpenApps.collectionName, Filters.eq("appId", appId), DocumentLib.new$Set(update));
        openAppService.unRegister(appId);
        return CheckMessage.newInstance();
    }

    /**
     * 卸载设备视图应用
     *
     * @param appId
     * @return
     */
    public CheckMessage uninstallOpenDvApp(String appId) {
        removeDeviceClassification(appId);
        DBUtils.deleteMany(QDeviceView.collectionName, Filters.eq("appId", appId));
        Document update = DocumentLib.newDoc();
        update.put("appJson", null);
        update.put("installed", false);
        DBUtils.updateOne(QOpenApps.collectionName, Filters.eq("appId", appId), DocumentLib.new$Set(update));

        return CheckMessage.newInstance();
    }

    /**
     * 删除设备视图应用所添加设备分类、视图
     *
     * @param appId
     */
    private void removeDeviceClassification(String appId) {
        List<Document> classificationList = DBUtils.list(QDeviceClassification.collectionName, Filters.eq("appId", appId), Projections.include("code"));
        classificationList.stream().forEach(classification -> {
            String code = DocumentLib.getString(classification, "code");
            Document updateDoc = DocumentLib.newDoc();
            updateDoc.put("classification", DocumentLib.newDoc());
            DBUtils.updateMany(QDevice.collectionName, Filters.eq("classification.classificationCode", code), DocumentLib.new$Set(updateDoc));
            DBUtils.updateMany(QDeviceView.collectionName, DocumentLib.newDoc("classification.classificationCode", code), DocumentLib.new$Set(updateDoc));
        });

        DBUtils.deleteMany(QDeviceClassification.collectionName, Filters.eq("appId", appId));
        /*此处为保持与原设备分类删除逻辑一致*/
        CacheUtils.deleteLike("classification_datastruc_");
        CacheUtils.deleteLike("DeviceState@");
    }

    /**
     * @param appId
     * @param version 安装的版本，当Version为0时，则安装最新版本
     * @return
     */
    public CheckMessage installOpenApp(String appId, int version, String contextPath) {
        CheckMessage checkMessage = CheckMessage.newInstance();
        OpenAppInstallBean bean = new OpenAppInstallBean(appId, version, contextPath);
        bean.install();
        return checkMessage;
    }

    /**
     * @param appId
     * @param version     安装的版本，当Version为0时，则安装最新版本
     * @param contextPath
     * @return
     */
    public CheckMessage installOpenDeviceViewApp(String appId, int version, String contextPath) {
        CheckMessage checkMessage = CheckMessage.newInstance();
        OpenDvAppInstallBean dvBean = new OpenDvAppInstallBean(appId, version, contextPath);
        dvBean.install();
        return checkMessage;
    }
}
