package com.cynovan.janus.addons.userManagement.role.controller;

import com.cynovan.janus.base.appstore.jdo.QOpenApps;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.service.SecurityService;
import com.cynovan.janus.base.device.database.jdo.QAppInfo;
import com.cynovan.janus.base.device.database.jdo.QAppMenu;
import com.cynovan.janus.base.device.database.jdo.QMenu;
import com.cynovan.janus.base.user.jdo.QRole;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.Sorts;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static com.cynovan.janus.base.utils.DateUtils.getDateTime;

@RestController
@RequestMapping(value = "role")
public class RoleWeb {

    @Autowired
    private SecurityService securityService;

    @PostMapping(value = "save")
    public String saveRole(@RequestParam String entity) {
        CheckMessage checkMessage = CheckMessage.newInstance();

        entity = StringLib.decodeURI(entity);
        Document role = Document.parse(entity);
        role.put("time", getDateTime());

        String roleId = DocumentLib.getID(role);
        if (StringLib.isEmpty(roleId)) { // 新增时,检查角色名是否重复
            String roleName = DocumentLib.getString(role, "name");
            Document exitRole = DBUtils.find(QRole.collectionName, DocumentLib.newDoc("name", roleName));
            if (exitRole != null) {
                checkMessage.setSuccess(false);
                checkMessage.addData("reason", "该角色已存在!");
                return checkMessage.toString();
            }
        }

        DBUtils.save(QRole.collectionName, role);
        securityService.recalcSecurity();

        checkMessage.addData("id", DocumentLib.getID(role));
        return checkMessage.toString();
    }

    @PostMapping(value = "delete")
    public String remove(@RequestParam String id) {
        Document role = DBUtils.findByID(QRole.collectionName, id);
        if (role != null) {
            DBUtils.deleteOne(QRole.collectionName, DocumentLib.newDoc("id", id));
            securityService.recalcSecurity();
        }
        return null;
    }

    @PostMapping(value = "menu")
    public Document getFunctionPermissionChoiceMenu(@RequestParam String id) {
        Document result = DocumentLib.newDoc();
        if (!StringLib.equals(id, "add_role")) {
            Document role = DBUtils.findByID(QRole.collectionName, id);
            result.put("role", role);
        }

        ArrayNode menu = JsonLib.createArrNode();

        List<Document> newList = Lists.newArrayList(); // 合并sysMenu & appMenu
        newList.addAll(DBUtils.list(QMenu.collectionName));
        newList.addAll(DBUtils.list(QAppMenu.collectionName, DocumentLib.newDoc("appId", DocumentLib.newDoc("$in", QAppInfo.getInstalledInfo()))));
        //安装的开放平台的app
        List<Document> openAppList = DBUtils.list(QOpenApps.collectionName, Filters.eq("installed", true),
                Projections.include("appId", "appJson"),
                Sorts.descending("installed_date"));
        /*菜单处理*/
        List<Document> openAppSubMenuList = Lists.newArrayList();
        openAppList.stream().forEach(openApp -> {
            Document appJson = DocumentLib.getDocument(openApp, "appJson");
            List<Document> appMenuList = DocumentLib.getList(appJson, "menus");
            appMenuList.stream().forEach(appItem -> {
                boolean showOnTop = DocumentLib.getBoolean(appItem, "showOnTop");
                if (showOnTop) {
                    newList.add(appItem);
                } else {
                    openAppSubMenuList.add(appItem);
                }
            });
        });

        for (int i = 0; i < newList.size(); i++) {
            ObjectNode moduleMenu = JsonLib.createObjNode();
            Document newListItem = newList.get(i);

            boolean showOnTop = DocumentLib.getBoolean(newListItem, "showOnTop");
            String appId = DocumentLib.getString(newListItem, "appId");
            if (StringLib.equals(appId, "appstore")) {
                showOnTop = true;//应用市场需要可以被控制，特殊处理一下
            }
            if (showOnTop) { // showOnTop的则是一个大的模块
                moduleMenu.put("module", DocumentLib.getString(newListItem, "name"));
                moduleMenu.put("i18nKey", DocumentLib.getString(newListItem, "i18nKey"));//对应i18nKey
                boolean fromOpen = DocumentLib.getBoolean(newListItem, "fromOpen");
                List<Document> subList = Lists.newArrayList();// 得到当前模块下的所有子模块数据
                if (fromOpen) {
                    openAppSubMenuList.stream().forEach(openAppSubMenu -> {
                        String openAppId = DocumentLib.getString(openAppSubMenu, "appId");
                        if (StringLib.equals(openAppId, appId)) {
                            subList.add(openAppSubMenu);
                        }
                    });
                } else {
                    subList.addAll(DBUtils.list(QMenu.collectionName, DocumentLib.newDoc("appId", appId)));
                    subList.addAll(DBUtils.list(QAppMenu.collectionName, DocumentLib.newDoc("appId", appId)));
                }

                ArrayNode submoduleList = JsonLib.createArrNode();
                if (subList.size() == 0) {
                    ObjectNode submodule = structureSubmodule(newListItem);
                    submoduleList.add(submodule);
                } else {
                    for (int j = 0; j < subList.size(); j++) {
                        Document subListItem = subList.get(j);
                        ObjectNode submodule = structureSubmodule(subListItem);
                        if (submodule.get("security") != null)
                            submoduleList.add(submodule);
                    }
                }
                /*在有需要进行权限控制的菜单时*/
                if (submoduleList.size() > 0) {
                    moduleMenu.set("submodule", submoduleList);
                    menu.add(moduleMenu);
                }
            }
        }
        result.put("menu", menu);

        return result;
    }

    private ObjectNode structureSubmodule(Document item) {
        ObjectNode submodule = JsonLib.createObjNode();
        submodule.put("name", DocumentLib.getString(item, "name"));
        submodule.put("description", DocumentLib.getString(item, "name"));
        submodule.put("appId", DocumentLib.getString(item, "appId"));
        submodule.put("menuIndex", DocumentLib.getString(item, "menuIndex"));
        submodule.put("i18nKey", DocumentLib.getString(item, "i18nKey"));//对应i18nKey
        List security = DocumentLib.getList(item, "security");
        if (CollectionUtils.isNotEmpty(security)) {
            submodule.set("security", JsonLib.toJSON(security));
        }
        return submodule;
    }
}
