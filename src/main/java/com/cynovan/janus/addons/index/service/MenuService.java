package com.cynovan.janus.addons.index.service;

import com.cynovan.janus.base.config.bean.InitializeData;
import com.cynovan.janus.base.config.service.SecurityService;
import com.cynovan.janus.base.user.service.UserSettingService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.cynovan.janus.base.utils.UserUtils;
import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Lists;
import com.google.common.collect.Multimap;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MenuService {

    @Autowired
    private SecurityService securityService;

    @Autowired
    private UserSettingService userSettingService;

    public List<Document> loadUserRightHeaderMenu() {
        List<Document> list = InitializeData.loadAllInstalledMenu();

        /*首先过滤所有的HeaderMenu*/
        List<Document> headerList = Lists.newArrayList();
        list.stream().forEach(menu -> {
            boolean showOnTop = DocumentLib.getBoolean(menu, "showOnTop");
            if (showOnTop == true) {
                headerList.add(menu);
            }
        });

        List<Document> rightList = Lists.newArrayList();
        if (UserUtils.isSuperUser() == false) {
            /*过滤Header以及有权限看到的*/
            headerList.stream().forEach(menu -> {
                String appId = DocumentLib.getString(menu, "appId");
                int menuIndex = DocumentLib.getInt(menu, "menuIndex");
                if (checkHasMenuViewRight(appId, menuIndex)) {
                    rightList.add(menu);
                }
            });
        } else {
            rightList.addAll(headerList);
        }
        return rightList;
    }

    /*检查逻辑为: 拥有自身的权限，以及其下属菜单有权限，都返回True*/
    private boolean checkHasMenuViewRight(String appId, Integer menuIndex) {
        Document currentMenu = InitializeData.getMenu(appId, menuIndex);
        boolean showOnTop = DocumentLib.getBoolean(currentMenu, "showOnTop");
        if (showOnTop == false) {
            /*菜单为子节点，则直接判断是否有菜单权限*/
            return securityService.hasRight(appId, menuIndex, "view");
        } else {
            /*菜单为父节点，自身或者其下属节点有权限，即代表有权限*/
            boolean hasRight = securityService.hasRight(appId, menuIndex, "view");
            if (hasRight == true) {
                return true;
            }
            /*检查所有的子节点*/
            Multimap<String, Document> menuMap = loadSonMenuMap();
            List<Document> subMenuList = (List) menuMap.get(appId);
            if (CollectionUtils.isNotEmpty(subMenuList)) {
                for (int i = 0; i < subMenuList.size(); i++) {
                    Document subMenu = subMenuList.get(i);
                    String subMenuKey = DocumentLib.getString(subMenu, "appId");
                    Integer subMenuIndex = DocumentLib.getInt(subMenu, "menuIndex");
                    if (securityService.hasRight(subMenuKey, subMenuIndex, "view")) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public Multimap<String, Document> loadSonMenuMap() {
        // load sub menu list
        List<Document> menuList = InitializeData.loadAllInstalledMenu();
        Multimap<String, Document> menuMap = ArrayListMultimap.create();

        menuList.stream().forEach(item -> {
            boolean showOnTop = DocumentLib.getBoolean(item, "showOnTop");
            if (showOnTop == false) {
                String appId = DocumentLib.getString(item, "appId");
                int menuIndex = DocumentLib.getInt(item, "menuIndex");
                if (securityService.hasRight(appId, menuIndex, "view")) {
                    menuMap.put(appId, item);
                }
            }
        });
        return menuMap;
    }

    public List<Document> loadFinallyMenu() {
        //加载用户设置后的app,组合成最终的headerMenu
        List<Document> rightHeaderMenuList = loadUserRightHeaderMenu();
        List<Document> appNavigateSetting = DocumentLib.getList(userSettingService.get("appNavigateSetting"), "menu");
        List<Document> finallyMenuList = Lists.newArrayList();

        for (int i = 0, le = rightHeaderMenuList.size(); i < le; i++) {
            Document menuDetail = DocumentLib.newDoc();
            Document heardMenu = rightHeaderMenuList.get(i);
            String appId = DocumentLib.getString(heardMenu, "appId");
            String i18nKey = DocumentLib.getString(heardMenu, "i18nKey");
            boolean show = true;
            int sort = i;
            if (!StringLib.equals(appId, "appstore")) {
                for (Document app : appNavigateSetting) {
                    if (StringLib.equals(DocumentLib.getString(app, "appId"), appId)) {
                        sort = DocumentLib.getInt(app, "sort");
                        show = DocumentLib.getBoolean(app, "show");
                    }
                }
                menuDetail.put("appId", appId);
                menuDetail.put("show", show);
                menuDetail.put("sort", sort);
                menuDetail.put("name", DocumentLib.getString(heardMenu, "name"));
                menuDetail.put("hideOnLeft", DocumentLib.getBoolean(heardMenu, "hideOnLeft"));
                if (StringLib.isNotEmpty(i18nKey)) {
                    menuDetail.put("i18nKey", i18nKey);
                }
                finallyMenuList.add(menuDetail);
            }
        }

        return finallyMenuList;
    }
}
