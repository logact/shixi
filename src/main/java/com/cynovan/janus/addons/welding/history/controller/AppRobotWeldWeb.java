package com.cynovan.janus.addons.welding.history.controller;

import com.cynovan.janus.addons.welding.history.controller.service.*;
import com.cynovan.janus.base.appstore.jdo.QAppData;
import com.cynovan.janus.base.appstore.service.AppDataService;
import com.cynovan.janus.base.arch.bean.CheckMessage;
import com.cynovan.janus.base.config.bean.InitializeWeb;
import com.cynovan.janus.base.device.push.DevicePushService;
import com.cynovan.janus.base.gridfs.service.FileStorageService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import com.google.common.collect.Table;
import com.google.common.io.Files;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPReply;
import org.bson.Document;
import org.joda.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.math.BigInteger;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

@Controller
@RequestMapping(value = "/weld")
public class AppRobotWeldWeb {

    @Autowired
    private AppDataService appDataService;
    @Autowired
    private MessageService messageService;

    @RequestMapping(value = "removeDupCheckItem")
    @ResponseBody
    public String removeAiCheckDup() {
        AtomicInteger modifyCount = new AtomicInteger(0);
        List<Document> list = DBUtils.list(QAppData.collectionName, Filters.regex("key", "weld_robot_ai_check_.*"), Projections.include("key"));
        if (CollectionUtils.isNotEmpty(list)) {
            list.stream().forEach(item -> {
                String dataKey = DocumentLib.getString(item, "key");
                Document document = DBUtils.find(QAppData.collectionName, Filters.eq("_id", DocumentLib.getObjectId(item)));
                List<Document> sublist = DocumentLib.getList(document, "data.list");
                if (CollectionUtils.isNotEmpty(sublist)) {
                    /*给所有数据生成md5标签*/
                    Set<String> itemKeySet = Sets.newHashSet();
                    List<Document> newList = Lists.newArrayList();
                    sublist.stream().forEach(subitem -> {
                        String md5 = DocumentLib.getString(subitem, "md5");
                        if (StringLib.isEmpty(md5)) {
                            String fileId_preprocess = DocumentLib.getString(subitem, "fileId_preprocess");
                            String fileId_postprocess = DocumentLib.getString(subitem, "fileId_postprocess");
                            String analysis_result = DocumentLib.getString(subitem, "analysis_result");
                            String arcTag = DocumentLib.getString(subitem, "arcTag");
                            md5 = DigestLib.md5Hex(StringLib.join(fileId_preprocess, StringLib.SPLIT_1, fileId_postprocess, StringLib.SPLIT_1, analysis_result, StringLib.SPLIT_1, arcTag));
                            subitem.put("md5", md5);
                        }
                        if (!itemKeySet.contains(md5)) {
                            newList.add(subitem);
                            itemKeySet.add(md5);
                        }
                    });

                    int removeSize = sublist.size() - newList.size();
                    if (removeSize > 0) {
                        Document newDoc = DocumentLib.newDoc("list", newList);
                        modifyCount.addAndGet(removeSize);
                        appDataService.set(dataKey, newDoc);
                    }
                }
            });
        }

        ObjectNode result = JsonLib.createObjNode();
        result.put("result", "success");
        return result.toString();
    }

    @ResponseBody
    @RequestMapping(value = "testUpload")
    public String testUpload(Integer year, Integer month, Integer day) {
        Calendar calendar = Calendar.getInstance();
        calendar.set(year, month, day);
        appRobotWeldService.submitFileToFtp(calendar);
        return CheckMessage.newInstance().toString();
    }

    @ResponseBody
    @RequestMapping(value = "testFtpConn")
    public String testFtpConn(String ftp_server, Integer ftp_port, String ftp_user, String ftp_pwd, String ftp_model) {
        FTPClient ftpClient = new FTPClient();

        CheckMessage checkMessage = CheckMessage.newInstance();
        try {
            ftpClient.connect(ftp_server, ftp_port);
            checkMessage.addMessage("连接FTP Server成功");
            int replyCode = ftpClient.getReplyCode();
            if (!FTPReply.isPositiveCompletion(replyCode)) {
                ftpClient.disconnect();
            }

            boolean logined = ftpClient.login(ftp_user, ftp_pwd);
            if (!logined) {
                ftpClient.disconnect();
            }

            ftpClient.setFileType(FTP.BINARY_FILE_TYPE);
            ftpClient.setFileTransferMode(FTP.BINARY_FILE_TYPE);
            if (StringLib.equalsIgnoreCase(ftp_model, "passive")) {
                ftpClient.enterLocalPassiveMode();
            } else {
                ftpClient.enterLocalActiveMode();
            }

            checkMessage.addMessage("登录成功");

            String uploadDir = DateUtils.formatDate(new Date(), "yyyyMMddHHmmss") + "-TEST";
            ftpClient.makeDirectory(uploadDir);
            ftpClient.changeWorkingDirectory(uploadDir);
            checkMessage.addMessage("创建文件夹[" + uploadDir + "]成功");

            String content = "this is test file ";
            ftpClient.storeFile("test.txt", new ByteArrayInputStream(content.getBytes("utf-8")));
            checkMessage.addMessage("上传文件[" + uploadDir + "/test.txt]成功");
            if (ftpClient != null && ftpClient.isConnected()) {
                ftpClient.logout();
                ftpClient.disconnect();
            }
            checkMessage.addMessage("断开连接成功");
            checkMessage.addMessage("测试成功");
        } catch (IOException e) {
            checkMessage.setSuccess(false);
            checkMessage.addMessage(e.getMessage());
            checkMessage.addMessage("测试失败");
        }
        return checkMessage.toString();
    }

    @ResponseBody
    @RequestMapping(value = "exportBarcode")
    public void downloadBarcode(@RequestParam String uuid,
                                @RequestParam String date,
                                @RequestParam String barcode,
                                HttpServletResponse response) {

        LocalDate exportDate = LocalDate.fromDateFields(DateUtils.parseDate(date));
        String key = StringLib.join("weld_robot_history_", uuid, StringLib.SPLIT_1, exportDate.getYear(),
                StringLib.SPLIT_1, exportDate.getMonthOfYear(), StringLib.SPLIT_1, exportDate.getDayOfMonth());
        Document dayData = DBUtils.find(QAppData.collectionName, DocumentLib.newDoc("key", key));
        List list = DocumentLib.getList(DocumentLib.getDocument(dayData, "data"), "arr");

        List<String> dataList = Lists.newArrayList();
        List<String> headerList = Lists.newArrayList();
        headerList.add("物料条码");
        headerList.add("焊接ID");
        headerList.add("焊接序号");
        headerList.add("时间");
        headerList.add("给定电流");
        headerList.add("给定电压");
        headerList.add("反馈电流");
        headerList.add("反馈电压");
        headerList.add("焊接速度设定值");
        headerList.add("焊接速度实际值");
        headerList.add("送丝速度");
        headerList.add("送丝负荷");
        headerList.add("主板温度");
        headerList.add("风扇转速");
        dataList.add(StringLib.join(headerList, ","));
        if (list != null && list.size() > 0) {
            List<Document> weldingList = Lists.newArrayList();
            list.stream().forEach(item -> {
                Document itemObj = (Document) item;
                String targetBarcode = DocumentLib.getString(itemObj, "barcode");
                if (StringLib.equals(targetBarcode, barcode)) {
                    weldingList.add(itemObj);
                }
            });
            if (CollectionUtils.isNotEmpty(weldingList)) {
                weldingList.sort((o1, o2) -> {
                    String o1Date = DocumentLib.getString(o1, "start");
                    String o2Date = DocumentLib.getString(o2, "start");
                    if (o1Date != null && o2Date != null) {
                        return o1Date.compareTo(o2Date);
                    }
                    return 0;
                });

                Document projection = DocumentLib.newDoc();
                projection.put("time", 1);
                projection.put("data.101_Status_DI_ArcWeldingStart", 1);
                projection.put("data.118_Par_WeldingCurrent", 1);
                projection.put("data.119_Par_WeldingVoltage", 1);
                projection.put("data.191_Status_WeldingCurrent_NoFilter", 1);
                projection.put("data.192_Status_WeldingVoltage_NoFilter", 1);
                projection.put("data.157_WeldingSpeed", 1);
                projection.put("data.076_LineVelocity", 1);
                projection.put("data.174_WireFeedSpeed", 1);
                projection.put("data.175_WireFeedCurrent", 1);
                projection.put("data.180_WelderTemperature", 1);
                projection.put("data.181_WelderFanSpeed", 1);

                AtomicInteger weldingIndex = new AtomicInteger(0);
                weldingList.stream().forEach(item -> {
                    Document query = DocumentLib.newDoc("uuid", uuid);
                    Document timeFilter = DocumentLib.newDoc();
                    timeFilter.put("$gte", DateUtils.parseDatePattern(DocumentLib.getString(item, "start"), DateUtils.DateTimePattern));
                    timeFilter.put("$lte", DateUtils.parseDatePattern(DocumentLib.getString(item, "end"), DateUtils.DateTimePattern));
                    query.put("time", timeFilter);

                    String weldingId = DocumentLib.getString(item, "weldingId");
                    weldingIndex.incrementAndGet();

                    Document params = DocumentLib.newDoc();
                    params.put("uuid", uuid);
                    params.put("start", DateUtils.parseDatePattern(DocumentLib.getString(item, "start"), DateUtils.DateTimePattern).getTime());
                    params.put("end", DateUtils.parseDatePattern(DocumentLib.getString(item, "end"), DateUtils.DateTimePattern).getTime());
                    params.put("fields", Lists.newArrayList());
                    AppRobotLineChartBean lineChartBean = new AppRobotLineChartBean(params);
                    List<Document> deviceDataList = lineChartBean.getData();
//                    List<Document> deviceDataList = DBUtils.list(QDeviceData.collectionName, query, projection, DocumentLib.newDoc("time", 1));
                    if (CollectionUtils.isNotEmpty(deviceDataList)) {
                        deviceDataList.stream().forEach(deviceDataRow -> {
                            List<String> datarow = Lists.newArrayList();
                            datarow.add(barcode);
                            datarow.add(weldingId);
                            datarow.add(StringLib.toString(weldingIndex.get()));
                            datarow.add(DateUtils.formatDate((Date) deviceDataRow.get("time"), DateUtils.DateTimePattern));
                            datarow.add(DocumentLib.getString(deviceDataRow, "data.118_Par_WeldingCurrent"));
                            datarow.add(DocumentLib.getString(deviceDataRow, "data.119_Par_WeldingVoltage"));
                            datarow.add(DocumentLib.getString(deviceDataRow, "data.191_Status_WeldingCurrent_NoFilter"));
                            datarow.add(DocumentLib.getString(deviceDataRow, "data.192_Status_WeldingVoltage_NoFilter"));
                            datarow.add(DocumentLib.getString(deviceDataRow, "data.157_WeldingSpeed"));
                            datarow.add(DocumentLib.getString(deviceDataRow, "data.076_LineVelocity"));
                            datarow.add(DocumentLib.getString(deviceDataRow, "data.174_WireFeedSpeed"));
                            datarow.add(DocumentLib.getString(deviceDataRow, "data.175_WireFeedCurrent"));
                            datarow.add(DocumentLib.getString(deviceDataRow, "data.180_WelderTemperature"));
                            datarow.add(DocumentLib.getString(deviceDataRow, "data.181_WelderFanSpeed"));
                            dataList.add(StringLib.join(datarow, ","));
                        });
                    }
                });
            }
        }

        String responseStr = StringLib.join(dataList, "\n").toString();

        String fileName = StringLib.join(uuid, "-", barcode, "(", date, ").csv");

        try {
            byte[] by = responseStr.getBytes("gbk");
            long filelength = by.length;
            OutputStream out = response.getOutputStream();
            FilenameUtil.setFilenameHeader(response, fileName);
            response.addHeader("Content-Range", "bytes 0-" + filelength + "/" + filelength);
            response.addHeader("Accept-Ranges", "bytes");
            response.setContentType("application/csv; charset=UTF-8");
            response.setContentLength(by.length);
            IOUtils.write(by, out);
            out.flush();
            out.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @ResponseBody
    @RequestMapping(value = "dayData")
    public void dayData(@RequestParam String uuid, @RequestParam String date, HttpServletResponse response) throws IOException {
        try {
            new AppRobotWeldCalc(uuid, date);
            // 获取FTP配置，如果选中[下载上传FTP]，下载并上传；如果不选中，则只下载
            Document config = appDataService.get("weld_robot_history_config");
            /*得到ftp server配置*/
            boolean download_ftp = DocumentLib.getBoolean(config, "download_ftp");
            File zipFile = null;
            byte[] by = null;
            boolean result = false;

            if (download_ftp) {
                String ftp_server = DocumentLib.getString(config, "ftp_server");
                int ftp_port = DocumentLib.getInt(config, "ftp_port");
                String ftp_user = DocumentLib.getString(config, "ftp_user");
                String ftp_pwd = DocumentLib.getString(config, "ftp_pwd");
                String ftp_model = DocumentLib.getString(config, "ftp_model");
                SimpleDateFormat sdf = new SimpleDateFormat(DateUtils.DatePattern);
                Date parseDate = sdf.parse(date);
                AppRobotDayDataUploadToFtp appToFtp = new AppRobotDayDataUploadToFtp(
                        ftp_server,
                        ftp_port,
                        ftp_user,
                        ftp_pwd,
                        ftp_model,
                        parseDate,
                        uuid);
                MessageDto messageDto = new MessageDto();
                try {
                    appToFtp.connect();
                } catch (IOException e) {
                    messageDto.addParam("失败原因", e.getMessage());
                }
                zipFile = appToFtp.getZipFile(uuid);
                by = Files.toByteArray(zipFile);
                result = appToFtp.uploadFilesToFtp(uuid);
                appToFtp.disconnect();
                if (result) {
                    messageDto.setTitle("弧焊设备数据手动上传至ftp");
                    messageDto.setContent("弧焊设备" + date + "的焊接数据已上传至ftp:" + ftp_server + ":" + ftp_port);
                } else {
                    messageDto.setTitle("弧焊设备数据手动上传至ftp失败");
                    messageDto.setContent("弧焊设备" + date + "的焊接数据手动上传至ftp:" + ftp_server + ":" + ftp_port + "失败");
                }
                messageDto.addParam("ftp地址", ftp_server + ":" + ftp_port);
                messageDto.addParam("相关设备", uuid);
                messageService.send(messageDto);

            } else {
                AppRobotDayDataDownload appRobotDayDataDownload = new AppRobotDayDataDownload(uuid, date);
                zipFile = appRobotDayDataDownload.getZipFile();
                by = Files.toByteArray(zipFile);
            }

            String filename = StringLib.join(uuid, "#", date, ".zip");
            // header
            final HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);        // response

            if (zipFile != null) {
                zipFile.delete();
            }
            response.setDateHeader("Expires", InitializeWeb.expiredDate);
            response.setHeader("Cache-Control", "max-age=" + InitializeWeb.expireSecond);
            response.setContentLength(by.length);
            FilenameUtil.setFilenameHeader(response, filename);
            OutputStream out = response.getOutputStream();
            IOUtils.write(by, out);
            out.flush();
            out.close();
        } catch (ParseException e) {
            PrintWriter printWriter = response.getWriter();
            printWriter.write(e.getMessage());
            printWriter.close();
        }
    }

    @ResponseBody
    @RequestMapping(value = "export")
    public void download(@RequestParam String uuid,
                         @RequestParam Integer year,
                         @RequestParam Integer month,
                         HttpServletResponse response) {
        CheckMessage checkMessage = CheckMessage.newInstance();

        // Get last day
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.YEAR, year);
        calendar.set(Calendar.MONTH, month - 1);
        int lastDay = calendar.getActualMaximum(Calendar.DAY_OF_MONTH);

        // Get device info
        Document device = DBUtils.find("device", DocumentLib.newDoc("uuid", uuid));
        String deviceName = DocumentLib.getString(device, "baseInfo.name");

        // 遍历 该月每一天的数据
        List<Document> monthList = Lists.newArrayList();
        String key = StringLib.join("weld_robot_history_", uuid, StringLib.SPLIT_1, year, StringLib.SPLIT_1, month, StringLib.SPLIT_1, ".*");
        List<Document> list = DBUtils.list(QAppData.collectionName, DocumentLib.newDoc("key", java.util.regex.Pattern.compile(key)));

        list.stream().forEach(dbDataRow -> {
            List dayList = DocumentLib.getList(DocumentLib.getDocument(dbDataRow, "data"), "arr");
            if (dayList != null && dayList.size() > 0) {
                dayList.stream().forEach(item -> {
                    Document itemObj = (Document) item;
                    monthList.add(itemObj);
                });
            }
        });

        monthList.sort((o1, o2) -> {
            String barcode1 = DocumentLib.getString(o1, "barcode");
            String barcode2 = DocumentLib.getString(o2, "barcode");
            int compare = barcode1.compareTo(barcode2);
            if (compare == 0) {
                Date o1Date = DateUtils.parseDate(DocumentLib.getString(o1, "start"));
                Date o2Date = DateUtils.parseDate(DocumentLib.getString(o2, "start"));
                if (o1Date != null && o2Date != null) {
                    compare = o1Date.compareTo(o2Date);
                }
            }
            return compare;
        });

        checkMessage.addData("count", monthList.size());
        checkMessage.addData("data", monthList);
        List<String> dataList = Lists.newArrayList();

        List<String> headerList = Lists.newArrayList();
        headerList.add("物料品名");
        headerList.add("物料批次");
        headerList.add("物料条码");
        headerList.add("产品焊接结果");
        headerList.add("产品开始时间");
        headerList.add("产品结束时间");
        headerList.add("焊缝序号");
        headerList.add("焊缝ID");
        headerList.add("焊缝焊接结果");
        headerList.add("焊缝开始时间");
        headerList.add("焊缝结束时间");
        headerList.add("焊接类型");
        headerList.add("焊接直径");
        headerList.add("焊材类型");
        headerList.add("保护气类型");
        headerList.add("焊接电流");
        headerList.add("焊接电压");
        headerList.add("反馈电流");
        headerList.add("反馈电压");

        List<Document> fieldList = DocumentLib.getList(appDataService.get("weld_robot_history_config"), "fields");
        if (CollectionUtils.isNotEmpty(fieldList)) {
            fieldList.stream().forEach(field -> {
                String desc = DocumentLib.getString(field, "name");
                headerList.add(desc);
            });
        }
        dataList.add(StringLib.join(headerList, ","));

        /*以Barcode为Key，计算对应的产品结果*/
        Table<String, String, Object> barcodeResultTable = HashBasedTable.create();
        monthList.stream().forEach(item -> {
            String barcode = DocumentLib.getString(item, "barcode");
            String result = DocumentLib.getString(item, "result");
            if (StringLib.equalsIgnoreCase(result, "ng")) {
                addCount(barcodeResultTable, barcode, "ng");
            } else if (StringLib.equalsIgnoreCase(result, "ok")) {
                addCount(barcodeResultTable, barcode, "ok");
            } else {
                addCount(barcodeResultTable, barcode, "noResult");
            }
            addCount(barcodeResultTable, barcode, "total");
            if (!barcodeResultTable.contains(barcode, "start")) {
                barcodeResultTable.put(barcode, "start", DocumentLib.getString(item, "start"));
            }
            barcodeResultTable.put(barcode, "end", DocumentLib.getString(item, "end"));

            int index = addCount(barcodeResultTable, barcode, "index");
            item.put("index", index);
        });

        monthList.sort((o1, o2) -> {
            Date o1Date = DateUtils.parseDate(DocumentLib.getString(o1, "start"));
            Date o2Date = DateUtils.parseDate(DocumentLib.getString(o2, "start"));
            int compare = 0;
            if (o1Date != null && o2Date != null) {
                compare = o1Date.compareTo(o2Date);
            }

            if (compare == 0) {
                String barcode1 = DocumentLib.getString(o1, "barcode");
                String barcode2 = DocumentLib.getString(o2, "barcode");
                compare = barcode1.compareTo(barcode2);
            }
            return compare;
        });

        monthList.stream().forEach(item -> {
            List<String> rowData = Lists.newArrayList();
            String barcode = DocumentLib.getString(item, "barcode");
            rowData.add(DocumentLib.getString(item, "show_data.MaterialName"));
            rowData.add(DocumentLib.getString(item, "show_data.MaterialBatch"));
            rowData.add(barcode);
            /*产品焊接结果*/
            rowData.add(getBarcodeResult(barcodeResultTable, barcode));
            /*产品开始时间*/
            rowData.add(getValue(barcodeResultTable, barcode, "start"));
            /*产品结束时间*/
            rowData.add(getValue(barcodeResultTable, barcode, "end"));
            /*焊缝序号*/
            rowData.add(DocumentLib.getString(item, "index"));
            /*焊缝编号*/
            rowData.add(DocumentLib.getString(item, "weldingId"));
            /*焊缝焊接结果*/
            String result = DocumentLib.getString(item, "result");
            rowData.add(getResult(result));
            /*焊缝开始时间*/
            rowData.add(DocumentLib.getString(item, "start"));
            rowData.add(DocumentLib.getString(item, "end"));
            /*焊机类型*/
            rowData.add(DocumentLib.getString(item, "show_data.128_Par_WelderType"));
            /*焊丝直径*/
            rowData.add(DocumentLib.getString(item, "show_data.131_Par_WireType"));
            /*焊材类型*/
            rowData.add(DocumentLib.getString(item, "show_data.130_Par_MaterialType"));
            /*保护气类型*/
            rowData.add(DocumentLib.getString(item, "show_data.132_Par_GasType"));
            /*焊接电流*/
            rowData.add(DocumentLib.getString(item, "show_data.118_Par_WeldingCurrent"));
            /*焊接电压*/
            rowData.add(DocumentLib.getString(item, "show_data.119_Par_WeldingVoltage"));
            /*反馈电流*/
            rowData.add(DocumentLib.getString(item, "show_data.120_Status_WeldingCurrent"));
            /*反馈电压*/
            rowData.add(DocumentLib.getString(item, "show_data.121_Status_WeldingVoltage"));

            if (CollectionUtils.isNotEmpty(fieldList)) {
                fieldList.stream().forEach(field -> {
                    String bind = DocumentLib.getString(field, "bind");
                    String value = DocumentLib.getString(item, StringLib.join("show_data.", bind));
                    rowData.add(value);
                });
            }
            dataList.add(StringLib.join(rowData, ","));
        });

        String responseStr = StringLib.join(dataList, "\n").toString();

        String fileName = StringLib.join(uuid, "(", year, "-", month, ").csv");

        try {
            byte[] by = responseStr.getBytes("gbk");
            long filelength = by.length;
            OutputStream out = response.getOutputStream();
            FilenameUtil.setFilenameHeader(response, fileName);
            response.addHeader("Content-Range", "bytes 0-" + filelength + "/" + filelength);
            response.addHeader("Accept-Ranges", "bytes");
            response.setContentType("application/csv; charset=UTF-8");
            response.setContentLength(by.length);
            IOUtils.write(by, out);
            out.flush();
            out.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private Integer addCount(Table<String, String, Object> table, String barcode, String key) {
        Integer count = StringLib.toInteger(table.get(barcode, key));
        if (count == null) {
            count = 0;
        }
        count++;
        table.put(barcode, key, count);
        return count;
    }

    private int getCount(Table<String, String, Object> table, String barcode, String key) {
        Integer count = StringLib.toInteger(table.get(barcode, key));
        if (count == null) {
            count = 0;
        }
        return count;
    }

    private String getBarcodeResult(Table<String, String, Object> table, String barcode) {
        int ngTimes = getCount(table, barcode, "ng");
        String result = "";
        if (ngTimes > 0) {
            result = "不合格";
        } else {
            if (getCount(table, barcode, "noResult") > 0) {
                result = "";
            } else {
                result = "合格";
            }
        }
        return result;
    }

    private String getResult(String result) {
        if (StringLib.equalsIgnoreCase(result, "ng")) {
            return "不合格";
        } else if (StringLib.equalsIgnoreCase(result, "ng")) {
            return "合格";
        }
        return "";
    }

    public String getValue(Table<String, String, Object> table, String barcode, String key) {
        return StringLib.toString(table.get(barcode, key));
    }

    @Autowired
    private AppRobotWeldService appRobotWeldService;

    @ResponseBody
    @RequestMapping(value = "testCron", method = {RequestMethod.GET})
    public String testHuhanCron() {
        appRobotWeldService.submitFileToFtp();
        String info = "触发完成";
        return info;
    }

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private DevicePushService devicePushService;

    @ResponseBody
    @PostMapping(value = "creatDataConfigTxt")
    public String creatDataConfigTxt(@RequestParam String uuid, @RequestParam String StateDataFrequency, @RequestParam String SamplingPeriod,
                                     @RequestParam String SendDataString, @RequestParam String SamplingString, @RequestParam String file_path_to,
                                     HttpServletRequest request) {
        CheckMessage checkMessage = CheckMessage.newInstance();

        BigInteger SendDataBinary = new BigInteger(SendDataString, 2);
        BigInteger SamplingBinary = new BigInteger(SamplingString, 2);
        String SendDataKey = SendDataBinary.toString(16);
        String SamplingKey = SamplingBinary.toString(16);


        int sendDataKeyLen = SendDataKey.length();
        if (sendDataKeyLen < 53) {
            while (sendDataKeyLen < 53) {
                StringBuffer sb = new StringBuffer();
                sb.append("0").append(SendDataKey);//左补0
                SendDataKey = sb.toString();
                sendDataKeyLen = SendDataKey.length();
            }
        }

        int samplingKeyLen = SamplingKey.length();
        if (samplingKeyLen < 53) {
            while (samplingKeyLen < 53) {
                StringBuffer sb = new StringBuffer();
                sb.append("0").append(SamplingKey);//左补0
                SamplingKey = sb.toString();
                samplingKeyLen = SamplingKey.length();
            }
        }

        StringBuilder txtContent = new StringBuilder();
        txtContent.append("StateDataFrequency:");
        txtContent.append(StateDataFrequency);
        txtContent.append(";\r\n");
        txtContent.append("SamplingPeriod:");
        txtContent.append(SamplingPeriod);
        txtContent.append(";\r\n");
        txtContent.append("SendDataKey:");
        txtContent.append(SendDataKey);
        txtContent.append(";\r\n");
        txtContent.append("SamplingKey:");
        txtContent.append(SamplingKey);
        txtContent.append(";\r\n");

        InputStream inputStream = IOUtils.toInputStream(txtContent.toString());

        String fileName = "ClouldSendParFile.txt";
        ObjectNode result = fileStorageService.storeFile(inputStream, fileName, "");
        String fileId = JsonLib.getString(result, "fileId");
        GridFSFile file = fileStorageService.fetchFile(fileId);

        ObjectNode pushObj = JsonLib.createObjNode();
        pushObj.put("uuid", uuid);
        pushObj.put("action", "cloud_download");
        ObjectNode pushData = JsonLib.createObjNode();
        pushData.put("server_url", StringLib.join(RequestLib.getCompleteUrl(request), "gridfs/", fileId));
        pushData.put("file_name", fileName);
        pushData.put("file_path_to", file_path_to);
        pushData.put("checksum", file.getMD5());
        pushObj.set("data", pushData);
        devicePushService.pushToDevice(pushObj);

        return checkMessage.toString();
    }

    @ResponseBody
    @RequestMapping(value = "lineChartData")
    public String loadLineChart(@RequestParam String data) {
        data = StringLib.decodeURI(data);
        Document param = DocumentLib.parse(data);
        AppRobotLineChartBean lineChartBean = new AppRobotLineChartBean(param);
        return JsonLib.toJSON(lineChartBean.getData()).toString();
    }

}
