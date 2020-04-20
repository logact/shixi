package com.cynovan.janus.base.utils;


import org.apache.commons.text.RandomStringGenerator;

import java.util.UUID;

import static org.apache.commons.text.CharacterPredicates.DIGITS;
import static org.apache.commons.text.CharacterPredicates.LETTERS;

/**
 * 封装各种生成唯一性ID算法的工具类.
 *
 * @author Aric.chen
 * @version 2013-01-15
 */
public class RandomUtils extends org.apache.commons.lang3.RandomUtils {

    private static RandomStringGenerator generator = new RandomStringGenerator.Builder()
            .withinRange('0', 'z').filteredBy(LETTERS, DIGITS).build();

    private static RandomStringGenerator numGenerator = new RandomStringGenerator.Builder()
            .withinRange('0', '9').filteredBy(DIGITS).build();

    public static String uuid() {
        return UUID.randomUUID().toString();
    }

    public static String uuid2() {
        return uuid().replaceAll("-", "");
    }

    public static String uuid8char() {
        return generator.generate(8);
    }

    public static String uuid4char() {
        return generator.generate(4);
    }

    public static String uuid4num(){
        return numGenerator.generate(4);
    }
}
