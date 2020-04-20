package com.cynovan.janus.base.service.changed;

import com.cynovan.janus.base.service.changed.jdo.QJanusChangeCheck;
import com.cynovan.janus.base.service.executor.ExecutorTaskService;
import com.cynovan.janus.base.utils.CacheUtils;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.mongodb.client.model.Filters;
import org.apache.commons.lang3.tuple.MutablePair;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class JanusChangeCheckService {

    @Autowired
    private ExecutorTaskService executorTaskService;

    public MutablePair<Boolean, Integer> check(String key, boolean value) {
        return check(key, DocumentLib.newDoc("value", value));
    }

    public MutablePair<Boolean, Integer> check(String key, Document value) {
        MutablePair<Boolean, Integer> pair = new MutablePair<>();
        if (value == null) {
            value = DocumentLib.newDoc();
        }
        /*首先从缓存中取得数据*/
        Document cacheDocument = CacheUtils.getDocument(key);
        Document oriObj = null;
        if (cacheDocument != null) {
            /*取得对应的检查数据*/
            oriObj = cacheDocument;
        } else {
            oriObj = DBUtils.find(QJanusChangeCheck.collectionName, DocumentLib.newDoc("key", key));
            /*如果数据库中没有该数据，则新增数据*/
            if (oriObj == null) {
                oriObj = DocumentLib.newDoc();
                oriObj.put("key", key);
                oriObj.put("value", value);
                oriObj.put("times", 1);
                DBUtils.save(QJanusChangeCheck.collectionName, oriObj);
            }
            CacheUtils.set(key, oriObj);
        }

        Document oriValue = DocumentLib.getDocument(oriObj, "value");
        int oriTimes = DocumentLib.getInt(oriObj, "times");
        if (value.equals(oriValue)) {
            /*如果Value相等，则需要更新数据库该数量*/
            /*1分钟防抖动更新数据库，保证性能*/
            oriTimes++;
            debounceUpdate(key, DocumentLib.newDoc("$inc", DocumentLib.newDoc("times", 1)));
            pair.setLeft(false);
            pair.setRight(oriTimes);
        } else {
            /*如果不相等,则更新数据库，附带更新缓存*/
            debounceUpdate(key, DocumentLib.new$Set(DocumentLib.newDoc("value", value).append("times", 1)));
            pair.setLeft(true);
            /*返回上一次的值*/
            pair.setRight(oriTimes);
            oriTimes = 1;
        }
        oriValue.put("times", oriTimes);
        oriValue.put("value", value);
        CacheUtils.set(key, oriValue);
        return pair;
    }

    public Document getValue(String key) {
        Document cacheDocument = CacheUtils.getDocument(key);
        Document oriObj = null;
        if (cacheDocument != null) {
            /*取得对应的检查数据*/
            oriObj = cacheDocument;
        } else {
            oriObj = DBUtils.find(QJanusChangeCheck.collectionName, DocumentLib.newDoc("key", key));
        }
        if (oriObj != null) {
            return DocumentLib.getDocument(oriObj, "value");
        }
        return null;
    }

    private void debounceUpdate(String key, Document update) {
        String taskKey = StringLib.join("JANUS_CHANGE_", key);
        executorTaskService.debounce(taskKey, new Runnable() {
            @Override
            public void run() {
                DBUtils.updateOne(QJanusChangeCheck.collectionName,
                        Filters.eq("key", key),
                        update);
            }
        }, 1L, TimeUnit.MINUTES);
    }
}
