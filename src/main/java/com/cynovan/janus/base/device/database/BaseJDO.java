package com.cynovan.janus.base.device.database;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mongodb.DBObject;

/**
 * Created by Aric on 2017/4/26.
 */
public abstract class BaseJDO {

    @JsonIgnore
    public static final String id = "id";
    @JsonIgnore
    public static final String name = "name";

    public void createIndex() {

    }

    public void onCollectionUpdate(String exec, DBObject options) {

    }

    public boolean autoRemoveData() {
        return false;
    }
}
