package com.cynovan.janus.base.config.bean;

import com.cynovan.janus.base.appstore.jdo.QOpenApps;
import com.cynovan.janus.base.appstore.jdo.QOpenAppsResource;
import com.cynovan.janus.base.appstore.service.AppDataService;
import com.cynovan.janus.base.config.bean.service.OpenAppJanusService;
import com.cynovan.janus.base.gridfs.service.FileStorageService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.googlecode.htmlcompressor.compressor.HtmlCompressor;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping(value = "openApp")
public class OpenAppJanusController {

    @Autowired
    private OpenAppJanusService openAppJanusService;

    @Autowired
    private AppDataService appDataService;

    @Autowired
    private FileStorageService fileStorageService;

    @ResponseBody
    @RequestMapping(value = "callJanusApi")
    public String callNeptuneApi(String data, HttpServletRequest request) {
        data = StringLib.decodeURI(data);
        ObjectNode node = (ObjectNode) JsonLib.parseJSON(data);
        String appId = JsonLib.getString(node, "appId");
        String api = JsonLib.getString(node, "api");
        String method = JsonLib.getString(node, "method");
        ObjectNode paramsNode = JsonLib.getObjectNode(node, "params");
        Map<String, String> params = Maps.newHashMap();
        if (paramsNode != null && paramsNode.size() > 0) {
            Iterator<String> fields = paramsNode.fieldNames();
            while (fields.hasNext()) {
                String key = fields.next();
                String value = null;
                JsonNode valueNode = paramsNode.get(key);
                if (valueNode instanceof ObjectNode) {
                    value = valueNode.toString();
                } else if (valueNode instanceof ArrayNode) {
                    value = valueNode.toString();
                } else {
                    value = valueNode.asText();
                }
                params.put(key, value);
            }
        }
        JsonNode result = openAppJanusService.callJanusApi(appId, api, method, params, request);
        return result.toString();
    }

    @ResponseBody
    @RequestMapping(value = "file/{appId}")
    public void filePath(@PathVariable("appId") String appId, @RequestParam String f, HttpServletRequest request, HttpServletResponse response) {
        Document fileTree = DBUtils.find(QOpenAppsResource.collectionName,
                Filters.and(Filters.eq("appId", appId), Filters.eq("path", f)), Projections.include("fileId"));

        response.setDateHeader("Expires", InitializeWeb.expiredDate);
        response.addHeader("Cache-Control", "max-age=" + InitializeWeb.expireSecond);

        String fileId = DocumentLib.getString(fileTree, "fileId");
        if (StringLib.isNotEmpty(fileId)) {
            GridFSFile file = fileStorageService.fetchFile(fileId);
            if (file != null) {
                try {
                    fileStorageService.download(file, response);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private HtmlCompressor compressor = new HtmlCompressor();

    @ResponseBody
    @PostMapping(value = "getDialogInfo")
    public String getDialogInfo(@RequestParam String appId, @RequestParam String depend, String page, HttpServletRequest request) {
        depend = StringLib.decodeURI(depend);
        List<Document> appFileTreeList = DBUtils.list(QOpenAppsResource.collectionName,
                Filters.and(Filters.eq("appId", appId), Filters.exists("fileType")),
                Projections.include("path", "_id", "fileType", "name"));
        Map<String, Document> pathToIdMap = Maps.newHashMap();
        appFileTreeList.stream().forEach(item -> {
            pathToIdMap.put(DocumentLib.getString(item, "path"), item);
        });
        List<String> originDependList = JsonLib.parseArray(depend, String.class);
        List<String> dependPathList = Lists.newArrayList();
        if (CollectionUtils.isNotEmpty(originDependList)) {
            String contextPath = request.getContextPath();
            originDependList.stream().forEach(dependItem -> {
                Document file = pathToIdMap.get(dependItem);
                String fileTreeId = DocumentLib.getID(file);
                String fileType = DocumentLib.getString(file, "fileType");
                if (StringLib.isNotEmpty(fileTreeId)) {
                    if (!dependPathList.contains(fileTreeId)) {
                        String url = StringLib.join(contextPath + "/initialize/openappresource/", fileTreeId);
                        url = StringLib.join(url, "?name=", DocumentLib.getString(file, "name"));
                        if (StringLib.equalsIgnoreCase(fileType, "css")) {
                            url = "css!" + url;
                        }
                        dependPathList.add(url);
                    }
                }
            });
        }

        ObjectNode result = JsonLib.createObjNode();
        result.set("depend", JsonLib.toJSON(dependPathList));

        Document query = DocumentLib.newDoc();
        query.put("appId", appId);
        query.put("path", page);
        Document fileDoc = DBUtils.find(QOpenAppsResource.collectionName, Filters.and(Filters.eq("appId", appId),
                Filters.eq("path", page)),
                Projections.include("code"));
        result.put("html", compressor.compress(DocumentLib.getString(fileDoc, "code")));
        return result.toString();
    }

    @ResponseBody
    @RequestMapping(value = "appjson")
    public String getAppJson(@RequestParam String appId) {
        Document myApp = DBUtils.find(QOpenApps.collectionName, Filters.eq("appId", appId), Projections.include("appJson"));
        Document appJson = DocumentLib.getDocument(myApp, "appJson");
        return appJson.toJson();
    }

    @ResponseBody
    @GetMapping(value = "getData")
    public String getData(String key) {
        Document data = appDataService.get(key);
        if (data == null) {
            data = DocumentLib.newDoc();
        }
        return data.toJson();
    }

    @ResponseBody
    @PostMapping(value = "setData")
    public String setdata(@RequestParam String key, @RequestParam String value) {
        Document docData = DocumentLib.newDoc();
        if (StringLib.isNotEmpty(value)) {
            value = StringLib.decodeURI(value);
            docData = DocumentLib.parse(value);
        }
        appDataService.set(key, docData);
        return docData.toJson();
    }

}
