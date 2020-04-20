package com.cynovan.janus.base.utils;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;

public class RequestLib {
    public static String getCompleteUrl(HttpServletRequest request) {
        return getCompleteUrl(request, null);
    }

    public static String getCompleteUrl(HttpServletRequest request, String... suffix) {
        StringBuilder builder = new StringBuilder();
        builder.append(request.getScheme());
        builder.append("://");
        builder.append(request.getServerName());
        builder.append(":");
        builder.append(request.getServerPort());
        builder.append(request.getContextPath());
        builder.append("/");
        if (suffix != null && suffix.length > 0) {
            Arrays.stream(suffix).forEach(value -> {
                if (StringLib.isNotEmpty(value)) {
                    builder.append(value);
                }
            });
        }
        return builder.toString();
    }
}
