package com.cynovan.janus.addons.dataservice.dto;

import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.collect.Lists;
import org.apache.commons.collections4.CollectionUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;

/**
 * Created by Aric on 2016/11/15.
 */
public class QueryUtils {

    public static QueryParameter buildQueryParameter(HttpServletRequest request) {
        QueryParameter parameter = new QueryParameter();
        parameter.setStart(StringLib.toInteger(request.getParameter("start")));
        parameter.setLength(StringLib.toInteger(request.getParameter("length")));
        parameter.setCollection(StringLib.capitalize(request.getParameter("collection")));
        parameter.setDraw(StringLib.toInteger(request.getParameter("draw")));
        parameter.setOrder(request.getParameter("order"));
        parameter.setAsc(!StringLib.equals(request.getParameter("asc"), "true"));
        String params = request.getParameter("params");
        if (StringLib.isNotEmpty(params)) {
            parameter.setParams(JsonLib.parseJSON(params, HashMap.class));
        }

        String includeStr = request.getParameter("include");
        parameter.setInclude(processStringList(includeStr));

        /*Columns*/
        String columnsStr = request.getParameter("columns");
        if (StringLib.isNotEmpty(columnsStr)) {
            List<TableColumn> columns = JsonLib.parseArray(columnsStr, TableColumn.class);
            parameter.setColumns(columns);
        }

        String filter = request.getParameter("filter");
        if (StringLib.isNotEmpty(filter)) {
            JsonNode filterNode = JsonLib.parseJSON(filter);
            if (filterNode.has("keyword")) {
                String keyword = JsonLib.getString(filterNode, "keyword");
                if (StringLib.isNotEmpty(keyword)) {
                    parameter.setKeyword(keyword);
                }
            }
            if (filterNode.has("query")) {
                JsonNode queryNode = filterNode.get("query");
                if (queryNode.fields().hasNext()) {
                    parameter.setQuery(queryNode.toString());
                }
            }
        }

        /*Process the columns*/
        if (CollectionUtils.isNotEmpty(parameter.getColumns())) {
            parameter.getColumns().stream().filter(column -> {
                return column.isQuery();
            }).forEach(c -> {
                parameter.getInclude().add(c.getData());
            });
        }

        return parameter;
    }

    private static List<String> processStringList(String str) {
        List<String> list = Lists.newArrayList();
        if (StringLib.isNotEmpty(str)) {
            if (StringLib.contains(str, "[")) {
                list = JsonLib.parseArray(str, String.class);
            } else {
                list.add(str);
            }
        }
        return list;
    }
}
