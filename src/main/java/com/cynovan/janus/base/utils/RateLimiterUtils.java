package com.cynovan.janus.base.utils;

import com.google.common.collect.Maps;
import com.google.common.util.concurrent.RateLimiter;

import java.util.Map;

public class RateLimiterUtils {

    private static Map<String, RateLimiter> rateLimiterMap = Maps.newConcurrentMap();

    //Aric.chen:::::1.0 / permitsPerSecond
    public static final double PER_EVERY_5_MINUTES = 0.00333;
    public static final double PER_EVERY_4_MINUTES = 0.00416;
    public static final double PER_EVERY_3_MINUTES = 0.00555;
    public static final double PER_EVERY_2_MINUTES = 0.00833;
    /*每分钟一个，等同于1 / 60秒*/
    public static final double PER_EVERY_1_MINUTES = 0.01111;

    public static RateLimiter getRateLimiter(String key, double per) {
        if (!rateLimiterMap.containsKey(key)) {
            rateLimiterMap.put(key, RateLimiter.create(per));
        }
        return rateLimiterMap.get(key);
    }

    public static boolean tryAcquire(String key, double per) {
        return getRateLimiter(key, per).tryAcquire();
    }
}
