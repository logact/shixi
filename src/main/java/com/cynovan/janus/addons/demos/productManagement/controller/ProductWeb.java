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
public class ProductWeb {

    @Autowired
    private SecurityService securityService;

    @PostMapping(value = "save")
    public String saveUser(@RequestParam String entity, HttpServletResponse response) {
        CheckMessage checkMessage = CheckMessage.newInstance();

        entity = StringLib.decodeURI(entity);
        Document product = Document.parse(entity);
        product.put("time", getDateTime());

        String productId = DocumentLib.getID(product);
//        在插入的时候自动生成了一个productId
        DBUtils.save("product",product);

        return checkMessage.toString();
    }



}
