package com.cynovan.janus.base.i18n.web;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.utils.JsonLib;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(value = "i18n")
public class I18nWeb {

    @Autowired
    private I18nService i18nService;

    @PostMapping(value = "change")
    public String changeLanguage(@RequestParam String lang) {
        /*更新用户设置的语言信息*/
        i18nService.setLang(lang);
        return CheckMessage.newInstance().toString();
    }

    @ResponseBody
    @GetMapping(value = "get-lang")
    public String getLanguage() {
        return i18nService.getLang();
    }

    @ResponseBody
    @GetMapping(value = "load")
    public String loadLanguage(@RequestParam String appId, String lang) {
        Map<String, String> i18nMap = i18nService.getLangI18n(appId, lang);
        return JsonLib.toJSON(i18nMap).toString();
    }
}
