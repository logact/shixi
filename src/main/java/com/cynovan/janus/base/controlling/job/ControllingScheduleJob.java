package com.cynovan.janus.base.controlling.job;


import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.controlling.service.ControllingRunService;
import com.cynovan.janus.base.schedule.service.JanusScheduleJobBase;
import com.cynovan.janus.base.utils.StringLib;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

public class ControllingScheduleJob extends JanusScheduleJobBase {

    @Override
    protected void executeInternal(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        String controllingId = StringLib.toString(jobExecutionContext.getMergedJobDataMap().get("controllingId"));
        String ruleId = StringLib.toString(jobExecutionContext.getMergedJobDataMap().get("ruleId"));

        ControllingRunService controllingRunService = SpringContext.getBean(ControllingRunService.class);
        controllingRunService.run(controllingId, ruleId);

    }
}
