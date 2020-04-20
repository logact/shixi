package com.cynovan.janus.base.utils.bean;

import com.cynovan.janus.base.utils.DateUtils;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.DateDeserializers.DateDeserializer;

import java.io.IOException;
import java.util.Date;

public class CnvDateDeserializer extends DateDeserializer {

    private static final long serialVersionUID = 6921469038461348546L;

    @Override
    protected Date _parseDate(JsonParser arg0, DeserializationContext arg1)
            throws IOException, JsonProcessingException {
        return DateUtils.parseDate(arg0.getText());
    }
}
