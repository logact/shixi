package com.cynovan.janus.addons.bi.service;

import com.cynovan.janus.addons.bi.task.AggregatorTask;
import com.cynovan.janus.base.config.bean.SpringContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

/**
 * @author ian.lan@cynovan.com
 */
@Service
public class AggregatorService {

    @Qualifier("aggreagatorThreadPool")
    @Autowired
    ThreadPoolTaskExecutor executor;

    @Qualifier(value = "aggreagatorThreadPool")
    public void doAggregate(String viewId, String config) {

        if (config != null) {
            AggregatorTask task = new AggregatorTask(viewId, config);
            executor.execute(task);
        }
    }

}
