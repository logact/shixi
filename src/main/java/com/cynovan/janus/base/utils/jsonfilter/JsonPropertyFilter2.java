package com.cynovan.janus.base.utils.jsonfilter;

import com.fasterxml.jackson.annotation.JsonFilter;
import com.fasterxml.jackson.databind.ser.impl.SimpleBeanPropertyFilter;

@JsonFilter(value = "Filter2")
public class JsonPropertyFilter2 extends SimpleBeanPropertyFilter {

}
