package com.cynovan.janus.base.config.auth;

import com.cynovan.janus.base.user.jdo.UserToken;
import com.cynovan.janus.base.utils.CookieUtil;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.JwtTokenUtils;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.web.filter.GenericFilterBean;
import org.springframework.web.util.UrlPathHelper;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class AuthenticationFilter extends GenericFilterBean {

    private final static Logger logger = LoggerFactory.getLogger(AuthenticationFilter.class);

    private AuthenticationManager authenticationManager;

    public AuthenticationFilter(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = asHttp(request);
        HttpServletResponse httpResponse = asHttp(response);

        String access_token = CookieUtil.getValue(httpRequest, JwtTokenUtils.ACCESS_TOKEN_KEY);
        String refresh_token = CookieUtil.getValue(httpRequest, JwtTokenUtils.REFRESH_TOKEN_KEY);

        String resourcePath = new UrlPathHelper().getPathWithinApplication(httpRequest);

        if (postToAuthenticate(httpRequest, resourcePath)) {
            String username = httpRequest.getParameter("username");
            String password = httpRequest.getParameter("password");
            processUsernamePasswordAuthentication(httpResponse, username, password);
            return;
        } else if (StringLib.isNotEmpty(access_token) || StringLib.isNotEmpty(refresh_token)) {
            UserToken userToken = new UserToken();
            userToken.setAccess_token(access_token);
            userToken.setRefresh_token(refresh_token);
            processTokenAuthentication(userToken);
        }
        chain.doFilter(request, response);
    }

    private HttpServletRequest asHttp(ServletRequest request) {
        return (HttpServletRequest) request;
    }

    private HttpServletResponse asHttp(ServletResponse response) {
        return (HttpServletResponse) response;
    }

    private boolean postToAuthenticate(HttpServletRequest httpRequest, String resourcePath) {
        return StringLib.indexOf(resourcePath, "/authenticate") != -1 && httpRequest.getMethod().equals("POST");
    }

    private void processUsernamePasswordAuthentication(HttpServletResponse httpResponse, String username, String password) throws IOException {
        Authentication resultOfAuthentication = tryToAuthenticateWithUsernameAndPassword(username, password);
        SecurityContextHolder.getContext().setAuthentication(resultOfAuthentication);
        httpResponse.setStatus(HttpServletResponse.SC_OK);
        ObjectNode tokenResponse = JsonLib.createObjNode();
        tokenResponse.put("token", resultOfAuthentication.getDetails().toString());
        httpResponse.addHeader("Content-Type", "application/json");
        httpResponse.getWriter().print(tokenResponse.toString());
    }

    private Authentication tryToAuthenticateWithUsernameAndPassword(String username, String password) {
        UsernamePasswordAuthenticationToken requestAuthentication = new UsernamePasswordAuthenticationToken(username, password);
        return tryToAuthenticate(requestAuthentication);
    }

    private void processTokenAuthentication(UserToken userToken) {
        Authentication resultOfAuthentication = tryToAuthenticateWithToken(userToken);
        SecurityContextHolder.getContext().setAuthentication(resultOfAuthentication);
    }

    private Authentication tryToAuthenticateWithToken(UserToken userToken) {
        PreAuthenticatedAuthenticationToken requestAuthentication =
                new PreAuthenticatedAuthenticationToken(userToken, null);
        return tryToAuthenticate(requestAuthentication);
    }

    private Authentication tryToAuthenticate(Authentication requestAuthentication) {
        Authentication responseAuthentication = authenticationManager.authenticate(requestAuthentication);
        if (responseAuthentication == null || !responseAuthentication.isAuthenticated()) {
            throw new InternalAuthenticationServiceException("Unable to authenticate Domain User for provided credentials");
        }
        return responseAuthentication;
    }
}
