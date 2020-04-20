package com.cynovan.janus.addons.monitor.guacamole.config;

import com.cynovan.janus.addons.monitor.guacamole.config.rdp.GuacamoleRDPConfig;
import com.cynovan.janus.addons.monitor.guacamole.config.vnc.GuacamoleVNCConfig;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import org.glyptodon.guacamole.protocol.GuacamoleConfiguration;

import javax.servlet.http.HttpServletRequest;

import static com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleProtocol.rdp;
import static com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleProtocol.vnc;

/**
 * Created by ian on 4/7/16.
 */
public class GuacamoleConfigProvider {

    private GuacamoleConfig config;
    private String protocol;

    public GuacamoleConfigProvider(HttpServletRequest request) {
        String protocol = request.getParameter("protocol");
        String configJson = request.getParameter("config");
        this.protocol = protocol;
        if (configJson != null) {
            if (StringLib.equals(protocol, vnc.getValue())) {
                config = JsonLib.parseJSON(configJson, GuacamoleVNCConfig.class);
            }
            if (StringLib.equals(protocol, rdp.getValue())) {
                config = JsonLib.parseJSON(configJson, GuacamoleRDPConfig.class);
            }
        }
    }

//    public GuacamoleConfig getConfig() {
//        return config;
//    }

//    public String getProtocol() {
//        return protocol;
//    }

    public GuacamoleConfiguration getConfiguration() {
        config.buildParameters();
        GuacamoleConfiguration configuration = new GuacamoleConfiguration();
        configuration.setProtocol(protocol);
        configuration.setParameters(config.getParameters());
        return configuration;
    }
}
