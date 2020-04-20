package com.cynovan.janus.base.config.service;

import com.cynovan.janus.base.user.jdo.QRole;
import com.cynovan.janus.base.user.jdo.QTeam;
import com.cynovan.janus.base.user.jdo.QUser;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.cynovan.janus.base.utils.UserUtils;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import org.bson.Document;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class SecurityService {

    public boolean hasRight(String appId, int menuIndex, String rightName) {
        if (UserUtils.isSuperUser()) {
            return true;
        }

        Document userInfo = UserUtils.getUser();
        if (userInfo != null) {
            String key = StringLib.join(appId, "@", menuIndex, "@", rightName);
            List userFunctionRightPermission = DocumentLib.getList(userInfo, "userFunctionRightPermission");
            if (userFunctionRightPermission != null) {
                if (userFunctionRightPermission.contains(key)) {
                    return true;
                }
            }
        }

        return false;
    }

    public Document getDataRightQuery(String collectionName) {
        Document query = DocumentLib.newDoc();
        if (UserUtils.isSuperUser() == false) {
            Document userInfo = UserUtils.getUser();
            if (userInfo != null) {
                if (StringLib.equalsAny(collectionName, "user", "device")) {
                    String userDataPermissionType = DocumentLib.getString(userInfo, "userDataPermissionType");
                    if (!StringLib.equals(userDataPermissionType, QRole.RIGHT_ALLDATA)) {
                        /*部门 或者 部门以下, 针对部门进行筛选 */
                        List userTeamRightPermission = DocumentLib.getList(userInfo, "userTeamRightPermission");
                        query.put("team.code", DocumentLib.newDoc("$in", userTeamRightPermission));
                    }
                }
            }
        }
        return query;
    }

    public void recalcSecurity() {
        List<Document> userList = DBUtils.list(QUser.collectionName);

        /*得到所有的角色信息,用作下面的计算*/
        List<Document> roleList = DBUtils.list(QRole.collectionName);
        Map<String, Document> roleMap = Maps.newHashMap();
        roleList.stream().forEach(role -> {
            String roleId = DocumentLib.getID(role);
            roleMap.put(roleId, role);
        });

        /*得到所有的部门信息,用作下级部门的筛选*/
        List<Document> teamList = DBUtils.list(QTeam.collectionName);

        for (int i = 0; i < userList.size(); i++) {
            Document userInfo = userList.get(i);
            String userName = DocumentLib.getString(userInfo, "userName");

            Document userUpdate = DocumentLib.newDoc();

            //存储用户功能权限。moduleName@view
            Set<String> userFunctionRightPermission = Sets.newHashSet();

            //存储用户数据权限。所有数据/团队数据/团队以及子团队数据
            Set<String> userDataRightPermission = Sets.newHashSet();

            //计算多个角色合并的团队 用于过滤数据的
            Set<String> userTeamRightPermission = Sets.newHashSet();

            Set<String> updateUserRoleList = Sets.newHashSet();
            Set<String> updateUserRoleNameList = Sets.newHashSet();

            List userRoleList = DocumentLib.getList(userInfo, "roles");//拿到第i个用户的全部角色
            for (int roleIdx = 0; roleIdx < userRoleList.size(); roleIdx++) {//遍历他拥有的角色
                Document targetRoleDoc = (Document) userRoleList.get(roleIdx);
                String targetRoleId = DocumentLib.getString(targetRoleDoc, "id");
                Document targetRole = roleMap.get(targetRoleId);
                if (targetRole != null) {
                    /*重新计算用户的Role ID，以及Role Name*/
                    updateUserRoleList.add(targetRoleId);
                    String roleName = DocumentLib.getString(targetRole, "name");
                    if (StringLib.isNotEmpty(roleName)) {
                        updateUserRoleNameList.add(roleName);
                    }

                    List perms = DocumentLib.getList(targetRole, "permission");//功能权限
                    perms.stream().forEach(item -> {
                        String functionCode = StringLib.toString(item);
                        if (StringLib.isNotEmpty(functionCode)) {
                            userFunctionRightPermission.add(functionCode);
                        }
                    });

                    userDataRightPermission.add(targetRole.getString("dataPermission"));//角色的数据权限

                    List attachTeam = DocumentLib.getList(targetRole, "attachTeam");//角色的附加团队
                    attachTeam.stream().forEach(item -> {
                        String teamcode = StringLib.toString(item);
                        if (StringLib.isNotEmpty(teamcode)) {
                            userTeamRightPermission.add(teamcode);
                        }
                    });
                }
            }

            userUpdate.put("roleName", updateUserRoleNameList);
            userUpdate.put("userFunctionRightPermission", userFunctionRightPermission);

            /*计算用户的最高数据权限*/
            String userDataRightPermissionValue = "";
            if (userDataRightPermission.contains(QRole.RIGHT_ALLDATA)) {
                userDataRightPermissionValue = QRole.RIGHT_ALLDATA;
            } else if (userDataRightPermission.contains(QRole.RIGHT_TEAM_WITH_SUB)) {
                userDataRightPermissionValue = QRole.RIGHT_TEAM_WITH_SUB;
            } else if (userDataRightPermission.contains(QRole.RIGHT_TEAM)) {
                userDataRightPermissionValue = QRole.RIGHT_TEAM;
            }
            userUpdate.put("userDataPermissionType", userDataRightPermissionValue);

            if (StringLib.equals(userDataRightPermissionValue, QRole.RIGHT_TEAM_WITH_SUB)) {
                userTeamRightPermission.addAll(getAllSubTeam(teamList, DocumentLib.getString(userInfo, "team.code")));
            } else {
                userTeamRightPermission.add(DocumentLib.getString(userInfo, "team.code"));
            }
            userUpdate.put("userTeamRightPermission", userTeamRightPermission);

            DBUtils.updateOne(QUser.collectionName, DocumentLib.newDoc("userName", userName), DocumentLib.new$Set(userUpdate));
        }
        UserUtils.getUser(true);
    }

    private Set<String> getAllSubTeam(List<Document> teamList, String teamCode) {
        Set<String> subTeamCodeSet = Sets.newHashSet();
        teamList.stream().forEach(team -> {
            String key = DocumentLib.getString(team, "key");
            if (StringLib.contains(key, teamCode)) {
                String code = DocumentLib.getString(team, "code");
                subTeamCodeSet.add(code);
            }
        });
        return subTeamCodeSet;
    }
}
