package com.cynovan.janus.base.config.cache;

import org.ehcache.CacheManager;
import org.ehcache.config.builders.CacheConfigurationBuilder;
import org.ehcache.config.builders.CacheManagerBuilder;
import org.ehcache.config.builders.ExpiryPolicyBuilder;
import org.ehcache.config.builders.ResourcePoolsBuilder;
import org.ehcache.config.units.MemoryUnit;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.net.URISyntaxException;
import java.time.Duration;

/**
 * @author Aric.Chen
 * @date 2020/3/27 15:27
 */
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() throws URISyntaxException {

        CacheManager cacheManager = CacheManagerBuilder.newCacheManagerBuilder()
                /*系统的缓存*/
                .withCache("systemCache",
                        CacheConfigurationBuilder.newCacheConfigurationBuilder(String.class, String.class,
                                ResourcePoolsBuilder.heap(800).disk(5, MemoryUnit.GB))
                                .withExpiry(ExpiryPolicyBuilder.timeToIdleExpiration(Duration.ofMinutes(30))))
                .withCache("biCache",
                        CacheConfigurationBuilder.newCacheConfigurationBuilder(String.class, String.class,
                                ResourcePoolsBuilder.heap(400).disk(1, MemoryUnit.GB))
                                .withExpiry(ExpiryPolicyBuilder.timeToLiveExpiration(Duration.ofHours(2))))
                .with(CacheManagerBuilder.persistence(new File(System.getProperty("java.io.tmpdir"), "ehcache")))
                .build();
        cacheManager.init();

        return cacheManager;
    }
}
