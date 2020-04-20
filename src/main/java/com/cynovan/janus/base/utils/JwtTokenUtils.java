package com.cynovan.janus.base.utils;

import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.user.jdo.UserToken;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.bson.Document;
import org.joda.time.LocalDateTime;

import javax.servlet.http.HttpServletResponse;
import java.util.Date;
import java.util.concurrent.TimeUnit;

public class JwtTokenUtils {

    public static final String ACCESS_TOKEN_KEY = "JANUS-ACCESS-TOKEN";
    public static final String REFRESH_TOKEN_KEY = "JANUS-REFRESH-TOKEN";


    private static final String SigningKey = "JANUS-EDGE-JwT-sIgn_key";

    private static final int ACCESS_TOKEN_EXPIRED = 30;
    private static final int REFRESH_TOKEN_EXPIRED = 7;

    public static void createTokenCookie(HttpServletResponse response, UserToken userToken) {
        createTokenCookie(response, userToken.getAccess_token(), userToken.getRefresh_token());
    }

    public static void createTokenCookie(HttpServletResponse response, String access_token, String refreshToken) {
        CookieUtil.create(response, ACCESS_TOKEN_KEY, access_token);
        CookieUtil.create(response, REFRESH_TOKEN_KEY, refreshToken);
    }

    public static void clearTokenCookie(HttpServletResponse response) {
        CookieUtil.clear(response, JwtTokenUtils.ACCESS_TOKEN_KEY);
        CookieUtil.clear(response, JwtTokenUtils.REFRESH_TOKEN_KEY);
    }

    private static String newToken(String userId, int minutes) {
        Date expireDate = LocalDateTime.now().plusMinutes(minutes).toDate();
        JwtBuilder builder = Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(new Date())
                .setExpiration(expireDate)
                .signWith(SignatureAlgorithm.HS256, SigningKey);

        return builder.compact();
    }

    public static String newRefreshToken(String userId) {
        int minutes = StringLib.toInteger(TimeUnit.DAYS.toMinutes(REFRESH_TOKEN_EXPIRED));
        return newToken(userId, minutes);
    }

    public static String newAccessToken(String userId) {
        return newToken(userId, ACCESS_TOKEN_EXPIRED);
    }

    private static String getUserId(String token) {
        if (StringLib.isEmpty(token)) {
            return null;
        }
        try {
            return Jwts.parser().setSigningKey(SigningKey).parseClaimsJws(token).getBody().getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    public static UserToken getUserToken(UserToken userToken) {
        String access_token = userToken.getAccess_token();

        String userId = getUserId(access_token);

        /*当access token失效时，用refresh token进行刷新*/
        String refresh_token = userToken.getRefresh_token();
        if (StringLib.isEmpty(userId)) {
            userId = getUserId(refresh_token);
            if (StringLib.isNotEmpty(userId)) {
                Document userInfo = null;
                if (StringLib.equalsIgnoreCase(userId, UserToken.SUPER_USER_NAME)) {
                    userInfo = QJanus.get();
                } else {
                    userInfo =
                            DBUtils.find("user", Filters.eq("_id", userId),
                                    Projections.include("name"));
                }
                /*用refresh token 生成 access token的时候再去数据库检查一次*/
                if (userInfo != null) {
                    UserToken newUserToken = new UserToken();
                    /*由于UserToken失效，重新生成UserToken*/
                    newUserToken.setId(userId);
                    newUserToken.setUsername(DocumentLib.getString(userInfo, "name"));
                    newUserToken.setRefresh_token(refresh_token);
                    /*每次都返回新的access token*/
                    newUserToken.setAccess_token(newAccessToken(userId));
                    return newUserToken;
                }
            } else {
                /*当refresh token 和 access token都失效时，直接返回null*/
                return null;
            }
        } else {
            /*access Token 是有效的*/
            UserToken newUserToken = new UserToken();
            newUserToken.setId(userId);
            newUserToken.setRefresh_token(refresh_token);
            newUserToken.setAccess_token(newAccessToken(userId));
            return newUserToken;
        }
        return null;
    }
}

