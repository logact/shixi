package com.cynovan.janus.addons.demos.productManagement.backend.controller;

import com.alibaba.excel.EasyExcel;

import com.cynovan.janus.addons.demos.productManagement.backend.util.DataDefinitionDataListener;
import com.cynovan.janus.addons.demos.productManagement.backend.util.DataDefinitionDataTemplate;
import com.cynovan.janus.addons.triton.classification.backend.jdo.QDeviceClassification;
import com.cynovan.janus.addons.triton.classification.backend.util.DataDefinitionDataTypeCellWriteHandler;
import com.cynovan.janus.addons.triton.classification.backend.util.DataDfntionDecimalsCellWriterHandler;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.service.SecurityService;
import com.cynovan.janus.base.jms.WebSocketService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.TimeZone;

import static com.cynovan.janus.base.utils.DateUtils.getDateTime;

@RestController
@RequestMapping(value = "product")
public class ProductWeb {
    private static final Logger LOGGER = LoggerFactory.getLogger(ProductWeb.class);

    @Autowired
    private SecurityService securityService;

    @Autowired
    WebSocketService webSocketService;

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

    /**
     * 处理从从excel 导入数据
     * @param request
     * @param response
     */
    @RequestMapping(value = "/importTemplate", method = RequestMethod.POST)
    public void importTemplate(HttpServletRequest request, HttpServletResponse response) {
        MultipartHttpServletRequest multiRequest = (MultipartHttpServletRequest) request;
        Iterator<String> fileNames = multiRequest.getFileNames();
        MultipartFile multipartFile = multiRequest.getFile(fileNames.next());
        try {
            EasyExcel
                    .read(multipartFile.getInputStream(),
                            DataDefinitionDataTemplate.class,
                            new DataDefinitionDataListener())
                    .sheet()
                    .doRead();
        } catch (IOException e) {
            e.printStackTrace();
            ObjectNode message = JsonLib.createObjNode();
            message.put("message", "数据读取失败,请保证数据格式正确!");
            message.put("state", "error");
            webSocketService.pushMessage("importDataStruct/productImport", message);
        }
    }


    /**
     * 导出数据到excel中就简单的写入省掉了相关的hanlder 处理过程。
     *
     * @param request
     * @param response
     * @throws UnsupportedEncodingException
     */
    @RequestMapping(value = "/exportFromData")
    public void exportFromData(HttpServletRequest request, HttpServletResponse response) throws UnsupportedEncodingException {
        List<DataDefinitionDataTemplate> products = getExportData(DBUtils.list("product"));
        LOGGER.info("products:"+products);
//        毫秒为单位但是粒度太小了
//       String filename = "产品列表数据下载"+System.currentTimeMillis()+".xlsx";
        String filename = "产品列表数据下载"+RandomUtils.uuid() + ".xlsx";
        LOGGER.info("filename:::" + filename);
//        System.out.println("filename:"+filename);
        filename = new String(filename.getBytes("UTF-8"), "ISO8859-1");
        response.setContentType("application/vnd.ms-excel");
        response.setCharacterEncoding("utf-8");
        response.setHeader("Content-disposition", "attachment;filename=" + filename);
        try {
            EasyExcel
                    .write(response.getOutputStream(), DataDefinitionDataTemplate.class)
                    .sheet("产品列表模板")
                    .doWrite(products);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        for(int i=0;i<100;i++){
            System.out.println("产品列表数据下载"+RandomUtils.uuid()+".xlsx");
        }
    }
    private List<DataDefinitionDataTemplate> getExportData(List<Document> products) {
        List<DataDefinitionDataTemplate> list = new ArrayList<>();
        for (Document product: products) {
            DataDefinitionDataTemplate data = new DataDefinitionDataTemplate();
            data.setModoel(DocumentLib.getString(product, "model"));
            data.setPrice(DocumentLib.getString(product, "price"));
            data.setTime(DocumentLib.getString(product, "time"));
            data.setProductName(DocumentLib.getString(product, "productName"));
            data.setType(DocumentLib.getString(product, "type"));
            list.add(data);
        }
        return list;
    }

}
