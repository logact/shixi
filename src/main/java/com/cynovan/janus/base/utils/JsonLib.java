package com.cynovan.janus.base.utils;

import com.cynovan.janus.base.utils.bean.*;
import com.cynovan.janus.base.utils.jsonfilter.JsonPropertyFilter1;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonParser.Feature;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.ser.FilterProvider;
import com.fasterxml.jackson.databind.ser.impl.SimpleBeanPropertyFilter;
import com.fasterxml.jackson.databind.ser.impl.SimpleFilterProvider;
import org.apache.commons.lang3.math.NumberUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Map;

public class JsonLib {

    private static final ObjectMapper mapper = getInstance();
    private static final String CALLBACK = "callback";
    private static Logger logger = LoggerFactory.getLogger(JsonLib.class);

    public static String toString(Object object) {
        try {
            return mapper.writeValueAsString(object);
        } catch (IOException e) {
            logger.warn("write to json string error:" + object, e);
            return null;
        }
    }

    public static ObjectMapper getInstance() {
        ObjectMapper filterMapper = new ObjectMapper();
        filterMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        filterMapper.configure(Feature.ALLOW_SINGLE_QUOTES, true);
        filterMapper.configure(Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);
        filterMapper.setSerializationInclusion(Include.NON_NULL);
        filterMapper.configure(SerializationFeature.WRITE_NULL_MAP_VALUES, false);
        filterMapper.configure(Feature.ALLOW_NON_NUMERIC_NUMBERS, true);

        SimpleModule simpleModule = new SimpleModule("SimpleModule");
        simpleModule.addSerializer(new CnvDateSerializer());
        simpleModule.addSerializer(Number.class, new CnvNumberSerializer());
        simpleModule.addSerializer(Boolean.class, new CnvBooleanSerializer());

        simpleModule.addDeserializer(Date.class, new CnvDateDeserializer());
        simpleModule.addDeserializer(Boolean.class, new CnvBooleanDeserializer());
        simpleModule.addDeserializer(Float.class, new CnvNumberDeserializer());
        filterMapper.registerModule(simpleModule);
        return filterMapper;
    }

    public static JsonNode toJSONWithExclude(Object object, Class clazz, String... propertyArray) {
        if (propertyArray == null || propertyArray.length == 0) {
            return JsonLib.createObjNode();
        }
        if (object != null) {
            ObjectMapper filterMapper = getInstance();
            filterMapper.addMixIn(clazz, JsonPropertyFilter1.class);
            FilterProvider filterProvider = new SimpleFilterProvider().addFilter("Filter1",
                    SimpleBeanPropertyFilter.serializeAllExcept(propertyArray));
            filterMapper.setFilterProvider(filterProvider);
            return filterMapper.convertValue(object, JsonNode.class);

        }
        return createObjNode();
    }

    public static JsonNode toJSON(Object object) {
        return mapper.convertValue(object, JsonNode.class);
    }

    public static JsonNode toJSON(Object object, Class clazz, String... propertyArray) {
        if (propertyArray == null || propertyArray.length == 0) {
            return JsonLib.toJSON(object);
        }

        if (object != null) {
            ObjectMapper filterMapper = getInstance();
            filterMapper.addMixIn(clazz, JsonPropertyFilter1.class);
            FilterProvider filterProvider = new SimpleFilterProvider().addFilter("Filter1",
                    SimpleBeanPropertyFilter.filterOutAllExcept(propertyArray));
            filterMapper.setFilterProvider(filterProvider);

            return filterMapper.convertValue(object, JsonNode.class);
        }
        return createObjNode();
    }

    public static JsonNode parseJSON(String str) {
        JsonNode node = null;
        JsonFactory factory = mapper.getFactory();
        try {
            JsonParser jp = factory.createParser(str);
            node = mapper.readTree(jp);
        } catch (Exception e) {
            e.printStackTrace();
            node = mapper.createObjectNode();
        }
        return node;
    }

    public static ObjectNode createObjNode() {
        return mapper.createObjectNode();
    }

    public static ArrayNode createArrNode() {
        return mapper.createArrayNode();
    }

    public static <T> List<T> parseArray(String jsonString, Class<T> clazz) {
        if (StringLib.isEmpty(jsonString)) {
            return null;
        }
        return parseArray(JsonLib.parseJSON(jsonString), clazz);
    }

    public static <T> List<T> parseArray(JsonNode node, Class<T> clazz) {
        if (node == null) {
            return null;
        }
        return mapper.convertValue(node, mapper.getTypeFactory().constructCollectionType(List.class, clazz));
    }

    public static <T> Map<String, T> parseMap(JsonNode node, Class<T> clazz) {
        if (node == null) {
            return null;
        }
        return mapper.convertValue(node, mapper.getTypeFactory().constructMapType(Map.class, String.class, clazz));
    }

    public static <T> T parseJSON(String jsonString, Class<T> clazz) {
        if (org.apache.commons.lang3.StringUtils.isEmpty(jsonString)) {
            return null;
        }
        try {
            return mapper.readValue(jsonString, clazz);
        } catch (IOException e) {
            logger.warn("parse json string error:" + jsonString, e);
            return null;
        }
    }

    public static <T> T parseJSON(JsonNode node, Class<T> clazz) {
        if (node == null) {
            return null;
        }
        return mapper.convertValue(node, clazz);
    }

    public static <T> T parseJSON(String jsonString, TypeReference<T> reference) {
        if (org.apache.commons.lang3.StringUtils.isEmpty(jsonString)) {
            return null;
        }

        try {
            return mapper.readValue(jsonString, reference);
        } catch (IOException e) {
            logger.warn("parse json string error:" + jsonString, e);
            return null;
        }
    }

    public static <T> T parseJSON(JsonNode node, TypeReference<T> reference) {
        if (node == null) {
            return null;
        }
        return mapper.convertValue(node, reference);
    }

    @SuppressWarnings("unchecked")
    public static <T> T parseJSON(String jsonString, JavaType javaType) {
        if (org.apache.commons.lang3.StringUtils.isEmpty(jsonString)) {
            return null;
        }

        try {
            return (T) mapper.readValue(jsonString, javaType);
        } catch (IOException e) {
            logger.warn("parse json string error:" + jsonString, e);
            return null;
        }
    }

    public static Long getLong(JsonNode node, String key) {
        if (!node.has(key)) {
            return 0l;
        }
        JsonNode jNode = node.get(key);
        if (jNode != null && NumberUtils.isNumber(jNode.asText())) {
            return StringLib.toLong(jNode.asText());
        }
        return 0l;
    }

    public static Boolean getBoolean(JsonNode node, String key) {
        if (!node.has(key)) {
            return false;
        }
        JsonNode jNode = node.get(key);
        if ("true".equals(jNode.asText())) {
            return true;
        }
        return false;
    }

    public static Integer getInteger(JsonNode node, String key) {
        if (!node.has(key)) {
            return 0;
        }
        JsonNode jNode = node.get(key);
        if (jNode != null && NumberUtils.isNumber(jNode.asText())) {
            return StringLib.toInteger(jNode.asText());
        }
        return 0;
    }

    public static Double getDouble(JsonNode node, String key) {
        if (!node.has(key)) {
            return 0.0;
        }
        JsonNode jNode = node.get(key);
        if (jNode != null && NumberUtils.isNumber(jNode.asText())) {
            return StringLib.toDouble(jNode.asText());
        }
        return 0.0;
    }

    public static Float getFloat(JsonNode node, String key) {
        if (!node.has(key)) {
            return 0f;
        }
        JsonNode jNode = node.get(key);
        if (jNode != null && NumberUtils.isNumber(jNode.asText())) {
            return StringLib.toFloat(jNode.asText());
        }
        return 0f;
    }

    public static ArrayNode getArrayNode(JsonNode node, String key) {
        if (!node.has(key)) {
            return createArrNode();
        }
        JsonNode jNode = node.get(key);
        if (jNode != null && jNode.isArray()) {
            return (ArrayNode) jNode;
        }
        return createArrNode();
    }

    public static ObjectNode getObjectNode(JsonNode node, String key) {
        if (!node.has(key)) {
            return createObjNode();
        }
        JsonNode jNode = node.get(key);
        if (jNode != null && jNode.isObject()) {
            return (ObjectNode) jNode;
        }
        return createObjNode();
    }

    public static String getString(JsonNode node, String key) {
        if (!node.has(key)) {
            return StringLib.EMPTY;
        }

        JsonNode jNode = node.get(key);
        if (jNode != null) {
            return jNode.asText();
        }
        return StringLib.EMPTY;
    }
}
