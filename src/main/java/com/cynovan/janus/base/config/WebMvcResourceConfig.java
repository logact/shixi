package com.cynovan.janus.base.config;

import com.cynovan.janus.base.config.bean.CnvResourceResolver;
import com.google.common.collect.Lists;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.AppCacheManifestTransformer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.nio.charset.Charset;
import java.util.List;

@Configuration
@EnableWebMvc
public class WebMvcResourceConfig implements WebMvcConfigurer {

    @Value("${debug}")
    private Boolean debug;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        String location = "classpath:/com/cynovan/janus/addons/";
        Integer cachePeriod = debug ? 0 : 315360000;

        AppCacheManifestTransformer appCacheTransformer = new AppCacheManifestTransformer();

        PathResourceResolver pathResolver = new CnvResourceResolver(debug);

        registry.addResourceHandler("/resource/**").addResourceLocations(location).setCachePeriod(cachePeriod)
                .resourceChain(false).addResolver(pathResolver).addTransformer(appCacheTransformer);
    }

    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer.mediaType("json", MediaType.APPLICATION_JSON);
    }

    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        converters.add(responseBodyConverter());
        converters.add(new MappingJackson2HttpMessageConverter());
    }

    @Bean
    public HttpMessageConverter<String> responseBodyConverter() {
        StringHttpMessageConverter converter = new StringHttpMessageConverter();
        List<MediaType> types = Lists.newArrayList();
        types.add(new MediaType("text", "plain", Charset.forName("UTF-8")));
        types.add(new MediaType("text", "html", Charset.forName("UTF-8")));
        types.add(new MediaType("text", "css", Charset.forName("UTF-8")));
        types.add(new MediaType("application", "json", Charset.forName("UTF-8")));
        types.add(new MediaType("application", "javascript", Charset.forName("UTF-8")));
        converter.setDefaultCharset(Charset.forName("utf-8"));
        converter.setSupportedMediaTypes(types);
        return converter;
    }
}
