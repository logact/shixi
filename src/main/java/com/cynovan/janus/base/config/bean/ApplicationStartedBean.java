package com.cynovan.janus.base.config.bean;

import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.neptune.mq.NeptuneMQConnService;
import com.cynovan.janus.base.utils.DigestLib;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class ApplicationStartedBean implements ApplicationRunner {

    @Autowired
    private ConfigurableApplicationContext ctx;

    @Autowired
    private NeptuneMQConnService neptuneMQConnService;

    private static Logger logger = LoggerFactory.getLogger(SpringContext.class);

    @Override
    public void run(ApplicationArguments args) throws Exception {

        String mac_address_secret = DocumentLib.getString(QJanus.get(), "mac_address_secret");
        boolean close = true;
        if (StringLib.isNotEmpty(mac_address_secret)) {
            List<String> macAddresses = StringLib.getMACAddresses();
            Collections.sort(macAddresses);
            String mac_address = StringLib.join(macAddresses, ", ");
            String mac_address_security = StringLib.join(mac_address, "@janus@ston_$%^&");
            mac_address_security = DigestLib.md5Hex(mac_address_security);
            if (StringLib.equalsIgnoreCase(mac_address_secret, mac_address_security)) {
                close = false;
            }
        }
        /*Janus检查但不关闭*/
        /*if (close == true) {
            logger.error("请不要个人复制部署项目,请联系赛诺梵运维人员;");
            logger.error("请不要个人复制部署项目,请联系赛诺梵运维人员;");
            logger.error("请不要个人复制部署项目,请联系赛诺梵运维人员;");
            logger.error("请不要个人复制部署项目,请联系赛诺梵运维人员;");
            logger.error("请不要个人复制部署项目,请联系赛诺梵运维人员;");
            logger.error("请不要个人复制部署项目,请联系赛诺梵运维人员;");
            ctx.close();
        }*/

        neptuneMQConnService.conn();
    }
}
