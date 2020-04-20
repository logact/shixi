package com.cynovan.janus.base.connection.conns.device_as_udpclient.handler;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.conns.device_as_udpclient.DeviceAsUdpClientService;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.channel.socket.DatagramPacket;
import io.netty.util.CharsetUtil;
import org.apache.commons.codec.binary.Hex;
import org.bson.Document;

import java.net.InetSocketAddress;

public class SocketUDPHandler extends SimpleChannelInboundHandler<DatagramPacket> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, DatagramPacket datagramPacket) {
        ByteBuf buf = (ByteBuf) datagramPacket.copy().content();
        byte[] req = new byte[buf.readableBytes()];
        buf.readBytes(req);

        String data10 = StringLib.getDecodeCharset(req);
        String data16 = Hex.encodeHexString(req);
        DeviceAsUdpClientService deviceAsUdpClientService = SpringContext.getBean(DeviceAsUdpClientService.class);
        DeviceDataService deviceDataService = SpringContext.getBean(DeviceDataService.class);
        String clientIp = getClientIP(datagramPacket);

        if (StringLib.isNotEmpty(clientIp)) {
            String uuid = deviceAsUdpClientService.getUuidByIp(clientIp);
            if (StringLib.isNotEmpty(uuid)) {
                String data = null;
                if (deviceAsUdpClientService.isHexData(uuid)) {
                    data = data16;
                } else {
                    data = data10;
                }

                /*检查能否转换为JSON数据*/
                Document deviceData = null;
                try {
                    deviceData = DocumentLib.parse(data);

                } catch (Exception e) {
                    deviceData = DocumentLib.newDoc();
                    deviceData.put("data", DocumentLib.newDoc("data", data));
                }
                /*不能转换为JSON时*/
                deviceData.put("uuid", uuid);
                deviceAsUdpClientService.setChannel(uuid, ctx, clientIp);
                deviceDataService.onData(deviceData);
            } else {
                sendDataNoBindUuidMessage(clientIp, data10, data16);
            }
        }
    }

    private void sendDataNoBindUuidMessage(String clientIp, String data10, String data16) {
        I18nService i18nService = SpringContext.getBean(I18nService.class);
        /*发送消息至消息中心*/
        MessageDto messageDto = new MessageDto();
        messageDto.setTitle(i18nService.getValue("收到无名数据", "receive_unknown_data", "system"));
        messageDto.setContent(i18nService.getValue("收到UDP Client发来的数据，未匹配到设备，请检查设备IP配置。", "udp.check.config", "system"));
        messageDto.addParam(i18nService.getValue("UDP Client IP地址", "udp.client.ip", "system"), clientIp);
        messageDto.addParam(i18nService.getValue("数据(10进制)", "data.decimal", "system"), data10);
        messageDto.addParam(i18nService.getValue("数据(16进制)", "data.hexadecimal", "system"), data16);

        MessageService messageService = SpringContext.getBean(MessageService.class);
        messageService.send(messageDto);
    }

    private String getClientIP(DatagramPacket datagramPacket) {
        return datagramPacket.sender().getAddress().getHostAddress();
    }

    private void sendResponse(ChannelHandlerContext ctx, InetSocketAddress address, String response) {
        ctx.writeAndFlush(new DatagramPacket(Unpooled.copiedBuffer(response, CharsetUtil.UTF_8), address));
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        super.channelInactive(ctx);
        ctx.close();
    }
}
