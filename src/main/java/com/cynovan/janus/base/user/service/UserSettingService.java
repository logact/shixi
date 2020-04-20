package com.cynovan.janus.base.user.service;

import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.user.jdo.QUser;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.UserUtils;
import org.bson.Document;
import org.springframework.stereotype.Component;

/**
 * 存储用户习惯的Service，例如左边菜单是否显示，菜单的排序等
 */
@Component
public class UserSettingService {

    public void set(String key, Document value) {
        /*得到对应的用户信息*/
        if (UserUtils.isSuperUser()) {
            DBUtils.updateOne(QJanus.collectionName,
                    DocumentLib.newDoc(),
                    DocumentLib.new$Set("userSetting." + key, value));
        } else {
            String userId = DocumentLib.getID(UserUtils.getUser());
            DBUtils.updateOne(QUser.collectionName,
                    DocumentLib.newDoc("id", userId),
                    DocumentLib.new$Set("userSetting." + key, value));
        }
        UserUtils.getUser(true);
    }

    public Document get(String key) {
        if (UserUtils.isSuperUser()) {
            return DocumentLib.getDocument(QJanus.get(), "userSetting." + key);
        } else {
            Document userInfo = UserUtils.getUser();
            return DocumentLib.getDocument(userInfo, "userSetting." + key);
        }
    }
}
