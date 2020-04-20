package com.cynovan.janus.addons.userInfo.service;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.user.service.UserSettingService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "userSetting")
public class UserSettingWeb {

    @Autowired
    private UserSettingService userSettingService;

    @RequestMapping(value = "set")
    public String set(@RequestParam String key, String value) {
        if (StringLib.isNotEmpty(value)) {
            userSettingService.set(key, DocumentLib.parse(value));
        } else {
            userSettingService.set(key, null);
        }
        return CheckMessage.newInstance().toString();
    }

    @RequestMapping(value = "get")
    public String get(@RequestParam String key) {
        Document data = userSettingService.get(key);
        return data.toJson();
    }
}
