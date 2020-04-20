package com.cynovan.janus.addons.api.controller.device_conn;

import com.cynovan.janus.addons.api.dto.HttpApiResponse;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import org.bson.Document;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ApiModbusMaster extends ApiConnection {

    private I18nService i18nService = SpringContext.getBean(I18nService.class);

    ApiModbusMaster(String token) {
        super(token);
    }

    @Override
    public Document getConnInfo(HttpServletRequest request, CheckMessage message) {

        String modbus = request.getParameter("modbus");
        String timeUnit = request.getParameter("timeUnit");
        String time = request.getParameter("time");
        String ip = request.getParameter("ip");
        String port = request.getParameter("port");
        String commPortId = request.getParameter("commPortId");
        String baudRate = request.getParameter("baudRate");
        String parity = request.getParameter("parity");
        String dataBits = request.getParameter("dataBits");
        String stopBits = request.getParameter("stopBits");
        String row = request.getParameter("row");
        String slave = request.getParameter("slave");

        if (StringLib.isEmpty(modbus)) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_MISSING);
            message.addMessage(i18nService.getValue("缺少参数：需要传入modbus", "api.deviceconnect.lack.params", "system"));
            return conn;
        }
        if (!StringLib.equalsAny(modbus, "rtu", "tcp")) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_INVALID);
            message.addMessage(i18nService.getValue("参数错误：不支持的modbus协议", "api.deviceconnect.wrong.modubs", "system"));
            return conn;
        }
        conn.put("modbus", modbus);

        if (StringLib.isEmpty(timeUnit)) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_MISSING);
            message.addMessage(i18nService.getValue("缺少参数：需传入timeUnit", "api.deviceconnect.lack.timeunit", "system"));
            return conn;
        }
        String[] timeUnitArray = {"ms", "m", "s"};
        if (!Arrays.asList(timeUnitArray).contains(timeUnit)) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_INVALID);
            message.addMessage(i18nService.getValue("参数错误：不支持的timeUnit", "api.deviceconnect.wrong.timeunit", "system"));
            return conn;
        }

        if (StringLib.isEmpty(time)) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_MISSING);
            message.addMessage(i18nService.getValue("缺少参数：需传入time", "api.deviceconnect.lack.time", "system"));
            return conn;
        }

        Pattern pattern = Pattern.compile("[0-9]+");
        Matcher matcher = pattern.matcher(time);
        if (!matcher.matches()) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_INVALID);
            message.addMessage(i18nService.getValue("参数错误：需传入合理time", "api.deviceconnect.wrong.time", "system"));
            return conn;
        }

        if (StringLib.equals(timeUnit, "ms") && Integer.parseInt(time) < 50) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_INVALID);
            message.addMessage(i18nService.getValue("参数错误：timeUnit为ms时，time不能小于50", "api.deviceconnect.min.time", "system"));
            return conn;
        }
        conn.put("timer", time + timeUnit);


        if (StringLib.isNotEmpty(ip)) {
            conn.put("ip", ip);
        } else {
            conn.put("ip", StringLib.join(StringLib.getIPAddresses(), ", "));
        }

        if (StringLib.equals(modbus, "tcp")) {
            if (StringLib.isEmpty(port)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_MISSING);
                message.addMessage(i18nService.getValue("缺少参数：需传入port", "api.deviceconnect.port", "system"));
                return conn;
            }
            conn.put("port", port);

        } else if (StringLib.equals(modbus, "rtu")) {
            if (StringLib.isEmpty(commPortId)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_MISSING);
                message.addMessage(i18nService.getValue("缺少参数：需传入commPortId", "api.deviceconnect.commPortId", "system"));
                return conn;
            }
            conn.put("commPortId", commPortId);

            if (StringLib.isEmpty(baudRate)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_MISSING);
                message.addMessage(i18nService.getValue("缺少参数：需传入baudRate", "api.deviceconnect.baudRate", "system"));
                return conn;
            }
            String[] baudArray = {"300", "600", "1200", "2400", "4800", "9600", "19200", "38400", "76800", "153600"};
            if (!Arrays.asList(baudArray).contains(baudRate)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_INVALID);
                message.addMessage(i18nService.getValue("参数错误：需传入合理的baudRate", "api.deviceconnect.wrong.baudRate", "system"));
                return conn;
            }
            conn.put("baudRate", baudRate);

            if (StringLib.isNotEmpty(parity)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_MISSING);
                message.addMessage(i18nService.getValue("缺少参数：需传入parity", "api.deviceconnect.parity", "system"));
                return conn;
            }

            String[] parityArray = {"0", "1", "2"};
            if (!Arrays.asList(parityArray).contains(parity)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_INVALID);
                message.addMessage(i18nService.getValue("参数错误：需传入合理的parity", "api.deviceconnect.wrong.parity", "system"));
                return conn;
            }
            conn.put("parity", parity);

            if (StringLib.isEmpty(dataBits)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_MISSING);
                message.addMessage(i18nService.getValue("缺少参数：需传入dataBits", "api.deviceconnect.dataBits", "system"));
                return conn;
            }

            String[] dataBitsArray = {"8", "7", "6"};
            if (!Arrays.asList(dataBitsArray).contains(dataBits)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_INVALID);
                message.addMessage(i18nService.getValue("参数错误：需传入合理的dataBits", "api.deviceconnect.wrong.dataBits", "system"));
                return conn;
            }
            conn.put("dataBits", request.getParameter("dataBits"));


            if (StringLib.isEmpty(stopBits)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_MISSING);
                message.addMessage(i18nService.getValue("缺少参数：需传入stopBits", "api.deviceconnect.stopBits", "system"));
                return conn;
            }
            String[] stopBitsArray = {"1", "2"};
            if (!Arrays.asList(stopBitsArray).contains(stopBits)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_INVALID);
                message.addMessage(i18nService.getValue("参数错误：需传入合理的stopBits", "api.deviceconnect.wrong.stopBits", "system"));
                return conn;
            }
            conn.put("stopBits", stopBits);

        }

        if (StringLib.isNotEmpty(row)) {
            List<ObjectNode> list = JsonLib.parseArray(row, ObjectNode.class);

            List rowList = Lists.newArrayList();
            String[] areaArray = {"1", "2", "3", "4"};

            for (ObjectNode line : list) {
                if (line.size() < 3) {
                    message.setSuccess(false);
                    message.addData("code", HttpApiResponse.PARAM_INVALID);
                    message.addMessage(i18nService.getValue("参数错误：需传入合理的row", "api.deviceconnect.wrong.row", "system"));
                    return conn;
                }

                if (!line.get("area").isNull() && Arrays.asList(areaArray).contains(line.get("area").textValue())) {
                    rowList.add(Document.parse(line.toString()));
                } else {
                    message.setSuccess(false);
                    message.addData("code", HttpApiResponse.PARAM_INVALID);
                    message.addMessage(i18nService.getValue("参数错误：需传入合理的row", "api.deviceconnect.wrong.row", "system"));
                    return conn;
                }

            }
            conn.put("row", rowList);
        }

        if (StringLib.isEmpty(slave)) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_MISSING);
            message.addMessage(i18nService.getValue("缺少参数：需传入slave", "api.deviceconnect.slave", "system"));
            return conn;
        }
        conn.put("slave", slave);

        return conn;
    }
}
