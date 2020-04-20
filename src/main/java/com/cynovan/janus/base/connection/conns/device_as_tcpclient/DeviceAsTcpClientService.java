package com.cynovan.janus.base.connection.conns.device_as_tcpclient;

import com.cynovan.janus.base.connection.service.base.DeviceConnBaseService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.JsonLib;
import com.cynovan.janus.base.utils.StringLib;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;
import com.google.common.collect.Maps;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelHandlerContext;
import org.bson.Document;
import org.springframework.stereotype.Service;

import java.nio.charset.Charset;
import java.util.Map;

@Service
public class DeviceAsTcpClientService extends DeviceConnBaseService {

    private Map<String, ChannelHandlerContext> channelMap = Maps.newConcurrentMap();

    private BiMap<String, String> ip2UuidMap = HashBiMap.create();

    private Map<String, Boolean> hexDataMap = Maps.newHashMap();

    public void putChannel(String uuid, ChannelHandlerContext ctx) {
        if (!channelMap.containsKey(uuid)) {
            channelMap.put(uuid, ctx);
        }
    }

    public void removeChannel(String uuid) {
        ChannelHandlerContext context = channelMap.get(uuid);
        channelMap.remove(uuid);
        hexDataMap.remove(uuid);
        context.close();
    }

    public boolean push(ObjectNode update) {
        boolean success = false;
        String uuid = JsonLib.getString(update, "uuid");
        ChannelHandlerContext ctx = channelMap.get(uuid);
        if (ctx != null) {
            if (ctx.channel().isActive()) {
                ByteBuf response = Unpooled.copiedBuffer(update.toString(), Charset.forName("GBK"));
                ChannelFuture cf = ctx.write(response);
                success = cf.isSuccess();
            } else {
                /*当tcp socket已不能使用时，则删除使用*/
                removeChannel(uuid);
            }
        }
        return success;
    }

    public void initTcpClientService(Document dataAccessConfig) {
        String uuid = DocumentLib.getString(dataAccessConfig, "uuid");

        Document tcpClient = DocumentLib.getDocument(dataAccessConfig, "conn_info_tcp_client");

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
