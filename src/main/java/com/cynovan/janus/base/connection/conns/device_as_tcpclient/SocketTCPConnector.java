package com.cynovan.janus.base.connection.conns.device_as_tcpclient;

import com.cynovan.janus.base.connection.conns.device_as_tcpclient.handler.SocketTCPHandler;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

@Component
public class SocketTCPConnector {

    @Value("${socket_tcp_port}")
    private Integer socket_tcp_port;

    private EventLoopGroup bossGroup;

    private EventLoopGroup workerGroup;

    @Autowired
    private MessageService messageService;

    @Autowired
    private I18nService i18nService;

    @PostConstruct
    public void startSocketTCP() {
        if (socket_tcp_port > 0) {
            bossGroup = new NioEventLoopGroup();
            workerGroup = new NioEventLoopGroup();
            ServerBootstrap serverBootstrap = new ServerBootstrap();

            serverBootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 1024) // 等待队列
                    .option(ChannelOption.RCVBUF_ALLOCATOR, new FixedRecvByteBufAllocator(65535))
                    .childOption(ChannelOption.SO_REUSEADDR, true) //重用地址
                    .childOption(ChannelOption.SO_RCVBUF, 65536) // 接收buffer
                    .childOption(ChannelOption.SO_SNDBUF, 65536) // 发送buffer
                    .childOption(ChannelOption.TCP_NODELAY, true) // no delay
                    .childOption(ChannelOption.SO_KEEPALIVE, true) // 长连接
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        public void initChannel(SocketChannel ch)
                                throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 注册handler
                            pipeline.addLast(new SocketTCPHandler());
                        }
                    });
            try {
                serverBootstrap.bind(socket_tcp_port).sync();
            } catch (InterruptedException e) {
                e.printStackTrace();
                MessageDto messageDto = new MessageDto();
                messageDto.setTitle(i18nService.getValue("系统启动TCP Socket Server失败", "tcp.server.fail", "system"));
                messageDto.setContent(String.format(i18nService.getValue("系统启动TCP Socket Server失败,端口号 : %s", "tcp.fail.port", "system"), socket_tcp_port));
                messageDto.addParam(i18nService.getValue("异常详情", "exception.detail", "system"), e.getMessage());
                messageService.send(messageDto);
            }
        }
    }

    @PreDestroy
    public void destroy() {
        if (bossGroup != null) {
            bossGroup.shutdownGracefully();
        }
        if (workerGroup != null) {
            workerGroup.shutdownGracefully();
        }
    }
}
