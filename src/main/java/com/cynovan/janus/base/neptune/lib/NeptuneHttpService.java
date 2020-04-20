package com.cynovan.janus.base.neptune.lib;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class NeptuneHttpService {

    @Value("${neptune}")
    private String neptune;

    public String getURL(String uri){
        return new StringBuilder().append(neptune).append("/").append(uri).toString();
    }
}
