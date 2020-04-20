package com.cynovan.janus.base.gridfs;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.config.bean.InitializeWeb;
import com.cynovan.janus.base.gridfs.eventbus.FileUploadPublisher;
import com.cynovan.janus.base.gridfs.service.FileStorageService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;

/**
 * Created by Aric on 2016/11/25.
 */
@Controller
@RequestMapping(value = "gridfs")
public class GridFSWeb extends BaseWeb {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private FileUploadPublisher fileUploadPublisher;

    @ResponseBody
    @RequestMapping(value = "")
    public void get(HttpServletRequest request, HttpServletResponse response) throws IOException {
        get("", request, response);
    }

    @ResponseBody
    @RequestMapping(value = "{id}")
    public void get(@PathVariable("id") String id, HttpServletRequest request, HttpServletResponse response) throws IOException {
        String dft = request.getParameter("default");

        response.setDateHeader("Expires", InitializeWeb.expiredDate);
        response.setHeader("Cache-Control", "max-age=" + InitializeWeb.expireSecond);
        if (StringLib.isNotEmpty(id)) {
            GridFSFile file = fileStorageService.fetchFile(id);
            fileStorageService.download(file, response);
        } else {
            String defaultImg = "/web/img/default.png";
            if (!StringLib.isEmpty(dft)) {
                defaultImg = dft;
            }
            defaultImg = "com/cynovan/janus/addons/" + defaultImg;
            defaultImg = StringLib.replace(defaultImg, "//", "/");
            ClassPathResource resource = new ClassPathResource(defaultImg);
            byte[] by = IOUtils.toByteArray(resource.getInputStream());
            if (by == null) {
                by = new byte[0];
            }
            response.setContentType(MediaType.IMAGE_PNG_VALUE);
            int length = by.length;
            response.setContentLength(length);
            response.setHeader("Accept-Ranges", "bytes");
            response.setHeader("Content-Range", "bytes 0-" + length + "/" + length);
            OutputStream out = response.getOutputStream();
            IOUtils.write(by, out);
            out.flush();
            out.close();
        }
    }

    @ResponseBody
    @RequestMapping(value = "upload")
    public String uploadImage(HttpServletRequest request, HttpServletResponse response) {
        MultipartHttpServletRequest multiRequest = (MultipartHttpServletRequest) request;
        CheckMessage checkMessage = CheckMessage.newInstance();

        List<MultipartFile> files = multiRequest.getFiles("FILE");
        ArrayNode idList = JsonLib.createArrNode();
        for (MultipartFile file : files) {
            ObjectNode result = fileStorageService.storeFile(file, null);

            fileUploadPublisher.publish(DocumentLib.parse(result.toString()));
            idList.add(JsonLib.getString(result, "fileId"));
            checkMessage.addData("id", JsonLib.getString(result, "fileId"));
            checkMessage.addData("name", JsonLib.getString(result, "name"));
            checkMessage.addData("size", JsonLib.getString(result, "size"));
            checkMessage.addData("md5", JsonLib.getString(result, "md5"));
        }
        checkMessage.addData("ids", idList.toString());
        return checkMessage.toString();
    }
}
