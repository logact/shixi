package com.cynovan.janus.base.config.auth.handler;

import com.cynovan.janus.base.config.filter.CorsResponseInterceptor;
import com.cynovan.janus.base.utils.JsonLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Created by Eric on 2017/1/13.
 */
public class CustomLoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {
    protected final Log logger = LogFactory.getLog(this.getClass());
    private String defaultFailureUrl;
    private boolean forwardToDestination = false;
    private boolean allowSessionCreation = true;
    private RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();

    public CustomLoginFailureHandler() {
    }

    public CustomLoginFailureHandler(String defaultFailureUrl) {
        this.setDefaultFailureUrl("/login");
    }

    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        CorsResponseInterceptor.addCorsResponse(response);
        request.getSession().setAttribute("SPRING_SECURITY_LAST_EXCEPTION", exception);
        if (this.forwardToDestination) {
            this.logger.debug("Forwarding to " + "/login");
            request.getRequestDispatcher("/login").forward(request, response);
        } else {
            try {
                ObjectNode ret = JsonLib.createObjNode();
                ret.put("success", false);
                if (exception instanceof UsernameNotFoundException) {
                    ret.put("exception", "username");
                } else {
                    ret.put("exception", "password");
                }
                response.getWriter().print(ret.toString());
                response.getWriter().flush();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public void setDefaultFailureUrl(String defaultFailureUrl) {
        this.defaultFailureUrl = "/login";
    }

    protected boolean isUseForward() {
        return this.forwardToDestination;
    }

    public void setUseForward(boolean forwardToDestination) {
        this.forwardToDestination = forwardToDestination;
    }

    public void setRedirectStrategy(RedirectStrategy redirectStrategy) {
        this.redirectStrategy = redirectStrategy;
    }

    protected RedirectStrategy getRedirectStrategy() {
        return this.redirectStrategy;
    }

    protected boolean isAllowSessionCreation() {
        return this.allowSessionCreation;
    }

    public void setAllowSessionCreation(boolean allowSessionCreation) {
        this.allowSessionCreation = allowSessionCreation;
    }
}


