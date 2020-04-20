package com.cynovan.janus.addons.userManagement.team.controller;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.service.SecurityService;
import com.cynovan.janus.base.user.jdo.QTeam;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.RandomUtils;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Maps;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.MongoRegexCreator;
import org.springframework.data.mongodb.core.query.MongoRegexCreator.MatchMode;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import static com.cynovan.janus.base.utils.DateUtils.getDateTime;

@RestController
@RequestMapping(value = "team")
public class TeamWeb {

    @Autowired
    private SecurityService securityService;

    @PostMapping(value = "save")
    public String saveTeam(@RequestParam String entity) {
        CheckMessage checkMessage = CheckMessage.newInstance();
        entity = StringLib.decodeURI(entity);
        Document team = Document.parse(entity);
        team.put("time", getDateTime());

        // 得到所选的上级团队的key
        String parentTeamCode = DocumentLib.getString(team, "team.code");
        Document queryObject = new Document("code", parentTeamCode);
        Document parentTeamObj = DBUtils.find(QTeam.collectionName,queryObject);
        String parentTeamKey = DocumentLib.getString(parentTeamObj, "key");

        // 以有无id标识是新增还是编辑
        String teamId = DocumentLib.getID(team);
        if (StringLib.isEmpty(teamId)) {
            String code = generateCode();
            team.put("code", code);

            // 新增时检查团队名是否重复
            String teamName = DocumentLib.getString(team, "name");
            Document exitTeam = DBUtils.find(QTeam.collectionName, DocumentLib.newDoc("name", teamName));
            if (exitTeam != null) {
                checkMessage.setSuccess(false);
                checkMessage.addData("reason", "该团队已存在!");
                return checkMessage.toString();
            }
        } else {
            // 检查是否存在A->B->C->A的情况
            boolean check = checkKeyChange(DocumentLib.getString(team, "code"), parentTeamKey);
            if (!check) {
                checkMessage.setSuccess(false);
                checkMessage.addData("reason", "保存失败!");
                return checkMessage.toString();
            }
        }

        // 生成当前团队的key
        String code = DocumentLib.getString(team, "code");
        if (StringLib.isNotEmpty(parentTeamCode)) {
            String key = parentTeamKey + ":" + code;
            team.put("key", key); // 有上级团队:key=上级团队的key+自己的code
        } else {
            team.put("key", code);// 无上级团队:key=code
        }

        DBUtils.save(QTeam.collectionName, team);
        securityService.recalcSecurity();

        checkMessage.addData("id", DocumentLib.getID(team));
        return checkMessage.toString();
    }

    @PostMapping(value = "delete")
    public String remove(@RequestParam String id) {
        CheckMessage checkMessage = CheckMessage.newInstance();
        Document team = DBUtils.findByID(QTeam.collectionName, id);
        String code = DocumentLib.getString(team, "code");

        if (team != null) {
            List<Document> subLists = DBUtils.list(QTeam.collectionName, DocumentLib.newDoc("team.code", code));
            if (subLists.size() > 0) { // 该团队存在下级团队
                checkMessage.setSuccess(false);
                return checkMessage.toString();
            } else {
                DBUtils.deleteOne(QTeam.collectionName, DocumentLib.newDoc("id", id));
                recalcTeam();// Recalculate the team in the list
            }
        }
        return checkMessage.toString();
    }

    private boolean checkKeyChange(String code, String parentTeamKey) {
        boolean result = true;

        // 得到当前团队和它的所有下级团队
        List<Document> subLists = DBUtils.list(QTeam.collectionName, DocumentLib.newDoc("key",
                Pattern.compile(MongoRegexCreator.INSTANCE.toRegularExpression(code, MatchMode.CONTAINING))));
        for (int i = 0; i < subLists.size(); i++) {
            Document subitem = subLists.get(i);
            String key = DocumentLib.getString(subitem, "key");
            String oldKey = code + StringLib.substringAfter(key, code);
            String newKey = StringLib.joinWith(":", parentTeamKey, oldKey);
            subitem.put("key", newKey);
            if (StringLib.contains(parentTeamKey, code)) { // 如果所选择的上级团队的key中包含此团队的code,则存在A->B->C->A现象
                result = false;
                break;
            }
        }
        if (result) {
            for (int i = 0; i < subLists.size(); i++) {
                Document subitem = subLists.get(i);
                DBUtils.updateOne(QTeam.collectionName, DocumentLib.newDoc("code", DocumentLib.getString(subitem, "code")),
                        DocumentLib.new$Set("key", DocumentLib.getString(subitem, "key"))); // 更新当前团队和它的所有下级团队的key
            }
        }
        return result;
    }

    private static String generateCode() {
        String code = RandomUtils.uuid4char();   // generate code
        if (DBUtils.find("team", DocumentLib.newDoc("code", code)) != null) {  // ensure code is unique
            code = generateCode();
        }
        return code;
    }

    private void recalcTeam() {
        updateHasTeamFieldList("user");
        updateHasTeamFieldList("device");
    }

    private void updateHasTeamFieldList(String targetCollectionName) {
        List<Document> teamList = DBUtils.list(QTeam.collectionName);
        Map<String, Document> teamMap = Maps.newHashMap();
        for (int i = 0; i < teamList.size(); i++) { // 遍历团队列表
            Document teamItem = teamList.get(i);
            String code  = DocumentLib.getString(teamItem,"code");
            teamMap.put(code, teamItem); // 用团队信息的code作为key生成新的tempMap
        }

        List<Document> targetList = DBUtils.list(targetCollectionName);
        for (int i = 0; i < targetList.size(); i++) { // 遍历传进来需要update的表
            Document targetItem = targetList.get(i);
            String id = DocumentLib.getString(targetItem, "id");

            Document teamUpdate = DocumentLib.newDoc();
            Document teamInfo = DocumentLib.newDoc();
            String oldTeamCode = DocumentLib.getString(targetItem, "team.code");// 得到需要update的表中的team code

            Document targetTeam = teamMap.get(oldTeamCode); // 在团队表生成的teamMap中查询是否存在这个code的team
            if (targetTeam != null) {
                teamInfo.put("code", oldTeamCode);
                teamInfo.put("name", DocumentLib.getString(targetItem, "team.name"));
            }

            teamUpdate.put("team", teamInfo);// update targetList's team field
            DBUtils.updateOne(targetCollectionName, DocumentLib.newDoc("id", id), DocumentLib.new$Set(teamUpdate));
        }
    }

}
