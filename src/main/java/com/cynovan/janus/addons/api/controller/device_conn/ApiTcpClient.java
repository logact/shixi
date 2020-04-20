package com.cynovan.janus.addons.api.controller.device_conn;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;

import javax.servlet.http.HttpServletRequest;

public class ApiTcpClient extends ApiConnection {

    @Value("${socket_tcp_port}")
    private Integer socket_tcp_port;

    ApiTcpClient(String token) {
        super(token);

        Environment env = SpringContext.getBean(Environment.class);
        String socket_tcp_port = env.getProperty("socket_tcp_port");
        this.socket_tcp_port = StringLib.toInteger(socket_tcp_port);
    }


    @Override
    public Document getConnInfo(HttpServletRequest request, CheckMessage message) {
        conn.put("address", StringLib.join(StringLib.getIPAddresses(), ", "));
        conn.put("port", socket_tcp_port);
        conn.put("token", token);
        return conn;
    }
}
