package com.cynovan.janus.addons.api.controller;

import com.cynovan.janus.addons.api.controller.device_conn.ApiConnection;
import com.cynovan.janus.addons.api.controller.device_conn.ApiConnectionFactory;
import com.cynovan.janus.addons.api.dto.HttpApiResponse;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.service.DataAccessCreateService;
import com.cynovan.janus.base.device.jdo.QDataExchange;
import com.cynovan.janus.base.device.jdo.QDataTag;
import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.device.jdo.QUuidList;
import com.cynovan.janus.base.device.push.DevicePushService;
import com.cynovan.janus.base.device.service.DeviceService;
import com.cynovan.janus.base.devicedata.jdo.QDeviceData;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.user.jdo.QTeam;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping(value = "api/device")
public class DeviceApiWeb {

    @Autowired
    private I18nService i18nService;

    @PostMapping(value = "create")
    public String devicecreate(@RequestParam String token,
                               @RequestParam String name,
                               String uuid,
                               String tag,
                               String remarks,
                               String team_name,
                               Boolean sync_neptune) {
        HttpApiResponse response = HttpApiResponse.checkToken(token);

        if (response.getCode() > 200) {
            return response.toString();
        }
        // task 1206 check uuid
        uuid = StringLib.trim(uuid);
        Document uuidObject = DocumentLib.newDoc();
        if (StringLib.isNotEmpty(uuid)) {
            Document query = new Document();
            query.put(QUuidList.use, false);
            query.put(QUuidList.uuid, uuid);
            uuidObject = DBUtils.find(QUuidList.collectionName, query);
            if (uuidObject == null) {
                response.setCode(HttpApiResponse.USED_NOT_BELONG);
                response.setMessage(i18nService.getValue("传入的UUID不属于该Janus或已经被使用", "api.uuid.unavailable", "system"));
                return response.toString();
            }
        } else {
            uuidObject = DBUtils.find(QUuidList.collectionName, DocumentLib.newDoc("use", false));
            String notUsedUuid = DocumentLib.getString(uuidObject, "uuid");
            if (StringLib.isEmpty(notUsedUuid)) {
                response.setCode(HttpApiResponse.ARRIVE_UPPER_LIMIT);
                response.setMessage(i18nService.getValue("设备可接入数量已达到上限", "api.device.upper.limit", "system"));
                return response.toString();
            }
        }

        Document device = DocumentLib.newDoc();
        device.put("uuid", DocumentLib.getString(uuidObject, "uuid"));
        device.put("uuid_type", "1");

        String tagArr[] = {};
        List<String> targetTagArr = Lists.newArrayList();

        if (StringLib.isNotEmpty(tag)) {
            // replace zh ， to en ,
            tag = tag.replace("，", StringLib.SPLIT_3);
            tagArr = StringLib.split(tag, StringLib.SPLIT_3);
            if (tagArr.length > 0) {
                for (int i = 0; i < tagArr.length; i++) {
                    String target = StringLib.trim(tagArr[i]);
                    if (StringLib.isNotEmpty(target)) {
                        targetTagArr.add(target);
                        // add to dataTag
                        DBUtils.updateOne(QDataTag.collectionName, DocumentLib.newDoc("key", QDataTag.key),
                                DocumentLib.newDoc("$addToSet", DocumentLib.newDoc(QDataTag.tags, target)), true);
                    }
                }

            }
        }
        device.put("tag", targetTagArr);

        Document infoObject = new Document();
        infoObject.put("name", name);
        infoObject.put("remarks", remarks);

        device.put("baseInfo", infoObject);
        device.put("create_date", new Date());
        device.put("online", false);

        if (sync_neptune != null) {
            device.put("sync_neptune", sync_neptune);
        } else {
            device.put("sync_neptune", false);
        }

        if (StringLib.isNotEmpty(team_name)) {
            Document teamInfo = DBUtils.find(QTeam.collectionName, DocumentLib.newDoc("name", team_name));
            if (teamInfo != null) {
                Document addTeam = DocumentLib.newDoc();
                addTeam.put("code", DocumentLib.getString(teamInfo, "code"));
                addTeam.put("name", DocumentLib.getString(teamInfo, "name"));
                device.put("team", addTeam);
            }
        }

        DBUtils.save(QDevice.collectionName, device);
        // update uuidList
        uuidObject.put("use", true);
        DBUtils.save(QUuidList.collectionName, uuidObject);

        device.remove("id");
        response.setData((ObjectNode) JsonLib.parseJSON(device.toJson()));
        return response.toString();
    }

    @PostMapping(value = "edit")
    public String deviceedit(@RequestParam String token,
                             @RequestParam String uuid,
                             String name,
                             String tag,
                             String remarks,
                             String team_name,
                             Boolean sync_neptune) {
        HttpApiResponse response = HttpApiResponse.checkToken(token);

        if (response.getCode() > 200) {
            return response.toString();
        }
        uuid = StringLib.trim(uuid);

        Document device = DBUtils.find(QDevice.collectionName,
                DocumentLib.newDoc(QDevice.uuid, uuid));
        if (device == null) {
            response.setCode(HttpApiResponse.NOT_EXISTS);
            response.setMessage(i18nService.getValue("设备不存在", "api.device.null", "system"));
            return response.toString();
        }


        String tagArr[] = {};
        List<String> targetTagArr = Lists.newArrayList();

        if (StringLib.isNotEmpty(tag)) {
            // replace zh ， to en ,
            tag = tag.replace("，", StringLib.SPLIT_3);
            tagArr = StringLib.split(tag, StringLib.SPLIT_3);
            if (tagArr.length > 0) {
                for (int i = 0; i < tagArr.length; i++) {
                    String target = StringLib.trim(tagArr[i]);
                    if (StringLib.isNotEmpty(target)) {
                        targetTagArr.add(target);
                        // add to dataTag
                        DBUtils.updateOne(QDataTag.collectionName, DocumentLib.newDoc("key", QDataTag.key),
                                DocumentLib.newDoc("$addToSet", DocumentLib.newDoc(QDataTag.tags, target)), true);
                    }
                }

            }
        }
        device.put("tag", targetTagArr);

        Document infoObject = new Document();
        Document baseInfo = DocumentLib.getDocument(device, "baseInfo");
        if (StringLib.isNotEmpty(name)) {
            infoObject.put("name", name);
        } else {
            infoObject.put("name", DocumentLib.getString(baseInfo, "name"));
        }
        if (null != remarks) {
            infoObject.put("remarks", remarks);
        } else {
            infoObject.put("remarks", DocumentLib.getString(baseInfo, "remarks"));
        }


        device.put("baseInfo", infoObject);
        device.put("edit_date", new Date());
        device.put("online", false);

        if (sync_neptune != null) {
            device.put("sync_neptune", sync_neptune);
        } else {
            device.put("sync_neptune", false);
        }

        if (StringLib.isNotEmpty(team_name)) {
            Document teamInfo = DBUtils.find(QTeam.collectionName, DocumentLib.newDoc("name", team_name));
            if (teamInfo != null) {
                Document addTeam = DocumentLib.newDoc();
                addTeam.put("code", DocumentLib.getString(teamInfo, "code"));
                addTeam.put("name", DocumentLib.getString(teamInfo, "name"));
                device.put("team", addTeam);
            }
        }
        DBUtils.updateOne(QDevice.collectionName,
                DocumentLib.newDoc(QDevice.uuid, uuid),
                DocumentLib.new$Set(device));

        device.remove("id");
        response.setData((ObjectNode) JsonLib.parseJSON(device.toJson()));
        return response.toString();
    }

    @GetMapping(value = "data")
    public String devicedata(@RequestParam String token,
                             @RequestParam String uuid,
                             @RequestParam String start,
                             @RequestParam String end,
                             String page,
                             String fields) {
        HttpApiResponse response = HttpApiResponse.checkToken(token);
        if (response.getCode() > 200) {
            return response.toString();
        }

        Document device = DBUtils.find(QDevice.collectionName,
                DocumentLib.newDoc(QDevice.uuid, uuid),
                DocumentLib.newDoc("_id", 1));
        if (device == null) {
            response.setCode(HttpApiResponse.NOT_EXISTS);
            response.setMessage(i18nService.getValue("设备不存在", "api.device.null", "system"));
            return response.toString();
        }
        Date startDate = null, endDate = null;
        try {
            startDate = DateUtils.parseDate(start);
            endDate = DateUtils.parseDate(end);
        } catch (Exception e) {
            response.setCode(HttpApiResponse.DATETIME_ERROR);
            response.setMessage(i18nService.getValue("时间格式不正确", "api.wrong.date", "system"));
            return response.toString();
        }

        int pageInt = StringLib.toInteger(page);
        if (pageInt < 1) {
            pageInt = 1;
        }
        int count = 100;

        Document query = DocumentLib.newDoc();
        query.put("uuid", uuid);

        Document timeFilter = DocumentLib.newDoc();
        timeFilter.put("$gte", startDate);
        timeFilter.put("$lte", endDate);
        query.put("time", timeFilter);

        Document projector = DocumentLib.newDoc();
        projector.put("_id", 0);
//        projector.put("action", 0);
        projector.put("create_date", 1);
//        projector.put("uuid", 0);
        if (StringLib.isNotEmpty(fields)) {
            fields = StringLib.replace(fields, "，", ",");
            String[] fieldsArray = StringLib.split(fields, ",");
            Set<String> fieldSets = Sets.newHashSet(fieldsArray);
            fieldSets.stream().forEach(field -> {
                if (StringLib.isNotEmpty(field)) {
                    projector.put(StringLib.join("data.", field), 1);
                }
            });
        } else {
            projector.put("data", 1);
        }

        long total = DBUtils.count(QDeviceData.collectionName, query);
        ObjectNode data = JsonLib.createObjNode();
        data.put("total", total);
        data.put("page", pageInt);
        data.put("count", count);

        List<Document> datas = DBUtils.list(QDeviceData.collectionName, query, projector, DocumentLib.newDoc("time", 1), count, (pageInt - 1) * count);

        data.set("datas", JsonLib.toJSON(datas));
        response.setData(data);

        return response.toString();
    }

    @Autowired
    private DeviceService deviceService;

    @RequestMapping(value = "remove", method = {RequestMethod.POST, RequestMethod.DELETE})
    public String deviceremove(@RequestParam String token, @RequestParam String uuid) {
        HttpApiResponse response = HttpApiResponse.checkToken(token);
        if (response.getCode() > 200) {
            return response.toString();
        }
        deviceService.removeDeviceByUUID(uuid);
        return response.toString();
    }

    @GetMapping(value = "list")
    public String devicelist(@RequestParam String token,
                             String page) {
        HttpApiResponse response = HttpApiResponse.checkToken(token);
        if (response.getCode() > 200) {
            return response.toString();
        }
        int pageInt = StringLib.toInteger(page);
        if (pageInt < 1) {
            pageInt = 1;
        }
        int count = 15;
        Document query = DocumentLib.newDoc();
        ObjectNode data = JsonLib.createObjNode();


        long total = DBUtils.count(QDevice.collectionName, query);
        data.put("total", total);
        data.put("page", page);
        data.put("count", count);

        List<Document> devices = DBUtils.list(QDevice.collectionName, query, null, DocumentLib.newDoc("_id", -1), count, (pageInt - 1) * count);
        data.set("devices", JsonLib.toJSON(devices));
        response.setData(data);
        return response.toString();
    }

    @GetMapping(value = "query")
    public String devicequery(@RequestParam String token, @RequestParam String uuid) {
        HttpApiResponse response = HttpApiResponse.checkToken(token);
        if (response.getCode() > 200) {
            return response.toString();
        }

        Document device = DBUtils.find(QDevice.collectionName, DocumentLib.newDoc(QDevice.uuid, uuid));
        if (device == null) {
            response.setCode(HttpApiResponse.NOT_EXISTS);
            response.setMessage(i18nService.getValue("设备不存在", "api.device.null", "system"));
            return response.toString();
        }

        Document data = new Document();
        data.put("uuid", DocumentLib.getString(device, "uuid"));

        Document baseInfo = DocumentLib.getDocument(device, "baseInfo");
        data.put("name", DocumentLib.getString(baseInfo, "name"));

        String remarks = DocumentLib.getString(baseInfo, "remarks");
        if (remarks != null) {
            data.put("remarks", remarks);
        }
        String online = DocumentLib.getString(device, "online");
        data.put("online", StringLib.equals(online, "true"));

        data.put("create_date", DateUtils.formatDateTime(device.getDate("create_date")));
        data.put("tag", DocumentLib.getList(device, "tag"));

        response.setData((ObjectNode) JsonLib.parseJSON(data.toJson()));

        return response.toString();
    }

    @PostMapping(value = "connection")
    public String deviceconnection(@RequestParam String token,
                                   @RequestParam String uuid,
                                   @RequestParam String conn_type,
                                   HttpServletRequest request) {
        HttpApiResponse response = HttpApiResponse.checkToken(token);
        if (response.getCode() > 200) {
            return response.toString();
        }
        Document device = DBUtils.find(QDevice.collectionName, DocumentLib.newDoc(QDevice.uuid, uuid));
        if (device == null) {
            response.setCode(HttpApiResponse.NOT_EXISTS);
            response.setMessage(i18nService.getValue("设备不存在", "api.device.null", "system"));
            return response.toString();
        }

        Document dataExchange = DocumentLib.newDoc();
        dataExchange.put("uuid", uuid);
        dataExchange.put("conn_type", conn_type);

        // 数据
        ApiConnection connection = ApiConnectionFactory.createConnection(conn_type, token);
        CheckMessage message = new CheckMessage();
        Document connInfo = connection.getConnInfo(request, message);
        if (!message.isSuccess()) {
            response.setCode(StringLib.toInteger(message.getDatas().get("code")));
            response.setMessage(message.getMessages().get(0));
            return response.toString();
        }
        switch (conn_type) {
            case "triton":
                connInfo.put("uuid", uuid);
                dataExchange.put("conn_info_triton", connInfo);
                break;
            case "modbus_slave":
                dataExchange.put("conn_info_modbus_master", connInfo);
                break;
            case "modbus_master":
                dataExchange.put("conn_info_modbus_slave", connInfo);
                break;
            default:
                dataExchange.put("conn_info_" + conn_type, connInfo);
        }

        // 测试数据
        String testdata = request.getParameter("testdata");
        String output = request.getParameter("output");
        ObjectNode jsonObject = JsonLib.createObjNode();
        jsonObject.put("speed", "30");
        jsonObject.put("temperature", "50");

        if (StringLib.isEmpty(testdata)) {
            testdata = StringLib.toString(jsonObject);
        }
        dataExchange.put("testdata", StringLib.toString(JsonLib.parseJSON(testdata)));

        if (StringLib.isEmpty(output)) {
            output = StringLib.toString(jsonObject);
        }
        dataExchange.put("output", StringLib.toString(JsonLib.parseJSON(output)));

        DBUtils.updateOne(QDataExchange.collectionName,
                DocumentLib.newDoc(QDevice.uuid, uuid),
                DocumentLib.new$Set(dataExchange), true);

        DataAccessCreateService service = SpringContext.getBean(DataAccessCreateService.class);
        service.restart(uuid);

        return response.toString();
    }

    @Autowired
    DevicePushService devicePushService;

    @PostMapping(value = "pushdata")
    public String pushData(@RequestParam String token, @RequestParam String uuid, @RequestParam String data,
                           String callback) {
        HttpApiResponse response = HttpApiResponse.checkToken(token);
        if (response.getCode() > 200) {
            return response.toString();
        }
        Document device = DBUtils.find(QDevice.collectionName, DocumentLib.newDoc(QDevice.uuid, uuid));
        if (device == null) {
            response.setCode(HttpApiResponse.NOT_EXISTS);
            response.setMessage(i18nService.getValue("设备不存在", "api.device.null", "system"));
            return response.toString();
        }

        data = StringLib.decodeURI(data);
        ObjectNode dataNode = null;
        try {
            dataNode = (ObjectNode) JsonLib.parseJSON(data);
        } catch (Exception e) {
            response.setCode(HttpApiResponse.JSON_EXCEPTION);
            response.setMessage(i18nService.getValue("下发数据不符合JSON格式", "api.dataissue.fail.format", "system"));
            return response.toString();
        }

        ObjectNode pushObject = JsonLib.createObjNode();
        pushObject.put("uuid", uuid);
        pushObject.put("action", "update");
        pushObject.set("data", dataNode);
        devicePushService.pushToDevice(pushObject, callback);
        /*把operation_id移动到首层目录*/
        String operation_id = JsonLib.getString(dataNode, "operation_id");
        pushObject.put("operation_id", operation_id);
        response.setData(pushObject);

        return response.toString();
    }
}

