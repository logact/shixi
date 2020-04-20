package com.cynovan.janus.addons.triton.device.controller.state.bean;

import com.alibaba.excel.write.handler.SheetWriteHandler;
import com.alibaba.excel.write.metadata.holder.WriteSheetHolder;
import com.alibaba.excel.write.metadata.holder.WriteWorkbookHolder;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.util.CellRangeAddressList;

public class WriteAlarmDataTemplateBooleanHandler implements SheetWriteHandler {

    @Override
    public void beforeSheetCreate(WriteWorkbookHolder writeWorkbookHolder, WriteSheetHolder writeSheetHolder) {

    }

    @Override
    public void afterSheetCreate(WriteWorkbookHolder writeWorkbookHolder, WriteSheetHolder writeSheetHolder) {
        DataValidationHelper helper = writeSheetHolder.getSheet().getDataValidationHelper();
        CellRangeAddressList cellRangeAddressList = new CellRangeAddressList(1, 2000, 0, 0);
        DataValidationConstraint constraint = helper.createExplicitListConstraint(new String[]{"正常", "警告", "报警"});
        DataValidation dataValidation = helper.createValidation(constraint, cellRangeAddressList);

        writeSheetHolder.getSheet().addValidationData(dataValidation);
    }
}
