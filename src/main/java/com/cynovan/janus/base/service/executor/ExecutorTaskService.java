package com.cynovan.janus.base.service.executor;

import com.google.common.collect.Maps;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.*;

@Component
public class ExecutorTaskService {

    private ScheduledExecutorService executor = Executors.newScheduledThreadPool(4);

    private Map<String, Future> futureMap = Maps.newConcurrentMap();

    public void debounce(String key, Runnable runnable, Long delay, TimeUnit timeUnit) {
        Future future = futureMap.get(key);
        if (future != null) {
            if (future.isCancelled() == false) {
                future.cancel(true);
            }
            futureMap.remove(key);
        }
        ScheduledFuture scheduledFuture = executor.schedule(runnable, delay, timeUnit);
        futureMap.put(key, scheduledFuture);
    }
}
