package com.cynovan.janus.base.config;

import com.cynovan.janus.base.config.filter.CorsResponseInterceptor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UdfServletConfig extends SpringBootServletInitializer {

    @Bean
    public FilterRegistrationBean crosFilterRegistration() {
        FilterRegistrationBean registration = new FilterRegistrationBean();
        registration.setFilter(new CorsResponseInterceptor());
        registration.addUrlPatterns("/*");
        registration.addInitParameter("async-supported", "true");
        registration.setName("cors");
        registration.setOrder(1);
        return registration;
    }
}
