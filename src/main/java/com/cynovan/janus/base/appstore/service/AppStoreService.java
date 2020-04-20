package com.cynovan.janus.base.appstore.service;

import com.cynovan.janus.base.config.bean.InitializeData;
import com.cynovan.janus.base.utils.CacheUtils;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AppStoreService {

    private static final String CACHE_KEY = "CACHE_INSTALL_APPS";

    public void installApp(String name) {
        DBUtils.updateOne("appInfo",
                DocumentLib.newDoc(),
                DocumentLib.newDoc("$addToSet", DocumentLib.newDoc("installed", name)),
                true);
        CacheUtils.delete(CACHE_KEY);
        CacheUtils.delete(InitializeData.ALL_MENU_CACHE_KEY);
    }

    public void uninstallApp(String name) {
        DBUtils.updateOne("appInfo", DocumentLib.newDoc(), DocumentLib.newDoc("$pull", DocumentLib.newDoc("installed", name)));
        CacheUtils.delete(CACHE_KEY);
        CacheUtils.delete(InitializeData.ALL_MENU_CACHE_KEY);
    }

    public boolean checkAppInstall(String name) {
        List<String> installApps = JsonLib.parseArray(CacheUtils.get(CACHE_KEY), String.class);
        if (installApps == null) {
            Document document = DBUtils.find("appInfo", null);
            installApps = DocumentLib.getList(document, "installed");
            CacheUtils.set(CACHE_KEY, JsonLib.toString(installApps));
        }
        if (CollectionUtils.isNotEmpty(installApps)) {
            return installApps.contains(name);
        }
        return false;
    }
}
