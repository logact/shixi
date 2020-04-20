package com.cynovan.janus.addons.systeminfo.service;

import com.cynovan.janus.base.device.database.jdo.QJanus;
import com.cynovan.janus.base.device.database.jdo.QJdoList;
import com.cynovan.janus.base.i18n.service.I18nService;
import com.cynovan.janus.base.message.entity.MessageDto;
import com.cynovan.janus.base.message.service.MessageService;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.DeleteManyModel;
import com.mongodb.client.model.WriteModel;
import com.sun.management.OperatingSystemMXBean;
import org.bson.Document;
import org.joda.time.Days;
import org.joda.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.nio.file.FileStore;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * @author win.li@cynovan.com
 */
@Service
public class JanusInfoService {

    private Logger logger = LoggerFactory.getLogger(JanusInfoService.class);

    private static final long JANUS_FIXED_SIZE = 1024 * 1024 * 500;

    @Autowired
    private MessageService messageService;
    @Autowired
    private I18nService i18nService;

    /**
     * 获取系统信息
     *
     * @return 系统信息 JSON Object
     */
    public ObjectNode getOsInfo() {
        Properties props = System.getProperties();
        ObjectNode os = JsonLib.createObjNode();
        os.put("name", props.getProperty("os.name"));
        os.put("version", props.getProperty("os.version"));
        return os;
    }

    /**
     * 获取内存信息
     * <p>
     * 单位： bytes
     *
     * @return 内存信息 JSON Object
     */
    public ObjectNode getMemoryInfo() {
        OperatingSystemMXBean osBean = (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        long total = osBean.getTotalPhysicalMemorySize();
        ObjectNode memory = JsonLib.createObjNode();
        memory.put("total", total);
        return memory;
    }

    /**
     * 获取磁盘信息
     * <p>
     * 单位： bytes
     *
     * @return 磁盘信息 JSON Object
     */
    public ArrayNode getDiskInfo() {
        ArrayNode disk = JsonLib.createArrNode();
        for (Path root : FileSystems.getDefault().getRootDirectories()) {
            ObjectNode diskNode = JsonLib.createObjNode();
            diskNode.put("devname", String.valueOf(root));
            try {
                FileStore store = Files.getFileStore(root);
                long total = store.getTotalSpace();
                long available = store.getUsableSpace();
                long used = total - available;
                diskNode.put("total", total);
                diskNode.put("available", available);
                diskNode.put("used", used);
                disk.add(diskNode);
            } catch (IOException ignored) {
            }
        }
        return disk;
    }

    /**
     * 获取网卡信息
     *
     * @return 网卡信息 JSON Object
     */
    public ArrayNode getNetworkInterfaceInfo() {
        ArrayNode card = JsonLib.createArrNode();
        try {
            ObjectNode cardNode = JsonLib.createObjNode();
            Enumeration<NetworkInterface> networkInterfaceEnum = NetworkInterface.getNetworkInterfaces();
            while (networkInterfaceEnum.hasMoreElements()) {
                NetworkInterface networkInterface = networkInterfaceEnum.nextElement();
                if (!networkInterface.isLoopback() && networkInterface.isUp()) {
                    Enumeration<InetAddress> ips = networkInterface.getInetAddresses();
                    while (ips.hasMoreElements()) {
                        InetAddress addr = ips.nextElement();
                        if (addr instanceof Inet4Address && addr.getHostAddress() != null && addr.getHostAddress().length() > 0) {
                            cardNode.put("ifaces", networkInterface.getName());
                            cardNode.put("ip", addr.getHostAddress());
                            cardNode.put("mac", getMacAddress(networkInterface));
                            for (int i = 0; i < (networkInterface.getInterfaceAddresses()).size(); i++) {
                                if (!StringLib.contains(networkInterface.getInterfaceAddresses().get(i).toString(), ":")) {
                                    cardNode.put("netmask", intToIP(networkInterface.getInterfaceAddresses().get(i).getNetworkPrefixLength()));
                                }
                            }
                            card.add(cardNode);
                        }
                    }
                }
            }
            return card;

        } catch (SocketException e) {
            e.printStackTrace();
            return null;
        }
    }


    /**
     * 获取存储信息
     * <p>
     * 单位： bytes
     *
     * @return 存储信息 JSON Object
     */
    public ObjectNode getStorageInfo() {
        ObjectNode info = JsonLib.createObjNode();
        Document dbStats = getDbStats();
        double storageSize = DocumentLib.getDouble(dbStats, "storageSize");
        double fsTotalSize = DocumentLib.getDouble(dbStats, "fsTotalSize");
        info.put("storageSize", storageSize + JANUS_FIXED_SIZE);
        info.put("fsTotalSize", fsTotalSize);
        return info;
    }


    @Scheduled(cron = "0 0 3 * * ?")
    private void scheduleCheckStrategy() {
        logger.info(" ==== janus auto clean start! ====");
        checkStrategy();
        logger.info(" ==== janus auto clean end! ====");
    }

    /**
     * *
     * 峰值监控策略为A时：比较Janus占用的硬盘容量storageSize 是否大于所填的峰值数peak
     * 峰值监控策略为B时：比较Janus占所在硬盘的容量比part 是否大于所选峰值比例peak
     */
    private void checkStrategy() {
        Document strategy = DBUtils.find("autoClearStrategy", null);
        String plan = DocumentLib.getString(strategy, "plan");

        Document dbStats = getDbStats();
        //unit b -> gb , 加上 500MB 固有空间
        double janusSize = DocumentLib.getDouble(dbStats, "storageSize") + JANUS_FIXED_SIZE;
        logger.info("==== janus auto clean begin check stragegy ====");
        logger.info("==== storageSize is " + janusSize + "B ====");
        logger.info("==== plan is " + plan + " ====");

        if (StringLib.equals(plan, "A")) {
            // unit gb, if storageSize gt peak, clean data
            int peak = DocumentLib.getInt(strategy, "peak");
            logger.info("==== peak is " + peak + "GB ====");
            /*转换为GB*/
            double gbSize = janusSize / 1024 / 1024 / 1024;
            if (gbSize > peak) {
                logger.info("==== auto clean plan A triggered ====");
                removeData();
            }
        } else {
            double systemSize = DocumentLib.getDouble(dbStats, "fsTotalSize");
            logger.info("==== fsTotalSize is " + systemSize + "B ====");
            double janusPercent = janusSize / systemSize * 100;
            logger.info("==== percentage is " + janusPercent + " ====");
            // if percentage gt peak, clean data
            int peak = StringLib.toInteger(DocumentLib.getString(strategy, "peak"));
            logger.info("==== peak is " + peak + "% ====");
            if (janusPercent > peak) {
                logger.info("==== auto clean plan B triggered ====");
                removeData();
            }
        }
    }

    /**
     * *
     * 获取用户所选择的清除比例,以及获取deviceData的总数量,
     * 计算需要清除的数据量,得到需要清除的数据中最后一条数据的时间,sort by time
     * 清除小于该时间点的全部数据.清除数据前后均调用getDbStats方法,通过差值计算janus的容量清除了多少。
     */
    public void removeData() {

        Document strategy = DBUtils.find("autoClearStrategy", null);
        double clearProportion = DocumentLib.getDouble(strategy, "clearProportion");
        double percentToClear = clearProportion / 100;

        /*通过日期计算要删除的数据。
         * Janus有注册日期,每次清除数据记录最后一次清除时间，时间时间来计算百分比*/
        Document janus = QJanus.get();
        Date lastPurgeDate = DocumentLib.getDate(janus, "last_purge_date");

        if (lastPurgeDate == null) {
            /*当最后一次清除日期为null时，使用Janus的创建日期作为坐标*/
            lastPurgeDate = DocumentLib.getDate(janus, "create_date");
        }
        if (lastPurgeDate == null) {
            /*都计算错误时，默认策略为计算当前日期内的2个月数据*/
            lastPurgeDate = LocalDate.now().minusDays(60).toDate();
        }

        /*根据比例计算要清除的数据*/
        int daysDiff = Days.daysBetween(LocalDate.fromDateFields(lastPurgeDate), LocalDate.now()).getDays();
        daysDiff = Math.abs(daysDiff);

        int purgeDays = StringLib.toInteger(daysDiff * percentToClear);

        Date newPurgeDate = LocalDate.fromDateFields(lastPurgeDate).plusDays(purgeDays).toDate();

        /*需要清除的collection列表*/
        List<Document> autoRemoveJdoList = DBUtils.list(QJdoList.collectionName, DocumentLib.newDoc("autoRemoveData", true));
        Set<String> autoRemoveCollSet = autoRemoveJdoList.stream().map(item -> {
            return DocumentLib.getString(item, "collection");
        }).collect(Collectors.toSet());

        AtomicLong removeCount = new AtomicLong();

        Document deleteQuery = DocumentLib.newDoc("time", DocumentLib.newDoc("$lte", newPurgeDate));
        autoRemoveCollSet.stream().forEach(collName -> {
            MongoCollection mongoCollection = DBUtils.getCollection(collName);

            List<WriteModel> list = Lists.newArrayList();
            list.add(new DeleteManyModel(deleteQuery));
            BulkWriteResult bulkWriteResult = mongoCollection.bulkWrite(list);
            removeCount.addAndGet(bulkWriteResult.getDeletedCount());
        });

        /*清除成功后，更新Janus的最后清除日期*/
        DBUtils.updateOne(QJanus.collectionName, DocumentLib.newDoc("token", QJanus.getToken()), DocumentLib.new$Set("last_purge_date", newPurgeDate));

        if (removeCount.get() > 0) {

            autoRemoveCollSet.stream().forEach(collName -> {
                DBUtils.runCommand(DocumentLib.newDoc("compact", collName));
            });

            logger.info("==== auto clean finished, " + removeCount.get() + "data removed. ====");

            MessageDto messageDto = new MessageDto();
            messageDto.setTitle(i18nService.getValue("Janus自动清除完成", "janus.auto.delete", "system"));
            StringBuilder contentBuilder = new StringBuilder();
            contentBuilder.append("已触发自动删除策略，于 ");
            contentBuilder.append("%s");
            contentBuilder.append(StringLib.join(" 清除了 ", "%d", " 条数据"));
            messageDto.setContent(String.format(i18nService.getValue(contentBuilder.toString(), "janus.auto.delete.tip", "system"), DateUtils.getDate(DateUtils.DateTimePattern), removeCount.get()));
            messageService.send(messageDto);
        }
    }

    private String intToIP(int prflen) {
        int shft = 0xffffffff << (32 - prflen);
        int oct1 = ((byte) ((shft & 0xff000000) >> 24)) & 0xff;
        int oct2 = ((byte) ((shft & 0x00ff0000) >> 16)) & 0xff;
        int oct3 = ((byte) ((shft & 0x0000ff00) >> 8)) & 0xff;
        int oct4 = ((byte) (shft & 0x000000ff)) & 0xff;
        return oct1 + "." + oct2 + "." + oct3 + "." + oct4;
    }

    private String getMacAddress(NetworkInterface networkInterface) throws SocketException {
        byte[] mac = networkInterface.getHardwareAddress();
        if (mac != null) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < mac.length; i++) {
                sb.append(String.format("%02X%s", mac[i], (i < mac.length - 1) ? ":" : ""));
            }
            return sb.toString();
        }
        return null;
    }

    private Document getDbStats() {
        return DBUtils.runCommand(DocumentLib.newDoc("dbStats", 1));
    }

}
