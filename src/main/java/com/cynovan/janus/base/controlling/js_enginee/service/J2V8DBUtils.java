package com.cynovan.janus.base.controlling.js_enginee.service;

import com.cynovan.janus.base.utils.DBUtils;
import com.eclipsesource.v8.V8;
import com.google.common.collect.Sets;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.util.List;
import java.util.Set;

/**
 * @author Aric.Chen
 * @date 2020/4/2 14:47
 */
public class J2V8DBUtils {

    private V8 v8Runtime = null;

    public J2V8DBUtils(V8 _v8Runtime) {
        this.v8Runtime = _v8Runtime;
    }

    /*不能被用户更新的表，系统基础数据表*/
    private static Set<String> notUpdateCollection = Sets.newHashSet(
            "janus", "user", "device", "deviceData", "uuidList", "sys_template",
            "sys_menu", "open_apps", "open_apps_resource", "open_apps_version", "neptune_sync", "messages",
            "jdoList", "janusChangeCheck", "i18n", "fs.files", "fs.chunks", "fileInfo", "device_timeline",
            "deviceView", "deviceClassification", "dataExchange", "controlling", "controllingRuleTriggerFlag",
            "apps", "app_menu", "appInfo", "appData", "appDataConfig", "apiDocument", "apiDocument_en_us", "apiDocument_zh_cn");

    private boolean checkNotUpdateCollection(String collectionName) {
        return notUpdateCollection.contains(collectionName);
    }

    public List<Document> aggregate(String collectionName, List<Document> pipeline) {
        return DBUtils.aggregate(collectionName, pipeline);
    }

    public Document find(String collectionName, Document filter) {
        return DBUtils.find(collectionName, filter);
    }

    public Document find(String collectionName, Bson filter, Bson projection) {
        return DBUtils.find(collectionName, filter, projection);
    }

    public Document find(String collectionName, Bson filter, Bson projection, Bson sort) {
        return DBUtils.find(collectionName, filter, projection, sort);
    }

    public Document find(String collectionName, Bson filter, Bson projection, Bson sort, int skip) {
        return DBUtils.find(collectionName, filter, projection, sort, skip);
    }

    public void insertMany(String collectionName, List<Document> list) {
        DBUtils.insertMany(collectionName, list);
    }

    public void insert(String collectionName, Document document) {
        DBUtils.insert(collectionName, document);
    }

    public void updateMany(String collectionName, Bson filter, Bson update) {
        if (checkNotUpdateCollection(collectionName)) {
            return;
        }
        DBUtils.updateMany(collectionName, filter, update);
    }

    public void updateMany(String collectionName, Bson filter, Bson update, boolean upsert) {
        if (checkNotUpdateCollection(collectionName)) {
            return;
        }
        DBUtils.updateMany(collectionName, filter, update, upsert);
    }

    public void updateOne(String collectionName, Bson filter, Bson update) {
        if (checkNotUpdateCollection(collectionName)) {
            return;
        }
        DBUtils.updateOne(collectionName, filter, update);
    }

    public void updateOne(String collectionName, Bson filter, Bson update, boolean upsert) {
        if (checkNotUpdateCollection(collectionName)) {
            return;
        }
        DBUtils.updateOne(collectionName, filter, update, upsert);
    }

    public void deleteOne(String collectionName, Bson filter) {
        if (checkNotUpdateCollection(collectionName)) {
            return;
        }
        DBUtils.deleteOne(collectionName, filter);
    }

    public void deleteMany(String collectionName, Bson filter) {
        if (checkNotUpdateCollection(collectionName)) {
            return;
        }
        DBUtils.deleteMany(collectionName, filter);
    }

    public List<Document> list(String collectionName) {
        return DBUtils.list(collectionName);
    }

    public List<Document> list(String collectionName, Bson filter) {
        return DBUtils.list(collectionName, filter);
    }

    public List<Document> list(String collectionName, Bson filter, Bson projection) {
        return DBUtils.list(collectionName, filter, projection);
    }

    public List<Document> list(String collectionName, Bson filter, Bson projection, Bson sort) {
        return DBUtils.list(collectionName, filter, projection, sort);
    }

    public List<Document> list(String collectionName, Bson filter, Bson projection, Bson sort, int limit) {
        return DBUtils.list(collectionName, filter, projection, sort, limit);
    }

    public List<Document> list(String collectionName, Bson filter, Bson projection, Bson sort, int limit, int skip) {
        return DBUtils.list(collectionName, filter, projection, sort, limit, skip);
    }

}
