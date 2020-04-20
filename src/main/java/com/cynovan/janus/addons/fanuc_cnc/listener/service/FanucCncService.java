package com.cynovan.janus.addons.fanuc_cnc.listener.service;

import com.cynovan.janus.addons.fanuc_cnc.jdo.QFanucSubmitData;
import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.NumberLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.*;

@Component
public class FanucCncService  {

    @Autowired
    private ApplicationContext applicationContext;

    @PostConstruct
    private void ontInit() {
        MongoTemplate mongoTemplate = applicationContext.getBean(MongoTemplate.class);
        mongoTemplate.dropCollection(QFanucSubmitData.collectionName);
    }

    /*针对Fanuc CNC的数据处理*/
    public void process(DeviceDataEvent deviceDataEvent) {
        Document deviceData = deviceDataEvent.getToDbData();
        Document deviceDataObject = DocumentLib.getDocument(deviceData, "data");
        String janus_cnc_type = DocumentLib.getString(deviceData, "janus_cnc_type");
        if (StringLib.isEmpty(janus_cnc_type)) {
            janus_cnc_type = DocumentLib.getString(deviceDataObject, "janus_cnc_type");
        }

        if (StringLib.equals(janus_cnc_type, "fanuc")) {
            Document deviceDataCopy = DocumentLib.copy(deviceData);
            deviceDataCopy.put("create_date", new Date());
            DBUtils.save(QFanucSubmitData.collectionName, deviceDataCopy);

            String function_name = DocumentLib.getString(deviceDataObject, "function_name");
            String function_param = DocumentLib.getString(deviceDataObject, "function_param");

            /*显示时间的处理*/
            if (StringLib.equals(function_name, "cnc_rdtimer")) {
                long minute = DocumentLib.getLong(deviceDataObject, "minute");
                long msec = DocumentLib.getLong(deviceDataObject, "msec");
                String timeValue = transferTime(minute, msec);
                if (StringLib.equals(function_param, "0")) {
                    deviceDataObject.put("power_on_time", timeValue);
                } else if (StringLib.equals(function_param, "1")) {
                    deviceDataObject.put("operating_time", timeValue);
                } else if (StringLib.equals(function_param, "2")) {
                    deviceDataObject.put("cutting_time", timeValue);
                } else if (StringLib.equals(function_param, "3")) {
                    deviceDataObject.put("cycle_time", timeValue);
                }
            } else if (StringLib.equals(function_name, "cnc_diagnoss")) {
                String diagnoss = DocumentLib.getString(deviceDataObject, "u_cdata");
                int value = hexToInt(diagnoss);
                if (StringLib.equals(function_param, "308")) {
                    deviceDataObject.put("servo_temp_0", hexToInt(DocumentLib.getString(deviceDataObject, "u_cdatas_0")) + "℃");
                    deviceDataObject.put("servo_temp_1", hexToInt(DocumentLib.getString(deviceDataObject, "u_cdatas_1")) + "℃");
                    deviceDataObject.put("servo_temp_2", hexToInt(DocumentLib.getString(deviceDataObject, "u_cdatas_2")) + "℃");
                } else if (StringLib.equals(function_param, "403")) {
                    deviceDataObject.put("spindle_temp", value + "℃");
                } else if (StringLib.equals(function_param, "418")) {
                    deviceDataObject.put("spindle_error", value);
                } else if (StringLib.equals(function_param, "461")) {
                    deviceDataObject.put("spindle_error_0", hexToInt(DocumentLib.getString(deviceDataObject, "u_cdatas_0")));
                    deviceDataObject.put("spindle_error_1", hexToInt(DocumentLib.getString(deviceDataObject, "u_cdatas_1")));
                    deviceDataObject.put("spindle_error_2", hexToInt(DocumentLib.getString(deviceDataObject, "u_cdatas_2")));
                }
            } else if (StringLib.equals(function_name, "cnc_rdaxisdata")) {
                if (StringLib.equals(function_param, "2:1")) {
                    /*伺服轴负载率*/
                    deviceDataObject.put("servo_load_override_0", DocumentLib.getString(deviceDataObject, "axdata_0_data") + "%");
                    deviceDataObject.put("servo_load_override_1", DocumentLib.getString(deviceDataObject, "axdata_1_data") + "%");
                    deviceDataObject.put("servo_load_override_2", DocumentLib.getString(deviceDataObject, "axdata_2_data") + "%");
                } else if (StringLib.equals(function_param, "2:2")) {
                    /*伺服轴负载电流*/
                    deviceDataObject.put("servo_load_current_0", powvalue(
                            DocumentLib.getLong(deviceDataObject, "axdata_0_data"),
                            DocumentLib.getInt(deviceDataObject, "axdata_0_dec")));

                    deviceDataObject.put("servo_load_current_1", powvalue(
                            DocumentLib.getLong(deviceDataObject, "axdata_1_data"),
                            DocumentLib.getInt(deviceDataObject, "axdata_1_dec")));

                    deviceDataObject.put("servo_load_current_2", powvalue(
                            DocumentLib.getLong(deviceDataObject, "axdata_2_data"),
                            DocumentLib.getInt(deviceDataObject, "axdata_2_dec")));
                } else if (StringLib.equals(function_param, "3:0")) {
                    /*主轴负载率*/
                    deviceDataObject.put("spindle_load_override", DocumentLib.getString(deviceDataObject, "axdata_0_data") + "%");
                } else if (StringLib.equals(function_param, "3:4")) {
                    /*主轴负载电流*/
                    deviceDataObject.put("spindle_load_current", DocumentLib.getString(deviceDataObject, "axdata_0_data"));
                } else if (StringLib.equals(function_param, "3:3")) {
                    deviceDataObject.put("servo_load_current", DocumentLib.getString(deviceDataObject, "axdata_0_data"));
                }
            } else if (StringLib.equals(function_name, "cnc_rdparam")) {
                double u_rdata_prm_val = DocumentLib.getDouble(deviceDataObject, "u_rdata_prm_val");
                double u_rdata_dec_val = DocumentLib.getDouble(deviceDataObject, "u_rdata_dec_val");
                double paramValue = u_rdata_prm_val * Math.pow(10l, -u_rdata_dec_val);
                int value = StringLib.toInteger(paramValue);
                if (StringLib.equals(function_param, "6711")) {
                    deviceDataObject.put("parts_count", value);
                } else if (StringLib.equals(function_param, "6712")) {
                    deviceDataObject.put("parts_total", value);
                } else if (StringLib.equals(function_param, "6713")) {
                    deviceDataObject.put("parts_required", value);
                }
            } else if (StringLib.equals(function_name, "cnc_rdprgnum")) {
                String mdata = DocumentLib.getString(deviceDataObject, "mdata");
                deviceDataObject.put("main_program_number", mdata);
                deviceDataObject.put("current_program_number", DocumentLib.getString(deviceDataObject, "data"));
            } else if (StringLib.equals(function_name, "cnc_rdseqnum")) {
                deviceDataObject.put("current_seq_number", DocumentLib.getString(deviceDataObject, "data"));
            } else if (StringLib.equals(function_name, "cnc_rdcommand")) {
                if (StringLib.equals(function_param, "-1")) {
                    /*主轴指令速度*/
                    deviceDataObject.put("spindle_cmd_speed", DocumentLib.getString(deviceDataObject, "cmd_val_8"));
                    /*伺服轴指令速度*/
                    deviceDataObject.put("command_axis_speed", DocumentLib.getString(deviceDataObject, "cmd_val_2"));
                    /*当前刀号*/
                    deviceDataObject.put("current_tool_number", DocumentLib.getString(deviceDataObject, "cmd_val_9"));
                    /*当前执行单节*/
                    deviceDataObject.put("current_program_mcode", DocumentLib.getString(deviceDataObject, "cmd_val_5"));

                    deviceDataObject.put("current_program_h", DocumentLib.getString(deviceDataObject, "cmd_val_3"));
                }
            } else if (StringLib.equals(function_name, "cnc_rdspeed")) {
                /*主轴实际运行速度*/
                deviceDataObject.put("spindle_actual_speed", DocumentLib.getString(deviceDataObject, "acts_data"));
                /*进料速度*/
                deviceDataObject.put("feed_rate", DocumentLib.getString(deviceDataObject, "actf_data") + " mm/min");
            } else if (StringLib.equals(function_name, "cnc_rdsrvspeed")) {
                /*伺服轴实际运行速度*/
                deviceDataObject.put("servo_actual_speed_0", DocumentLib.getString(deviceDataObject, "speed_0") + "rpm");
                deviceDataObject.put("servo_actual_speed_1", DocumentLib.getString(deviceDataObject, "speed_1") + "rpm");
                deviceDataObject.put("servo_actual_speed_2", DocumentLib.getString(deviceDataObject, "speed_2") + "rpm");
            } else if (StringLib.equals(function_name, "pmc_rdpmcrng")) {
                String value = DocumentLib.getString(deviceDataObject, "u_cdata_0");
                value = StringLib.replace(value, "0x", "");
                int percent = 0;
                if (StringLib.isNotEmpty(value)) {
                    percent = Integer.parseUnsignedInt(value, 16);
                }
                if (StringLib.equals(function_param, "0:12")) {
                    /*伺服轴转速百分比*/
                    percent = 0 - (percent + 1);
                    deviceDataObject.put("servo_speed_override", StringLib.join(percent, "%"));
                } else if (StringLib.equals(function_param, "0:30")) {
                    /*主轴转速百分比*/
                    deviceDataObject.put("spindle_speed_override", StringLib.join(percent, "%"));
                }
            } else if (StringLib.equals(function_name, "cnc_rdposition")) {
                String fields[] = new String[]{"abs_", "mach_", "rel_", "dist_"};

                Arrays.stream(fields).forEach(prefix -> {
                    for (int i = 0; i < 3; i++) {
                        String fieldName = StringLib.join(prefix, "data_", i);
                        String decField = StringLib.join(prefix, "dec_", i);

                        Double fieldValue = DocumentLib.getDouble(deviceDataObject, fieldName);
                        Double decValue = DocumentLib.getDouble(deviceDataObject, decField);
                        double value = fieldValue * Math.pow(10l, -decValue);
                        deviceDataObject.put(fieldName, NumberLib.formatDouble(value));
                    }
                });
            } else if (StringLib.equals(function_name, "cnc_rdgcode")) {
                for (int i = 0; i < 36; i++) {
                    String fieldName = StringLib.join("code_", i);
                    String value = DocumentLib.getString(deviceDataObject, fieldName);
                    if (StringLib.isNotEmpty(value)) {
                        deviceDataObject.put("rg_code_" + i, value);
                    }
                }
            } else if (StringLib.equals(function_name, "cnc_rdalmmsg2")) {
                List<String> external = Lists.newArrayList();
                List<String> internal = Lists.newArrayList();
                for (int i = 0; i < 16; i++) {
                    String fieldName = StringLib.join("alm_msg_", i);
                    String alarmInfo = DocumentLib.getString(deviceDataObject, fieldName);
                    if (StringLib.isNotEmpty(alarmInfo)) {
                        int alarmType = DocumentLib.getInt(deviceDataObject, "type_" + i);
                        if (alarmType < 15) {
                            internal.add(alarmInfo);
                        } else if (alarmType == 15) {
                            external.add(alarmInfo);
                        }
                    }
                }
                deviceDataObject.put("alarm_external", StringLib.join(external, ";"));
                deviceDataObject.put("alarm_internal", StringLib.join(internal, ""));
            } else if (StringLib.equals(function_name, "cnc_rdophistry4")) {
                processHisDatas(deviceDataObject);
            }
        }
    }

    private static Map<String, String> hisRecTypeMap = Maps.newHashMap();

    private static Map<String, String> hisFieldLabelMap = Maps.newHashMap();

    static {
        hisRecTypeMap.put("0", "u_rec_mdi_");
        hisRecTypeMap.put("1", "u_rec_sgn_");
        hisRecTypeMap.put("2", "u_rec_alm_");
        hisRecTypeMap.put("3", "u_rec_date_");
        hisRecTypeMap.put("4", "u_rec_mac_");
        hisRecTypeMap.put("5", "u_rec_prm_");
        hisRecTypeMap.put("6", "u_rec_opm_");
        hisRecTypeMap.put("7", "u_rec_ofs_");
        hisRecTypeMap.put("8", "u_rec_wof_");
        hisRecTypeMap.put("9", "u_rec_ial_");
        hisRecTypeMap.put("10", "u_rec_mal_");
        hisRecTypeMap.put("11", "u_rec_mac2_");
        hisRecTypeMap.put("12", "u_rec_mac2_");

        hisFieldLabelMap.put("date", "日期");
        hisFieldLabelMap.put("time", "时间");
        hisFieldLabelMap.put("key_code", "按键编码");
        hisFieldLabelMap.put("pw_flag", "开机");
        hisFieldLabelMap.put("ex_flag", "外部MDI按键");
        hisFieldLabelMap.put("sig_name", "信号名称");
        hisFieldLabelMap.put("sig_no", "信号编号");
        hisFieldLabelMap.put("sig_old", "信号变换前");
        hisFieldLabelMap.put("sig_new", "信号变换后");
        hisFieldLabelMap.put("alm_grp", "报警类型");
        hisFieldLabelMap.put("alm_no", "报警编号");
        hisFieldLabelMap.put("axis_no", "轴号");
        hisFieldLabelMap.put("evnt_type", "事件类型");
        hisFieldLabelMap.put("pth_no", "路径号");
        hisFieldLabelMap.put("pmc_no", "PMC号");
        hisFieldLabelMap.put("axis_num", "轴总数");
        hisFieldLabelMap.put("g_modal", "G代码");
        hisFieldLabelMap.put("g_dp", "G代码小数位");
        hisFieldLabelMap.put("a_modal", "A代码");
        hisFieldLabelMap.put("a_dp", "A代码小数位");
        hisFieldLabelMap.put("abs_pos", "报警绝对位置");
        hisFieldLabelMap.put("abs_dp", "报警绝对位置小数位");
        hisFieldLabelMap.put("mcn_pos", "报警机器位置");
        hisFieldLabelMap.put("mcn_dp", "报警机器位置小数位");
        hisFieldLabelMap.put("alm_msg", "报警内容");
        hisFieldLabelMap.put("om_no", "消息编号");
        hisFieldLabelMap.put("ope_msg", "消息");
        hisFieldLabelMap.put("ofs_grp", "工具补偿数据类型");
        hisFieldLabelMap.put("ofs_no", "补偿编号");
        hisFieldLabelMap.put("ofs_old", "补偿变换前");
        hisFieldLabelMap.put("ofs_new", "补偿变换后");
        hisFieldLabelMap.put("old_dp", "变换前小数位");
        hisFieldLabelMap.put("new_dp", "变换后小数位");
        hisFieldLabelMap.put("mac_old", "变换前自定义宏通用变量");
        hisFieldLabelMap.put("mac_new", "变换后自定义宏通用变量");
        hisFieldLabelMap.put("prm_grp", "参数类型");
        hisFieldLabelMap.put("prm_num", "参数数量");
        hisFieldLabelMap.put("prm_len", "参数长度");
        hisFieldLabelMap.put("prm_no", "参数编号");
        hisFieldLabelMap.put("prm_old", "变换前参数");
        hisFieldLabelMap.put("prm_new", "变换后参数");
    }

    private void processHisDatas(Document deviceDataObject) {
        String rec_type = DocumentLib.getString(deviceDataObject, "rec_type");
        String prefix = hisRecTypeMap.get(rec_type);
        if (StringLib.isNotEmpty(prefix)) {
            Set<String> dataFields = Sets.newHashSet(deviceDataObject.keySet());

            Document processObject = DocumentLib.newDoc();
            dataFields.stream().forEach(field -> {
                if (StringLib.startsWith(field, prefix)) {
                    String fieldKey = StringLib.replace(field, prefix, "");
                    processObject.put(fieldKey, deviceDataObject.get(field));
                }
            });

            /*process times*/
            String hour = DocumentLib.getString(processObject, "hour");
            String minute = DocumentLib.getString(processObject, "minute");
            String second = DocumentLib.getString(processObject, "second");

            String year = DocumentLib.getString(processObject, "year");
            String month = DocumentLib.getString(processObject, "month");
            String day = DocumentLib.getString(processObject, "day");
            deviceDataObject.put("his_op_time", StringLib.join(hour, ":", minute, ":", second));
            deviceDataObject.put("his_op_date", StringLib.join(year, "-", month, "-", day));
            DocumentLib.remove(deviceDataObject, "year", "month", "day", "hour", "minute", "second", "dsp_flg");

            processObject.keySet().forEach(field -> {
                if (hisFieldLabelMap.containsKey(field)) {
                    String fieldKey = StringLib.join("his_op_", field);
                    deviceDataObject.put(fieldKey, processObject.get(field));
                }
            });
        }
    }

    private String powvalue(long value, int dec) {
        if (dec > 0) {
            return NumberLib.formatDouble(value * Math.pow(10l, -dec));
        }
        return NumberLib.formatDouble(value);
    }

    private int hexToInt(String value) {
        value = StringLib.replace(value, "0x", "");
        int intValue = 0;
        if (StringLib.isNotEmpty(value)) {
            intValue = Integer.parseUnsignedInt(value, 16);
        }
        return intValue;
    }

    private String transferTime(long minute, long msec) {
        int hour = StringLib.toInteger(minute / 60);
        minute = minute - (hour * 60);
        int second = StringLib.toInteger(msec / 1000);
        return StringLib.join(hour, "时", minute, "分", second, "秒");
    }
}
