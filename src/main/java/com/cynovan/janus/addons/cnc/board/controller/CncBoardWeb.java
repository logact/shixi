package com.cynovan.janus.addons.cnc.board.controller;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.device.push.DevicePushService;
import com.cynovan.janus.base.gridfs.service.FileStorageService;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.RequestLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;

@Controller
public class CncBoardWeb extends BaseWeb {

    @Autowired
    private DevicePushService devicePushService;

    @Autowired
    private GridFsTemplate gridFsTemplate;

    @Autowired
    private FileStorageService fileStorageService;

    @ResponseBody
    @RequestMapping(value = "cnc/change-ncFile")
    public String changeFile(@RequestParam String uuid, @RequestParam String file_name, @RequestParam String file_path_to, @RequestParam String file_id, HttpServletRequest request) {
        CheckMessage cm = CheckMessage.newInstance();

        GridFSFile file = fileStorageService.fetchFile(file_id);

        ObjectNode objectNode = JsonLib.createObjNode();
        objectNode.put("action", "cloud_download");
        ObjectNode dataNode = JsonLib.createObjNode();
        dataNode.put("server_url", StringLib.join(RequestLib.getCompleteUrl(request), "gridfs/", file_id));
        dataNode.put("file_name", file_name);
        if (StringLib.isEmpty(file_path_to)) {
            file_path_to = "Hard Disk/tmp/LINE.NC";
        }
        dataNode.put("file_path_to", file_path_to);
        dataNode.put("checksum", file.getMD5());
        objectNode.set("data", dataNode);
        objectNode.put("uuid", uuid);

        devicePushService.pushToDevice(objectNode);

        return cm.toString();
    }
}
