package com.cynovan.janus.base.config.auth.handler;

import com.cynovan.janus.base.config.filter.CorsResponseInterceptor;
import com.cynovan.janus.base.user.jdo.UserToken;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.JwtTokenUtils;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Created by Eric on 2017/1/13.
 */
public class CustomLoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    protected final Log logger = LogFactory.getLog(this.getClass());

    public CustomLoginSuccessHandler() {
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        try {
            CorsResponseInterceptor.addCorsResponse(response);
            UserToken userToken = (UserToken) authentication.getPrincipal();
            ObjectNode obj = JsonLib.createObjNode();
            obj.put("success", true);
            JwtTokenUtils.createTokenCookie(response, userToken);
            response.getWriter().print(obj.toString());
            response.getWriter().flush();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}


