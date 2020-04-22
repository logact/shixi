package com.cynovan.janus.base.config.bean;

import com.cynovan.janus.base.appstore.jdo.QOpenApps;
import com.cynovan.janus.base.device.jdo.QDeviceClassification;
import com.cynovan.janus.base.device.database.jdo.QAppInfo;
import com.cynovan.janus.base.device.database.jdo.QAppMenu;
import com.cynovan.janus.base.device.database.jdo.QMenu;
import com.cynovan.janus.base.device.database.jdo.QTemplate;
import com.cynovan.janus.base.utils.CacheUtils;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Lists;
import com.google.common.collect.Table;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.Sorts;
import org.apache.commons.collections4.MapUtils;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

public class InitializeData {


    public static final String HEADER_MENU_CACHE_KEY = "janus@HeaderMenu";
    public static final String SUB_MENU_CACHE_KEY = "janus@SubMenu";
    public static final String ALL_MENU_CACHE_KEY = "janus@AllMenu";

    public static String getTemplate(String name) {
        //将所有的参数连接起来 这里就是 :sys_template_templateId
        String cacheKey = StringLib.join("sys_template", StringLib.SPLIT_1, name);
        String template = CacheUtils.getString(cacheKey);
        //这里给定一个缓存如果缓存中没有的话就可以实现这样的功能
        if (StringLib.isEmpty(template)) {
            Document object = DBUtils.find(QTemplate.collectionName, DocumentLib.newDoc("name", name));
            if (object != null) {
                template = DocumentLib.getString(object, "template");
                CacheUtils.set(cacheKey, template);
            }
        }
        return template;
    }

    public static void removeAppTemplateCache(String appId) {
        CacheUtils.deleteLike(StringLib.join("sys_template", StringLib.SPLIT_1, appId, StringLib.SPLIT_1));
    }

    /**
     * 获得所有的Document 存放在一个Table中，将所有的一已安装的Menu取出来存放在一个list中然后再遍历这个list将这个变为appId menuIndex 对应的map，这里可以看出来这个appId是这里生成的所以每一次取出这特定的menu
     * 都需要去把所有的取出来
     * 通过hashBased Table 方法创建一个这样的table
     *  String appId = DocumentLib.getString(item, "appId");
     *   int menuIndex = DocumentLib.getInt(item, "menuIndex");
     * @return
     */

    private static Table<String, Integer, Document> loadAllMenu() {
        List<Document> documentList = loadAllInstalledMenu();
        Table<String, Integer, Document> menuTable = HashBasedTable.create();
        documentList.stream().forEach(item -> {

            String appId = DocumentLib.getString(item, "appId");
            int menuIndex = DocumentLib.getInt(item, "menuIndex");
            menuTable.put(appId, menuIndex, item);
        });
        return menuTable;
    }

    public static Document getMenu(String appId, Integer menuIndex) {
//        这是google guava的数据集合，这个table应该是一个三维的表通过前两项来确定一个Document
        Table<String, Integer, Document> menuTable = loadAllMenu();
        return menuTable.get(appId, menuIndex);
    }

    public static Document getMenuByName(String appId, String name) {
        Table<String, Integer, Document> menuTable = loadAllMenu();
        Map<Integer, Document> menuMap = menuTable.row(appId);
        if (MapUtils.isNotEmpty(menuMap)) {
            for (Entry<Integer, Document> entry : menuMap.entrySet()) {
                Document menu = entry.getValue();
                if (StringLib.equalsAnyIgnoreCase(DocumentLib.getString(menu, "name"), name)) {
                    return menu;
                }
            }
        }
        return null;
    }

    public static Document getAppTopMenu(String appId) {
        Table<String, Integer, Document> menuTable = loadAllMenu();
        Map<Integer, Document> appMenuMap = menuTable.row(appId);
        if (appMenuMap != null) {
            for (Document menu : appMenuMap.values()) {
                if (DocumentLib.getBoolean(menu, "showOnTop") == true) {
                    return menu;
                }
            }
        }
        return null;
    }

    /**
     * 加载所有的已安装的Menu\
     * 得到所有的系统Menu :
     *  List<Document> sysList = DBUtils.list(QMenu.collectionName);
     *         menuList.addAll(sysList);
     * @return
     */
    public static List<Document> loadAllInstalledMenu() {
        List<Document> menuList = Lists.newArrayList();

        /*得到所有的系统Menu*/
        List<Document> sysList = DBUtils.list(QMenu.collectionName);
        menuList.addAll(sysList);

        Document query = DocumentLib.newDoc();
        query.append("appId", DocumentLib.newDoc("$in", QAppInfo.getInstalledInfo()));
        List<Document> appList = DBUtils.list(QAppMenu.collectionName, query);
        //open平台上的app
        List<Document> openAppList = DBUtils.list(QOpenApps.collectionName, Filters.eq("installed", true),
                Projections.include("appId", "appJson"),
                Sorts.descending("installed_date"));
        /*进行简单处理*/
        openAppList.stream().forEach(openApp -> {
            String appId = DocumentLib.getString(openApp, "appId");
            Document appJson = DocumentLib.getDocument(openApp, "appJson");

            List<Document> appMenuList = DocumentLib.getList(appJson, "menus");
            appMenuList.stream().forEach(menuItem -> {
                menuItem.put("appId", appId);
                appList.add(menuItem);
            });
        });
        menuList.addAll(appList);
        List<Document> classifyApp=DBUtils.list(QDeviceClassification.collectionName,DocumentLib.newDoc("isapp",true));
        classifyApp.forEach(document -> {
            Document dynamicapp=DocumentLib.newDoc();
            dynamicapp.put("name",DocumentLib.getString(document,"name"));
            dynamicapp.put("showOnTop",true);
            dynamicapp.put("menuIndex",0);
            dynamicapp.put("appId",DocumentLib.getString(document,"code"));
            Document submenu=DocumentLib.newDoc();
            submenu.put("name","设备列表");
            submenu.put("template","device_app_template");
            submenu.put("menuIndex",1);
            submenu.put("appId",DocumentLib.getString(document,"code"));
            List<String> depend=new ArrayList();
            depend.add("classify_app/web/js/classify_app");
            depend.add("css!classify_app/web/css/classify_app");
            submenu.put("depend",depend);
            submenu.put("icon","resource/classify_app/web/img/list.png");
            menuList.add(dynamicapp);
            menuList.add(submenu);
        });
        return menuList;
    }

    public static String getApiTemplate(String key, String language) {
        String cacheKey = StringLib.join("api_template_", language, StringLib.SPLIT_1, key);
        String template = CacheUtils.getString(cacheKey);
        if (StringLib.isEmpty(template)) {
            Document object = DBUtils.find(StringLib.join("apiDocument_", language), DocumentLib.newDoc("key", key));
            if (object != null) {
                template = DocumentLib.getString(object, "html");
                CacheUtils.set(cacheKey, template);
            }
        }
        return template;
    }
}
