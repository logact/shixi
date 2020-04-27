package com.cynovan.janus.base.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.context.AbstractSecurityWebApplicationInitializer;

/**
 * Created by Aric on 2016/12/12.
 */
@Configuration
public class SpringSecurityInitializer extends AbstractSecurityWebApplicationInitializer {
//    防止用户重复登录
    @Override
    protected boolean enableHttpSessionEventPublisher() {
        return true;
    }
}
