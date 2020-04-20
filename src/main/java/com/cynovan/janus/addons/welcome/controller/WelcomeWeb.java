package com.cynovan.janus.addons.welcome.controller;

import com.cynovan.janus.base.utils.UserUtils;
import com.google.common.collect.Maps;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Map;

@Controller
@RequestMapping(value = "welcome")
public class WelcomeWeb {

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

    @RequestMapping
    public String loginpage(HttpServletRequest request, Model model, HttpServletResponse response) {
        /*Check User is Logined*/
        Document userInfo = UserUtils.getUser();

        if (userInfo != null) {
            return "redirect:/";
        } else {
            model.addAllAttributes(pageAttributes(request));
//            这里直接不加前缀的视图解析
            return "welcome/welcome";
        }
    }
}
