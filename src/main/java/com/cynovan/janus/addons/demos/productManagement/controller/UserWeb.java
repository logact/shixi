package com.cynovan.janus.addons.demos.productManagement.controller;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.service.SecurityService;
import com.cynovan.janus.base.user.jdo.QUser;
import com.cynovan.janus.base.utils.*;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;

import static com.cynovan.janus.base.utils.DateUtils.getDateTime;

@RestController
@RequestMapping(value = "product")
public class UserWeb {

    @Autowired
    private SecurityService securityService;

    @PostMapping(value = "save")
    public String saveUser(@RequestParam String entity, HttpServletResponse response) {
        CheckMessage checkMessage = CheckMessage.newInstance();

        entity = StringLib.decodeURI(entity);
        Document product = Document.parse(entity);
        product.put("time", getDateTime());

        String productId = DocumentLib.getID(product);

        // 新增时,检查用户名是否重复
//        if (StringLib.isEmpty(productId)) {
//            Document exitUser = DBUtils.find(QUser.collectionName, DocumentLib.newDoc("userName", userName));
//            if (exitProduct != null) {
//                checkMessage.setSuccess(false);
//                checkMessage.addData("reason", "该用户已存在!");
//                return checkMessage.toString();
//            }
//        }

//        String pwd = DocumentLib.getString(user, "pwd");
//        if (StringLib.isNotBlank(pwd)) {
//            String password = DigestLib.getPasswordEncoder().encode(pwd);
//            user.put("password", password);
//            user.remove("pwd");
//            user.remove("confirmPwd");// 明文密码不保存在数据库中
//
//            boolean result = checkCurrentLoginUser(userName);
//            if (result) {
//                JwtTokenUtils.clearTokenCookie(response);
//            }
//        }

        DBUtils.save("product",product);

        return checkMessage.toString();
    }



}
