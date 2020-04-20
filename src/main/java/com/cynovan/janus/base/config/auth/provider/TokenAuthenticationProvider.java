package com.cynovan.janus.base.config.auth.provider;

import com.cynovan.janus.base.user.jdo.UserToken;
import com.cynovan.janus.base.utils.JwtTokenUtils;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;

public class TokenAuthenticationProvider implements AuthenticationProvider {

    public TokenAuthenticationProvider() {
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        UserToken userToken = (UserToken) authentication.getPrincipal();
        if (userToken == null || StringLib.isEmpty(userToken.getAccess_token()) || StringLib.isEmpty(userToken.getRefresh_token())) {
            throw new BadCredentialsException("Invalid token");
        }

        UserToken newUserToken = JwtTokenUtils.getUserToken(userToken);

        if (newUserToken == null) {
            throw new BadCredentialsException("Invalid token or token expired");
        }
        return new UsernamePasswordAuthenticationToken(newUserToken, null, Lists.newArrayList());

    }

    @Override
    public boolean supports(Class<?> authentication) {
        return authentication.equals(PreAuthenticatedAuthenticationToken.class);
    }
}
