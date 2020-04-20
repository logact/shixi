package com.cynovan.janus.addons.triton.device.controller.state;

import com.alibaba.excel.EasyExcel;
import com.cynovan.janus.addons.triton.device.controller.state.bean.AlarmDataEntity;
import com.cynovan.janus.addons.triton.device.controller.state.bean.ReadExcelOfAlarmDataListener;
import com.cynovan.janus.addons.triton.device.controller.state.bean.WriteAlarmDataTemplateBooleanHandler;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;

@Controller
@RequestMapping(value = "DeviceDataTimeLine")
public class DeviceDataTimeLineController {

    @RequestMapping(value = "importAlarmDataByExcel")
    public void importAlarmDataByExcel(HttpServletRequest request, HttpServletResponse response) {
        MultipartHttpServletRequest multiRequest = (MultipartHttpServletRequest) request;
        Iterator<String> fileNames = multiRequest.getFileNames();
        MultipartFile multipartFile = multiRequest.getFile(fileNames.next());
        String classificationId = request.getParameter("classificationId");
        try {
            EasyExcel
                    .read(multipartFile.getInputStream(), AlarmDataEntity.class, new ReadExcelOfAlarmDataListener(classificationId))
                    .sheet()
                    .doRead();
        } catch (IOException e) {
            System.out.println();
        }

    }

    @RequestMapping(value = "getTemplate")
    public void getTemplate(HttpServletRequest request, HttpServletResponse response) {
        response.setContentType("application/vnd.ms-excel");
        response.setCharacterEncoding("utf-8");
        response.setHeader("Content-disposition", "attachment;filename=template.xlsx");
        try {
            EasyExcel
                    .write(response.getOutputStream(), AlarmDataEntity.class)
                    .registerWriteHandler(new WriteAlarmDataTemplateBooleanHandler())
                    .sheet("模板")
                    .doWrite(new ArrayList());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
