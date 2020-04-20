package com.cynovan.janus.addons.bi.task;

import com.cynovan.janus.addons.bi.service.AggregatorConfig;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.jms.WebSocketService;
import com.cynovan.janus.base.utils.BICacheUtils;
import com.cynovan.janus.base.utils.CacheUtils;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.jms.core.JmsTemplate;

/**
 * @author ian.lan@cynovan.com
 */
public class AggregatorTask implements Runnable {

    /**
     * 执行时间少于两秒，增加 timeout, 避免 websocket 收不到
     */
    private static final long TIME_OUT = 2000L;

    private WebSocketService webSocketService;
    private String view_id;
    private String config;

    public AggregatorTask(String view_id, String config) {
        this.view_id = view_id;
        this.config = config;
    }

    @Override
    public void run() {
        AggregatorConfig aggregatorConfig = new AggregatorConfig(config);
        long startTime = System.currentTimeMillis();
        JsonNode result = aggregatorConfig.doAggregate();
        this.webSocketService = SpringContext.getBean(WebSocketService.class);
//        if (result != null) {
        boolean lt2s = (System.currentTimeMillis() - startTime) < TIME_OUT;
        // 计算时间小于2秒
        if (lt2s) {
            try {
                Thread.sleep(2000L);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        // aggregate success
        // send mq message to neptune
        ObjectNode dataNode = JsonLib.createObjNode();
        dataNode.put("type", "historydata");
        dataNode.set("data", result);
        dataNode.set("column", aggregatorConfig.getColumns());
        dataNode.put("view_id", view_id);
        webSocketService.pushMessage(StringLib.join("historydata/", view_id), dataNode);
//        }
        BICacheUtils.delete(StringLib.join(view_id, "_calced"));
        if (result != null) {
            BICacheUtils.set(view_id, dataNode.toString());
        }
    }
}
