package com.cynovan.janus.base.utils.bean;

import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;

public class CnvBooleanDeserializer<T extends Object> extends JsonDeserializer<Boolean> {

    @Override
    public Boolean deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        JsonToken t = jp.getCurrentToken();
        if (t == JsonToken.VALUE_TRUE) {
            return true;
        } else if (t == JsonToken.VALUE_STRING) {
            String text = jp.getText().trim();
            if (StringLib.equalsIgnoreCase("true", text) || StringLib.equalsIgnoreCase(text, "yes")
                    || StringLib.equalsIgnoreCase(text, "1")) {
                return true;
            }
        } else if (t == JsonToken.VALUE_NUMBER_INT) {
            int value = jp.getIntValue();
            if (value == 1) {
                return true;
            }
        }

        return false;
    }
}
