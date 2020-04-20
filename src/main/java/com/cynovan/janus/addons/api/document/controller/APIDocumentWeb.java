package com.cynovan.janus.addons.api.document.controller;

import com.cynovan.janus.base.api.document.jdo.QAPIDocument;
import com.cynovan.janus.base.config.bean.InitializeData;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Maps;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;

/**
 * @author aric.chen@cynovan.com
 */
@Controller
@RequestMapping(value = "api")
public class APIDocumentWeb {

    /**
     * expire after ten years
     */
    private final static Long EXPIRE_DATE = System.currentTimeMillis() + (315360000L * 10);

    /**
     * expire after one year
     */
    private final static Long EXPIRE_SECOND = 315360000L;

    @Value("${version}")
    private String version;

    @Value("${debug}")
    private Boolean debug;

    @Value("${language}")
    private String systemLanguage;

    @RequestMapping(value = "")
    public String api(HttpServletRequest request, Model model) {
        model.addAllAttributes(pageAttributes(request));
        return "api/document/api";
    }

    private Map<String, Object> pageAttributes(HttpServletRequest request) {
        Map<String, Object> attributes = Maps.newHashMap();
        attributes.put("r_path", request.getContextPath() + "/resource/");
        attributes.put("version", version);
        attributes.put("debug", debug);
        attributes.put("c_path", request.getContextPath());
        return attributes;
    }

    @ResponseBody
    @RequestMapping(value = "doc/menu")
    public String menu() {
        List<Document> list = DBUtils.list(QAPIDocument.collectionName,
                DocumentLib.newDoc(),
                DocumentLib.newDoc("html", 0),
                DocumentLib.newDoc("index", 1));
        ObjectNode data = JsonLib.createObjNode();
        data.set("list", JsonLib.toJSON(list));
        return data.toString();
    }

    @ResponseBody
    @RequestMapping(value = "doc/template/{key}", produces = "text/html;text/plain")
    public String template(@PathVariable("key") String key, String language, HttpServletResponse response) {
        if (debug == false) {
            response.setDateHeader("Expires", EXPIRE_DATE);
            response.setHeader("Cache-Control", "max-age=" + EXPIRE_SECOND);
        }
        response.setHeader("Content-Type", "text/html;");
        response.setCharacterEncoding("utf-8");
        if (StringLib.isEmpty(language)) {
            language = systemLanguage;
        }
        language = StringLib.replace(language, "-", "_");
        String template = InitializeData.getApiTemplate(key, language);
        if (template == null) {
            template = "";
        }
        return template;
    }
}
