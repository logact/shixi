package com.cynovan.janus.addons.api.controller.device_conn;

import com.cynovan.janus.addons.api.dto.HttpApiResponse;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ApiSerialPort extends ApiConnection {

    private I18nService i18nService = SpringContext.getBean(I18nService.class);

    ApiSerialPort(String token) {
        super(token);
    }

    @Override
    public Document getConnInfo(HttpServletRequest request, CheckMessage message) {

        String commPortId = request.getParameter("commPortId");
        String baudRate = request.getParameter("baudRate");
        String parity = request.getParameter("parity");
        String dataBits = request.getParameter("dataBits");
        String stopBits = request.getParameter("stopBits");
        String receive_type = request.getParameter("receive_type");
        String send_type = request.getParameter("send_type");
        String timeUnit = request.getParameter("timeUnit");
        String time = request.getParameter("time");
        String timer_data = request.getParameter("timer_data");

        if (StringLib.isEmpty(request.getParameter("commPortId"))) {
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

        if (StringLib.isEmpty(parity)) {
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

        String[] dataBitsArray1 = {"8", "7", "6"};
        if (!Arrays.asList(dataBitsArray1).contains(dataBits)) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_INVALID);
            message.addMessage(i18nService.getValue("参数错误：需传入合理的dataBits", "api.deviceconnect.wrong.dataBits", "system"));
            return conn;
        }
        conn.put("dataBits", dataBits);

        if (StringLib.isEmpty(stopBits)) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_MISSING);
            message.addMessage(i18nService.getValue("缺少参数：需传入stopBits", "api.deviceconnect.stopBits", "system"));
            return conn;
        }

        String[] dataBitsArray2 = {"1", "2"};
        if (Arrays.asList(dataBitsArray2).contains(request.getParameter("stopBits"))) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_INVALID);
            message.addMessage(i18nService.getValue("参数错误：需传入合理的stopBits", "api.deviceconnect.wrong.stopBits", "system"));
            return conn;
        }
        conn.put("stopBits", stopBits);

        if (StringLib.isEmpty(receive_type)) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_MISSING);
            message.addMessage(i18nService.getValue("缺少参数：需传入receive_type", "api.deviceconnect.receivetype", "system"));
            return conn;
        }
        if (!StringLib.equalsAny(receive_type, "ascii", "hex")) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_INVALID);
            message.addMessage(i18nService.getValue("参数错误：需传入合理的receive_type", "api.deviceconnect.wrong.receivetype", "system"));
            return conn;
        }
        conn.put("receive_type", receive_type);

        if (StringLib.isEmpty(send_type)) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_MISSING);
            message.addMessage(i18nService.getValue("缺少参数：需传入send_type", "api.deviceconnect.sendtype", "system"));
            return conn;
        }
        if (StringLib.equalsAny("ascii", "hex")) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_INVALID);
            message.addMessage(i18nService.getValue("参数错误：需传入合理的send_type", "api.deviceconnect.wrong.sendtype", "system"));
            return conn;
        }
        conn.put("send_type", send_type);

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

        if (StringLib.equals(timeUnit, "ms") && Integer.parseInt("time") < 50) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_INVALID);
            message.addMessage(i18nService.getValue("参数错误：timeUnit为ms时，time不能小于50", "api.deviceconnect.min.time", "system"));
            return conn;

        }
        conn.put("timer", time +timeUnit);

        if (StringLib.isNotEmpty(timer_data)) {
            conn.put("timer_data", timer_data);
        }

        return conn;
    }

}
