package com.cynovan.janus.addons.dataservice.service;

import com.cynovan.janus.addons.dataservice.dto.QueryParameter;
import com.cynovan.janus.addons.dataservice.dto.QueryUtils;
import com.cynovan.janus.base.arch.controller.BaseService;
import com.cynovan.janus.base.config.service.SecurityService;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * Created by Aric on 2016/11/15.
 */
@Service
public class QueryService extends BaseService {

    @Autowired
    private SecurityService securityService;

    public JsonNode query(HttpServletRequest request) {
        QueryParameter queryParameter = QueryUtils.buildQueryParameter(request);
        QueryResolver resolver = new QueryResolver(queryParameter);
        Query query = resolver.getQuery();
        String collectionName = queryParameter.getCollection();

        //数据权限部分的处理 数据在后台过滤
        Document queryObject = query.getQueryObject();

        String lowercaseCollName = StringLib.lowerCase(collectionName);
        Document userDataQuery = securityService.getDataRightQuery(lowercaseCollName);
        queryObject.putAll(userDataQuery);

        long count = DBUtils.count(collectionName, queryObject);

        List<Document> dataList = DBUtils.list(collectionName, queryObject,
                query.getFieldsObject(),
                query.getSortObject(),
                queryParameter.getLength(),
                queryParameter.getStart());

        ObjectNode dataNode = JsonLib.createObjNode();
        dataNode.put("recordsTotal", count);
        dataNode.put("recordsFiltered", count);
        dataNode.put("draw", queryParameter.getDraw());
        dataNode.set("data", JsonLib.toJSON(dataList));
        return dataNode;
    }
}
