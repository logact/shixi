package com.cynovan.janus.addons.api.controller.device_conn;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import org.springframework.core.env.Environment;

import javax.servlet.http.HttpServletRequest;


public class ApiUdpClient extends ApiConnection {

    private Integer socket_udp_port;

    ApiUdpClient(String token) {
        super(token);

        Environment env = SpringContext.getBean(Environment.class);
        String socket_udp_port = env.getProperty("socket_udp_port");
        this.socket_udp_port = StringLib.toInteger(socket_udp_port);
    }

    @Override
    public Document getConnInfo(HttpServletRequest request, CheckMessage message) {

        conn.put("address", StringLib.join(StringLib.getIPAddresses(), ", "));
        conn.put("port", socket_udp_port);
        conn.put("token", token);
        return conn;
    }
}
