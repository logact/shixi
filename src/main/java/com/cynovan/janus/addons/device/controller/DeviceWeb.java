package com.cynovan.janus.addons.device.controller;

import com.cynovan.janus.addons.triton.device.controller.bean.DeviceTimelineDataGetBean;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.arch.controller.BaseWeb;
import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.device.jdo.QDataExchange;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.device.jdo.QUuidList;
import com.cynovan.janus.base.device.push.DevicePushService;
import com.cynovan.janus.base.device.service.DeviceService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.base.Joiner;
import com.google.common.base.Splitter;
import com.google.common.collect.Lists;
import com.mongodb.client.model.Projections;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.List;

@Controller
@RequestMapping(value = "/device")
public class DeviceWeb extends BaseWeb {

    @Value("${debug}")
    private Boolean debug;

    @Value("${version}")
    private String version;

    @Autowired
    private DeviceService deviceService;

    @ResponseBody
    @PostMapping(value = "create")
    public String checkCreate(@RequestParam String data, HttpServletRequest request) {
        CheckMessage checkMessage = CheckMessage.newInstance();
        data = StringLib.decodeURI(data);
        Document device = Document.parse(data);

        String newUuid = null;
        Document query = new Document();
        Document uuid = new Document();
        query.put("use", false);
        String uuid_type = DocumentLib.getString(device, "uuid_type");

        if (StringLib.equals(uuid_type, "1")) { // 自动生成
            uuid = DBUtils.find(QUuidList.collectionName, query);
            if (uuid != null) {
                newUuid = DocumentLib.getString(uuid, "uuid");
                device.put(QDevice.uuid, newUuid);
                uuid.put("use", true);
                DBUtils.save(QUuidList.collectionName, uuid);
            } else {
                if (checkLicences().equals("true")) {
                    StringBuilder uuidBuilder = new StringBuilder();
                    uuidBuilder.append(StringLib.SPLIT_1);
                    uuidBuilder.append(DocumentLib.getID(UserUtils.getUser()));
                    uuidBuilder.append(StringLib.SPLIT_1);
                    uuidBuilder.append(request.getSession().getId());
                    uuidBuilder.append(StringLib.SPLIT_1);
                    uuidBuilder.append(System.currentTimeMillis());
                    // 16 bit uuid
                    newUuid = createUuid(uuidBuilder.toString());
                    device.put(QDevice.uuid, newUuid);
                }
            }

        } else {    // 手动选择
            newUuid = DocumentLib.getString(device, QDevice.uuid);
            query.put("uuid", newUuid);
            uuid = DBUtils.find(QUuidList.collectionName, query);
            if (uuid != null) {
                uuid.put("use", true);
                DBUtils.save(QUuidList.collectionName, uuid);
            }
        }
        checkMessage.addData(QDevice.uuid, newUuid);

        Document dbDevice = DBUtils.find(QDevice.collectionName, DocumentLib.newDoc("uuid", uuid));
        if (dbDevice != null) {
            checkMessage.setSuccess(false);
        } else {
            device.put("create_date", new Date());
            device.put("online", false);
            DBUtils.save(QDevice.collectionName, device);
            checkMessage.addData("id", DocumentLib.getID(device));
        }
        return checkMessage.toString();
    }

    @Autowired
    private DevicePushService devicePushService;

    @ResponseBody
    @PostMapping(value = "pushToDevice/{uuid}")
    public String pushToDevice(@PathVariable("uuid") String uuid, @RequestParam String action, HttpServletRequest request) {
        CheckMessage checkMessage = CheckMessage.newInstance();
        try {
            ObjectNode pushObject = (ObjectNode) JsonLib.parseJSON(action);
            pushObject.put("uuid", uuid);
            devicePushService.pushToDevice(pushObject);
        } catch (Exception e) {
            checkMessage.setSuccess(false);
            return checkMessage.toString();
        }
        return checkMessage.toString();
    }

    @ResponseBody
    @RequestMapping(value = "pushQueryConfig/{uuid}")
    public String pushQueryConfig(@PathVariable("uuid") String uuid) {
        CheckMessage checkMessage = CheckMessage.newInstance();
        devicePushService.pushToDevice(uuid, "query_config");
        return checkMessage.toString();
    }

    @ResponseBody
    @RequestMapping(value = "checkControlPwd")
    public String checkControlPwd(@RequestParam String password) {
        CheckMessage checkMessage = CheckMessage.newInstance();

        Document janus = QJanus.get();
        String encodedPassword = DocumentLib.getString(janus, "control_password");
        checkMessage.setSuccess(DigestLib.getPasswordEncoder().matches(password, encodedPassword));

        return checkMessage.toString();
    }

    @ResponseBody
    @PostMapping(value = "remove")
    public String remove(@RequestParam String id) {
        Document device = DBUtils.findByID(QDevice.collectionName, id);
        if (device != null) {
            String uuid = DocumentLib.getString(device, "uuid");
            if (StringLib.isNotEmpty(uuid)) {
                deviceService.removeDeviceByUUID(uuid);
            } else {
                DBUtils.deleteOne(QDevice.collectionName, DocumentLib.newDoc("id", id));
            }
        }
        return CheckMessage.newInstance().toString();
    }

    @ResponseBody
    @PostMapping(value = "checkLicences")
    public String checkLicences() {
        int licences = DocumentLib.getInt(QJanus.get(), "licences");

        Long count = DBUtils.count("device");

        if (count >= licences) {
            return "false";
        } else {
            return "true";
        }
    }

    private String createUuid(String source) {
        String uuid = DigestLib.md5Hex(source);
        uuid = StringLib.substring(uuid, 0, 16).toUpperCase();
        uuid = Joiner.on("-").join(Splitter.fixedLength(4).split(uuid));
        return uuid;
    }

    @ResponseBody
    @GetMapping(value = "availableUUID")
    public String availableUUID() {
        CheckMessage cm = new CheckMessage();
        List<Document> uuidList = DBUtils.list(QUuidList.collectionName,
                DocumentLib.newDoc(QUuidList.use, false),
                DocumentLib.newDoc(QUuidList.uuid, 1));

        List<String> list = Lists.newArrayList();
        uuidList.stream().forEach(item -> {
            list.add(DocumentLib.getString(item, QUuidList.uuid));
        });
        cm.addData("result", list);
        return cm.toString();
    }

    @ResponseBody
    @PostMapping(value = "saveExchangeCode")
    public String saveExchangeCode(String uuid, String data) {
        data = StringLib.decodeURI(data);
        Document update = DocumentLib.parse(data);
        DBUtils.updateOne(QDataExchange.collectionName,
                DocumentLib.newDoc("uuid", uuid),
                DocumentLib.new$Set(update),
                true);
        CacheUtils.deleteLike( uuid);
        return CheckMessage.newInstance().toString();
    }

    @ResponseBody
    @PostMapping(value = "updateDevice")
    public String updateDevice(String uuid, String entity) {
        CheckMessage checkMessage = new CheckMessage();
        Document device = DocumentLib.parse(entity);
        DBUtils.updateOne(QDevice.collectionName, DocumentLib.newDoc("uuid", uuid), DocumentLib.new$Set(device));
        // 移除设备定义缓存
        CacheUtils.deleteLike("classification_datastruc_");
        CacheUtils.deleteLike(uuid);
        return checkMessage.toString();
    }

    @ResponseBody
    @GetMapping(value = "timeline")
    public String timeline(String uuid, String date_type, String start, String end) {
        DeviceTimelineDataGetBean getDeviceTimelineBean = new DeviceTimelineDataGetBean(uuid, date_type, start, end);
        return JsonLib.toJSON(getDeviceTimelineBean.getTimelineDataList()).toString();
    }

    @ResponseBody
    @GetMapping(value = "getDeviceName")
    public String getDeviceName(String uuid){
        Document device=DBUtils.find(QDevice.collectionName,DocumentLib.newDoc("uuid",uuid), Projections.include("baseInfo.name"));
        return DocumentLib.getString(device,"baseInfo.name");
    }
}
