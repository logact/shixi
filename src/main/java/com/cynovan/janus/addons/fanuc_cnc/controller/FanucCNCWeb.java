package com.cynovan.janus.addons.fanuc_cnc.controller;

import com.cynovan.janus.addons.fanuc_cnc.jdo.QFanucSubmitData;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DateUtils;
import com.cynovan.janus.base.utils.FilenameUtil;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import org.apache.commons.io.IOUtils;
import org.bson.Document;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;

@Controller
@RequestMapping(value = "fanuc_cnc")
public class FanucCNCWeb {

    @ResponseBody
    @RequestMapping(value = "download")
    public void downloadData(HttpServletRequest request, HttpServletResponse response) throws IOException {

        List<Document> list = DBUtils.list(QFanucSubmitData.collectionName);

        List<String> strList = Lists.newArrayList();
        list.stream().forEach(item -> {
            strList.add(item.toJson());
        });

        String totalStr = StringLib.join(strList, "");

        byte[] by = totalStr.getBytes("utf-8");

        final HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        // response
        String fileName = DateUtils.getDate("yyyyMMddHHmmssSSS") + ".txt";
        response.setContentLength(by.length);
        FilenameUtil.setFilenameHeader(response, fileName);
        OutputStream out = response.getOutputStream();
        IOUtils.write(by, out);
        out.flush();
        out.close();
    }
}
