package com.cynovan.janus.base.connection.conns.device_as_tcpserver;

import com.cynovan.janus.base.connection.conns.activemq.DeviceOnlineService;
import com.cynovan.janus.base.connection.service.base.DeviceConnBaseService;
import com.cynovan.janus.base.device.jdo.QDataExchange;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Maps;
import io.netty.bootstrap.Bootstrap;
import io.netty.buffer.Unpooled;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.util.CharsetUtil;
import io.netty.util.concurrent.Future;
import io.netty.util.concurrent.GenericFutureListener;
import org.apache.commons.collections4.MapUtils;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PreDestroy;
import java.util.Map;

@Service
public class SocketTCPClientService extends DeviceConnBaseService {

    private Map<String, Channel> channelMap = Maps.newConcurrentMap();

    private Map<String, Boolean> raxis16Map = Maps.newHashMap();

    EventLoopGroup clientGroup = new NioEventLoopGroup();

    @Autowired
    private DeviceOnlineService deviceOnlineService;

    public void create(Document dataAccessObject) {
        createTcpSocketClient(dataAccessObject);
    }

    private void createTcpSocketClient(Document dataAccessObject) {
        String uuid = DocumentLib.getString(dataAccessObject, "uuid");

        if (channelMap.containsKey(uuid)) {
            return;
        }

        Document tcpServerConfig = DocumentLib.getDocument(dataAccessObject, "conn_info_tcp_server");
        String ip = DocumentLib.getString(tcpServerConfig, "ip");
        int port = DocumentLib.getInt(tcpServerConfig, "port");

        Bootstrap clientBootstrap = new Bootstrap();
        clientBootstrap
                .group(clientGroup)
                .channel(NioSocketChannel.class)
                .option(ChannelOption.SO_KEEPALIVE, true);

        clientBootstrap.handler(new ChannelInitializer<Channel>() {
            @Override
            protected void initChannel(Channel ch) throws Exception {
                ChannelPipeline pipeline = ch.pipeline();
                pipeline.addLast(uuid, new TcpClientHandler(dataAccessObject));
            }
        });

        try {
            ChannelFuture channelFuture = clientBootstrap.connect(ip, port);
            channelFuture.addListener(new GenericFutureListener<Future<? super Void>>() {
                @Override
                public void operationComplete(Future<? super Void> future) throws Exception {
                    if (future instanceof ChannelFuture) {
                        ChannelFuture innerChannelFuture = (ChannelFuture) future;
                        if (innerChannelFuture.isSuccess()) {
                            Channel innerChannel = innerChannelFuture.channel();
                        } else {
                            channelMap.remove(uuid);
                        }
                    }
                }
            });

            Channel channel = channelFuture.sync().channel();
            channelMap.put(uuid, channel);
        } catch (Exception e) {
            channelMap.remove(uuid);
            tcpClientConnException(uuid, ip, port, e.getMessage());
        }

        raxis16Map.put(uuid, DocumentLib.getBoolean(tcpServerConfig, "radix16"));
    }

    public void tcpClientConnException(String uuid, String ip, int port, String exception) {
        Map<String, String> params = Maps.newHashMap();
        params.put("异常类型", "设备作为TCP Socket Server接入异常");
        if (StringLib.isNotEmpty(exception)) {
            params.put("异常详情", exception);
        }
        params.put("TCP Server详情", StringLib.join(ip, ":", port));
        params.put("提示", "运维系统会于3分钟后自动尝试重连");
        deviceOnlineService.readDataException(uuid, params);
    }

    @PreDestroy
    private void destroy() {
        if (MapUtils.isNotEmpty(channelMap)) {
            channelMap.forEach((uuid, channel) -> {
                if (channel != null) {
                    try {
                        channel.close().sync();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            });
        }
    }

    public boolean isHexData(String uuid) {
        if (raxis16Map.containsKey(uuid)) {
            return raxis16Map.get(uuid);
        }
        return false;
    }

    private Map<String, Integer> timerSendIndexMap = Maps.newConcurrentMap();

    public void timerSendMessage(Document exchangeConfig) {
        Document tcpServerConfig = DocumentLib.getDocument(exchangeConfig, "conn_info_tcp_server");
        String uuid = DocumentLib.getString(exchangeConfig, "uuid");
        String timer_data = DocumentLib.getString(tcpServerConfig, "timer_data");
        if (StringLib.isNotEmpty(timer_data)) {
            if (channelMap.containsKey(uuid)) {
                String dataArr[] = StringLib.split(timer_data, "\n");
                if (!timerSendIndexMap.containsKey(uuid)) {
                    timerSendIndexMap.put(uuid, 0);
                }
                int index = timerSendIndexMap.get(uuid);
                if (index >= dataArr.length) {
                    index = 0;
                }
                String item = dataArr[index];
                push(uuid, item);
                index++;
                timerSendIndexMap.put(uuid, index);
            }
        }
    }

    public boolean push(String uuid, String value) {
        if (StringLib.isNotEmpty(value)) {
            Document dataAccessConfig = DBUtils.find(QDataExchange.collectionName, DocumentLib.newDoc("uuid", uuid));
            Document tcpServerConfig = DocumentLib.getDocument(dataAccessConfig, "conn_info_tcp_server");
            if (DocumentLib.getBoolean(tcpServerConfig, "push_use_other_port")) {
                int push_port = DocumentLib.getInt(tcpServerConfig, "push_port");
                String ip = DocumentLib.getString(tcpServerConfig, "ip");
                if (push_port > 0) {
                    Bootstrap clientBootstrap = new Bootstrap();
                    clientBootstrap
                            .group(clientGroup)
                            .channel(NioSocketChannel.class)
                            .option(ChannelOption.SO_KEEPALIVE, true);

                    clientBootstrap.handler(new ChannelInitializer<Channel>() {
                        @Override
                        protected void initChannel(Channel ch) throws Exception {
                        }
                    });
                    Channel channel = null;
                    try {
                        ChannelFuture channelFuture = clientBootstrap.connect(ip, push_port);
                        channel = channelFuture.sync().channel();
                        if (channel != null) {
                            try {
                                channel.writeAndFlush(Unpooled.copiedBuffer(value, CharsetUtil.UTF_8));
                            } catch (Exception e) {
                                return false;
                            }
                        }
                    } catch (Exception e) {
                        return false;
                    } finally {
                        if (channel != null) {
                            channel.closeFuture();
                            channel.close();
                        }
                    }
                }
            } else {
                Channel channel = channelMap.get(uuid);
                if (channel != null) {
                    try {
                        channel.writeAndFlush(Unpooled.copiedBuffer(value, CharsetUtil.UTF_8));
                    } catch (Exception e) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    @Override
    public void unregister(String uuid) {
        raxis16Map.remove(uuid);
        if (channelMap.containsKey(uuid)) {
            Channel channel = channelMap.get(uuid);
            channel.closeFuture();
            channel.close();

            channelMap.remove(uuid);
            timerSendIndexMap.remove(uuid);
        }
    }
}
