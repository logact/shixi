package com.cynovan.janus.addons.api.controller.device_conn;

import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.utils.RequestLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import org.bson.Document;
import org.springframework.core.env.Environment;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

public class ApiHttpRest extends ApiConnection {

    private String server_port;

    ApiHttpRest(String token) {
        super(token);

        Environment env = SpringContext.getBean(Environment.class);
        this.server_port = env.getProperty("server.port");
    }

    @Override
    public Document getConnInfo(HttpServletRequest request, CheckMessage message) {

        String addr = RequestLib.getCompleteUrl(request, "httpapi/data");
        if (StringLib.contains(addr, "localhost")) {
            String url = new StringBuilder().append("http://")
                    .append("@ip@")
                    .append(":")
                    .append(server_port).append("/httpapi/data").toString();
            List<String> ipAddress = StringLib.getIPAddresses();

            List<String> urls = Lists.newArrayList();
            ipAddress.stream().forEach(ip -> {
                urls.add(StringLib.replace(url, "@ip@", ip));
            });

            addr = StringLib.join(urls, " , ");
        }
        conn.put("addr", addr);
        conn.put("token", token);
        conn.put("method", "POST");
        conn.put("param", "data");

        return conn;
    }
}
