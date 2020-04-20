package com.cynovan.janus.base.utils;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.google.common.collect.Lists;
import jdk.nashorn.api.scripting.NashornScriptEngine;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.bson.Document;
import org.springframework.core.env.Environment;

import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/*
By AricChen。封装的高性能JavaScript执行方法
 */
public class JavaScriptUtils {

    /*10 分钟缓存没有访问，自动清空*/
    private static Cache<String, Object> compiledScriptCache = Caffeine.newBuilder()
            .expireAfterAccess(10l, TimeUnit.MINUTES).build();

    private static ScriptEngineManager manager = new ScriptEngineManager();

    public static Boolean runGetBoolean(String code, Map<String, Document> params) {
        Object value = runGetObject(code, params);
        if (value != null) {
            if (value instanceof Boolean) {
                return (Boolean) value;
            } else if (value instanceof String) {
                String strValue = StringLib.toString(value);
                strValue = StringLib.lowerCase(strValue);
                if (StringLib.isEmpty(strValue) || StringLib.equalsAnyIgnoreCase(strValue, "false", "0")) {
                    return false;
                } else {
                    return true;
                }
            }
        }
        return false;
    }

    public static Document runGetDocument(String code, Map<String, Document> params) {
        Document result = new Document();
        Object value = runGetObject(code, params);
        if (value != null) {
            if (value instanceof Document) {
                result = (Document) value;
            } else if (value instanceof Map) {
                result = new Document((Map) value);
            }
        }
        return result;
    }

    /*当做方法运行时，需要自行添加额外的function 定义*/
    public static Object runGetObject(String code, Map<String, Document> params) {
        List<String> paramNameList = Lists.newArrayList(params.keySet());
        Collections.sort(paramNameList);
        /*为了防止方法调用者，即使用code调用run，又调用runAsFunc，造成不必要的Bug，针对code多加几个空格*/
        /*在生成MD5时，需要加入参数列表，以防止由于参数变化引起的问题*/
        String codeMD5 = DigestLib.md5Hex(StringLib.join(" ", code, " ", StringLib.join(paramNameList, " ")));
        NashornScriptEngine nashornScriptEngine = (NashornScriptEngine) compiledScriptCache.getIfPresent(codeMD5);
        String functionName = StringLib.join("func_", codeMD5);
        Object returnValue = null;
        try {
            if (nashornScriptEngine == null) {
                nashornScriptEngine = getScriptEngine();
                /*当做方法运行时，首先会用方法包含代码,用本身的MD5作为方法名*/
                code = StringLib.join("function ", functionName, "(", StringLib.join(paramNameList, ","), "){", code, "}");
                nashornScriptEngine.eval(code);
                compiledScriptCache.put(codeMD5, nashornScriptEngine);
            }
            List<Object> valueList = Lists.newArrayList();
            paramNameList.stream().forEach(paramName -> {
                valueList.add(params.get(paramName));
            });
            returnValue = nashornScriptEngine.invokeFunction(functionName, valueList.toArray());
            if (returnValue != null) {
                if (returnValue instanceof ScriptObjectMirror) {
                    ScriptObjectMirror mirror = (ScriptObjectMirror) returnValue;
                    if (mirror.isArray()) {
                        return JsonLib.toJSON(mirror.to(List.class));
                    } else {
                        return JsonLib.parseJSON(JsonLib.toJSON(mirror), Document.class);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return returnValue;
    }

    private static String loadLodashJs() {
        Environment env = SpringContext.getBean(Environment.class);
        boolean debug = StringLib.equals(StringLib.toString(env.getProperty("debug")), "true");
        StringBuffer loDashPath = new StringBuffer();
        loDashPath.append("com/cynovan/janus/addons/web/lib/lodash/");
        if (debug == false) {
            loDashPath.append("lodash.min.js");
        } else {
            loDashPath.append("lodash.js");
        }
        return FileUtils.getClassPathFileContent(loDashPath.toString());
    }

    private static NashornScriptEngine getScriptEngine() {
        NashornScriptEngine scriptEngine = (NashornScriptEngine) manager.getEngineByName("nashorn");
        String str = loadLodashJs();
        if (StringLib.isNotEmpty(str)) {
            try {
                scriptEngine.eval(str);
            } catch (ScriptException e) {
                e.printStackTrace();
            }
        }
        return scriptEngine;
    }
}
