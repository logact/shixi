package com.cynovan.janus.addons.welding.history.controller.service;

import com.cynovan.janus.base.appstore.service.AppDataService;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.devicedata.jdo.QDeviceData;
import com.cynovan.janus.base.gridfs.service.FileStorageService;
import com.cynovan.janus.base.utils.*;
import com.google.common.collect.LinkedListMultimap;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.compress.archivers.zip.Zip64Mode;
import org.apache.commons.compress.archivers.zip.ZipArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveOutputStream;
import org.apache.commons.compress.utils.IOUtils;
import org.bson.Document;
import org.joda.time.LocalDate;
import org.joda.time.LocalDateTime;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.atomic.AtomicInteger;

public class AppRobotDayDataDownload {

    private String uuid;
    private LocalDate queryDate;
    private Date dateStart;
    private Date dateEnd;

    private File paramFile;
    private File dataFile;
    private File zipFile;

    private String filePrefix;
    private Map<String, String> imageMap = Maps.newHashMap();

    private String appDataKey;
    private Document configDocument;

    private AppDataService appDataService;

    private List<String> paramList = Lists.newArrayList();
    private List<String> totalDataList = Lists.newArrayList();

    public AppRobotDayDataDownload(String _uuid, String _date) {
        this.uuid = _uuid;
        initialize(_date);
    }

    private void initialize(String _date) {
        initializeVar(_date);
        createTempFile();
        initCSVHeader();
        loadData();
        writeToFile();
    }

    private void writeToFile() {
        try {
            ZipArchiveOutputStream zipArchiveOutputStream = new ZipArchiveOutputStream(zipFile);
            zipArchiveOutputStream.setUseZip64(Zip64Mode.AsNeeded);
            /*加工参数写入文件中*/
            String paramString = StringLib.join(paramList, "\n");
            FileUtils.writeByteArrayToFile(paramFile, paramString.getBytes("gbk"));
            ZipArchiveEntry paramFileEntry = new ZipArchiveEntry(paramFile, "加工参数.csv");
            zipArchiveOutputStream.putArchiveEntry(paramFileEntry);
            addFileToZipEntry(paramFile, zipArchiveOutputStream);
            paramFile.delete();

            /*数据写入文件中*/
            String dataString = StringLib.join(totalDataList, "\n");
            FileUtils.writeByteArrayToFile(dataFile, dataString.getBytes("gbk"));
            ZipArchiveEntry dataEntry = new ZipArchiveEntry(dataFile, "焊接数据.csv");
            zipArchiveOutputStream.putArchiveEntry(dataEntry);
            addFileToZipEntry(dataFile, zipArchiveOutputStream);
            dataFile.delete();

            File readmeFile = File.createTempFile(filePrefix, ".txt");
            StringBuilder readmeTxt = new StringBuilder();
            readmeTxt.append("1. ZIP命名方式为:设备UUID#日期.zip\n");
            readmeTxt.append("2. 加工参数.csv 中显示所有焊缝数据加工参数,[焊缝ID]为焊缝的唯一标识ID\n");
            readmeTxt.append("3. 焊接数据.csv 中显示焊缝焊接的过程数据,[焊缝ID]为焊缝的唯一标识ID,对应[加工参数.csv]中的[焊缝ID]\n");
//            readmeTxt.append("4. 焊缝结果图片也包含在zip中，图片命名方式为:[uuid#焊缝ID#索引.jpg],焊缝ID对应[加工参数.csv]中的[焊缝ID]\n");
            readmeTxt.append("4. 焊缝结果图片也包含在zip中，图片命名方式为:[条码#焊接序号#索引.jpg],条码和焊接序号对应[加工参数.csv]中的[条码]和[焊接序号]\n");
            FileUtils.writeByteArrayToFile(readmeFile, readmeTxt.toString().getBytes("gbk"));
            ZipArchiveEntry readmeEntry = new ZipArchiveEntry(readmeFile, "readme.txt");
            zipArchiveOutputStream.putArchiveEntry(readmeEntry);
            addFileToZipEntry(readmeFile, zipArchiveOutputStream);
            readmeFile.delete();
            /*循环读取文件写入*/
            if (MapUtils.isNotEmpty(imageMap)) {
                FileStorageService fileStorageService = SpringContext.getBean(FileStorageService.class);
                for (Entry<String, String> entry : imageMap.entrySet()) {
                    GridFSFile file = fileStorageService.fetchFile(entry.getValue());
                    byte[] imageArr = fileStorageService.getGridFsByteArray(file);
                    if (imageArr != null && imageArr.length > 0) {
                        File imageFile = File.createTempFile(filePrefix, ".jpg");
                        FileUtils.writeByteArrayToFile(imageFile, imageArr);

                        ZipArchiveEntry imageFileEntry = new ZipArchiveEntry(imageFile, "image/" + entry.getKey() + ".jpg");
                        zipArchiveOutputStream.putArchiveEntry(imageFileEntry);

                        addFileToZipEntry(imageFile, zipArchiveOutputStream);
                        imageFile.delete();
                    }
                }
            }
            IOUtils.closeQuietly(zipArchiveOutputStream);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
        }
    }

    public File getZipFile() {
        return zipFile;
    }

    private void addFileToZipEntry(File destFile, ZipArchiveOutputStream zipArchiveOutputStream) throws Exception {
        byte[] buffer = new byte[1024 * 1024 * 5];
        int len = -1;
        InputStream inputStream = new FileInputStream(destFile);
        while ((len = inputStream.read(buffer)) != -1) {
            //把缓冲区的字节写入到ZipArchiveEntry
            zipArchiveOutputStream.write(buffer, 0, len);
        }
        zipArchiveOutputStream.closeArchiveEntry();
        IOUtils.closeQuietly(inputStream);
    }

    private void initializeVar(String _date) {
        queryDate = LocalDate.fromDateFields(DateUtils.parseDate(_date));

        dateStart = LocalDateTime.fromDateFields(queryDate.toDate()).withTime(0, 0, 0, 0).toDate();
        dateEnd = LocalDateTime.fromDateFields(queryDate.toDate()).withTime(23, 59, 59, 999).toDate();

        filePrefix = StringLib.join("app_robot_day_download_", uuid, "_", DateUtils.getDate());
        appDataKey = StringLib.join("weld_robot_history_", uuid, "_", queryDate.getYear(), "_", queryDate.getMonthOfYear(), "_", queryDate.getDayOfMonth());
        appDataService = SpringContext.getBean(AppDataService.class);
        configDocument = appDataService.get("weld_robot_history_config");
    }

    private void createTempFile() {
        try {
            paramFile = File.createTempFile(filePrefix, ".csv");
            dataFile = File.createTempFile(filePrefix, ".csv");
            zipFile = File.createTempFile(filePrefix, ".zip");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void initCSVHeader() {
        /*param的header*/
        List<String> paramHeader = Lists.newArrayList();
        paramHeader.add("序号");
        paramHeader.add("设备UUID");
        paramHeader.add("物料品名");
        paramHeader.add("物料批次");
        paramHeader.add("条码");
        paramHeader.add("焊缝ID");
        paramHeader.add("焊接序号");
        paramHeader.add("焊缝开始时间");
        paramHeader.add("焊缝结束时间");
        List<Document> fields = DocumentLib.getList(configDocument, "fields");
        if (CollectionUtils.isNotEmpty(fields)) {
            fields.stream().forEach(field -> {
                paramHeader.add(DocumentLib.getString(field, "name"));
            });
        }
        paramList.add(StringLib.join(paramHeader, ","));
        /*data的header*/
        List<String> dataHeader = Lists.newArrayList();
        dataHeader.add("序号");
        dataHeader.add("设备UUID");
        dataHeader.add("物料品名");
        dataHeader.add("物料批次");
        dataHeader.add("条码");
        dataHeader.add("焊缝ID");
        dataHeader.add("焊接序号");
        dataHeader.add("时间");
        dataHeader.add("给定电流");
        dataHeader.add("给定电压");
        dataHeader.add("反馈电流");
        dataHeader.add("反馈电压");
        dataHeader.add("焊接速度设定值");
        dataHeader.add("焊接速度实际值");
        dataHeader.add("送丝速度");
        dataHeader.add("送丝负荷");
        dataHeader.add("主板温度");
        dataHeader.add("风扇转速");
        totalDataList.add(StringLib.join(dataHeader, ","));
    }

    private void loadData() {
        /*得到今日的焊接数据*/
        AtomicInteger paramIndex = new AtomicInteger(1);
        AtomicInteger dataIndex = new AtomicInteger(1);
        Document dayData = appDataService.get(appDataKey);
        List<Document> dataList = DocumentLib.getList(dayData, "arr");
        if (CollectionUtils.isNotEmpty(dataList)) {
            Document projection = DocumentLib.newDoc();
            projection.put("time", 1);
            projection.put("data.101_Status_DI_ArcWeldingStart", 1);
            projection.put("data.118_Par_WeldingCurrent", 1);
            projection.put("data.119_Par_WeldingVoltage", 1);
            projection.put("data.120_Status_WeldingCurrent", 1);
            projection.put("data.121_Status_WeldingVoltage", 1);
            projection.put("data.157_WeldingSpeed", 1);
            projection.put("data.076_LineVelocity", 1);
            projection.put("data.174_WireFeedSpeed", 1);
            projection.put("data.175_WireFeedCurrent", 1);
            projection.put("data.180_WelderTemperature", 1);
            projection.put("data.181_WelderFanSpeed", 1);

            dataList.sort((o1, o2) -> {
                return DocumentLib.getString(o1, "start").compareTo(DocumentLib.getString(o2, "start"));
            });
            /* key 是barcode, value 是该barcode 的焊接记录 */
            LinkedListMultimap<String, Document> weldMultimap = LinkedListMultimap.create();
            dataList.stream().forEach(item -> {
                Document itemDoc = (Document) item;
                String barcode = DocumentLib.getString(itemDoc, "barcode");
                weldMultimap.put(barcode, itemDoc);
            });
            List<Document> fields = DocumentLib.getList(configDocument, "fields");
            List<String> barcodeSet = Lists.newArrayList(weldMultimap.keySet());
            barcodeSet.stream().forEach(barcodeItem -> {
                Collection<Document> barcodeDataList = weldMultimap.get(barcodeItem);
                AtomicInteger weldingIndex = new AtomicInteger(0);
                /*焊接参数的Header*/
                barcodeDataList.stream().forEach(item -> {
                    /*每一条焊缝会有一条加工参数数据*/
                    Document show_data = DocumentLib.getDocument(item, "show_data");
                    List<String> paramRow = Lists.newArrayList();
                    paramRow.add(StringLib.toString(paramIndex.get()));
                    paramRow.add(uuid);

                    String weldingId = DocumentLib.getString(item, "weldingId");
                    weldingIndex.incrementAndGet();

                    paramRow.add(DocumentLib.getString(show_data, "MaterialName"));
                    paramRow.add(DocumentLib.getString(show_data, "MaterialBatch"));
                    paramRow.add(DocumentLib.getString(item, "barcode"));
                    paramRow.add(weldingId);
                    paramRow.add(StringLib.toString(weldingIndex.get()));
                    String start = DocumentLib.getString(item, "start");
                    String end = DocumentLib.getString(item, "end");
                    paramRow.add(start);
                    paramRow.add(end);

                    fields.stream().forEach(field -> {
                        String bind = DocumentLib.getString(field, "bind");
                        String value = DocumentLib.getString(show_data, bind);
                        paramRow.add(value);
                    });

                    paramList.add(StringLib.join(paramRow, ","));
                    paramIndex.incrementAndGet();
                    /*绑定图片信息*/
                    List<String> imgList = DocumentLib.getList(item, "image_ids");
                    if (CollectionUtils.isNotEmpty(imgList)) {
                        AtomicInteger imgIdx = new AtomicInteger(1);
                        imgList.stream().forEach(imgId -> {
//                            String fileName = StringLib.join(uuid, "#", weldingId, "#", imgIdx.get());
                            String fileName = StringLib.join(barcodeItem, "#", weldingIndex, "#", imgIdx.get());
                            imgIdx.incrementAndGet();
                            imageMap.put(fileName, imgId);
                        });
                    }

                    /*每一条焊缝的详细数据，循环中读取数据库*/
                    Document query = DocumentLib.newDoc("uuid", uuid);
                    Document timeFilter = DocumentLib.newDoc();
                    timeFilter.put("$gte", DateUtils.parseDatePattern(start, DateUtils.DateTimePattern));
                    timeFilter.put("$lte", DateUtils.parseDatePattern(end, DateUtils.DateTimePattern));
                    query.put("time", timeFilter);
                    List<Document> deviceDataList = DBUtils.list(QDeviceData.collectionName, query, projection, DocumentLib.newDoc("time", 1));
                    if (CollectionUtils.isNotEmpty(deviceDataList)) {
                        deviceDataList.stream().forEach(row -> {
                            List<String> deviceData = Lists.newArrayList();
                            deviceData.add(StringLib.toString(dataIndex.get()));
                            deviceData.add(uuid);
                            deviceData.add(DocumentLib.getString(show_data, "MaterialName"));
                            deviceData.add(DocumentLib.getString(show_data, "MaterialBatch"));
                            deviceData.add(DocumentLib.getString(item, "barcode"));
                            deviceData.add(DocumentLib.getString(item, "weldingId"));
                            deviceData.add(StringLib.toString(weldingIndex.get()));
                            deviceData.add(DateUtils.formatDateTime(DocumentLib.getDate(row, "time")));
                            deviceData.add(DocumentLib.getString(row, "data.118_Par_WeldingCurrent"));
                            deviceData.add(DocumentLib.getString(row, "data.119_Par_WeldingVoltage"));
                            deviceData.add(DocumentLib.getString(row, "data.120_Status_WeldingCurrent"));
                            deviceData.add(DocumentLib.getString(row, "data.121_Status_WeldingVoltage"));
                            deviceData.add(DocumentLib.getString(row, "data.157_WeldingSpeed"));
                            deviceData.add(DocumentLib.getString(row, "data.076_LineVelocity"));
                            deviceData.add(DocumentLib.getString(row, "data.174_WireFeedSpeed"));
                            deviceData.add(DocumentLib.getString(row, "data.175_WireFeedCurrent"));
                            deviceData.add(DocumentLib.getString(row, "data.180_WelderTemperature"));
                            deviceData.add(DocumentLib.getString(row, "data.181_WelderFanSpeed"));
                            totalDataList.add(StringLib.join(deviceData, ","));
                            dataIndex.incrementAndGet();
                        });
                    }
                });
            });

        }
    }
}
