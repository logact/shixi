package com.cynovan.janus.base.connection.conns.device_as_udpclient;

import com.cynovan.janus.base.connection.conns.device_as_udpclient.handler.SocketUDPHandler;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioDatagramChannel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

@Component
public class SocketUDPConnector {

    @Value("${socket_udp_port}")
    private Integer socket_udp_port;

    private static EventLoopGroup eventLoopGroup;

    @Autowired
    private MessageService messageService;

    @Autowired
    private I18nService i18nService;

    @PostConstruct
    public void startSocketUDP() {
        if (socket_udp_port > 0) {
            Bootstrap bs = new Bootstrap();
            eventLoopGroup = new NioEventLoopGroup();
            bs.group(eventLoopGroup)
                    // UDP 协议
                    .channel(NioDatagramChannel.class)
                    // 支持广播
                    .option(ChannelOption.SO_BROADCAST, true)
                    //业务处理
                    .handler(new SocketUDPHandler());

            try {
                // 启动 udp server
                ChannelFuture f = bs.bind(socket_udp_port).sync();
            } catch (InterruptedException e) {
                MessageDto messageDto = new MessageDto();
                messageDto.setTitle(i18nService.getValue("系统启动UDP Socket Server失败", "udp.fail", "system"));
                messageDto.setContent(String.format(i18nService.getValue("系统启动UDP Socket  Server失败,端口号 : %s", "udp.fail.port", "system"), socket_udp_port));
                messageDto.addParam(i18nService.getValue("异常详情", "exception.detail", "system"), e.getMessage());
                messageService.send(messageDto);
            }
        }
    }


    @PreDestroy
    public void destroy() {
        if (eventLoopGroup != null) {
            eventLoopGroup.shutdownGracefully();
        }
    }
}
