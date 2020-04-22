//package com.cynovan.janus.addons.demos.productManagement.controller;
//
//import com.cynovan.janus.base.arch.bean.CheckMessage;
//import com.cynovan.janus.base.config.service.SecurityService;
//import com.cynovan.janus.base.user.jdo.QUser;
//import com.cynovan.janus.base.utils.*;
//import org.bson.Document;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RequestParam;
//import org.springframework.web.bind.annotation.RestController;
//
//import javax.servlet.http.HttpServletResponse;
//
//import static com.cynovan.janus.base.utils.DateUtils.getDateTime;
//
//@RestController
//@RequestMapping(value = "user")
//public class UserWeb {
//
//    @Autowired
//    private SecurityService securityService;
//
//    @PostMapping(value = "save")
//    public String saveUser(@RequestParam String entity, HttpServletResponse response) {
//        CheckMessage checkMessage = CheckMessage.newInstance();
//
//        entity = StringLib.decodeURI(entity);
//        Document user = Document.parse(entity);
//        user.put("time", getDateTime());
//
//        String userId = DocumentLib.getID(user);
//        String userName = DocumentLib.getString(user, "userName");
//        userName = userName.toLowerCase();// 将用户名统一转换为小写
//        user.replace("userName", userName);
//
//        // 新增时,检查用户名是否重复
//        if (StringLib.isEmpty(userId)) {
//            Document exitUser = DBUtils.find(QUser.collectionName, DocumentLib.newDoc("userName", userName));
//            if (exitUser != null) {
//                checkMessage.setSuccess(false);
//                checkMessage.addData("reason", "该用户已存在!");
//                return checkMessage.toString();
//            }
//        }
//
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
//
//        DBUtils.save(QUser.collectionName, user);
//        securityService.recalcSecurity();
//        checkMessage.addData("id", DocumentLib.getID(user));
//        return checkMessage.toString();
//    }
//
//    private boolean checkOldPassword(String oldPwd) {
//        boolean result = true;
//        Document userInfo = UserUtils.getUser(true);
//        if (userInfo != null) {
//            String encodedOldPwd = DocumentLib.getString(userInfo, "password");
//            boolean checkPassword = DigestLib.getPasswordEncoder().matches(oldPwd, encodedOldPwd);
//            if (checkPassword == false) {
//                result = false;
//            }
//        }
//        return result;
//    }
//
//    private boolean checkCurrentLoginUser(String userName) {
//        boolean result = false;
//        Document userInfo = UserUtils.getUser();
//        String currentUserName = DocumentLib.getString(userInfo, "userName");
//        if (StringLib.equals(userName, currentUserName)) {
//            result = true;
//        }
//        return result;
//    }
//
//    @PostMapping(value = "updateAvatar")
//    public String updateAvatar(@RequestParam String userName, @RequestParam String userAvatar) {
//        DBUtils.updateOne(QUser.collectionName, DocumentLib.newDoc("userName", userName),
//                DocumentLib.new$Set("userAvatar", userAvatar));
//        UserUtils.getUser(true);
//        return CheckMessage.newInstance().toString();
//    }
//
//    @PostMapping(value = "updatePassword")
//    public String updatePassword(String entity) {
//        CheckMessage checkMessage = CheckMessage.newInstance();
//        entity = StringLib.decodeURI(entity);
//        Document user = Document.parse(entity);
//        String userId = DocumentLib.getID(user);
//
//        // 个人信息页面内修改密码时,需要验证原密码
//        String oldPwd = DocumentLib.getString(user, "oldPwd");
//        if (StringLib.isNotEmpty(oldPwd)) {
//            boolean result = checkOldPassword(oldPwd);
//            if (!result) {
//                checkMessage.setSuccess(false);
//                checkMessage.addData("reason", "原密码错误!");
//                return checkMessage.toString();
//            }
//        }
//        Document update = DocumentLib.newDoc();
//        String pwd = DocumentLib.getString(user, "pwd");
//        String userName = DocumentLib.getString(user, "userName");
//        userName = userName.toLowerCase();// 将用户名统一转换为小写
//        if (StringLib.isNotBlank(pwd)) {
//            String password = DigestLib.getPasswordEncoder().encode(pwd);
//            String token = DigestLib.md5Hex("janus_" + userName + pwd);
//            update.put("time", getDateTime());
//            update.put("password", password);
//            update.put("token", token);
//        }
//        DBUtils.updateOne(QUser.collectionName, DocumentLib.newDoc("id", userId), DocumentLib.new$Set(update));
//        securityService.recalcSecurity();
//        return checkMessage.toString();
//    }
//}
