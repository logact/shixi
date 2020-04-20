package com.cynovan.janus.base.arch.bean;

import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;

import java.util.List;
import java.util.Map;

/**
 * Created by Aric on 2016/11/23.
 */
public class CheckMessage {

    private boolean success = true;
    private List<String> messages = Lists.newArrayList();
    private Map<String, Object> datas = Maps.newHashMap();

    public static CheckMessage newInstance() {
        return new CheckMessage();
    }

    public boolean isSuccess() {
        return success;
    }

    public CheckMessage setSuccess(boolean success) {
        this.success = success;
        return this;
    }

    public List<String> getMessages() {
        return messages;
    }

    public void setMessages(List<String> messages) {
        this.messages = messages;
    }

    public Map<String, Object> getDatas() {
        return datas;
    }

    public void setDatas(Map<String, Object> datas) {
        this.datas = datas;
    }

    public CheckMessage addMessage(String _message) {
        if (StringLib.isNotEmpty(_message)) {
            this.messages.add(_message);
        }
        return this;
    }

    public CheckMessage addData(String key, Object value) {
        this.datas.put(key, value);
        return this;
    }

    @Override
    public String toString() {
        return JsonLib.toString(this);
    }
}
