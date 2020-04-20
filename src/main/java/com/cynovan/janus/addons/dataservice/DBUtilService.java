package com.cynovan.janus.addons.dataservice;

import com.cynovan.janus.addons.dataservice.service.QueryService;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.config.service.SecurityService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;

/**
 * Created by Aric on 2017/4/28.
 */
@RestController
@RequestMapping(value = "dbs")
public class DBUtilService extends BaseWeb {

    @Autowired
    private QueryService queryService;

    @ResponseBody
    @RequestMapping(value = "exec")
    public String exec(@RequestParam String exec, @RequestParam String collection, @RequestParam String params) {
        CheckMessage checkMessage = CheckMessage.newInstance();
        if (StringLib.isNotEmpty(collection)) {
            params = StringLib.decodeURI(params);
            ArrayNode paramNode = (ArrayNode) JsonLib.parseJSON(params);
            exec = StringLib.lowerCase(exec);
            if (paramNode != null && paramNode.size() > 0) {
                Document query = getParam(paramNode, 0);
                if (StringLib.equalsIgnoreCase(exec, "list")) {
                    Document projection = getParam(paramNode, 1);
                    Document sort = getParam(paramNode, 2);
                    int limit = getInt(paramNode, 3);
                    int skip = getInt(paramNode, 4);
                    List<Document> dataList = DBUtils.list(collection, query, projection, sort, limit, skip);
                    checkMessage.addData("result", dataList);
                } else if (StringLib.equals(exec, "find")) {
                    Document projection = getParam(paramNode, 1);
                    Document sort = getParam(paramNode, 2);
                    int skip = getInt(paramNode, 3);
                    Document result = DBUtils.find(collection, query, projection, sort, skip);
                    checkMessage.addData("result", result);
                } else if (StringLib.equals(exec, "update")) {
                    Document update = getParam(paramNode, 1);
                    boolean upsert = getBoolean(paramNode, 2);
                    UpdateResult updateResult = DBUtils.updateOne(collection, query, update, upsert);
                    checkMessage.addData("result", updateResult);
                } else if (StringLib.equalsIgnoreCase(exec, "updatemany")) {
                    Document update = getParam(paramNode, 1);
                    boolean upsert = getBoolean(paramNode, 2);
                    UpdateResult updateResult = DBUtils.updateMany(collection, query, update, upsert);
                    checkMessage.addData("result", updateResult);
                } else if (StringLib.equalsAny(exec, "insert", "save")) {
                    DBUtils.save(collection, query);
                    checkMessage.addData("entity", query);
                } else if (StringLib.equalsAny(exec, "delete", "remove")) {
                    DeleteResult deleteResult = DBUtils.deleteOne(collection, query);
                    checkMessage.addData("result", deleteResult);
                } else if (StringLib.equalsIgnoreCase(exec, "deletemany")) {
                    DeleteResult deleteResult = DBUtils.deleteMany(collection, query);
                    checkMessage.addData("result", deleteResult);
                } else if (StringLib.equals(exec, "count")) {
                    long count = DBUtils.count(collection, query);
                    checkMessage.addData("count", count);
                } else if (StringLib.equalsAny(exec, "aggregate", "aggregator")) {
                    List<Document> pipeline = Lists.newArrayList();
                    paramNode.forEach(item -> {
                        if (item instanceof ObjectNode) {
                            pipeline.add(Document.parse(item.toString()));
                        }
                    });
                    List<Document> list = DBUtils.aggregate(collection, pipeline);
                    checkMessage.addData("result", list);
                }
            }

            Document updateParam = getParam(paramNode, 3);
            if (updateParam != null) {
                /*删除缓存的操作*/
                String deleteCache = DocumentLib.getString(updateParam, "deleteCache");
                if (StringLib.isNotEmpty(deleteCache)) {
                    String split = ",";
                    if (StringLib.contains(deleteCache, ";")) {
                        split = ";";
                    }
                    String[] keys = deleteCache.split(split);
                    Arrays.stream(keys).forEach(cacheKey -> {
                        if (StringLib.isNotEmpty(cacheKey)) {
                            if (StringLib.contains(cacheKey, "%")) {
                                cacheKey = StringLib.replace(cacheKey, "%", "");
                                CacheUtils.deleteLike(cacheKey);
                            } else {
                                CacheUtils.delete(cacheKey);
                            }
                        }
                    });
                }
            }
        }
        return checkMessage.toString();
    }

    private Document getParam(ArrayNode paramNode, int index) {
        if (index >= paramNode.size()) {
            return null;
        }
        JsonNode item = paramNode.get(index);
        if (item instanceof ObjectNode) {
            return Document.parse(item.toString());
        }
        return null;
    }

    private int getInt(ArrayNode paramNode, int index) {
        if (index >= paramNode.size()) {
            return 0;
        }
        JsonNode item = paramNode.get(index);
        return StringLib.toInteger(item.asText());
    }

    private boolean getBoolean(ArrayNode paramNode, int index) {
        if (index >= paramNode.size()) {
            return false;
        }
        JsonNode item = paramNode.get(index);
        String value = item.asText();
        value = StringLib.lowerCase(value);
        if (StringLib.equalsAny(value, "1", "true")) {
            return true;
        }
        return false;
    }

    @ResponseBody
    @RequestMapping(value = "pagelist")
    public String pagelist(HttpServletRequest request) {
        JsonNode node = queryService.query(request);
        return node.toString();
    }

    @Autowired
    private SecurityService securityService;

    @ResponseBody
    @RequestMapping(value = "kanbanlist")
    public String kanbanlist(HttpServletRequest request) {
        String collectionName = request.getParameter("collection");
        /*mongodb query filter*/
        String queryStr = StringLib.decodeURI(request.getParameter("query"));
        Document query = null;
        if (StringLib.isNotEmpty(queryStr)) {
            query = Document.parse(queryStr);
            if (query == null) {
                query = DocumentLib.newDoc();
            }
            Document dataRightQuery = securityService.getDataRightQuery(collectionName);
            query.putAll(dataRightQuery);
        }

        /*mongodb query projector*/
        Document projector = null;
        String projectorStr = StringLib.decodeURI(request.getParameter("projector"));
        if (StringLib.isNotEmpty(projectorStr)) {
            projector = Document.parse(projectorStr);
        }

        /*mongodb query sort*/
        Document sort = null;
        String sortStr = StringLib.decodeURI(request.getParameter("sort"));
        if (StringLib.isNotEmpty(sortStr)) {
            sort = DocumentLib.parse(sortStr);
        }

        int pageNumber = StringLib.toInteger(request.getParameter("pageNumber"));
        int pageSize = StringLib.toInteger(request.getParameter("pageSize"));
        int skip = (pageNumber - 1) * pageSize;

        ObjectNode dataNode = JsonLib.createObjNode();
        long total = DBUtils.count(collectionName, query);
        dataNode.put("total", total);

        List<Document> list = DBUtils.list(collectionName, query, projector, sort, pageSize, skip);
        dataNode.set("items", JsonLib.toJSON(list));
        dataNode.put("pageSize", pageSize);
        dataNode.put("pageNumber", pageNumber);
        return dataNode.toString();
    }
}
