
package com.cynovan.janus.base.utils;

import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.math.NumberUtils;

import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.Locale;

public class NumberLib extends NumberUtils {
    private static DecimalFormat moneyFormater = new DecimalFormat("##,###0.00");

    private static DecimalFormat doubleFormater0 = new DecimalFormat("##0");
    private static DecimalFormat doubleFormater1 = new DecimalFormat("##0.0");
    private static DecimalFormat doubleFormater2 = new DecimalFormat("##0.00");
    private static DecimalFormat doubleFormater3 = new DecimalFormat("##0.000");
    private static DecimalFormat doubleFormater4 = new DecimalFormat("##0.0000");
    private static DecimalFormat doubleFormater5 = new DecimalFormat("##0.00000");
    private static DecimalFormat doubleFormater6 = new DecimalFormat("##0.000000");

    public static String formatMoney(Number value) {
        if (value == null) {
            return "";
        }
        return moneyFormater.format(value);
    }

    public static String formatDouble(Number value) {
        if (value == null) {
            return "";
        }
        return formatDouble(value, 2);
    }

    public static String formatDouble(Number value, int decimal) {
        if (decimal == 0) {
            return doubleFormater0.format(value);
        } else if (decimal == 1) {
            return doubleFormater1.format(value);
        } else if (decimal == 2) {
            return doubleFormater2.format(value);
        } else if (decimal == 3) {
            return doubleFormater3.format(value);
        } else if (decimal == 4) {
            return doubleFormater4.format(value);
        } else if (decimal == 5) {
            return doubleFormater5.format(value);
        }
        return doubleFormater2.format(value);
    }

    public static String formatInteger(Long value) {
        if (value == null) {
            return "";
        }
        DecimalFormat formatter = (DecimalFormat) NumberFormat.getInstance(Locale.US);
        formatter.setMinimumFractionDigits(0);
        formatter.setMaximumFractionDigits(0);
        return formatter.format(value);
    }

    public static boolean isNull(Long id) {
        return id == null || id <= 0;
    }

    public static Float mul(Float num1, Float num2) {
        if (num1 == null || num2 == null) {
            return 0f;
        }
        return num1 * num2;
    }

    public static float mul_percent(Float num, Float percent) {
        if (num == null || percent == null) {
            return 0f;
        }

        Float amount = (num * percent) / 100;
        if (Float.isNaN(amount)) {
            return 0f;
        }
        return amount;
    }

    public static float add(float... values) {
        if (ArrayUtils.isNotEmpty(values)) {
            float total = 0.0f;
            for (float value : values) {
                total += value;
            }
            return total;
        }
        return 0f;
    }
}
