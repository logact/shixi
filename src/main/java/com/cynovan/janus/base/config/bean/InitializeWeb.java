package com.cynovan.janus.base.config.bean;

import com.cynovan.janus.base.appstore.jdo.QOpenAppsResource;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * Created by Aric on 2016/11/15.
 */
@Controller
@RequestMapping(value = "initialize")
public class InitializeWeb extends BaseWeb {

    public final static Long expiredDate = System.currentTimeMillis() + (86400000l * 365 * 10);

    public final static Long expireSecond = 315360000l;

    @Value("${debug}")
    private Boolean debug;

    @ResponseBody
    @RequestMapping(value = "template/{template_name}", produces = "text/html;text/plain")
    public String template(@PathVariable("template_name") String name, HttpServletResponse response) {
        if (debug == false) {
            response.setDateHeader("Expires", expiredDate);
            response.setHeader("Cache-Control", "max-age=" + expireSecond);
        }
        response.setHeader("Content-Type", "text/html;");
        response.setCharacterEncoding("utf-8");
        String template = InitializeData.getTemplate(name);
        if (template == null) {
            template = "";
        }
        return template;
    }

//    首页地址真正映射的地方http://localhost:8080/#/app/plant_efficiency/menu/0
    @ResponseBody
    @RequestMapping(value = "appMenuTemplate/{appId}/{menuIdx}")
    public String getAppMenuTemplate(@PathVariable("appId") String appId, @PathVariable("menuIdx") Integer menuIdx, HttpServletResponse response) {
        System.out.println("appId:::"+appId+" menuIdx::::"+menuIdx);
//        这里一定要这样吗？
        response.setHeader("Content-Type", "text/html;");
        response.setCharacterEncoding("utf-8");
        //这里获得了appId:能模块名，menuIdx:
        //根据appId和menuIdx获得menu

        Document menu = InitializeData.getMenu(appId, menuIdx);
        //这里有一个getTemplate方法
        String html = InitializeData.getTemplate(DocumentLib.getString(menu, "template"));
        System.out.println("menu menu getAppMenuTemplate ::::"+menu);
        if (html == null) {
            html = "";
        }

        System.out.println("template template template::::::::::::"+html);
        return html;
    }

    @ResponseBody
    @RequestMapping(value = "appMenuDetailTemplate/{appId}/{menuIdx}")
    public String getAppMenuDetailTemplate(@PathVariable("appId") String appId, @PathVariable("menuIdx") Integer menuIdx, HttpServletResponse response) {
        response.setHeader("Content-Type", "text/html;");
        response.setCharacterEncoding("utf-8");

        Document menu = InitializeData.getMenu(appId, menuIdx);
        String html = InitializeData.getTemplate(DocumentLib.getString(menu, "detail_template"));
        if (html == null) {
            html = "";
        }
        return html;
    }

    @ResponseBody
    @RequestMapping(value = "getMenuIdxByName")
    public String getMenuIdxByName(@RequestParam String appId, @RequestParam String menuName) {
        Document menu = InitializeData.getMenuByName(appId, menuName);
        ObjectNode result = JsonLib.createObjNode();
        result.put("index", DocumentLib.getInt(menu, "menuIndex"));
        return result.toString();
    }

    /**
     * 这里只是返回的是一个关于js 的依赖项的列表
     * 形如：["plant_efficiency/device_timeline/web/js/device_timeline","css!plant_efficiency/alarm_list/web/css/alarm_list","plant_efficiency/device_timeline/web/service/device_timeline_service","css!plant_efficiency/index/web/css/efficiency","plant_efficiency/index/web/js/efficiency",
     * "css!plant_efficiency/device_timeline/web/css/device_timeline","plant_efficiency/alarm_list/web/js/alarm_list"]
     * @param appId
     * @param menuIdx
     * @return
     */
    @ResponseBody

    @RequestMapping(value = "appMenuDepend/{appId}/{menuIdx}")
    public String getAppMenuDepend(@PathVariable("appId") String appId, @PathVariable("menuIdx") Integer menuIdx) {
        Document menu = InitializeData.getMenu(appId, menuIdx);
        List<String> depend = DocumentLib.getList(menu, "depend");
        String s = JsonLib.toJSON(depend).toString();
        System.out.println(" depend depend depend depend dependdepend："+s);
        return s;
    }

    @ResponseBody
    @RequestMapping(value = "openappresource/{fileTreeId}")
    public String appResource(@PathVariable("fileTreeId") String fileTreeId, HttpServletResponse response) {
        response.setCharacterEncoding("utf-8");
        Document fileTreeItem = DBUtils.find(QOpenAppsResource.collectionName,
                Filters.eq("_id", fileTreeId),
                Projections.include("fileType", "code"));
        String fileType = DocumentLib.getString(fileTreeItem, "fileType");
        if (StringLib.equals(fileType, "js")) {
            response.setHeader("Content-Type", "application/javascript;");
        }
        if (StringLib.equals(fileType, "css")) {
            response.setHeader("Content-Type", "text/css;");
        }
        if (StringLib.equals(fileType, "json")) {
            response.setHeader("Content-Type", "application/json;");
        }

        String content = DocumentLib.getString(fileTreeItem, "code");
        if (content == null) {
            content = "";
        }
        return content;
    }

    @ResponseBody
    @RequestMapping(value = "reload/{type}")
    public String reload(@PathVariable("type") String type) {
        InitializeService initializeService = SpringContext.getBean(InitializeService.class);
        initializeService.initializeTemplate();
        CacheUtils.deleteLike("sys_template");
        return "success";
    }
}
