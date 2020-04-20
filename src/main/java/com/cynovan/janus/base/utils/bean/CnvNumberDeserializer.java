package com.cynovan.janus.base.utils.bean;

import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;

public class CnvNumberDeserializer extends JsonDeserializer<Float> {

    @Override
    public Float deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String floatString = parser.getText();
        if (StringLib.contains(floatString, ",")) {
            floatString = StringLib.replace(floatString, ",", "");
        }
        return StringLib.toFloat(floatString);
    }
}
