package com.cynovan.janus.addons.demos.productAnalysis.backend.controller;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import org.bson.Document;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("analysis")
public class ProductAnalysisController {
    /**
     * 简单处理一下从productSale 中取出的所有的记录
     * 将每个分类都置为第一级分类
     * 将每个分类下的东西都存储表示为他的分类
     * @return
     */
    @PostMapping("type")
    public CheckMessage types(){
        CheckMessage checkMessage=new CheckMessage();
        List<Document> typeList= DBUtils.list("productSale");
        Map<String,Integer> types=new HashMap<>();
        List<Document> res=new ArrayList<>();
        Map<Integer,Integer> countWithPid=new HashMap<>();
        Integer typeCount=1;
        for(Document product:typeList){
            String type= DocumentLib.getString(product,"type");
            if (!types.containsKey(type)) {
                types.put(type,typeCount++);
                Document document=new Document();
                document.put("pId",0);
                document.put("id",typeCount-1);
                document.put("name", type);
                res.add(document);
            }

            String name = DocumentLib.getString(product, "name");
            Document document=new Document();
            Integer pId = types.get(type);
            document.put("pId", pId);
            countWithPid.put(pId,countWithPid.getOrDefault("pId",0)+1);
            String id=pId+countWithPid.get(pId).toString();
            document.put("id",id);
            document.put("name", name);
            res.add(document);
        }
        checkMessage.addData("result",res);
        return checkMessage;
    }
}
