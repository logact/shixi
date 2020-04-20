package com.cynovan.janus.base.utils;

import com.ibm.icu.text.CharsetDetector;
import com.ibm.icu.text.CharsetMatch;

import java.nio.charset.Charset;

public class MQTTLib {

    private static final String DefaultEncoding = "gbk";

    public static String getData(byte[] in) {
        byte[] input = in.clone();
        byte[] processBytes = null;
        byte[] bytesDecompressed = ZLib.decompress(input);
        if (bytesDecompressed == null) {
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
                String encoding = DefaultEncoding;
                if (match.getConfidence() > 90) {
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
