package com.cynovan.janus.base.connection.conns.device_as_tcpclient.handler;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.connection.conns.device_as_tcpclient.DeviceAsTcpClientService;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import org.apache.commons.codec.binary.Hex;
import org.bson.Document;

import java.net.InetSocketAddress;

public class SocketTCPHandler extends ChannelInboundHandlerAdapter {

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        ByteBuf buf = (ByteBuf) msg;
        byte[] req = new byte[buf.readableBytes()];
        buf.readBytes(req);

        String data10 = StringLib.getDecodeCharset(req);
        String data16 = Hex.encodeHexString(req);

        DeviceAsTcpClientService deviceAsTcpClientService = SpringContext.getBean(DeviceAsTcpClientService.class);
        DeviceDataService deviceDataService = SpringContext.getBean(DeviceDataService.class);
        String clientIp = getClientIP(ctx);
        if (StringLib.isNotEmpty(clientIp)) {
            String uuid = deviceAsTcpClientService.getUuidByIp(clientIp);
            if (StringLib.isNotEmpty(uuid)) {
                String data = null;
                if (deviceAsTcpClientService.isHexData(uuid)) {
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
                deviceAsTcpClientService.putChannel(uuid, ctx);
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
        messageDto.setContent(i18nService.getValue("收到TCP Client发来的数据，未匹配到设备，请检查设备IP配置。", "tcp.check.config", "system"));
        messageDto.addParam(i18nService.getValue("TCP Client IP地址", "tcp.client.ip", "system"), clientIp);
        messageDto.addParam(i18nService.getValue("数据(10进制)", "data.decimal", "system"), data10);
        messageDto.addParam(i18nService.getValue("数据(16进制)", "data.hexadecimal", "system"), data16);

        MessageService messageService = SpringContext.getBean(MessageService.class);
        messageService.send(messageDto);
    }

    private String getClientIP(ChannelHandlerContext ctx) {
        InetSocketAddress insocket = (InetSocketAddress) ctx.channel()
                .remoteAddress();
        String clientIp = insocket.getAddress().getHostAddress();
        return clientIp;
    }

    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ctx.flush();
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
//        ctx.close();
    }

    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        super.channelActive(ctx);
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        super.channelInactive(ctx);
        ctx.close();
    }
}
