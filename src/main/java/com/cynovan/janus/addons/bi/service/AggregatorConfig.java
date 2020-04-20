package com.cynovan.janus.addons.bi.service;

import com.cynovan.janus.addons.bi.pojo.AxisItem;
import com.cynovan.janus.addons.bi.pojo.ChartSetting;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.joda.time.LocalDateTime;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * @author ian.lan@cynovan.com
 */
public class AggregatorConfig {

    private static final String COLLECTION_NAME = "deviceData";
    private static final String TIME_FIELD = "time";
    private static final String UUID_FIELD = "uuid";
    private static final String DATA_ROOT_FIELD = "data";
    private static final String TIME_GROUP_FIELD = "time_group";
    private static final String ID_FIELD = "_id";

    private static final String TO_DOUBLE_PREFIX = "{$toDouble:'$";
    private static final String TO_DOUBLE_SUFFIX = "'}";


    private ChartSetting setting;
    private String dateFormat;
    private Fields xFields = null;
    private Fields yFields = null;
    private AggregationOptions aggregationOptions;
    private List<AggregationOperation> aggregationOperationList = Lists.newArrayList();

    private Aggregation aggregation;

    public AggregatorConfig(String configStr) {
        this.setting = JsonLib.parseJSON(configStr, ChartSetting.class);
        this.aggregationOptions = new AggregationOptions.Builder().allowDiskUse(true).build();
        init();
    }

    /**
     * aggregator: project, match, group
     * <p>
     * project -> filtering fields, improve performance ( x and y axis, plus uuid and time)
     * match -> filtering data, mostly by time
     * group -> actual result wanted ( group by x axis, operate on y axis)
     */
    private void init() {

        xFields = getXFields(setting.getxAxisItems());
        yFields = getYFields(setting.getyAxisItems());

        buildMatch();
        buildProjection();
        buildGroup();
        buildSort();
        buildAggregation();
    }

    private Fields getXFields(List<AxisItem> axisItems) {
        Fields fs = null;
        if (axisItems == null) {
            return null;
        }
        for (AxisItem axisItem : axisItems) {
            String fieldName = extractFieldName(axisItem);
            if (StringLib.equals(fieldName, TIME_FIELD)) {
                dateFormat = axisItem.getTimeFormat();
            }
            if (StringLib.isNotEmpty(fieldName)) {
                fs = addFields(fs, fieldName);
            }
        }
        return fs;
    }

    private Fields getYFields(List<AxisItem> axisItems) {
        Fields fs = null;
        if (axisItems == null) {
            return null;
        }
        for (AxisItem axisItem : axisItems) {
            String fieldName = extractFieldName(axisItem);
            if (StringLib.isNotEmpty(fieldName)) {
                fs = addFields(fs, fieldName);
            }
        }
        return fs;
    }

    private Fields addFields(Fields fs, String fieldName) {
        Field f = Fields.field(fieldName);
        if (fs == null) {
            fs = Fields.from(f);
        } else {
            fs = fs.and(f);
        }
        return fs;
    }

    private String extractFieldName(AxisItem item) {
        String id = item.getId();
        if (StringLib.equals(id, TIME_FIELD)) {
            return TIME_FIELD;
        }
        if (StringLib.isEmpty(id)) {
            return null;
        }
        return StringLib.join(DATA_ROOT_FIELD, ".", id);
    }

    /**
     * x and y axis fields
     */
    private void buildProjection() {

        // project uuid , time and data
        ProjectionOperation projectionOperation = Aggregation.project(UUID_FIELD, TIME_FIELD);

        // xfields
        if (xFields != null) {
            projectionOperation = projectionOperation.andInclude(xFields);
        }

        // yFields should do $toDouble
        if (yFields != null) {
            for (Field f : yFields) {
                // change { f: 'data.f' } to { f: {$toDouble: 'data.f'} }
                String expression = TO_DOUBLE_PREFIX + f.getTarget() + TO_DOUBLE_SUFFIX;
                projectionOperation = projectionOperation.andExpression(expression).as(f.getName());
            }
        }

        if (dateFormat != null) {
            projectionOperation = projectionOperation.and(DateOperators.dateOf(TIME_FIELD).toString(dateFormat).withTimezone(DateOperators.Timezone.valueOf("Asia/Shanghai"))).as(TIME_GROUP_FIELD);
        }

        addAggregationOperation(projectionOperation);
    }

    /**
     * time range
     */
    private void buildMatch() {
        Criteria criteria = new Criteria(UUID_FIELD).is(setting.getUuid());

        LocalDateTime start = LocalDateTime.now().withTime(0, 0, 0, 0);
        LocalDateTime end = null;

        Integer diffDay = 0;
        switch (setting.getDateType()) {
            case RANGES:
                // d100
                String startDate = setting.getStart();
                String endDate = setting.getEnd();
                if (StringLib.isNotEmpty(startDate)) {
                    LocalDateTime s = LocalDateTime.parse(startDate);
                    if (s != null) {
                        start = s.withTime(0, 0, 0, 0);
                    }
                }
                if (StringLib.isNotEmpty(endDate)) {
                    LocalDateTime e = LocalDateTime.parse(endDate);
                    if (e != null) {
                        end = e.withTime(0, 0, 0, 0);
                    }
                }
                break;
            default:
                diffDay = setting.getDateType().getDays();
                break;
        }

        if (diffDay > 0) {
            start = start.minusDays(diffDay);
        }
        criteria = criteria.and(TIME_FIELD).gte(start.toDate());
        if (end != null) {
            criteria = criteria.lt(end.plusDays(1).toDate());
        }

        MatchOperation matchOperation = Aggregation.match(criteria);
        addAggregationOperation(matchOperation);
    }


    /**
     * group by x axis , operate on y axis
     */
    private void buildGroup() {
        if (xFields != null) {
            GroupOperation groupOperation = null;
            if (StringLib.isNotEmpty(dateFormat)) {
                // group by time
                groupOperation = Aggregation.group(TIME_GROUP_FIELD);
            } else {
                // group by xFields
                for (Field x :xFields){
                    groupOperation = Aggregation.group(x.getName());
                }
            }

            for (AxisItem y : setting.getyAxisItems()) {
                groupOperation = handleGroupOperation(groupOperation, y);
            }
            addAggregationOperation(groupOperation);
        }
    }


    private GroupOperation handleGroupOperation(GroupOperation operation, AxisItem y) {
        switch (y.getStatis()) {
            case COUNT:
                operation = operation.count().as(y.getId());
                break;
            case SUM:
                operation = operation.sum(y.getId()).as(y.getId());
                break;
            case AVG:
                operation = operation.avg(y.getId()).as(y.getId());
                break;
            case MIN:
                operation = operation.min(y.getId()).as(y.getId());
                break;
            case MAX:
                operation = operation.max(y.getId()).as(y.getId());
                break;
            default:
                break;
        }
        return operation;
    }

    private void buildSort() {
        SortOperation sortOperation = Aggregation.sort(Sort.Direction.ASC, ID_FIELD);
        addAggregationOperation(sortOperation);
    }

    private void buildAggregation() {
        this.aggregation = Aggregation.newAggregation(aggregationOperationList).withOptions(aggregationOptions);
    }

    private void addAggregationOperation(AggregationOperation operation) {
        this.aggregationOperationList.add(operation);
    }

    /**
     * do aggregation, return result;
     */
    public JsonNode doAggregate() {
        MongoTemplate mongoTemplate = SpringContext.getBean(MongoTemplate.class);
        System.out.println(aggregation.toDocument(COLLECTION_NAME, Aggregation.DEFAULT_CONTEXT).toJson());
        AggregationResults<Document> results = mongoTemplate.aggregate(aggregation, COLLECTION_NAME, Document.class);

        List<Document> result = results.getMappedResults();
        if (CollectionUtils.isNotEmpty(result)) {
            List<String> colList = yFields.asList().stream().map(Field::getName).collect(Collectors.toList());
            colList.add(0, "_id");

            int colSize = colList.size();
            int rowSize = result.size();

            Object[][] transferDatas = new Object[colSize][rowSize];

            IntStream.range(0, rowSize).forEach(rowIndex -> {
                Document row = result.get(rowIndex);
                IntStream.range(0, colSize).forEach(colIndex -> {
                    transferDatas[colIndex][rowIndex] = DocumentLib.getString(row, colList.get(colIndex));
                });
            });

            return JsonLib.toJSON(transferDatas);
        }

        return null;
    }

    public ObjectNode getColumns() {
        ObjectNode columns = JsonLib.createObjNode();
        ArrayNode xfields = JsonLib.createArrNode();
        for (Field field : xFields.asList()) {
            ObjectNode fieldNode = JsonLib.createObjNode();
            fieldNode.put("name", field.getName());
            xfields.add(fieldNode);
        }
        columns.set("xFields", xfields);
        return columns;
    }
}

