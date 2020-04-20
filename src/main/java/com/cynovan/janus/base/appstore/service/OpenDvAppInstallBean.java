package com.cynovan.janus.base.appstore.service;

import com.cynovan.janus.base.appstore.jdo.QOpenApps;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.utils.*;
import com.mongodb.client.model.Filters;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;

import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.Date;
import java.util.List;

/**
 * 安装设备视图app
 */
public class OpenDvAppInstallBean {
    private String appId;
    private int version;
    private String contextPath;

    private CheckMessage checkMessage = CheckMessage.newInstance();

    public OpenDvAppInstallBean(String _appId, int _version, String _contextPath) {
        this.appId = _appId;
        this.version = _version;
        this.contextPath = _contextPath;
    }

    public CheckMessage install() {
        File extractZipFolder = extractAppZipToFolder();
        /*解析deviceView deviceType到对应数据库deviceView deviceClassification中*/
        File source = new File(StringLib.join(extractZipFolder.getAbsolutePath(), File.separator, "source"));
        analysisFilesToDB(source);
        updateOpenApp(source);
        return checkMessage;
    }

    private void updateOpenApp(File extractSourceFolder) {
        Document update = DocumentLib.newDoc();
        update.put("installed", true);
        update.put("installed_date", new Date());
        DBUtils.updateOne(QOpenApps.collectionName, Filters.eq("appId", appId), DocumentLib.new$Set(update));

        /*删除zip解压文件的父级节点*/
        FileUtils.deleteFile(extractSourceFolder.getParentFile().getAbsolutePath());
    }

    private File extractAppZipToFolder() {
        OpenAppService openAppService = SpringContext.getBean(OpenAppService.class);
        return openAppService.extractAppZipToFolder(appId, version);
    }

    private void analysisFilesToDB(File extractSourceFolder) {
        /*文件夹有两个json文件：deviceView.json deviceType.json*/
        Collection<File> files = FileUtils.listFiles(extractSourceFolder, null, true);
        if (CollectionUtils.isNotEmpty(files)) {
            for (File file : files) {
                if (file.isFile()) {
                    String fileName = file.getName();
                    if (StringLib.equals(fileName, "deviceView.json") || StringLib.equals(fileName, "deviceType.json")) {
                        String collectionName = StringLib.equals(fileName, "deviceView.json") ? "deviceView" : "deviceClassification";
                        String createTime = DateUtils.getDateTime();
                        try {
                            Document fileInfo = DocumentLib.parse(FileUtils.readFileToString(file, "UTF-8"));
                            if (StringLib.equals(fileName, "deviceView.json")) {
                                fileInfo.put("create_time", createTime);
                                DBUtils.updateOne(collectionName, Filters.eq("code", DocumentLib.getString(fileInfo, "code")), DocumentLib.new$Set(fileInfo), true);
                            }
                            if (StringLib.equals(fileName, "deviceType.json")) {
                                List<Document> typeList = DocumentLib.getList(fileInfo, "typeList");
                                typeList.stream().forEach(type -> {
                                    String code = DocumentLib.getString(type, "code");
                                    type.put("create_time", createTime);
                                    DBUtils.updateOne(collectionName, Filters.eq("code", code), DocumentLib.new$Set(type), true);
                                });
                            }
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }

                }
            }
        }
    }
}
