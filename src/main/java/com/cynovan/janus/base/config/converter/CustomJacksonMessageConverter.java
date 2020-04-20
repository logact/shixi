package com.cynovan.janus.base.config.converter;

import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

public class CustomJacksonMessageConverter extends MappingJackson2HttpMessageConverter {
    public CustomJacksonMessageConverter() {
        super();
    }


}
