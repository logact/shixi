package com.cynovan.janus.base.connection.conns.device_as_tcpserver;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.devicedata.DeviceDataService;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import org.apache.commons.codec.binary.Hex;

public class TcpClientHandler extends ChannelInboundHandlerAdapter {

    private Document dataAccessObject;

    public TcpClientHandler(Document _dataAccessObject) {
        dataAccessObject = _dataAccessObject;
    }

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ByteBuf buf = (ByteBuf) msg;
        byte[] req = new byte[buf.readableBytes()];
        buf.readBytes(req);

        String uuid = ctx.name();

        SocketTCPClientService socketTCPClientService = SpringContext.getBean(SocketTCPClientService.class);
        boolean radix16 = socketTCPClientService.isHexData(uuid);
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
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        super.channelInactive(ctx);
        /*SocketTCPClientService socketTCPClientService = SpringContext.getBean(SocketTCPClientService.class);
        String uuid = DocumentLib.getString(dataAccessObject, "uuid");
        Document tcpServerConfig = DocumentLib.getDocument(dataAccessObject, "conn_info_tcp_server");
        String ip = DocumentLib.getString(tcpServerConfig, "ip");
        int port = DocumentLib.getInt(tcpServerConfig, "port");
        socketTCPClientService.tcpClientConnException(uuid, ip, port, null);
        socketTCPClientService.unregister(uuid);
        socketTCPClientService.create(dataAccessObject);*/
    }
}
