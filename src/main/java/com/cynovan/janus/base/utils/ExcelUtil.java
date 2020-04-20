package com.cynovan.janus.base.utils;

import com.alibaba.excel.ExcelReader;
import com.alibaba.excel.ExcelWriter;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;
import com.alibaba.excel.metadata.Sheet;
import com.alibaba.excel.support.ExcelTypeEnum;
import com.google.common.collect.Lists;
import org.apache.commons.collections4.CollectionUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;

/**
 * @author ian.lan@cynovan.com
 */
public class ExcelUtil {

    /**
     * 从上传的 excel 文件读取数据
     *
     * @param inputStream
     * @param clazz
     * @return BSON List
     */
    public static List readExcel(InputStream inputStream, Class clazz) {
        // table struct is : sheetNum, rowNum, rowData
        List datas = DocumentLib.newList();
        ExcelReader excelReader = new ExcelReader(inputStream, null, new AnalysisEventListener() {
            @Override
            public void invoke(Object o, AnalysisContext ctx) {
                if (clazz != null) {
                    datas.add(DocumentLib.parse(JsonLib.toJSON(o, clazz).toString()));
                } else {
                    datas.add(DocumentLib.parse(JsonLib.toJSON(o).toString()));
                }
            }

            @Override
            public void doAfterAllAnalysed(AnalysisContext ctx) {
            }
        });

        try {
            if (clazz != null) {
                excelReader.read(new Sheet(1, 1, clazz));
            } else {
                excelReader.read();
            }
        } catch (Exception ignored) {

        } finally {
            try {
                inputStream.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        return datas;
    }

    private static void writeExcel(OutputStream outputStream, List<String> header) {
        writeExcel(outputStream, header, null);
    }

    public static void writeExcel(OutputStream outputStream, List<String> header, List<List<String>> datas) {
        boolean needHead = CollectionUtils.isNotEmpty(header);
        ExcelWriter excelWriter = new ExcelWriter(outputStream, ExcelTypeEnum.XLSX, needHead);
        Sheet sheet1 = new Sheet(1, 0);
        if (datas == null) {
            datas = Lists.newArrayList();
        }
        if (needHead) {
            datas.add(0, header);
        }
        try {
            excelWriter.write0(datas, sheet1);
            outputStream.flush();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            excelWriter.finish();
            try {
                outputStream.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * 根据 header 导出 excel 模板
     *
     * @param outputStream
     * @param header
     */
    public static void exportTemplate(OutputStream outputStream, List<String> header) {
        writeExcel(outputStream, header);
    }

}
