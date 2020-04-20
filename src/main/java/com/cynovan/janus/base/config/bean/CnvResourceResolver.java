package com.cynovan.janus.base.config.bean;

import com.cynovan.janus.base.utils.StringLib;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

public class CnvResourceResolver extends PathResourceResolver {

    private Boolean isDebug = true;

    public CnvResourceResolver(Boolean _debug) {
        isDebug = _debug;
    }

    @Override
    protected Resource getResource(String resourcePath, Resource location) throws IOException {
        if (isDebug == false) {
            if (StringLib.contains(resourcePath, ".js")) {
                resourcePath = StringLib.replace(resourcePath, ".js", ".min.js");
            } else if (StringLib.contains(resourcePath, ".css")) {
                resourcePath = StringLib.replace(resourcePath, ".css", ".min.css");
            }
        }
        return super.getResource(resourcePath, location);
    }
}
