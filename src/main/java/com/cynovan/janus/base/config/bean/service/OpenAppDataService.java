package com.cynovan.janus.base.config.bean.service;

import com.cynovan.janus.base.appstore.jdo.QOpenApps;
import com.cynovan.janus.base.appstore.jdo.QOpenAppsResource;
import com.cynovan.janus.base.gridfs.service.FileStorageService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Maps;
import com.google.common.collect.Table;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.UnsupportedEncodingException;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class OpenAppDataService implements ApplicationRunner {

    @Autowired
    private FileStorageService fileStorageService;

    private Map<String, Document> appJsonMap = Maps.newHashMap();

    private Table<String, Integer, Document> openAppMenuTable = HashBasedTable.create();

    @Override
    public void run(ApplicationArguments args) throws Exception {
        init();
    }

    private void init() {
        List<Document> installedList =
                DBUtils.list(QOpenApps.collectionName, Filters.eq("installed", true), Projections.include("appId"));
        installedList.stream().forEach(item -> {
            String appId = DocumentLib.getString(item, "appId");
            register(appId);
        });
    }

    public void unRegister(String appId) {
        removeByRowKey(openAppMenuTable, appId);
    }

    public void register(String appId) {
        Document app = DBUtils.find(QOpenApps.collectionName, Filters.eq("appId", appId), Projections.include("appJson"));
        Document appJson = DocumentLib.getDocument(app, "appJson");
        appJsonMap.put(appId, appJson);
        /*get the menu list */
        List<Document> menuList = DocumentLib.getList(appJson, "menus");
        if (CollectionUtils.isNotEmpty(menuList)) {
            menuList.stream().forEach(menu -> {
                int menuIndex = DocumentLib.getInt(menu, "menuIndex");
                openAppMenuTable.put(appId, menuIndex, menu);
            });
        }
    }

    public Document getMenuByIndex(String appId, int menuIndex) {
        return openAppMenuTable.get(appId, menuIndex);
    }

    public String getMenuPageHtml(String appId, int menuIndex) {
        Document menu = getMenuByIndex(appId, menuIndex);
        String page = DocumentLib.getString(menu, "page");
        return getPageHtml(appId, page);
    }

    public String getPageHtml(String appId, String page) {
        Document appResource = DBUtils.find(QOpenAppsResource.collectionName, Filters.and(Filters.eq("appId", appId), Filters.eq("path", page)), Projections.include("fileId"));
        String fileId = DocumentLib.getString(appResource, "fileId");
        GridFSFile gridFSFile = fileStorageService.fetchFile(fileId);
        byte[] bytes = fileStorageService.getGridFsByteArray(gridFSFile);
        try {
            return new String(bytes, StringLib.UTF_8);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return null;
        }
    }

    private void removeByRowKey(Table table, String rowKey) {
        Set colKeySet = table.columnKeySet();
        if (!colKeySet.isEmpty()) {
            Object[] a = colKeySet.toArray();
            for (int i = 0, len = a.length; i < len; i++) {
                table.remove(rowKey, a[i]);
            }
        }
    }
}
