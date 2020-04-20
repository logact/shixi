package com.cynovan.janus.base.config.auth.provider;

import com.cynovan.janus.base.config.auth.exception.PasswordNotValidException;
import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.user.jdo.QUser;
import com.cynovan.janus.base.user.jdo.UserToken;
import com.cynovan.janus.base.utils.*;
import com.google.common.collect.Lists;
import org.bson.Document;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

public class DomainUsernamePasswordAuthenticationProvider implements AuthenticationProvider {

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String username = String.valueOf(authentication.getPrincipal());
        String password = String.valueOf(authentication.getCredentials());

        if (StringLib.isEmpty(password)) {
            throw new BadCredentialsException("Invalid Domain User Credentials");
        }

        Document janus = QJanus.get();
        if (janus == null) {
            throw new UsernameNotFoundException("janus not found!");
        }
        if (!DocumentLib.getBoolean(janus, QJanus.initialize)) {
            throw new UsernameNotFoundException("janus not initialized!");
        }

        String userId = "";
        if (StringLib.isEmpty(username)) {
            String encodedPassword = DocumentLib.getString(janus, QJanus.password);
            boolean checkPassword = DigestLib.getPasswordEncoder().matches(password, encodedPassword);
            if (checkPassword == false) {
                throw new PasswordNotValidException("password not valid");
            }
            userId = UserToken.SUPER_USER_NAME;
        } else {
            //普通用户登录 登录名统一转换为小写
            Document user = DBUtils.find(QUser.collectionName, DocumentLib.newDoc("userName", username.toLowerCase()));
            if (user == null || DocumentLib.getBoolean(user, "lock")) {
                throw new UsernameNotFoundException("User does not exist or user is locked!");
            }
            String encodedPassword = DocumentLib.getString(user, "password");
            boolean checkPassword = DigestLib.getPasswordEncoder().matches(password, encodedPassword);
            if (checkPassword == false) {
                throw new PasswordNotValidException("password not valid");
            }
            userId = DocumentLib.getID(user);
        }

        UserToken userToken = new UserToken();
        userToken.setId(userId);
        userToken.setRefresh_token(JwtTokenUtils.newRefreshToken(userToken.getId()));
        userToken.setAccess_token(JwtTokenUtils.newAccessToken(userToken.getId()));

        return new UsernamePasswordAuthenticationToken(userToken, null, Lists.newArrayList());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return authentication.equals(UsernamePasswordAuthenticationToken.class);
    }
}
