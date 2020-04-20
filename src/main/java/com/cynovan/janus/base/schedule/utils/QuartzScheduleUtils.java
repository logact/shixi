package com.cynovan.janus.base.schedule.utils;

import org.quartz.CronTrigger;
import org.quartz.JobDetail;
import org.quartz.SimpleTrigger;
import org.springframework.scheduling.quartz.CronTriggerFactoryBean;
import org.springframework.scheduling.quartz.SimpleTriggerFactoryBean;

import java.text.ParseException;

public class QuartzScheduleUtils {

    /**
     * 创建 simple trigger
     *
     * @param job
     * @param pollFrequencyMs
     * @return
     */
    public static SimpleTrigger createTrigger(JobDetail job, long pollFrequencyMs) {
        SimpleTriggerFactoryBean factoryBean = new SimpleTriggerFactoryBean();
        factoryBean.setName(job.getKey().getName());
        factoryBean.setGroup(job.getKey().getGroup());
        factoryBean.setJobDetail(job);
        factoryBean.setStartDelay(0L);
        factoryBean.setRepeatInterval(pollFrequencyMs);
        factoryBean.setRepeatCount(SimpleTrigger.REPEAT_INDEFINITELY);
        // in case of misfire, ignore all missed triggers and continue :
        factoryBean.setMisfireInstruction(SimpleTrigger.MISFIRE_INSTRUCTION_RESCHEDULE_NEXT_WITH_REMAINING_COUNT);
        factoryBean.afterPropertiesSet();
        return factoryBean.getObject();
    }

    /**
     * 创建 cron trigger
     *
     * @param job
     * @param cronExpression
     * @return
     */
    public static CronTrigger createCronTrigger(JobDetail job, String cronExpression) {
        try {
            CronTriggerFactoryBean factoryBean = new CronTriggerFactoryBean();
            factoryBean.setName(job.getKey().getName());
            factoryBean.setGroup(job.getKey().getGroup());
            factoryBean.setJobDetail(job);
            factoryBean.setCronExpression(cronExpression);
            factoryBean.setMisfireInstruction(SimpleTrigger.MISFIRE_INSTRUCTION_FIRE_NOW);
            factoryBean.afterPropertiesSet();
            return factoryBean.getObject();
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return null;
    }


}
