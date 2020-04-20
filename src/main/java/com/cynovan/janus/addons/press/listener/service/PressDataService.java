package com.cynovan.janus.addons.press.listener.service;

import com.cynovan.janus.base.device.eventbus.DeviceDataEvent;
import com.cynovan.janus.base.utils.DocumentLib;
import com.cynovan.janus.base.utils.StringLib;
import org.bson.Document;
import org.springframework.stereotype.Service;

@Service
public class PressDataService {

    public void process(DeviceDataEvent deviceDataEvent) {
        Document deviceData = deviceDataEvent.getToDbData();
        String uuid = DocumentLib.getString(deviceData, "uuid");
        if (StringLib.isNotEmpty(uuid)) {
            Document messageData = DocumentLib.getDocument(deviceData, "data");

            if (messageData.containsKey("PMP_iPushOverNum")) {
                String pushModel = DocumentLib.getString(messageData, "PMP_iPushOverNum");

                if (StringLib.equals("0", pushModel)) {
                    getData(messageData, pushModel);
                } else if (StringLib.equals("1", pushModel)) {
                    getData(messageData, pushModel);
                } else if (StringLib.equals("2", pushModel)) {
                    getData(messageData, pushModel);
                }
            }
        }
    }

    private void getData(Document messageData, String pushModel) {
        Document modelMessage = DocumentLib.newDoc();
        modelMessage.put("PMP_iPushOverNum", DocumentLib.getString(messageData, "PMP_iPushOverNum"));
        modelMessage.put("iControlMode", DocumentLib.getString(messageData, "iControlMode"));
        modelMessage.put("rSetPushmountingPos", DocumentLib.getString(messageData, "rSetPushmountingPos"));
        modelMessage.put("rSetPushmountingPre", DocumentLib.getString(messageData, "rSetPushmountingPre"));
        modelMessage.put("bRelativePreMode", DocumentLib.getString(messageData, "bRelativePreMode"));
        modelMessage.put("rSetPushmountingRelativePre", DocumentLib.getString(messageData, "rSetPushmountingRelativePre"));
        modelMessage.put("bRelativePosAlarmBack", DocumentLib.getString(messageData, "bRelativePosAlarmBack"));
        modelMessage.put("rRelativePressCrossPos", DocumentLib.getString(messageData, "rRelativePressCrossPos"));
        modelMessage.put("bRelativeDisAlarmBack", DocumentLib.getString(messageData, "bRelativeDisAlarmBack"));
        modelMessage.put("rRelativeBandPressRange", DocumentLib.getString(messageData, "rRelativeBandPressRange"));
        modelMessage.put("rSetPushmountingDis", DocumentLib.getString(messageData, "rSetPushmountingDis"));
        modelMessage.put("rBackPreStopLimt", DocumentLib.getString(messageData, "rBackPreStopLimt"));
        modelMessage.put("rSetStartPos", DocumentLib.getString(messageData, "rSetStartPos"));
        modelMessage.put("rSetHoldTimeSec", DocumentLib.getString(messageData, "rSetHoldTimeSec"));
        modelMessage.put("rMinHoldPre", DocumentLib.getString(messageData, "rMinHoldPre"));
        modelMessage.put("rMaxHoldPre", DocumentLib.getString(messageData, "rMaxHoldPre"));
        modelMessage.put("rSetFastForwardVel", DocumentLib.getString(messageData, "rSetFastForwardVel"));
        modelMessage.put("rSetProbeVel", DocumentLib.getString(messageData, "rSetProbeVel"));
        modelMessage.put("rPrePushPos", DocumentLib.getString(messageData, "rPrePushPos"));
        modelMessage.put("rAverageHoldPre", DocumentLib.getString(messageData, "rAverageHoldPre"));
        modelMessage.put("rSetPrePushVel", DocumentLib.getString(messageData, "rSetPrePushVel"));
        modelMessage.put("rSetPushmountingVel", DocumentLib.getString(messageData, "rSetPushmountingVel"));
        modelMessage.put("rSetBackhaulVel", DocumentLib.getString(messageData, "rSetBackhaulVel"));
        modelMessage.put("rSetBackhaulPre", DocumentLib.getString(messageData, "rSetBackhaulPre"));
        modelMessage.put("rSetFastForwardToProbePos", DocumentLib.getString(messageData, "rSetFastForwardToProbePos"));
        modelMessage.put("bSetPrePushEnablel", DocumentLib.getString(messageData, "bSetPrePushEnablel"));
        modelMessage.put("bPreAlarmBack", DocumentLib.getString(messageData, "bPreAlarmBack"));
        modelMessage.put("rSetHoldPre", DocumentLib.getString(messageData, "rSetHoldPre"));
        modelMessage.put("bSetHoldPreEnable", DocumentLib.getString(messageData, "bSetHoldPreEnable"));
        modelMessage.put("bBackPreAlarmBack", DocumentLib.getString(messageData, "bBackPreAlarmBack"));
        modelMessage.put("strBarCode", DocumentLib.getString(messageData, "strBarCode"));
        modelMessage.put("rActuallyContactPos", DocumentLib.getString(messageData, "rActuallyContactPos"));
        modelMessage.put("rAtlFinishPre", DocumentLib.getString(messageData, "rAtlFinishPre"));
        modelMessage.put("rAtlFinishPos", DocumentLib.getString(messageData, "rAtlFinishPos"));
        modelMessage.put("rMaxPos", DocumentLib.getString(messageData, "rMaxPos"));
        modelMessage.put("rMaxPre", DocumentLib.getString(messageData, "rMaxPre"));
        modelMessage.put("iActuallyPushmountingMode", DocumentLib.getString(messageData, "iActuallyPushmountingMode"));
        modelMessage.put("strProductQualityOK", DocumentLib.getString(messageData, "strProductQualityOK"));
        modelMessage.put("strProductTimer", DocumentLib.getString(messageData, "strProductTimer"));
        modelMessage.put("iPushOverNum", DocumentLib.getString(messageData, "iPushOverNum"));

        for (int i = 1; i < 6; i++) {
            /*质量判断*/
            modelMessage.put("iParamsCheck" + i + "Mode", DocumentLib.getString(messageData, "iParamsCheck" + i + "Mode"));
            modelMessage.put("rAtlParamsCheck" + i + "Val", DocumentLib.getString(messageData, "rAtlParamsCheck" + i + "Val"));
            modelMessage.put("rAtlParamsCheck" + i + "ValMax", DocumentLib.getString(messageData, "rAtlParamsCheck" + i + "ValMax"));
            modelMessage.put("rAtlParamsCheck" + i + "ValMin", DocumentLib.getString(messageData, "rAtlParamsCheck" + i + "ValMin"));

            /*质量检测*/
            modelMessage.put("iParamsCheckMode" + i, DocumentLib.getString(messageData, "iParamsCheckMode" + i));
            modelMessage.put("bParamsEnable" + i, DocumentLib.getString(messageData, "bParamsEnable" + i));
            modelMessage.put("bSetCheckMode" + i, DocumentLib.getString(messageData, "bSetCheckMode" + i));
            modelMessage.put("rSetParamsCheckStartVal" + i, DocumentLib.getString(messageData, "rSetParamsCheckStartVal" + i));
            modelMessage.put("rSetParamsCheckStopVal" + i, DocumentLib.getString(messageData, "rSetParamsCheckStopVal" + i));
            modelMessage.put("iSetAddParam" + i + "1", DocumentLib.getString(messageData, "iSetAddParam" + i + "1"));
            modelMessage.put("iSetAddParam" + i + "2", DocumentLib.getString(messageData, "iSetAddParam" + i + "2"));
            modelMessage.put("rSetParamsUpVal" + i + "1", DocumentLib.getString(messageData, "rSetParamsUpVal" + i + "1"));
            modelMessage.put("rSetParamsUpVal" + i + "2", DocumentLib.getString(messageData, "rSetParamsUpVal" + i + "2"));
            modelMessage.put("rSetParamsDownVal" + i + "1", DocumentLib.getString(messageData, "rSetParamsDownVal" + i + "1"));
            modelMessage.put("rSetParamsDownVal" + i + "2", DocumentLib.getString(messageData, "rSetParamsDownVal" + i + "2"));
        }

        messageData.put("pushModel" + pushModel, modelMessage);
    }
}
