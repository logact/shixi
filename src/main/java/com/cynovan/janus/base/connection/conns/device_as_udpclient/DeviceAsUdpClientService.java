package com.cynovan.janus.base.connection.conns.device_as_udpclient;

import com.cynovan.janus.base.connection.service.base.DeviceConnBaseService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;
import com.google.common.collect.Maps;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.socket.DatagramPacket;
import io.netty.util.CharsetUtil;
import org.bson.Document;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.util.Map;

@Service
public class DeviceAsUdpClientService extends DeviceConnBaseService {

    private Map<String, Object[]> channelMap = Maps.newConcurrentMap();

    private BiMap<String, String> ip2UuidMap = HashBiMap.create();

    private Map<String, Boolean> hexDataMap = Maps.newHashMap();

    public void setChannel(String uuid, ChannelHandlerContext ctx, String clientIp) {
        Object[] arr = new Object[2];
        arr[0] = ctx;
        arr[1] = clientIp;
        channelMap.put(uuid, arr);
    }

    public void invalidate(String uuid) {
        channelMap.remove(uuid);
    }

    public boolean push(ObjectNode update) {
        boolean success = false;
        String uuid = JsonLib.getString(update, "uuid");
        Object[] arr = channelMap.get(uuid);
        if (arr != null) {
            ChannelHandlerContext ctx = (ChannelHandlerContext) arr[0];
            if (ctx.channel().isActive()) {
                InetSocketAddress address = (InetSocketAddress) arr[1];
                ChannelFuture cf = ctx.writeAndFlush(new DatagramPacket(Unpooled.copiedBuffer(update.toString(), CharsetUtil.UTF_8), address));
                success = cf.isSuccess();
            } else {
                /*当UDP Socket已不能使用时，则删除使用*/
                invalidate(uuid);
            }
        }
        return success;
    }

    public void initUdpClientService(Document dataAccessConfig) {
        String uuid = DocumentLib.getString(dataAccessConfig, "uuid");

        Document tcpClient = DocumentLib.getDocument(dataAccessConfig, "conn_info_udp_client");

        String clientIp = DocumentLib.getString(tcpClient, "client_ip");
        clientIp = StringLib.trim(clientIp);
        if (StringLib.isNotEmpty(clientIp)) {
            ip2UuidMap.put(clientIp, uuid);

            hexDataMap.put(uuid, DocumentLib.getBoolean(tcpClient, "hex"));
        }
    }

    public boolean isHexData(String uuid) {
        return hexDataMap.containsKey(uuid) && hexDataMap.get(uuid);
    }

    @Override
    public void unregister(String uuid) {
        ip2UuidMap.inverse().remove(uuid);
        hexDataMap.remove(uuid);
    }

    public String getUuidByIp(String ip) {
        return ip2UuidMap.get(ip);
    }
}
