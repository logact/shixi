package com.cynovan.janus.base.appstore.service;

import com.cynovan.janus.base.appstore.jdo.QOpenAppsVersion;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.gridfs.service.FileStorageService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.google.common.io.Files;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.Sorts;
import net.lingala.zip4j.core.ZipFile;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.springframework.stereotype.Component;

import java.io.File;

@Component
public class OpenAppService {

    public File extractAppZipToFolder(String appId, int version) {
        try {
            FileStorageService fileStorageService = SpringContext.getBean(FileStorageService.class);
            GridFSFile gridFSFile = fileStorageService.fetchFile(getAppFileId(appId, version));
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

    private String getAppFileId(String appId, int version) {
        /*load the appId*/
        Bson filter = Filters.and(Filters.eq("appId", appId), Filters.eq("version", version));
        if (version <= 0) {
            filter = Filters.eq("appId", appId);
        }
        Document versionApp = DBUtils.find(QOpenAppsVersion.collectionName, filter, Projections.include("fileId"), Sorts.descending("version"));
        return DocumentLib.getString(versionApp, "fileId");
    }
}
