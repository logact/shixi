package com.cynovan.janus.base.api.document.jdo;

import com.cynovan.janus.base.device.database.BaseJDO;

public class QAPIDocument extends BaseJDO {

    public static final String collectionName = "apiDocument_zh_cn";

    public static final String name = "name";
    public static final String key = "key";
    public static final String parent = "parent";
    public static final String path = "path";   // .md 文件
    public static final String html = "html";   // .md 解析出来的html

}
