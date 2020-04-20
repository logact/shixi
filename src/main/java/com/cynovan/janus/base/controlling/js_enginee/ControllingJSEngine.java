package com.cynovan.janus.base.controlling.js_enginee;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.controlling.js_enginee.service.J2V8DBUtils;
import com.cynovan.janus.base.utils.FileUtils;
import com.cynovan.janus.base.utils.StringLib;
import com.eclipsesource.v8.V8;
import com.eclipsesource.v8.V8Object;
import org.springframework.core.env.Environment;

import java.lang.reflect.Method;
import java.util.Arrays;

/**
 * @author Aric.Chen
 * @date 2020/4/2 14:47
 */
public class ControllingJSEngine {

    private V8 v8Runtime = null;

    public ControllingJSEngine() {
        init();
    }

    private void init() {
        createV8Runtime();
    }

    private void createV8Runtime() {
        v8Runtime = V8.createV8Runtime();
        addLodash();
        addEngineFunction();
    }

    private void addEngineFunction() {
        /*访问DB的API*/
        J2V8DBUtils jsEngineDB = new J2V8DBUtils(v8Runtime);
        V8Object v8Engine = new V8Object(v8Runtime);
        v8Runtime.add("DBUtils", v8Engine);
        Method[] methods = jsEngineDB.getClass().getDeclaredMethods();
        Arrays.stream(methods).forEach(method -> {
            String methodName = method.getName();
            v8Engine.registerJavaMethod(jsEngineDB, methodName,
                    methodName, method.getParameterTypes());
        });
    }

    private void addLodash() {
        Environment env = SpringContext.getBean(Environment.class);
        boolean debug = StringLib.equals(StringLib.toString(env.getProperty("debug")), "true");
        StringBuffer loDashPath = new StringBuffer();
        loDashPath.append("com/cynovan/janus/addons/web/lib/lodash/");
        if (debug == false) {
            loDashPath.append("lodash.min.js");
        } else {
            loDashPath.append("lodash.js");
        }
        String lodashSource = FileUtils.getClassPathFileContent(loDashPath.toString());
        v8Runtime.executeScript(lodashSource);
    }
}
