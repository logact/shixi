package com.cynovan.janus.base.utils;

import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.user.jdo.QUser;
import com.cynovan.janus.base.user.jdo.UserToken;
import com.mongodb.client.model.Filters;
import org.bson.Document;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Created by Aric on 2016/11/25.
 */
public class UserUtils {

    public static Document getUser() {
        return getUser(false);
    }

    public static Document getUser(boolean reload) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal == null) {
            return null;
        }
        if (principal instanceof String) {
            return null;
        }

        UserToken userToken = (UserToken) principal;

        /*cached user info*/
        String cacheKey = "j_user_principal" + userToken.getId();
        if (reload == true) {
            CacheUtils.delete(cacheKey);
        }

        Document userInfo = CacheUtils.getDocument(cacheKey);
        if (userInfo == null) {
            if (StringLib.equals(userToken.getId(), UserToken.SUPER_USER_NAME)) {
                userInfo = QJanus.get();
            } else {
                userInfo = DBUtils.find(QUser.collectionName, Filters.eq("id", userToken.getId()));
            }
            CacheUtils.set(cacheKey, userInfo);
        }
        return userInfo;
    }

    public static boolean isSuperUser() {
        Document userInfo = UserUtils.getUser();
        if (userInfo != null) {
            String userName = DocumentLib.getString(userInfo, "userName");
            if (StringLib.isEmpty(userName)) {
                return true;
            }
            if (StringLib.equals(userName, UserToken.SUPER_USER_NAME)) {
                return true;
            }
            boolean admin = DocumentLib.getBoolean(userInfo, "admin");
            if (admin == true) {
                return true;
            }
        }
        return false;
    }
}
