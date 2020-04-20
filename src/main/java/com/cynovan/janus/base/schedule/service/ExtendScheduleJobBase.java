package com.cynovan.janus.base.schedule.service;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.schedule.utils.QuartzScheduleUtils;
import com.cynovan.janus.base.utils.StringLib;
import org.apache.commons.lang3.StringUtils;
import org.quartz.*;

public abstract class ExtendScheduleJobBase extends JanusScheduleJobBase {

    private JobDataMap jobDataMap = new JobDataMap();
    protected ScheduleBuilder scheduleBuilder;

    public void addJobData(String key, Object value) {
        jobDataMap.put(key, value);
    }

    public void setSchedule(ScheduleBuilder scheduleBuilder) {
        this.scheduleBuilder = scheduleBuilder;
    }

    @Override
    public void start() {
        if (StringUtils.isEmpty(name)) {
            logger.warn("schedule name must not be empty !!");
            return;
        }

        try {
            JobDetail jobDetail = JobBuilder.newJob(getClass())
                    .withIdentity(name, group)
                    .setJobData(jobDataMap)
                    .storeDurably()
                    .requestRecovery()
                    .build();

            Trigger trigger = null;
            if (interval != null && interval > 0) {
                trigger = QuartzScheduleUtils.createTrigger(jobDetail, interval);
            }
            if (trigger == null && StringLib.isNotBlank(cron)) {
                trigger = QuartzScheduleUtils.createCronTrigger(jobDetail, cron);
            }
            /* 扩展方式 */
            if (trigger == null && scheduleBuilder != null) {
                trigger = TriggerBuilder.newTrigger()
                        .withIdentity(jobDetail.getKey().getName(), jobDetail.getKey().getGroup())
                        .withSchedule(scheduleBuilder)
                        .build();
            }

            if (trigger == null) {
                logger.warn("trigger " + name + " - " + group + "create failed!!!");
                return;
            }

            // delete jobs in db before schedule new jobs
            SchedulerService schedulerService = SpringContext.getBean(SchedulerService.class);
            schedulerService.unScheduleJob(name, group);
            schedulerService.deleteJob(name, group);

            if (!schedulerService.checkJobExists(name, group)) {
                schedulerService.scheduleJob(jobDetail, trigger);
                logger.info("schedule job :" + name + " - " + group + " success!!!");
            } else {
                logger.info("schedule job :" + name + " - " + group + " already scheduled!!!");
            }

        } catch (SchedulerException e) {
            logger.info("schedule job :" + name + " - " + group + " failed!!!");
            e.printStackTrace();
        }
    }

}
