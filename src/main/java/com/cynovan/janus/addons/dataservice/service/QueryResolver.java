package com.cynovan.janus.addons.dataservice.service;

import com.cynovan.janus.addons.dataservice.dto.QueryParameter;
import com.cynovan.janus.addons.dataservice.dto.TableColumn;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.BasicQuery;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.MongoRegexCreator;
import org.springframework.data.mongodb.core.query.MongoRegexCreator.MatchMode;
import org.springframework.data.mongodb.core.query.Query;

import java.util.List;

/**
 * Created by Aric on 2016/11/15.
 */
public class QueryResolver {

    protected Query mongoDBQuery;
    private QueryParameter queryParameter;

    public QueryResolver(QueryParameter _queryParameter) {
        this.queryParameter = _queryParameter;
    }

    public Query getQuery() {
        initialize();
        return mongoDBQuery;
    }

    private void initialize() {
        if (StringLib.isNotEmpty(queryParameter.getQuery())) {
            mongoDBQuery = new BasicQuery(queryParameter.getQuery());
        } else {
            mongoDBQuery = new Query();
        }
        selectQuery();
        whereQuery();
        sortQuery();
        limitQuery();
    }

    private void selectQuery() {
        if (CollectionUtils.isNotEmpty(queryParameter.getInclude())) {
            queryParameter.getInclude().stream().forEach(c -> {
                mongoDBQuery.fields().include(c);
            });
        }
    }

    private String toLikeRegex(String source) {
        return MongoRegexCreator.INSTANCE.toRegularExpression(source, MatchMode.LIKE);
    }

    private void whereQuery() {
        if (StringLib.isNotEmpty(queryParameter.getKeyword())) {
            String regex = toLikeRegex(queryParameter.getKeyword());
            List<Criteria> criteriaList = Lists.newArrayList();
            for (int i = 0; i < queryParameter.getColumns().size(); i++) {
                TableColumn column = queryParameter.getColumns().get(i);
                if (column.isQuery() && column.isSearch()) {
                    Criteria c = Criteria.where(column.getData()).regex(regex, "i");
                    criteriaList.add(c);
                }
            }
            if (criteriaList.size() > 0) {
                Criteria criteria = new Criteria().orOperator(criteriaList.toArray(new Criteria[criteriaList.size()]));
                mongoDBQuery.addCriteria(criteria);
            }
        }
    }

    private void sortQuery() {
        List<Sort.Order> orderList = Lists.newArrayList();
        if (StringLib.isNotEmpty(queryParameter.getOrder())) {
            if (queryParameter.isAsc()) {
                orderList.add(Sort.Order.asc(queryParameter.getOrder()));
            } else {
                orderList.add(Sort.Order.desc(queryParameter.getOrder()));
            }
        } else {
            orderList.add(Sort.Order.desc("_id"));
        }
        mongoDBQuery = mongoDBQuery.with(Sort.by(orderList));
    }

    private void limitQuery() {
        mongoDBQuery = mongoDBQuery.limit(queryParameter.getLength());
        int startRow = queryParameter.getLength() * queryParameter.getStart();
        if (startRow > 0) {
            mongoDBQuery = mongoDBQuery.skip(startRow);
        }
    }
}
