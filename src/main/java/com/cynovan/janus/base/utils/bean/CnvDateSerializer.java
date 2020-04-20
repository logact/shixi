package com.cynovan.janus.base.utils.bean;

import com.cynovan.janus.base.utils.DateUtils;
import com.fasterxml.jackson.core.JsonGenerationException;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.DateSerializer;
import org.joda.time.LocalDateTime;

import java.io.IOException;
import java.util.Date;

public class CnvDateSerializer extends DateSerializer {

    private static final long serialVersionUID = -840218450390859914L;

    @Override
    public void serialize(Date value, JsonGenerator jgen, SerializerProvider provider)
            throws IOException, JsonGenerationException {
        LocalDateTime dateTime = LocalDateTime.fromDateFields(value);

        if (dateTime.getHourOfDay() == 0 && dateTime.getMinuteOfHour() == 0) {
            jgen.writeString(DateUtils.formatDate(value, DateUtils.DatePattern));
        } else {
            jgen.writeString(DateUtils.formatDate(value, DateUtils.DateTimePattern));
        }
    }
}
