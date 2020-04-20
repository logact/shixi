package com.cynovan.janus.addons.userManagement.architecture.controller;

import com.cynovan.janus.base.user.jdo.QTeam;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import org.bson.Document;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping(value = "architecture")
public class ArchitectureWeb {

    @RequestMapping(value = "menu")
    public String getArchitecture() {
        List<Document> deptList = DBUtils.list(QTeam.collectionName);
        Map<String, Document> deptMap = Maps.newHashMap();
        for (int i = 0; i < deptList.size(); i++) {
            String code = deptList.get(i).getString("code");
            deptMap.put(code, deptList.get(i));
        }

        List noParentList = Lists.newArrayList();

        for (int i = 0; i < deptList.size(); i++) {
            Document dept = deptList.get(i);
            String parentTeamCode = DocumentLib.getString(dept, "team.code");
            if (StringLib.isNotEmpty(parentTeamCode)) {
                Document parentDept = deptMap.get(parentTeamCode);
                List children = DocumentLib.getList(parentDept, "children");
                if (children == null) {
                    children = DocumentLib.newList();
                }
                children.add(dept);
                parentDept.put("children", children);
            } else {
                noParentList.add(dept);
            }
        }

        return JsonLib.toJSON(noParentList).toString();
    }
}
