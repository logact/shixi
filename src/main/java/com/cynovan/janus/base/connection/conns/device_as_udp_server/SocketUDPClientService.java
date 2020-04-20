package com.cynovan.janus.base.connection.conns.device_as_udp_server;

import com.cynovan.janus.base.connection.conns.activemq.DeviceOnlineService;
import com.cynovan.janus.base.connection.service.base.DeviceConnBaseService;
import com.cynovan.janus.base.device.jdo.QDataExchange;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;
import com.google.common.collect.Maps;
import io.netty.bootstrap.Bootstrap;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.Channel;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.DatagramPacket;
import io.netty.channel.socket.nio.NioDatagramChannel;
import io.netty.util.CharsetUtil;
import org.apache.commons.codec.DecoderException;
import org.apache.commons.codec.binary.Hex;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.net.InetSocketAddress;
import java.util.Map;

@Service
public class SocketUDPClientService extends DeviceConnBaseService {

    public static BiMap<String, String> udpDeviceMap = HashBiMap.create();

    public static Map<String, Boolean> raxis16Map = Maps.newHashMap();

    private EventLoopGroup eventLoopGroup = new NioEventLoopGroup();

    private Map<String, Channel> deviceChannelMap = Maps.newConcurrentMap();

    private Channel ch = null;

    @Autowired
    private DeviceOnlineService deviceOnlineService;

    @PostConstruct
    private void createPublicChannel() {
        ch = createUdpClient(0);
    }

    private Channel createUdpClient(int port) {
        Bootstrap b = new Bootstrap();
        b.group(eventLoopGroup)
                .channel(NioDatagramChannel.class)
                .option(ChannelOption.SO_BROADCAST, true)
                .handler(new UdpClientHandler());
        try {
            Channel ch = b.bind(port).channel();
            return ch;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private Map<String, Integer> timerSendIndexMap = Maps.newConcurrentMap();

    public void timerSendMessage(Document exchangeConfig) {
        Document udpServerConfig = DocumentLib.getDocument(exchangeConfig, "conn_info_udp_server");
        String uuid = DocumentLib.getString(exchangeConfig, "uuid");
        String timer_data = DocumentLib.getString(udpServerConfig, "timer_data");
        if (StringLib.isNotEmpty(timer_data)) {
            if (udpDeviceMap.inverse().containsKey(uuid)) {
                String dataArr[] = StringLib.split(timer_data, "\n");
                if (!timerSendIndexMap.containsKey(uuid)) {
                    timerSendIndexMap.put(uuid, 0);
                }
                int index = timerSendIndexMap.get(uuid);
                if (index >= dataArr.length) {
                    index = 0;
                }
                String item = dataArr[index];
                if (StringLib.isNotEmpty(item)) {
                    String ip = DocumentLib.getString(udpServerConfig, "ip");
                    int port = DocumentLib.getInt(udpServerConfig, "port");
                    try {
                        sendMessage(uuid, item, ip, port);
                        index++;
                        timerSendIndexMap.put(uuid, index);
                    } catch (Exception e) {
                        Map<String, String> params = Maps.newHashMap();
                        params.put("异常类型", "设备作为UDP Socket Server接入异常");
                        params.put("异常详情", e.getMessage());
                        params.put("UDP Server详情", StringLib.join(ip, ":", port));
                        deviceOnlineService.readDataException(uuid, params);
                    }
                }
            }
        }
    }

    public boolean push(String uuid, String message) {
        Document dataAccessConfig = DBUtils.find(QDataExchange.collectionName, DocumentLib.newDoc("uuid", uuid));
        Document udpServerConfig = DocumentLib.getDocument(dataAccessConfig, "conn_info_udp_server");
        String ip = DocumentLib.getString(udpServerConfig, "ip");
        int port = DocumentLib.getInt(udpServerConfig, "port");
        if (ch != null) {
            ByteBuf bufff = null;
            if (isHexData(uuid)) {
                bufff = Unpooled.buffer();
                try {
                    bufff.writeBytes(Hex.decodeHex(message.toCharArray()));
                } catch (DecoderException e) {
                    e.printStackTrace();
                }
            } else {
                bufff = Unpooled.copiedBuffer(message, CharsetUtil.UTF_8);
            }
            if (bufff != null) {
                try {
                    ch.writeAndFlush(new DatagramPacket(
                            bufff,
                            new InetSocketAddress(ip, port)));
                } catch (Exception e) {
                    return false;
                }
            }
        }
        return true;
    }

    private void sendMessage(String uuid, String message, String ip, int port) {
        if (ch != null) {
            ByteBuf bufff = null;
            if (isHexData(uuid)) {
                bufff = Unpooled.buffer();
                try {
                    bufff.writeBytes(Hex.decodeHex(message.toCharArray()));
                } catch (DecoderException e) {
                    e.printStackTrace();
                }
            } else {
                bufff = Unpooled.copiedBuffer(message, CharsetUtil.UTF_8);
            }
            if (bufff != null) {
                ch.writeAndFlush(new DatagramPacket(
                        bufff,
                        new InetSocketAddress(ip, port)));
            }
        }
    }

    public void create(Document exchangeConfig) {
        String uuid = DocumentLib.getString(exchangeConfig, "uuid");
        Document udpServerConfig = DocumentLib.getDocument(exchangeConfig, "conn_info_udp_server");
        String ip = DocumentLib.getString(udpServerConfig, "ip");
        int port = DocumentLib.getInt(udpServerConfig, "port");
        int local_port = DocumentLib.getInt(udpServerConfig, "local_port");
        if (local_port > 0) {
            Channel channel = createUdpClient(local_port);
            deviceChannelMap.put(uuid, channel);
        }

        String udpServerKey = StringLib.join(ip, StringLib.SPLIT_1, port);
        udpDeviceMap.put(udpServerKey, uuid);

        raxis16Map.put(uuid, DocumentLib.getBoolean(udpServerConfig, "radix16"));
    }

    public boolean isHexData(String uuid) {
        if (raxis16Map.containsKey(uuid)) {
            return raxis16Map.get(uuid);
        }
        return false;
    }

    @Override
    public void unregister(String uuid) {
        udpDeviceMap.inverse().remove(uuid);
        timerSendIndexMap.remove(uuid);
        deviceChannelMap.remove(uuid);
    }

    public BiMap<String, String> getBiMap() {
        return udpDeviceMap;
    }

    @PreDestroy
    private void destroy() {
        eventLoopGroup.shutdownGracefully();
    }
}
