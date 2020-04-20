package com.cynovan.janus.base.utils;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.google.common.collect.Sets;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.ehcache.Cache;
import org.ehcache.CacheManager;

import java.util.Iterator;
import java.util.Set;

/**
 * @author Aric.Chen
 * @date 2020/3/27 14:38
 */
public class CacheUtils {

    public static Cache<String, String> systemCache = null;

    static {
        CacheManager cacheManager = SpringContext.getBean(CacheManager.class);
        systemCache = cacheManager.getCache("systemCache", String.class, String.class);
        systemCache.clear();
    }

    public static String getString(String key) {
        return StringLib.toString(get(key));
    }

    public static Document getDocument(String key) {
        String value = getString(key);
        if (StringLib.isEmpty(value)) {
            return null;
        }
        return DocumentLib.parse(value);
    }

    public static String get(String key) {
        return systemCache.get(key);
    }

    public static Boolean getBoolean(String key) {
        return StringLib.equalsIgnoreCase(get(key), "true");
    }

    public static boolean contains(String key) {
        return systemCache.containsKey(key);
    }

    public static void set(String key, String value) {
        systemCache.put(key, value);
    }

    public static void set(String key, Boolean value) {
        systemCache.put(key, StringLib.toString(value));
    }

    public static void set(String key, Document value) {
        if (value == null) {
            value = new Document();
        }
        systemCache.put(key, value.toJson());
    }

    public static void delete(String key) {
        systemCache.remove(key);
    }

    public static void deleteLike(String prefix) {
        if (StringLib.isNotEmpty(prefix)) {
            Set<String> removeKeys = Sets.newHashSet();

            Iterator iterator = systemCache.iterator();
            while (iterator.hasNext()) {
                Cache.Entry entry = (Cache.Entry) iterator.next();
                String key = StringLib.toString(entry.getKey());
                if (StringLib.containsIgnoreCase(key, prefix)) {
                    removeKeys.add(key);
                }
            }
            if (CollectionUtils.isNotEmpty(removeKeys)) {
                removeKeys.stream().forEach(key -> {
                    delete(key);
                });
            }
        }
    }
}
