package com.cynovan.janus.base.config.filter;

import com.cynovan.janus.base.utils.StringLib;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class CorsResponseInterceptor extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, FilterChain filterChain) throws ServletException, IOException {
        String url = httpServletRequest.getRequestURI();
        if (StringLib.startsWithAny(url, "/ws", "/websocket")) {
            
        } else {
            addCorsResponse(httpServletResponse);
        }
        filterChain.doFilter(httpServletRequest, httpServletResponse);
    }

    public static void addCorsResponse(HttpServletResponse httpServletResponse) {
        httpServletResponse.addHeader("Access-Control-Allow-Origin", "*");

        httpServletResponse.addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        httpServletResponse.addHeader("Access-Control-Allow-Headers", "*");
        httpServletResponse.addHeader("Access-Control-Max-Age", "3600");
    }
}
