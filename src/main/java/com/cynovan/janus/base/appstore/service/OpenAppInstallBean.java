package com.cynovan.janus.base.appstore.service;

import com.cynovan.janus.base.appstore.jdo.QOpenApps;
import com.cynovan.janus.base.appstore.jdo.QOpenAppsResource;
import com.cynovan.janus.base.appstore.jdo.QOpenAppsVersion;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.InitializeData;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.config.bean.service.OpenAppDataService;
import com.cynovan.janus.base.device.database.jdo.QTemplate;
import com.cynovan.janus.base.gridfs.service.FileStorageService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import com.google.common.io.Files;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.Sorts;
import net.lingala.zip4j.core.ZipFile;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

public class OpenAppInstallBean {

    public static final Set<String> inDocumentSaveFileTypes = Sets.newHashSet("html", "js", "css", "json");

    private String appId;
    private int version;
    private String contextPath;

    private List<Document> appResourceList = Lists.newArrayList();
    private Map<String, Document> appResourceMap = Maps.newHashMap();
    private Map<String, Document> sysTemplateMap = Maps.newHashMap();
    private CheckMessage checkMessage = CheckMessage.newInstance();

    public OpenAppInstallBean(String _appId, int _version, String _contextPath) {
        this.appId = _appId;
        this.version = _version;
        this.contextPath = _contextPath;
    }

    public CheckMessage install() {
        clear();
        File extractZipFolder = extractAppZipToFolder(getAppFileId());

        /*解析app json 到数据库中*/
        File source = new File(StringLib.join(extractZipFolder.getAbsolutePath(), File.separator, "source"));
        analysisFilesToDBResource(source);
        updateAppJson(source);
        return checkMessage;
    }

    private void updateAppJson(File extractSourceFolder) {
        String appJsonFilePath = StringLib.join(extractSourceFolder.getAbsolutePath(), File.separator, "app.json");
        File appJsonFile = new File(appJsonFilePath);
        try {
            Document appJson = DocumentLib.parse(FileUtils.readFileToString(appJsonFile, StringLib.UTF_8));
            List<Document> appMenus = DocumentLib.getList(appJson, "menus");

            AtomicInteger menuIndex = new AtomicInteger(0);

            /*在Menu中加入必要的信息*/
            appMenus.stream().forEach((menuItem) -> {
                menuItem.put("appId", appId);
                menuItem.put("menuIndex", menuIndex.get());
                menuItem.put("fromOpen", true);
                String page = DocumentLib.getString(menuItem, "page");
                if (StringLib.isNotEmpty(page)) {
                    String templateId = StringLib.join(appId, "_", DigestLib.md5Hex(page));
                    menuItem.put("template", templateId);
                }
                String detailPage = DocumentLib.getString(menuItem, "detailPage");
                if (StringLib.isNotEmpty(detailPage)) {
                    String templateId = StringLib.join(appId, "_", DigestLib.md5Hex(detailPage));
                    menuItem.put("detail_template", templateId);
                }
                /*处理ICON的逻辑*/
                String icon = DocumentLib.getString(menuItem, "icon");
                if (StringLib.isNotEmpty(icon)) {
                    Document targetFile = appResourceMap.get(icon);
                    String fileId = DocumentLib.getString(targetFile, "fileId");
                    menuItem.put("icon", StringLib.join("gridfs/", fileId));
                }
                /*解析Menu的Depend，转换成和janus一样的规则*/
                List<String> depend = transformToJanusDepend(DocumentLib.getList(menuItem, "depend"));
                menuItem.put("depend", depend);
                menuIndex.incrementAndGet();
            });

            Document update = DocumentLib.newDoc();
            update.put("appJson", appJson);
            update.put("installed", true);
            update.put("installed_date", new Date());
            DBUtils.updateOne(QOpenApps.collectionName, Filters.eq("appId", appId), DocumentLib.new$Set(update));

            /*删除zip解压文件的父级节点*/
            FileUtils.deleteFile(extractSourceFolder.getParentFile().getAbsolutePath());

            OpenAppDataService openAppDataService = SpringContext.getBean(OpenAppDataService.class);
            openAppDataService.unRegister(appId);
            openAppDataService.register(appId);
            InitializeData.removeAppTemplateCache(appId);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private List<String> transformToJanusDepend(List<String> depend) {
        List<String> janusDependList = Lists.newArrayList();
        if (CollectionUtils.isNotEmpty(depend)) {
            depend.stream().forEach(item -> {
                Document file = appResourceMap.get(item);
                String fileTreeId = DocumentLib.getID(file);
                String fileType = DocumentLib.getString(file, "fileType");
                if (StringLib.isNotEmpty(fileTreeId)) {
                    if (!janusDependList.contains(fileTreeId)) {
                        String url = StringLib.join(contextPath + "/initialize/openappresource/", fileTreeId);
                        url = StringLib.join(url, "?name=", DocumentLib.getString(file, "name"));
                        if (StringLib.equalsIgnoreCase(fileType, "css")) {
                            url = "css!" + url;
                        }
                        if (!janusDependList.contains(url)) {
                            janusDependList.add(url);
                        }
                    }
                }
            });
        }
        return janusDependList;
    }

    private void analysisFilesToDBResource(File extractSourceFolder) {
        try {
            String sourcePath = extractSourceFolder.getAbsolutePath() + File.separator;
            Collection<File> files = FileUtils.listFiles(extractSourceFolder, null, true);
            if (CollectionUtils.isNotEmpty(files)) {
                FileStorageService fileStorageService = SpringContext.getBean(FileStorageService.class);
                for (File file : files) {
                    if (file.isFile()) {
                        String path = StringLib.replace(file.getAbsolutePath(), sourcePath, "");
                        path = StringLib.replace(path, File.separator, "/");
                        String fileName = file.getName();
                        String fileType = StringLib.substring(fileName, StringLib.lastIndexOf(fileName, ".") + 1);

                        Document appResource = DocumentLib.newDoc();
                        appResource.put(QOpenAppsResource.appId, appId);
                        appResource.put(QOpenAppsResource.path, path);
                        if (inDocumentSaveFileTypes.contains(fileType)) {
                            String fileString = FileUtils.readFileToString(file, StringLib.UTF_8);
                            if (StringLib.equalsIgnoreCase(fileType, "html")) {
                                Document template = new Document();
                                String templateName = StringLib.join(appId, "_", DigestLib.md5Hex(path));
                                template.put("name", templateName);
                                template.put("template", fileString);
                                sysTemplateMap.put(templateName, template);
                            }
                            appResource.put("code", fileString);
                        } else {
                            byte[] bytes = FileUtils.readFileToByteArray(file);
                            ObjectNode fileInfo = fileStorageService.storeFile(new ByteArrayInputStream(bytes), fileName, null);
                            String fileId = JsonLib.getString(fileInfo, "fileId");
                            appResource.put("fileId", fileId);
                        }
                        appResource.put("fileType", fileType);
                        appResourceList.add(appResource);
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        /*插入系统中*/
        DBUtils.insertMany(QTemplate.collectionName, Lists.newArrayList(sysTemplateMap.values()));
        DBUtils.insertMany(QOpenAppsResource.collectionName, appResourceList);

        appResourceList = DBUtils.list(QOpenAppsResource.collectionName,
                Filters.eq("appId", appId),
                Projections.include("appId", "fileType", "_id", "path"));

        appResourceList.stream().forEach(appResource -> {
            appResourceMap.put(DocumentLib.getString(appResource, "path"), appResource);
        });
    }

    private String getAppFileId() {
        /*load the appId*/
        Bson filter = Filters.and(Filters.eq("appId", appId), Filters.eq("version", version));
        if (version <= 0) {
            filter = Filters.eq("appId", appId);
        }
        Document versionApp = DBUtils.find(QOpenAppsVersion.collectionName, filter, Projections.include("fileId"), Sorts.descending("version"));
        return DocumentLib.getString(versionApp, "fileId");
    }

    private void clear() {
        /*删除资源文件*/
        DBUtils.deleteMany(QOpenAppsResource.collectionName, Filters.eq("appId", appId));

        /*删除App相关所有的Template*/
        DBUtils.deleteMany(QTemplate.collectionName, Filters.regex("name", appId + "_\\.*"));
    }

    private File extractAppZipToFolder(String fileId) {
        try {
            FileStorageService fileStorageService = SpringContext.getBean(FileStorageService.class);
            GridFSFile gridFSFile = fileStorageService.fetchFile(fileId);
            byte[] bytes = fileStorageService.getGridFsByteArray(gridFSFile);
            File baseDir = Files.createTempDir();
            File appZip = new File(baseDir, "app.zip");
            if (!appZip.exists()) {
                appZip.createNewFile();
            }

            Files.write(bytes, appZip);
            ZipFile zFile = new ZipFile(appZip);
            zFile.setPassword(OpenAppStoreService.ZIP_PASSWORD);

            String destpath = baseDir.getAbsolutePath() + File.separator + "appZip";
            zFile.extractAll(destpath);
            return new File(destpath);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
