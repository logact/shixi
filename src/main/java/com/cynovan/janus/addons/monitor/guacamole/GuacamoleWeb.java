package com.cynovan.janus.addons.monitor.guacamole;

import com.google.common.collect.Maps;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Map;

/**
 * Created by ian on 3/2/16.
 */
@Controller
@RequestMapping(value = "/guacamole")
public class GuacamoleWeb {

    @Value("${version}")
    private String version;

    @Value("${debug}")
    private Boolean debug;

    private Map<String, Object> pageAttributes(HttpServletRequest request) {
        Map<String, Object> attributes = Maps.newHashMap();
        attributes.put("r_path", request.getContextPath() + "/resource/");
        attributes.put("version", version);
        attributes.put("debug", debug);
        attributes.put("c_path", request.getContextPath());
        return attributes;
    }

    @RequestMapping(value = "")
    public String connect(HttpServletRequest request, HttpServletResponse response, Model model) {
        model.addAllAttributes(pageAttributes(request));
        response.addHeader("X-Frame-Options", "SAMEORIGIN");
        return "monitor/guacamole/guacamole";
    }
}
