package com.cynovan.janus.addons.welding.history.controller.service;

import com.cynovan.janus.base.device.jdo.QDevice;
import com.cynovan.janus.base.utils.DBUtils;
import com.cynovan.janus.base.utils.DateUtils;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPReply;
import org.bson.Document;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.UnknownHostException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class AppRobotDayDataUploadToFtp {

    private String ftp_server;
    private int ftp_port;
    private String ftp_user;
    private String ftp_pwd;
    private String ftp_model;
    private Date date;
    private String dateStr;

    private FTPClient ftpClient = new FTPClient();
    private List<Document> deviceList = Lists.newArrayList();
    private Map<String, File> filesMap = Maps.newHashMap();

    public AppRobotDayDataUploadToFtp(String _ftp_server, int _ftp_port, String _ftp_user, String _ftp_pwd, String ftp_model, Date _date) {
        this(_ftp_server, _ftp_port, _ftp_user, _ftp_pwd, ftp_model, _date, null);
    }

    public AppRobotDayDataUploadToFtp(String _ftp_server, int _ftp_port, String _ftp_user, String _ftp_pwd, String _ftp_model, Date _date, String _uuid) {
        this.ftp_server = _ftp_server;
        this.ftp_port = _ftp_port;
        this.ftp_user = _ftp_user;
        this.ftp_pwd = _ftp_pwd;
        this.ftp_model = _ftp_model;
        this.date = _date;

//        initialize(_uuid);
        initializeVar(_uuid);
    }

//    private void initialize(String _uuid) {
//        try {
//            initializeVar(_uuid);
//            connect();
//
//        } catch (IOException e) {
//            e.printStackTrace();
//        }
//    }

    private void initializeVar(String _uuid) {
        /*获取所有弧焊设备 uuid*/
        Document query = DocumentLib.newDoc("welding.show", true);
        if (StringLib.isNotEmpty(_uuid)) {
            query.put("uuid", _uuid);
        }
        Document projector = DocumentLib.newDoc();
        projector.put("uuid", 1);
        this.deviceList = DBUtils.list(QDevice.collectionName, query, projector);

        /* date String */
        SimpleDateFormat sdf = new SimpleDateFormat(DateUtils.DatePattern);
        this.dateStr = sdf.format(date);

        /*获取设备对应的 的zipFile*/
        deviceList.stream().forEach(device -> {
            String uuid = DocumentLib.getString(device, "uuid");
            if (StringLib.isNotEmpty(uuid)) {
                AppRobotDayDataDownload appRobotDayDataDownload = new AppRobotDayDataDownload(uuid, dateStr);
                File zipFile = appRobotDayDataDownload.getZipFile();
                String filename = StringLib.join(uuid, "#", dateStr, ".zip");

                filesMap.put(filename, zipFile);
            }
        });
    }

    /* 连接 */
    public void connect() throws IOException {
        try {
            ftpClient.connect(ftp_server, ftp_port);
        } catch (UnknownHostException e) {
            throw new IOException("Can't find FTP server: " + ftp_server);
        }

        int replyCode = ftpClient.getReplyCode();
        if (!FTPReply.isPositiveCompletion(replyCode)) {
            ftpClient.disconnect();
            throw new IOException("Can't connect to server: " + ftp_server);
        }

        boolean logined = ftpClient.login(ftp_user, ftp_pwd);
        if (!logined) {
            ftpClient.disconnect();
            throw new IOException("Can't login to server: " + ftp_server);
        }

        ftpClient.setFileType(FTP.BINARY_FILE_TYPE);
        ftpClient.setFileTransferMode(FTP.BINARY_FILE_TYPE);
        if (StringLib.equalsIgnoreCase(ftp_model, "passive")) {
            ftpClient.enterLocalPassiveMode();
        } else {
            ftpClient.enterLocalActiveMode();
        }
    }


    /* 创建多级目录，并切换到该目录下 */
    private void makeDirs() throws IOException {
        SimpleDateFormat sdf = new SimpleDateFormat(DateUtils.parsePatterns[3]);
        String uploadDir = sdf.format(this.date);

        String pathname = uploadDir.replace("\\\\", "/");
        String[] pathnameArr = pathname.split("/");
        for (String each : pathnameArr) {
            if (StringLib.isNotEmpty(each)) {
                ftpClient.makeDirectory(each);
                ftpClient.changeWorkingDirectory(each);
            }
        }
    }

    /*上传数据*/
    public boolean uploadFilesToFtp() throws IOException {
        if (ftpClient.isConnected()) {
            makeDirs();

            Iterator<String> iter = filesMap.keySet().iterator();
            while (iter.hasNext()) {
                String fileKey = iter.next();
                File file = filesMap.get(fileKey);

                FileInputStream fis = new FileInputStream(file);
                ftpClient.storeFile(fileKey, fis);
                fis.close();
            }
            return true;
        } else {
            return false;
        }
    }

    /*按设备uuid上传数据*/
    public boolean uploadFilesToFtp(String uuid) throws IOException {
        if (!StringLib.isEmpty(uuid) && ftpClient.isConnected()) {
            makeDirs();

            String filename = StringLib.join(uuid, "#", dateStr, ".zip");
            File targetFile = filesMap.get(filename);
            FileInputStream fis = new FileInputStream(targetFile);
            ftpClient.storeFile(filename, fis);
            fis.close();
            return true;
        }
        return false;
    }

    public File getZipFile(String uuid) {
        if (!StringLib.isEmpty(uuid)) {
            String filename = StringLib.join(uuid, "#", dateStr, ".zip");
            return filesMap.get(filename);
        }
        return null;
    }

    public void disconnect() {
        if (ftpClient != null && ftpClient.isConnected()) {
            try {
                ftpClient.logout();
                ftpClient.disconnect();

            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        Iterator<String> it = filesMap.keySet().iterator();
        while (it.hasNext()) {
            String filename = it.next();
            File file = filesMap.get(filename);
            if (file != null) {
                file.delete();
            }
        }
    }

    public List<Document> getDeviceList() {
        return deviceList;
    }
}
