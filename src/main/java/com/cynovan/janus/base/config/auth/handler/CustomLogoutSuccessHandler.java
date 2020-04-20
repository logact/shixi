package com.cynovan.janus.base.config.auth.handler;

import com.cynovan.janus.base.config.filter.CorsResponseInterceptor;
import com.cynovan.janus.base.utils.JwtTokenUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SimpleUrlLogoutSuccessHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class CustomLogoutSuccessHandler extends SimpleUrlLogoutSuccessHandler {

    protected final Log logger = LogFactory.getLog(this.getClass());

    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        CorsResponseInterceptor.addCorsResponse(response);
        JwtTokenUtils.clearTokenCookie(response);
        super.onLogoutSuccess(request, response, authentication);
    }
}
