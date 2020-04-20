package com.cynovan.janus.addons.welding.history.controller.service;

import com.cynovan.janus.base.appstore.service.AppDataService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.utils.DateUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.List;


@Component
public class AppRobotWeldService {
    @Autowired
    private MessageService messageService;
    @Autowired
    private AppDataService appDataService;

    @Scheduled(cron = "0 0 4 * * ?")
    public void submitFileToFtp() {
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DATE, -1);
        submitFileToFtp(calendar);
    }

    /*每日凌晨四点钟提交数据到Ftp Server*/

    public void submitFileToFtp(Calendar calendar) {
        Document config = appDataService.get("weld_robot_history_config");
        /*得到ftp server配置*/
        String ftp_server = DocumentLib.getString(config, "ftp_server");
        int ftp_port = DocumentLib.getInt(config, "ftp_port");
        String ftp_user = DocumentLib.getString(config, "ftp_user");
        String ftp_pwd = DocumentLib.getString(config, "ftp_pwd");
        String ftp_model = DocumentLib.getString(config, "ftp_model");
        boolean download_ftp = DocumentLib.getBoolean(config, "download_ftp");

        if (download_ftp && StringLib.isNotEmpty(ftp_server) && ftp_port > 0
                && StringLib.isNotEmpty(ftp_user) && StringLib.isNotEmpty(ftp_pwd)) {

            SimpleDateFormat sdf = new SimpleDateFormat(DateUtils.DatePattern);
            String dateStr = sdf.format(calendar.getTime());
            AppRobotDayDataUploadToFtp appToFtp = new AppRobotDayDataUploadToFtp(
                    ftp_server,
                    ftp_port,
                    ftp_user,
                    ftp_pwd,
                    ftp_model,
                    calendar.getTime());
            try {
                /*计算昨日所有弧焊数据的列表*/

                /*计算完成之后自动通过FTP上传，在上传的过程中增加消息的提示。*/
                appToFtp.connect();
                boolean result = appToFtp.uploadFilesToFtp();

                if (result) {
                    MessageDto messageDto = new MessageDto();

                    messageDto.setTitle("弧焊设备数据自动上传至ftp");
                    messageDto.setContent("弧焊设备" + dateStr + "的焊接数据已自动上传至ftp:" + ftp_server + ":" + ftp_port);

                    List<String> uuidList = Lists.newArrayList();
                    List<Document> deviceList = appToFtp.getDeviceList();
                    deviceList.stream().forEach(device -> {
                        String uuid = DocumentLib.getString(device, "uuid");
                        uuidList.add(uuid);
                    });
                    messageDto.addParam("ftp地址", ftp_server + ":" + ftp_port);
                    messageDto.addParam("相关设备", StringLib.join(uuidList, "<br/>"));
                    messageService.send(messageDto);
                }
            } catch (IOException e) {
                e.printStackTrace();
                MessageDto messageDto = new MessageDto();
                messageDto.setTitle("弧焊设备数据自动上传至ftp失败");
                messageDto.setContent("弧焊设备" + dateStr + "的焊接数据自动上传至ftp:" + ftp_server + ":" + ftp_port + "失败");
                messageDto.addParam("失败原因", e.getMessage());
                messageService.send(messageDto);
            } finally {
                appToFtp.disconnect();
            }
        }
    }

}
