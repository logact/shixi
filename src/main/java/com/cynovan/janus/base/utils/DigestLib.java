package com.cynovan.janus.base.utils;

import org.apache.commons.codec.DecoderException;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.lang3.Validate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

public class DigestLib extends DigestUtils {

    public static final int HASH_INTERATIONS = 1024;
    public static final int SALT_SIZE = 8;
    public static final String HASH_ALGORITHM = "SHA-1";

    private static SecureRandom random = new SecureRandom();

    private static BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public static PasswordEncoder getPasswordEncoder() {
        return passwordEncoder;
    }

    public static byte[] generateSalt(int numBytes) {
        Validate.isTrue(numBytes > 0, "numBytes argument must be a positive integer (1 or larger)", numBytes);

        byte[] bytes = new byte[numBytes];
        random.nextBytes(bytes);
        return bytes;
    }

    private static String encrypt(byte[] input, byte[] salt) {
        try {
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            if (salt != null) {
                digest.update(salt);
            }
            byte[] result = digest.digest(input);
            for (int i = 1; i < HASH_INTERATIONS; i++) {
                digest.reset();
                result = digest.digest(result);
            }
            return Hex.encodeHexString(salt) + Hex.encodeHexString(result);
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static byte[] decodeHex(String input) {
        try {
            return Hex.decodeHex(input.toCharArray());
        } catch (DecoderException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static String entryptPassword(String plainPassword) {
        byte[] salt = DigestLib.generateSalt(8);
        return encrypt(plainPassword.getBytes(), salt);
    }

    public static boolean validatePassword(String plainPassword, String password) {
        byte[] salt = DigestLib.decodeHex(password.substring(0, 16));
        String passwrod2 = encrypt(plainPassword.getBytes(), salt);
        return password.equals(passwrod2);
    }

}
