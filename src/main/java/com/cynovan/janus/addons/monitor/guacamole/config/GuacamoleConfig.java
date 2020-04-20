package com.cynovan.janus.addons.monitor.guacamole.config;

import com.cynovan.janus.base.utils.ClassLib;
import com.cynovan.janus.base.utils.StringLib;

import java.lang.reflect.Field;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Created by ian on 4/5/16.
 */
public abstract class GuacamoleConfig {

    private final Map<String, String> parameters = new HashMap();

    public String getParameter(String name) {
        return (String)this.parameters.get(name);
    }

    public void setParameter(String name, Object value) {
        String val = StringLib.toString(value);
        if (StringLib.isNotEmpty(val)) {
            this.parameters.put(name, val);
        }
    }

    public void unsetParameter(String name) {
        this.parameters.remove(name);
    }

    public Set<String> getParameterNames() {
        return Collections.unmodifiableSet(this.parameters.keySet());
    }

    public Map<String, String> getParameters() {
        return parameters;
    }

    public void addParameters(GuacamoleConfig config) {
        if (config != null) {
            config.buildParameters();
            this.parameters.putAll(config.getParameters());
        }
    }

    public void setParameters(Map<String, String> parameters) {
        this.parameters.clear();
        this.parameters.putAll(parameters);
    }

    public void buildParameters() {
        for(Field field : getClass().getDeclaredFields()) {
            String fieldName = StringLib.replace(field.getName(), "_", "-");
            setParameter(fieldName, ClassLib.getFieldValue(this, field.getName()));
        }
    }
}
