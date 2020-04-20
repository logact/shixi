package com.cynovan.janus.base.utils;

import com.google.common.collect.Lists;
import com.ibm.icu.text.CharsetDetector;
import com.ibm.icu.text.CharsetMatch;
import org.apache.commons.lang3.ArrayUtils;

import javax.servlet.http.HttpServletRequest;
import java.io.UnsupportedEncodingException;
import java.net.*;
import java.nio.charset.Charset;
import java.text.DecimalFormat;
import java.util.Enumeration;
import java.util.List;

public class StringLib extends org.apache.commons.lang3.StringUtils {

    public static final String UTF_8 = "UTF-8";
    public static final String GBK = "GBK";

    /**
     * split char @
     */
    public static final String SPLIT_1 = "_";
    public static final String SPLIT_2 = ":";
    public static final String SPLIT_3 = ",";

    public static final String TRUE = "true";
    public static final String FALSE = "false";

    private static final String CHAR1 = "+";
    private static final String ChAR1_ENCODE = "%20";

    public static String decodeURI(String str) {
        if (StringLib.isBlank(str)) {
            return EMPTY;
        }
        try {
            str = URLDecoder.decode(str, UTF_8);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return str;
    }

    public static boolean equalsAny(String key, String... values) {
        if (ArrayUtils.isNotEmpty(values)) {
            for (String str : values) {
                if (StringLib.equals(key, str)) {
                    return true;
                }
            }
        }
        return false;
    }

    public static String encodeURI(String part) {
        try {
            return URLEncoder.encode(part, UTF_8).replace(CHAR1, ChAR1_ENCODE);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static String toString(Object obj) {
        return obj == null ? "" : obj.toString();
    }

    /**
     * 缩略字符串（不区分中英文字符）
     *
     * @param str    目标字符串
     * @param length 截取长度
     * @return
     */
    public static String abbr(String str, int length) {
        if (str == null) {
            return EMPTY;
        }
        try {
            StringBuilder sb = new StringBuilder();
            int currentLength = 0;
            for (char c : str.toCharArray()) {
                currentLength += StringLib.toString(c).getBytes("GBK").length;
                if (currentLength <= length - 3) {
                    sb.append(c);
                } else {
                    sb.append("...");
                    break;
                }
            }
            return sb.toString();
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return "";
    }

    /**
     * 转换为Double类型
     */
    public static Double toDouble(Object val) {
        if (val == null) {
            return 0D;
        }
        try {
            return Double.valueOf(trim(val.toString()));
        } catch (Exception e) {
            return 0D;
        }
    }

    /**
     * 转换为Float类型
     */
    public static Float toFloat(Object val) {
        return toDouble(val).floatValue();
    }

    /**
     * 转换为Long类型
     */
    public static Long toLong(Object val) {
        return toDouble(val).longValue();
    }

    /**
     * 转换为Integer类型
     */
    public static Integer toInteger(Object val) {
        return toLong(val).intValue();
    }

    public static Short toShort(Object val) {
        return toShort(val).shortValue();
    }

    /**
     * 获得用户远程地址
     */
    public static String getRemoteAddr(HttpServletRequest request) {
        String remoteAddr = (String) request.getAttribute("X-Real-IP");
        if (StringLib.isEmpty(remoteAddr)) {
            remoteAddr = request.getHeader("X-Real-IP");
        }
        if (StringLib.isEmpty(remoteAddr)) {
            remoteAddr = request.getHeader("X-Forwarded-For");
        }
        if (StringLib.isEmpty(remoteAddr)) {
            remoteAddr = request.getHeader("Proxy-Client-IP");
        }
        if (StringLib.isEmpty(remoteAddr)) {
            remoteAddr = request.getHeader("WL-Proxy-Client-IP");
        }
        return remoteAddr != null ? remoteAddr : request.getRemoteAddr();
    }


    /**
     * convert long to binary string, empty byte will be filled with 0, like, toBinaryString(2, 4) => 0010
     *
     * @param value
     * @param length
     */
    public static String toBinaryString(long value, int length) {
        String binString = Long.toBinaryString(value);
        StringBuffer b = new StringBuffer(binString);

        while (b.length() < length) {
            b.insert(0, '0');
        }
        return b.toString();
    }

    /**
     * convert file size in byte to readable string, like xxKB, xxMB, xxGB
     *
     * @param size file size (byte)
     * @return
     */
    public static String readableFileSize(long size) {
        if (size <= 0) {
            return "0";
        }
        final String[] units = new String[]{"B", "kB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
        return new DecimalFormat("#,##0.#").format(size / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }

    public static List<String> getMACAddresses() {
        List<String> addresses = Lists.newArrayList();
        try {
            Enumeration<NetworkInterface> networkInterfaceEnum = NetworkInterface.getNetworkInterfaces();
            while (networkInterfaceEnum.hasMoreElements()) {
                NetworkInterface networkInterface = networkInterfaceEnum.nextElement();
                if (!networkInterface.isLoopback() && !networkInterface.isPointToPoint() && !networkInterface.isVirtual()) {
                    List<String> list = Lists.newArrayList();
                    byte[] macAddress = networkInterface.getHardwareAddress();
                    if (macAddress != null) {
                        for (int i = 0; i < macAddress.length; i++) {
                            String s = Integer.toHexString(macAddress[i] & 0xFF);
                            list.add(s.length() == 1 ? 0 + s : s);
                        }
                    }

                    if (list.size() > 0) {
                        addresses.add(StringLib.join(list, "-"));
                    }
                }
            }
        } catch (SocketException e) {
            e.printStackTrace();
        }
        return addresses;
    }

    public static List<String> getIPAddresses() {
        List<String> addresses = Lists.newArrayList();
        try {
            Enumeration<NetworkInterface> networkInterfaceEnum = NetworkInterface.getNetworkInterfaces();
            while (networkInterfaceEnum.hasMoreElements()) {
                NetworkInterface networkInterface = networkInterfaceEnum.nextElement();
                if (!networkInterface.isLoopback() && networkInterface.isUp()) {
                    Enumeration<InetAddress> ips = networkInterface.getInetAddresses();
                    while (ips.hasMoreElements()) {
                        InetAddress addr = ips.nextElement();
                        if (addr instanceof Inet4Address && StringLib.isNotEmpty(addr.getHostAddress())) {
                            addresses.add(addr.getHostAddress());
                        }
                    }
                }
            }
        } catch (SocketException e) {
            e.printStackTrace();
        }

        return addresses;
    }

    public static String getDecodeCharset(byte[] input) {
        byte[] processBytes = null;
        byte[] bytesDecompressed = ZLib.decompress(input);
        if (bytesDecompressed == null || bytesDecompressed.length == 0) {
            processBytes = input;
        } else {
            processBytes = bytesDecompressed;
        }

        String value = null;
        if (processBytes != null) {
            try {
                CharsetDetector detector = new CharsetDetector();
                detector.setText(processBytes);
                CharsetMatch match = detector.detect();
                String encoding = GBK;
                if (match.getConfidence() > 50) {
                    encoding = match.getName();
                }
                value = StringLib.toEncodedString(processBytes, Charset.forName(encoding));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return value;
    }
}
