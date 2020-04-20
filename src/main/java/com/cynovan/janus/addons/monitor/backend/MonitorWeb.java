package com.cynovan.janus.addons.monitor.backend;

import com.cynovan.janus.base.utils.JsonLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.commons.net.telnet.TelnetClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping(value = "monitor")
public class MonitorWeb {

    @GetMapping(value = "ping")
    public String pingIp(String ip0, String ip1) {
        /**/
        ObjectNode result = JsonLib.createObjNode();
        String ip = "";
        TelnetClient telnetClient = new TelnetClient();
        try {
            telnetClient.setConnectTimeout(1000);
            telnetClient.connect(ip0, 8082);
            ip = ip0;
            result.put("ip", ip);
            return result.toString();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                telnetClient.disconnect();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        try {
            telnetClient.connect(ip1, 9100);
            ip = ip1;
            result.put("ip", ip);
            return result.toString();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                telnetClient.disconnect();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        return result.toString();
    }
}
