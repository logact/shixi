package com.cynovan.janus.addons.bi.controller;

import com.cynovan.janus.addons.bi.bean.OriginValueChartBean;
import com.cynovan.janus.addons.bi.service.AggregatorService;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.utils.BICacheUtils;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping(value = "bi")
public class BIWeb extends BaseWeb {

    @Autowired
    AggregatorService aggregatorService;

    @ResponseBody
    @GetMapping(value = "data")
    public String loadBIData(@RequestParam String data) {
        CheckMessage checkMessage = CheckMessage.newInstance();
        ObjectNode chartSetting = (ObjectNode) JsonLib.parseJSON(StringLib.decodeURI(data));
        if (chartSetting != null) {
            String uuid = JsonLib.getString(chartSetting, "uuid");
            String chartId = JsonLib.getString(chartSetting, "chartId");
            String cacheDataKey = StringLib.join("historychart_", uuid, "_", chartId);
            String calculatingKey = StringLib.join(cacheDataKey, "_calced");
            if (BICacheUtils.contains(cacheDataKey)) {
                String dataStr = BICacheUtils.getString(cacheDataKey);
                checkMessage.addData("type", "geted");
                checkMessage.addData("data", JsonLib.parseJSON(dataStr));
            } else if (BICacheUtils.contains(calculatingKey)) {
                /*已提交到Spark进行计算, do nothing.*/
                checkMessage.addData("type", "calculating");
            } else {
                /*未提交到Spark 计算*/

                /*暂时不考虑使用原值的情况，后续需要再添加，2020年2月26日11:18:31*/
                /*如果是显示历史数据,则直接加载数据，不用提交到spark中计算*/
                String chartType = JsonLib.getString(chartSetting, "chartType");
                boolean lineOrigin = JsonLib.getBoolean(chartSetting, "useOrigin");
                if (StringLib.equals(chartType, "line-chart1") && lineOrigin) {
                    OriginValueChartBean originValueChartProcessor = new OriginValueChartBean(initChartConfig(chartSetting));
                    Document dataNode = originValueChartProcessor.getData();
                    checkMessage.addData("data", dataNode);
                    checkMessage.addData("type", "geted");
                } else {
                    try {
                        submitToAggregator(cacheDataKey, chartSetting);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    checkMessage.addData("type", "waiting");
                }
            }
            checkMessage.addData("chart_id", cacheDataKey);
        }
        return checkMessage.toString();
    }

    private void submitToAggregator(String cacheKey, ObjectNode chartConfig) {

        String calcCacheKey = StringLib.join(cacheKey, "_calced");
        /*未提交，启动spark运算，并返回等待状态*/
        BICacheUtils.set(calcCacheKey, "1");
        aggregatorService.doAggregate(cacheKey, initChartConfig(chartConfig).toString());
    }

    private ObjectNode initChartConfig(ObjectNode config) {
        ObjectNode newConfig = JsonLib.createObjNode();
        newConfig.put("data_mode", "history");
        newConfig.put("date_type", JsonLib.getString(config, "rangType"));
        newConfig.put("uuid", JsonLib.getString(config, "uuid"));
        newConfig.put("chartId", JsonLib.getString(config, "id"));
        newConfig.put("start", JsonLib.getString(config, "startDate"));
        newConfig.put("end", JsonLib.getString(config, "endDate"));
        newConfig.set("xAxisItems", JsonLib.createArrNode().add(JsonLib.getObjectNode(config, "groups")));
        newConfig.set("yAxisItems", JsonLib.getArrayNode(config, "fields"));

        return newConfig;
    }
}