package com.cynovan.janus.base.connection.conns.device_as_udp_server;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.channel.socket.DatagramPacket;
import org.apache.commons.codec.binary.Hex;

public class UdpClientHandler extends SimpleChannelInboundHandler<DatagramPacket> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, DatagramPacket msg) throws Exception {
        ByteBuf buf = (ByteBuf) msg.content();
        byte[] req = new byte[buf.readableBytes()];
        buf.readBytes(req);

        String ip = msg.sender().getAddress().getHostAddress();
        int port = msg.sender().getPort();
        String udpServerKey = StringLib.join(ip, StringLib.SPLIT_1, port);

        SocketUDPClientService socketUDPClientService = SpringContext.getBean(SocketUDPClientService.class);
        String uuid = socketUDPClientService.getBiMap().get(udpServerKey);

        boolean radix16 = socketUDPClientService.isHexData(uuid);
        String data = null;
        if (radix16) {
            data = Hex.encodeHexString(req);
        } else {
            data = StringLib.getDecodeCharset(req);
        }

        Document jsonData = null;
        try {
            jsonData = Document.parse(data);
            if (!jsonData.containsKey("uuid")) {
                jsonData.put("uuid", uuid);
            }
        } catch (Exception e) {
            jsonData = new Document();
            jsonData.put("uuid", uuid);
            jsonData.put("action", "data");
            jsonData.put("data", DocumentLib.newDoc("data", data));
        }
        if (jsonData != null) {
            DeviceDataService deviceDataService = SpringContext.getBean(DeviceDataService.class);
            deviceDataService.onData(jsonData);
        }
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
    }
}
