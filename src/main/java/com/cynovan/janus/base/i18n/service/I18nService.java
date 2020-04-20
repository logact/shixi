package com.cynovan.janus.base.i18n.service;

import com.cynovan.janus.base.i18n.jdo.QI18n;
import com.cynovan.janus.base.user.service.UserSettingService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Lists;
import com.google.common.collect.Table;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class I18nService {

    @Value("${language}")
    private String systemLanguage;

    @Autowired
    private UserSettingService userSettingService;

    public static final String ZH_CN = "zh-cn";
    public static final String EN_US = "en-us";
    public static final String split_chart = "@";

    /*key1 为key， key2为lang@appId拼接，value 为值*/
    private Table<String, String, String> i18nCacheTable = HashBasedTable.create();

    public String getValue(String origin, String key, String appId) {
        loadI18n();
        if (StringLib.isEmpty(appId)) {
            appId = "system";
        }
        String desc = i18nCacheTable.get(key, StringLib.join(getLang(), "@", appId));
        if (StringLib.isEmpty(desc)) {
            desc = i18nCacheTable.get(key, StringLib.join(getLang(), "@system"));
            if (StringLib.isEmpty(desc)) {
                desc = origin;
            }
        }
        return desc;
    }

    public void setLang(String lang) {
        userSettingService.set("systemLanguage", DocumentLib.newDoc("language", lang));
    }

    public Map<String, String> getLangI18n(String appId, String language) {
        loadI18n();
        String lang = getLang();
        if (StringLib.isNotEmpty(language)) {
            lang = language;
        }
        if (StringLib.equals(appId, "triton") || StringLib.equals(appId, "userManagement")) {
            appId = "system";
        }
        Map<String, String> langI18nMap = i18nCacheTable.column(StringLib.join(lang, split_chart, appId));
        langI18nMap.put("lang", lang);//把lang返回给前端，便于处理
        return langI18nMap;
    }

    public String getLang() {
        Document langDoc = userSettingService.get("systemLanguage");
        String lang = DocumentLib.getString(langDoc, "language");
        if (StringLib.isNotEmpty(lang)) {
            return lang;
        }
        return getDefaultLang();
    }

    public String getDefaultLang() {
        if (StringLib.isEmpty(systemLanguage)) {
            systemLanguage = ZH_CN;
        }
        return systemLanguage;
    }

    public List<String> getLanguages() {
        return Lists.newArrayList(ZH_CN, EN_US);
    }

    private void loadI18n() {
        if (i18nCacheTable.isEmpty()) {
            List<Document> list = DBUtils.list(QI18n.collectionName);
            list.stream().forEach(item -> {
                String key = DocumentLib.getString(item, "key");
                String lang = DocumentLib.getString(item, "lang");
                String appId = DocumentLib.getString(item, "appId");
                String value = DocumentLib.getString(item, "desc");
                i18nCacheTable.put(key, StringLib.join(lang, split_chart, appId), value);
            });
        }
    }
}
