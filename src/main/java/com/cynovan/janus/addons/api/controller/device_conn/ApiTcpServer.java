package com.cynovan.janus.addons.api.controller.device_conn;

import com.cynovan.janus.addons.api.dto.HttpApiResponse;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;

import javax.servlet.http.HttpServletRequest;

public class ApiTcpServer extends ApiConnection{

    private I18nService i18nService = SpringContext.getBean(I18nService.class);

    public ApiTcpServer(String token) {
        super(token);
    }

    @Override
    public Document getConnInfo(HttpServletRequest request, CheckMessage message) {
        String ip = request.getParameter("ip");
        String port = request.getParameter("port");
        String timer_switch = request.getParameter("timer_switch");
        String radix16 = request.getParameter("radix16");
        String time = request.getParameter("time");
        String timeUnit =  request.getParameter("timeUnit");
        String timer_data = request.getParameter("timer_data");

        if (StringLib.isEmpty(ip)) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_MISSING);
            message.addMessage(i18nService.getValue("缺少参数：需传入ip", "api.deviceconnect.ip", "system"));
            return conn;
        }
        conn.put("ip", ip);

        if (StringLib.isEmpty(port)) {
            message.setSuccess(false);
            message.addData("code", HttpApiResponse.PARAM_MISSING);
            message.addMessage(i18nService.getValue("缺少参数：需传入port", "api.deviceconnect.port", "system"));
            return conn;
        }
        conn.put("port", port);

        conn.put("timer_switch", StringLib.equals(timer_switch, "true"));

        if (StringLib.equals(timer_switch, "true")) {
            conn.put("radix16",StringLib.equals(radix16, "true"));

            if (StringLib.isEmpty(time)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_MISSING);
                message.addMessage(i18nService.getValue("缺少参数：需传入time", "api.deviceconnect.lack.time", "system"));
                return conn;
            }
            conn.put("time", time);

            if (StringLib.isEmpty(timeUnit)) {
                message.setSuccess(false);
                message.addData("code", HttpApiResponse.PARAM_MISSING);
                message.addMessage(i18nService.getValue("缺少参数：需传入timeUnit", "api.deviceconnect.lack.timeunit", "system"));
                return conn;
            }
            conn.put("timeUnit", timeUnit);
            conn.put("timer", time + timeUnit);

            if (StringLib.isNotEmpty(timer_data)) {
                conn.put("timer_data", timer_data);
            }
        }

        return conn;
    }
}
