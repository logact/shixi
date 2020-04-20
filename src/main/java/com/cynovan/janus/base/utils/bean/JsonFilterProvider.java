package com.cynovan.janus.base.utils.bean;

import com.cynovan.janus.base.utils.ClassLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ser.impl.SimpleBeanPropertyFilter;
import com.fasterxml.jackson.databind.ser.impl.SimpleFilterProvider;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import org.apache.commons.lang3.ArrayUtils;

import java.util.List;
import java.util.Map;

public class JsonFilterProvider {

    private List<String> keys = Lists.newArrayList();
    private List<Class<?>> clses = Lists.newArrayList();
    private Map<String, List<String>> propertiesMap = Maps.newHashMap();
    private boolean empty = true;
    private boolean exclude = true;

    public JsonFilterProvider(boolean exclude) {
        this.exclude = exclude;
    }

    public static JsonFilterProvider getInstance(boolean exclude) {
        return new JsonFilterProvider(exclude);
    }

    public static JsonFilterProvider getInstance() {
        return new JsonFilterProvider(false);
    }

    public JsonFilterProvider addProvider(String key, String... properties) {
        int index = keys.indexOf(key);
        if (index == -1) {
            try {
                clses.add(ClassLib.getClass(key, false));
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
            keys.add(key);
            List<String> pros = Lists.newArrayList();
            propertiesMap.put(key, pros);
            index = keys.indexOf(key);
        }
        return addProvider(index, properties);
    }

    public boolean isEmpty() {
        return empty;
    }

    public JsonFilterProvider addProvider(int index, String... properties) {
        if (index > keys.size()) {
            return this;
        }
        if (ArrayUtils.isNotEmpty(properties)) {
            String key = keys.get(index);
            List<String> pros = propertiesMap.get(key);
            for (String str : properties) {
                if (StringLib.isNotEmpty(str) && !pros.contains(str)) {
                    pros.add(str);
                    if (empty == true) {
                        empty = false;
                    }
                }
            }
            propertiesMap.put(key, pros);
        }
        return this;
    }

    public Class<?> getKeyClass(int index) {
        if (index > clses.size()) {
            return null;
        }
        return clses.get(index);
    }

    public Class<?> getKeyClass(String key) {
        int index = keys.indexOf(key);
        if (index == -1) {
            return null;
        }
        return clses.get(index);
    }

    public String[] getProperties(int index) {
        if (index > keys.size() || index < 0) {
            return null;
        }
        String key = keys.get(index);
        List<String> sublist = propertiesMap.get(key);
        return sublist.toArray(new String[sublist.size()]);
    }

    public String[] getProperties(String key) {
        return getProperties(keys.indexOf(key));
    }

    public void setJascksonProvider(ObjectMapper mapper) {
        if (empty == true || mapper == null) {
            return;
        }
        SimpleFilterProvider jacksonProvider = new SimpleFilterProvider();
        try {
            for (int index = 0, size = keys.size(); index < size; index++) {
                mapper.addMixIn(clses.get(index),
                        ClassLib.getClass("com.cynovan.janus.base.json.filter.JsonPropertyFilter" + (index + 1), false));
                if (exclude == true) {
                    jacksonProvider.addFilter("Filter" + (index + 1),
                            SimpleBeanPropertyFilter.serializeAllExcept(getProperties(index)));
                } else {
                    jacksonProvider.addFilter("Filter" + (index + 1),
                            SimpleBeanPropertyFilter.filterOutAllExcept(getProperties(index)));
                }
            }
            mapper.setFilterProvider(jacksonProvider);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
}
