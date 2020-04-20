package com.cynovan.janus.addons.triton.classification.backend.util;

import com.alibaba.excel.write.handler.SheetWriteHandler;
import com.alibaba.excel.write.metadata.holder.WriteSheetHolder;
import com.alibaba.excel.write.metadata.holder.WriteWorkbookHolder;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DataDefinitionDataTypeCellWriteHandler implements SheetWriteHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(DataDefinitionDataTypeCellWriteHandler.class);

    @Override
    public void beforeSheetCreate(WriteWorkbookHolder writeWorkbookHolder, WriteSheetHolder writeSheetHolder) {

    }

    @Override
    public void afterSheetCreate(WriteWorkbookHolder writeWorkbookHolder, WriteSheetHolder writeSheetHolder) {
        LOGGER.info("第{}个Sheet写入成功。", writeSheetHolder.getSheetNo());

        DataValidationHelper helper = writeSheetHolder.getSheet().getDataValidationHelper();
        CellRangeAddressList cellRangeAddressList = new CellRangeAddressList(1, 2000, 2, 2);
        DataValidationConstraint constraint = helper.createExplicitListConstraint(new String[] {"普通文本", "数字","布尔类型","枚举"});
        DataValidation dataValidation = helper.createValidation(constraint, cellRangeAddressList);

        writeSheetHolder.getSheet().addValidationData(dataValidation);
    }
}
