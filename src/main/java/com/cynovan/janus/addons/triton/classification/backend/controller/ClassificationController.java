package com.cynovan.janus.addons.triton.classification.backend.controller;


import com.alibaba.excel.EasyExcel;
import com.cynovan.janus.addons.triton.classification.backend.jdo.QDeviceClassification;
import com.cynovan.janus.addons.triton.classification.backend.util.DataDefinitionDataListener;
import com.cynovan.janus.addons.triton.classification.backend.util.DataDefinitionDataTemplate;
import com.cynovan.janus.addons.triton.classification.backend.util.DataDefinitionDataTypeCellWriteHandler;
import com.cynovan.janus.addons.triton.classification.backend.util.DataDfntionDecimalsCellWriterHandler;
import com.cynovan.janus.addons.triton.view.backend.jdo.QDeviceView;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.jms.WebSocketService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Controller
@RequestMapping(value = "dataDefinition")
public class ClassificationController extends BaseWeb {

    @Autowired
    WebSocketService webSocketService;

    @RequestMapping(value = "/exportTemplate")
    public void exportTemplate(HttpServletRequest request, HttpServletResponse response) throws UnsupportedEncodingException {
        String classificationId = request.getParameter("classificationId");
        Document deviceClassification = DBUtils.find("deviceClassification", DocumentLib.newDoc("id", classificationId));
        String filename = StringLib.join("[", DocumentLib.getString(deviceClassification, "name"), "]-数据定义-导入模板", ".xlsx");
        filename = new String(filename.getBytes("UTF-8"), "ISO8859-1");
        response.setContentType("application/vnd.ms-excel");
        response.setCharacterEncoding("utf-8");
        response.setHeader("Content-disposition", "attachment;filename=" + filename);
        List explanationData = excelExplanation();
        try {
            List data = excelExplanation();
            EasyExcel
                    .write(response.getOutputStream(), DataDefinitionDataTemplate.class)
                    .registerWriteHandler(new DataDefinitionDataTypeCellWriteHandler())
                    .registerWriteHandler(new DataDfntionDecimalsCellWriterHandler())
                    .sheet("数据栏位定义模板")
                    .doWrite(explanationData);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @ResponseBody
    @RequestMapping(value = "changeDeviceClassificationName")
    public String changeDeviceClassification(String cl_id, String cl_name) {
        CheckMessage cm = new CheckMessage();
        DBUtils.updateMany(QDevice.collectionName, DocumentLib.newDoc("classification.classificationId", cl_id),
                DocumentLib.new$Set("classification.classificationName", cl_name));
        removeCache();
        return cm.toString();
    }

    private List<List<Object>> excelExplanation() {
        List<List<Object>> list = new ArrayList<List<Object>>();
        for (int i = 0; i < 7; i++) {
            List<Object> data = new ArrayList<Object>();
            data.add("");
            data.add("");
            data.add("");
            data.add("");
            data.add("");
            data.add("");
            switch (i) {
                case 0:
                    data.add("注意事项： \n");
                    break;
                case 1:
                    data.add("1. 数据ID由数字和字母组成，不能包含特殊字符：+ - * / > < = % . \\ & $ # @\n");
                    break;
                case 2:
                    data.add("2. 修改数据类型后，会影响相关【图表】【动态数据栏位】【数据控制】等组件\n");
                    break;
                case 3:
                    data.add("3. 数据类型不填，默认为【普通文本】\n");
                    break;
                case 4:
                    data.add("4. 保留小数位 栏位只有当【数据类型】是【数字】的情况下生效\n");
                    break;
                case 5:
                    data.add("5. 枚举数据为JSON数据, 若导入的格式不对将会舍弃\n");
                    break;
                case 6:
                    data.add("6. 枚举数据单元格输入格式为:[{\"value\":\"转移后\",\"desc\":\"转义前\"}]");
                    break;
            }
            list.add(data);
        }
        return list;
    }

    @RequestMapping(value = "/exportFromData")
    public void exportFromData(HttpServletRequest request, HttpServletResponse response) throws UnsupportedEncodingException {
        String classificationId = request.getParameter("classificationId");
        Document deviceClassification = DBUtils.find(QDeviceClassification.collectionName, DocumentLib.newDoc("_id", classificationId));
        List details = DocumentLib.getList(deviceClassification, "data_definition.details");
        List data = getExportData(details);
        String filename = StringLib.join("[", DocumentLib.getString(deviceClassification, "name"), "]-数据定义-下载", ".xlsx");
        filename = new String(filename.getBytes("UTF-8"), "ISO8859-1");
        response.setContentType("application/vnd.ms-excel");
        response.setCharacterEncoding("utf-8");
        response.setHeader("Content-disposition", "attachment;filename=" + filename);
        try {
            EasyExcel
                    .write(response.getOutputStream(), DataDefinitionDataTemplate.class)
                    .registerWriteHandler(new DataDefinitionDataTypeCellWriteHandler())
                    .registerWriteHandler(new DataDfntionDecimalsCellWriterHandler())
                    .sheet("数据栏位定义模板")
                    .doWrite(data);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @RequestMapping(value = "/importTemplate", method = RequestMethod.POST)
    public void importTemplate(HttpServletRequest request, HttpServletResponse response) {
        String classificationId = request.getParameter("classificationId");
        MultipartHttpServletRequest multiRequest = (MultipartHttpServletRequest) request;
        Iterator<String> fileNames = multiRequest.getFileNames();
        MultipartFile multipartFile = multiRequest.getFile(fileNames.next());
        try {
            EasyExcel
                    .read(multipartFile.getInputStream(),
                            DataDefinitionDataTemplate.class,
                            new DataDefinitionDataListener(classificationId))
                    .sheet()
                    .doRead();
        } catch (IOException e) {
            e.printStackTrace();
            ObjectNode message = JsonLib.createObjNode();
            message.put("message", "数据读取失败,请保证数据格式正确!");
            message.put("state", "error");
            webSocketService.pushMessage("importDataStruct/" + classificationId, message);
        }
        removeCache();
    }

    private List<DataDefinitionDataTemplate> getExportData(List details) {
        List<DataDefinitionDataTemplate> list = new ArrayList<DataDefinitionDataTemplate>();
        for (Object o : details) {
            Document detail = (Document) o;
            DataDefinitionDataTemplate data = new DataDefinitionDataTemplate();
            String rule = DocumentLib.getString(detail, "rule");

            data.setDataId(DocumentLib.getString(detail, "key"));
            data.setDataName(DocumentLib.getString(detail, "name"));
            data.setDateType(DocumentLib.getString(detail, "rule_name"));
            data.setUnitSymbol(DocumentLib.getString(detail, "suffix"));
            data.setDecimalPlace("");
            data.setEnumerationData("[]");
            if (rule.equals("number")) {
                int deci = DocumentLib.getInt(detail, "decimal");
                String setDecimal = StringLib.join("保留" + deci + "位小数");
                if (deci == 0) {
                    setDecimal = StringLib.join("不保留小数");
                }
                data.setDecimalPlace(setDecimal);
            } else if (rule.equals("enum")) {
                List values = DocumentLib.getList(detail, "values");
                JsonNode valuesJson = JsonLib.toJSON(values);
                data.setEnumerationData(valuesJson.toString());
            }
            list.add(data);
        }
        return list;
    }

    @ResponseBody
    @RequestMapping(value = "removeCache")
    public String removeCache() {
        CheckMessage cm = new CheckMessage();
        CacheUtils.deleteLike("classification_datastruc_");
        CacheUtils.deleteLike("DeviceState@");
        return cm.toString();
    }

    @ResponseBody
    @RequestMapping(value = "addCls")
    public String addCls(String name, String remark, String viewCode) {
        CheckMessage cm = new CheckMessage();
        Document cls = DocumentLib.newDoc();
        cls.put("name", name);
        cls.put("remark", remark);
        if (!StringLib.isEmpty(viewCode)) {
            Document view = DBUtils.find(QDeviceView.collectionName, Filters.eq("code", viewCode), Projections.include("name"));
            Document clsView = DocumentLib.newDoc();
            clsView.put("viewCode", viewCode);
            clsView.put("viewName", DocumentLib.getString(view, "name"));
            cls.put("view", clsView);
        }
        if (this.isClsNameRepeat(name, cm)) {
            return cm.toString();
        }
        if (this.isCheckedViewRepeat(viewCode, cm)) {
            return cm.toString();
        }
        String newClsCode = RandomUtils.uuid();
        cls.put("code", newClsCode);
        DBUtils.save(QDeviceClassification.collectionName, cls);
        // 将cls信息保存到所选的view中
        if (!StringLib.isEmpty(viewCode)) {
            Document view_update = DocumentLib.newDoc();
            view_update.put("classification.classificationName", name);
            view_update.put("classification.classificationCode", newClsCode);
            DBUtils.updateOne(QDeviceView.collectionName, DocumentLib.newDoc("code", viewCode),
                    DocumentLib.new$Set(view_update));
        }
        return cm.toString();
    }

    @ResponseBody
    @RequestMapping(value = "updateCls")
    public String updateCls(String clsCode, String entity) {
        CheckMessage cm = new CheckMessage();
        Document cls = DocumentLib.parse(entity);
        String name = DocumentLib.getString(cls, "name");
        if (this.isClsNameEmpty(name, cm)) {
            return cm.toString();
        }
        Document cls_of_code = DBUtils.find("deviceClassification", DocumentLib.newDoc("code", clsCode),
                Projections.include("name", "view"));
        if (this.isClsNameRepeat(name, cm)) {
            String clsName_of_id = DocumentLib.getString(cls_of_code, "name");
            if (!StringLib.equals(clsName_of_id, name)) {
                return cm.toString();
            }
            cm.setMessages(new ArrayList<String>());
        }
        // 检查绑定视图是否重复
        String checked_view_code = DocumentLib.getString(cls, "view.viewCode");
        if (!StringLib.isEmpty(checked_view_code)) {
            if (this.isCheckedViewRepeat(checked_view_code, cm)) {
                Document view = DBUtils.find(QDeviceView.collectionName, DocumentLib.newDoc("code", checked_view_code),
                        Projections.include("classification", "code"));
                String cls_code_view = DocumentLib.getString(view, "classification.classificationCode");
                if (!StringLib.equals(cls_code_view, clsCode)) {
                    return cm.toString();
                }
            }
        }
        DBUtils.updateOne("deviceClassification", DocumentLib.newDoc("code", clsCode),
                DocumentLib.new$Set(cls));
        String front_viewCode = DocumentLib.getString(cls, "view.viewCode");
        String cls_code = DocumentLib.getString(cls, "code");
        Document update = DocumentLib.newDoc();
        update.put("classification.classificationName", name);
        update.put("classification.classificationCode", cls_code);
        if (!StringLib.isEmpty(front_viewCode)) {
            // 更新设备可视化
            String old_cls_viewCode = DocumentLib.getString(cls_of_code, "view.viewCode");
            if (!StringLib.isEmpty(old_cls_viewCode)) {
                Document setEmpty = DocumentLib.newDoc();
                setEmpty.put("classification", DocumentLib.newDoc());
                DBUtils.updateOne("deviceView", DocumentLib.newDoc("code", old_cls_viewCode),
                        DocumentLib.new$Set(setEmpty));
            }
            DBUtils.updateOne("deviceView", DocumentLib.newDoc("code", front_viewCode),
                    DocumentLib.new$Set(update));
        }
        // 更新设备
        if (!StringLib.isEmpty(clsCode)) {
            DBUtils.updateMany(QDevice.collectionName, DocumentLib.newDoc("classification.classificationCode", clsCode),
                    DocumentLib.new$Set(update));
        }
        cm.setSuccess(true);
        cm.addMessage("操作成功!");
        removeCache();
        return cm.toString();
    }

    @ResponseBody
    @RequestMapping(value = "deleteCls")
    public String deleteCls(String clsCode) {
        CheckMessage cm = new CheckMessage();
        // 删除设备分类
        DBUtils.deleteOne("deviceClassification", DocumentLib.newDoc("code", clsCode));
        // 将设备分类从设备中移除
        Document update = DocumentLib.newDoc();
        update.put("classification", DocumentLib.newDoc());
        DBUtils.updateMany(QDevice.collectionName, DocumentLib.newDoc("classification.classificationCode", clsCode),
                DocumentLib.new$Set(update));
        // 将设备分类从设备可视化中移除
        DBUtils.updateMany("deviceView", DocumentLib.newDoc("classification.classificationCode", clsCode),
                DocumentLib.new$Set(update));
        CacheUtils.deleteLike("classification_datastruc_");
        removeCache();
        return cm.toString();
    }

    public boolean isClsNameEmpty(String name, CheckMessage cm) {
        if (StringLib.isEmpty(name)) {
            cm.setSuccess(false);
            cm.addMessage("请输入分类名称!");
            return true;
        }
        return false;
    }

    public boolean isClsNameRepeat(String name, CheckMessage cm) {
        Document query = DocumentLib.newDoc();
        query.put("name", name);
        long count = DBUtils.count(QDeviceClassification.collectionName, query);
        if (count > 0) {
            cm.setSuccess(false);
            cm.addMessage("名称不能重复!");
            return true;
        }
        return false;
    }

    @ResponseBody
    @RequestMapping(value = "setClsIdToCode")
    public void setClsIdToCode() {
        /*Document dd = DocumentLib.newDoc();
        Document fd = DocumentLib.newDoc();
        fd.put("classification.classificationCode", "");
        fd.put("view.viewCode", "");
        fd.put("code", "");
        dd.put("$unset", fd);
        DBUtils.updateMany("deviceClassification", DocumentLib.newDoc(), dd);
        DBUtils.updateMany("deviceView", DocumentLib.newDoc(), dd);*/

        Document projector = DocumentLib.newDoc();
        projector.put("code", 1);
        projector.put("id", 1);
        projector.put("name", 1);
        List<Document> list = DBUtils.list("clsUpdate", DocumentLib.newDoc());
        if (!list.isEmpty()) {
            Document isUpdateD = list.get(0);
            String isUpdate = DocumentLib.getString(isUpdateD, "isUpdate");
            if (StringLib.equalsAny(isUpdate, "true")) {
                return;
            }
        }
        // 为设备分类添加code
        List<Document> cls_list = DBUtils.list("deviceClassification", DocumentLib.newDoc(), projector);
        cls_list.forEach(cls -> {
            if (!cls.containsKey("code")) {
                String clsId = DocumentLib.getString(cls, "id");
                cls.put("code", clsId);
                // 更新设备分类
                DBUtils.updateOne("deviceClassification", DocumentLib.newDoc("id", clsId), DocumentLib.new$Set(cls));
                // 将code更新到设备
                Document deviceUpdate = DocumentLib.newDoc();
                deviceUpdate.put("classification.classificationCode", clsId);
                deviceUpdate.put("classification.classificationName", DocumentLib.getString(cls, "name"));
                DBUtils.updateMany(QDevice.collectionName, DocumentLib.newDoc("classification.classificationId", clsId),
                        DocumentLib.new$Set(deviceUpdate));
                // 将code更新到设备可视化
                DBUtils.updateMany("DeviceView", DocumentLib.newDoc("production.productionId", clsId),
                        DocumentLib.new$Set(deviceUpdate));
            }
        });
        // 为设备可视化添加code
        Document viewProjector = DocumentLib.newDoc();
        viewProjector.put("id", 1);
        viewProjector.put("code", 1);
        viewProjector.put("name", 1);
        List<Document> viewList = DBUtils.list("deviceView", DocumentLib.newDoc(), viewProjector);
        viewList.forEach(view -> {
            if (!view.containsKey("code")) {
                String viewId = DocumentLib.getString(view, "id");
                view.put("code", viewId);
                Document viewUpdate = DocumentLib.newDoc();
                viewUpdate.put("view.viewCode", viewId);
                viewUpdate.put("view.viewName", DocumentLib.getString(view, "name"));
                // 为设备可视化添加code
                DBUtils.updateOne("DeviceView", DocumentLib.newDoc("id", viewId), DocumentLib.new$Set(view));
                // 将code更新到设备分类
                DBUtils.updateMany("DeviceClassification", DocumentLib.newDoc("view.viewId", viewId),
                        DocumentLib.new$Set(viewUpdate));
            }
        });
        Document completion = DocumentLib.newDoc();
        completion.put("isUpdate", "true");
        DBUtils.save("clsUpdate", completion);
    }

    @ResponseBody
    @RequestMapping(value = "getDeviceClsNoColumn")
    public String getDeviceClsNoColumn() {
        CheckMessage cm = new CheckMessage();
        Document projector = DocumentLib.newDoc();
        projector.put("id", 1);
        projector.put("name", 1);
        projector.put("view", 1);
        projector.put("code", 1);
        List<Document> clsList = DBUtils.list("deviceClassification", DocumentLib.newDoc(), projector);
        cm.addData("clsList", clsList);
        return cm.toString();
    }

    @ResponseBody
    @RequestMapping(value = "saveExchangeCode")
    public String saveExchangeCode(String classificationId, String data) {
        data = StringLib.decodeURI(data);
        Document update = DocumentLib.parse(data);
        DBUtils.updateOne(QDeviceClassification.collectionName,
                DocumentLib.newDoc("id", classificationId),
                DocumentLib.new$Set(DocumentLib.newDoc("exchange", update)),
                true);
        /*删除所有的设备类型处理代码的缓存*/
        CacheUtils.deleteLike("DEVICE_CLASS_EXCHANGE_");
        removeCache();
        return CheckMessage.newInstance().toString();
    }

    private boolean isCheckedViewRepeat(String checked_view_code, CheckMessage cm) {
        Document query = DocumentLib.newDoc();
        query.put("code", checked_view_code);
        Document view = DBUtils.find(QDeviceView.collectionName, query, Projections.include("classification", "code"));
        String cls_code_of_view = DocumentLib.getString(view, "classification.classificationCode");
        if (!StringLib.isEmpty(cls_code_of_view)) {
            cm.setSuccess(false);
            cm.addMessage("所选的设备视图已被绑定,请重新选择!");
            return true;
        }
        return false;
    }
}




