package com.cynovan.janus.addons.index.controller;

import com.cynovan.janus.addons.index.service.MenuService;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.config.bean.InitializeData;
import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.utils.HttpLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.UserUtils;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Multimap;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Enumeration;
import java.util.List;

@Controller
public class IndexWeb extends BaseWeb {

    @Value("${version}")
    private String version;

    @Value("${debug}")
    private Boolean debug;

    @Autowired
    private MenuService menuService;

    @Autowired
    private I18nService i18nService;

    @ResponseBody
    @RequestMapping(value = "index/headerMenu")
    public String headerMenu() {
        List<Document> rightHeaderMenuList = menuService.loadUserRightHeaderMenu();
        return JsonLib.toJSON(rightHeaderMenuList).toString();
    }

    @ResponseBody
    @RequestMapping(value = "index/loadFinallyMenu")
    public String loadFinallyMenu() {
        List<Document> finallyMenuList = menuService.loadFinallyMenu();
        return JsonLib.toJSON(finallyMenuList).toString();
    }


    @ResponseBody
    @RequestMapping(value = "index/subMenu")
    public String subMenu() {
        Multimap<String, Document> multimap = menuService.loadSonMenuMap();
        return JsonLib.toJSON(multimap.asMap()).toString();
    }

    @ResponseBody
    @RequestMapping(value = "index/loadAppTopMenu")
    public String menu(@RequestParam String appId) {
        Document menuObject = InitializeData.getAppTopMenu(appId);
        return menuObject.toJson();
    }


    @RequestMapping(value = "")
    public String index(HttpServletRequest request, Model model, HttpServletResponse response) {
        /*Check User is Logined*/
        Document userInfo = UserUtils.getUser();
        if (userInfo == null) {
            return "redirect:/welcome";
        } else {
            model.addAllAttributes(HttpLib.pageAttributes(request));
     
//            Enumeration<String> s = request.getAttributeNames();
//
            System.out.println("====================================================================");
            System.out.println(HttpLib.pageAttributes(request));
            System.out.println(HttpLib.pageAttributes(request));
            System.out.println(HttpLib.pageAttributes(request));
            System.out.println(HttpLib.pageAttributes(request));
//            while (s.hasMoreElements()) {
//                System.out.println(s.nextElement());
//            }
            System.out.println("====================================================================");
            return "index/index";
        }
    }

    @RequestMapping(value = "index/api")
    public String api(HttpServletRequest request, Model model) {
        Document userInfo = UserUtils.getUser();
        if (userInfo == null) {
            return "redirect:/welcome";
        } else {
            model.addAllAttributes(HttpLib.pageAttributes(request));
            return "api/api";
        }
    }

    @ResponseBody
    @GetMapping(value = "session")
    public String session() {
        ObjectNode dataNode = JsonLib.createObjNode();
        /*权限可能经常改动，需要时刻生效，reload=true*/
        Document userInfo = UserUtils.getUser(true);
        dataNode.set("user", JsonLib.toJSON(userInfo));
        dataNode.set("janus", JsonLib.toJSON(QJanus.get()));
//        i18nService.getLangI18n(appId);

        return dataNode.toString();
    }
}
