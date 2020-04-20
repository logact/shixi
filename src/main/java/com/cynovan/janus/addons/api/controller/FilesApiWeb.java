package com.cynovan.janus.addons.api.controller;

import com.cynovan.janus.addons.api.dto.HttpApiResponse;
import com.cynovan.janus.addons.api.dto.ResponseCodeEnum;
import com.cynovan.janus.base.gridfs.service.FileStorageService;
import com.cynovan.janus.base.utils.JsonLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

/**
 * @author ian.lan@cynovan.com
 */
@RestController
@RequestMapping(value = "api/file")
public class FilesApiWeb {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping(value = "upload")
    public String upload(@RequestParam String token, @RequestParam MultipartFile file, String tags) {
        HttpApiResponse apiResponse = HttpApiResponse.checkToken(token);
        if (!apiResponse.isSuccess()) {
            return apiResponse.toString();
        }

        ObjectNode result = fileStorageService.storeFile(file, tags);
        if (result == null) {
            apiResponse.setResponseCode(ResponseCodeEnum.FILE_UPLOAD_FAIL);
            return apiResponse.toString();
        }

        apiResponse.setData(result);
        return apiResponse.toString();
    }

    @GetMapping(value = "search")
    public String search(@RequestParam String token, @RequestParam String keyword) {
        HttpApiResponse apiResponse = HttpApiResponse.checkToken(token);
        if (!apiResponse.isSuccess()) {
            return apiResponse.toString();
        }

        List<Document> fileInfoList = fileStorageService.listFile(keyword);
        ObjectNode result = JsonLib.createObjNode();
        result.set("files", JsonLib.toJSON(fileInfoList));
        apiResponse.setData(result);

        return apiResponse.toString();
    }

    @GetMapping(value = "download")
    public void downloadById(@RequestParam String token, @RequestParam String fileId, HttpServletResponse response) {
        HttpApiResponse apiResponse = HttpApiResponse.checkToken(token);
        if (!apiResponse.isSuccess()) {
            try {
                PrintWriter printWriter = response.getWriter();
                printWriter.write(apiResponse.toString());
                printWriter.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        GridFSFile file = fileStorageService.fetchFile(fileId);
        if (file == null) {
            apiResponse.setResponseCode(ResponseCodeEnum.FILE_NOT_FOUND);
            try {
                PrintWriter printWriter = response.getWriter();
                printWriter.write(apiResponse.toString());
                printWriter.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        } else {
            try {
                fileStorageService.download(file, response);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    @GetMapping(value = "download_md5")
    public void downloadByMd5(@RequestParam String token, @RequestParam String md5, HttpServletResponse response) {
        HttpApiResponse apiResponse = HttpApiResponse.checkToken(token);
        if (!apiResponse.isSuccess()) {
            try {
                PrintWriter printWriter = response.getWriter();
                printWriter.write(apiResponse.toString());
                printWriter.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        GridFSFile file = fileStorageService.fetchFileByMd5(md5);
        if (file == null) {
            try {
                apiResponse.setResponseCode(ResponseCodeEnum.FILE_NOT_FOUND);
                PrintWriter printWriter = response.getWriter();
                printWriter.write(apiResponse.toString());
                printWriter.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        } else {
            try {
                fileStorageService.download(file, response);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
