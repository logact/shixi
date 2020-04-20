package com.cynovan.janus.addons.monitor.guacamole;

import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfigProvider;
import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.net.GuacamoleSocket;
import org.glyptodon.guacamole.net.GuacamoleTunnel;
import org.glyptodon.guacamole.net.InetGuacamoleSocket;
import org.glyptodon.guacamole.net.SimpleGuacamoleTunnel;
import org.glyptodon.guacamole.protocol.ConfiguredGuacamoleSocket;
import org.glyptodon.guacamole.servlet.GuacamoleHTTPTunnelServlet;

import javax.servlet.http.HttpServletRequest;

/**
 * Created by ian on 3/2/16.
 */
public class GuacamoleTunnelServlet extends GuacamoleHTTPTunnelServlet {

    private String guacHostname;
    private int guacPort;

    public GuacamoleTunnelServlet(String guaserver,int port){
        guacHostname = guaserver;
        guacPort = port;
    }

    @Override
    protected GuacamoleTunnel doConnect(HttpServletRequest request)
            throws GuacamoleException {

        /// / Create our configuration
        GuacamoleConfigProvider configProvider = new GuacamoleConfigProvider(request);

        // Connect to guacd - everything is hard-coded here.
        GuacamoleSocket socket = new ConfiguredGuacamoleSocket(
                new InetGuacamoleSocket(guacHostname, guacPort), configProvider.getConfiguration()
        );

        // Return a new tunnel which uses the connected socket
        return new SimpleGuacamoleTunnel(socket);

    }

}

