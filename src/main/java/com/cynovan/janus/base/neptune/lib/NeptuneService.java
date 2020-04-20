package com.cynovan.janus.base.neptune.lib;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.device.jdo.QUuidList;
import com.cynovan.janus.base.neptune.mq.NeptuneMQConnService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class NeptuneService {

    @Autowired
    private NeptuneHttpService neptuneHttpService;

    @Autowired
    private NeptuneMQConnService neptuneMQService;

    public CheckMessage checkConnNeptune() {
        JsonNode dataNode = HttpLib.get(neptuneHttpService.getURL("janus/conn"));
        CheckMessage checkMessage = CheckMessage.newInstance();
        if (dataNode == null) {
            checkMessage.setSuccess(false);
        }
        return checkMessage;
    }

    public CheckMessage checkJanusState() {
        Document janus = QJanus.get();
        boolean initialize = DocumentLib.getBoolean(janus, QJanus.initialize);
        CheckMessage checkMessage = CheckMessage.newInstance();
        if (initialize == false) {
            checkMessage.setSuccess(false);
        }
        return checkMessage;
    }

    public JsonNode checkToken(String token) {
        Map<String, String> params = Maps.newHashMap();
        params.put("token", token);
        JsonNode result = HttpLib.post(neptuneHttpService.getURL("janus/checkToken"), params);
        return result;
    }

    public JsonNode bindNeptune(String token, String password, String control_password) {
        Map<String, String> params = Maps.newHashMap();
        params.put("token", token);
        Document janus = QJanus.get();
        if (janus == null) {
            janus = DocumentLib.newDoc();
        }
        // 密码
        janus.put(QJanus.password, password);
        janus.put(QJanus.control_password, control_password);
        String janusData = StringLib.encodeURI(janus.toJson());
        params.put("janus", janusData);

        /*防止恶意提交bind*/
        String janus_id = DocumentLib.getID(janus);
        params.put("validateToken", DigestLib.md5Hex(new StringBuilder().append("@CNV").append(janus_id).append("@CNV")
                .toString()));

        JsonNode result = HttpLib.post(neptuneHttpService.getURL("janus/bind"), params);

        if (JsonLib.getBoolean(result, "success")) {
            // 注册成功
            janus.put(QJanus.initialize, true);
            // token

            // encode
            janus.put(QJanus.password, DigestLib.getPasswordEncoder().encode(password));
            janus.put(QJanus.control_password, DigestLib.getPasswordEncoder().encode(control_password));

            janus.put(QJanus.token, token);

            JsonNode datas = result.get("datas");
            //uuid
            List<Document> list = Lists.newArrayList();
            ArrayNode uuids = JsonLib.getArrayNode(datas, QJanus.uuids);
            for (JsonNode uuid : uuids) {
                Document object = new Document();
                object.put("uuid", uuid.asText());
                object.put("use", false);
                list.add(object);
            }
            DBUtils.insertMany(QUuidList.collectionName, list);

            // 注册时间 与服务器的一致
            janus.put(QJanus.bind_date, JsonLib.getString(datas, QJanus.bind_date));
            // 设备可接入数量
            janus.put(QJanus.licences, JsonLib.getInteger(datas, QJanus.licences));
            janus.put(QJanus.name, JsonLib.getString(datas, QJanus.name));
            janus.put(QJanus.remarks, JsonLib.getString(datas, QJanus.remarks));
            // 团队信息
            janus.put(QJanus.company_id, JsonLib.getString(datas, QJanus.company_id));
            janus.put(QJanus.company_name, JsonLib.getString(datas, QJanus.company_name));
            janus.put(QJanus.company_token, JsonLib.getString(datas, QJanus.company_token));

            DBUtils.save(QJanus.collectionName, janus);

            try {
                // 启动mq
                neptuneMQService.conn();
            } catch (Exception e) {

            }
        }

        return result;
    }

    @Scheduled(fixedRate = 5000)
    public void reportCurrentTime() {

    }
}
