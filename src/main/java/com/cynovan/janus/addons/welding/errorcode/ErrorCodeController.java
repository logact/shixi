package com.cynovan.janus.addons.welding.errorcode;

import com.cynovan.janus.addons.welding.dto.WeldingErrorCode;
import com.cynovan.janus.base.appstore.service.AppDataService;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.ExcelUtil;
import com.cynovan.janus.base.utils.FilenameUtil;
import com.google.common.collect.Lists;
import org.apache.commons.collections4.CollectionUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

/**
 * @author ian.lan@cynovan.com
 */
@RestController
@RequestMapping(value = "/weldingErrorCode")
public class ErrorCodeController {

    private static final List<String> exportHeader = Lists.newArrayList("错误代码", "错误信息", "错误分析", "解决方法");


    @Autowired
    private AppDataService appDataService;

    @PostMapping(value = "import")
    public String importFromExcel(HttpServletRequest request) {
        CheckMessage cm = CheckMessage.newInstance();
        MultipartHttpServletRequest multiRequest = (MultipartHttpServletRequest) request;
        List<MultipartFile> files = multiRequest.getFiles("FILE");
        List datas = DocumentLib.newList();
        if (CollectionUtils.isNotEmpty(files)) {
            MultipartFile file = files.get(0);
            if (file != null) {
                try {
                    datas = ExcelUtil.readExcel(file.getInputStream(), WeldingErrorCode.class);
                    // save to data base
                    Document data = DocumentLib.newDoc();
                    data.put("list", datas);
                    appDataService.set("welding_device_error_code", data);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

        cm.addData("datas", datas.toString());
        return cm.toString();
    }

    @GetMapping(value = "exportTemplate")
    public void exportTemplate(HttpServletResponse response) {
        response.setContentType("multipart/form-data");
        response.setCharacterEncoding("utf-8");
        FilenameUtil.setFilenameHeader(response, "焊接机器人报警代码导入模板.xlsx");
        try {
            ExcelUtil.exportTemplate(response.getOutputStream(), exportHeader);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
