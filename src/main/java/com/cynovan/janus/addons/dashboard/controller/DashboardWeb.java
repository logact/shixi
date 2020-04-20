package com.cynovan.janus.addons.dashboard.controller;


import com.cynovan.janus.base.utils.HttpLib;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;

@Controller
@RequestMapping(value = "dashboard")
public class DashboardWeb {

    @Value("${version}")
    private String version;

    @Value("${debug}")
    private Boolean debug;

    @RequestMapping(value = "")
    public String toPage(HttpServletRequest request, Model model) {
        model.addAllAttributes(HttpLib.pageAttributes(request));
        return "dashboard/dashboard";
    }
}
