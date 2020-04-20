package com.cynovan.janus.base.utils;

import org.quartz.CronTrigger;
import org.quartz.JobDetail;
import org.quartz.SimpleTrigger;
import org.quartz.TriggerBuilder;
import org.springframework.scheduling.quartz.CronTriggerFactoryBean;
import org.springframework.scheduling.quartz.JobDetailFactoryBean;

import java.text.ParseException;

import static org.quartz.SimpleScheduleBuilder.simpleSchedule;

public class QuartzUtils {


    /**
     * 创建 simple trigger
     * @param job
     * @param pollFrequencyMs
     * @return
     */
    public static SimpleTrigger createTrigger(JobDetail job, long pollFrequencyMs) {
        return TriggerBuilder.newTrigger().withIdentity(job.getKey().getName(), job.getKey().getGroup())
                .withSchedule(simpleSchedule().withIntervalInMilliseconds(pollFrequencyMs).withRepeatCount(SimpleTrigger.REPEAT_INDEFINITELY))
                .build();
        /*SimpleTriggerFactoryBean factoryBean = new SimpleTriggerFactoryBean();
        factoryBean.setName(job.getKey().getName());
        factoryBean.setGroup(job.getKey().getGroup());
        factoryBean.setJobDetail(job);
        factoryBean.setStartDelay(0L);
        factoryBean.setRepeatInterval(pollFrequencyMs);
        factoryBean.setRepeatCount(SimpleTrigger.REPEAT_INDEFINITELY);
        // in case of misfire, ignore all missed triggers and continue :
        factoryBean.setMisfireInstruction(SimpleTrigger.MISFIRE_INSTRUCTION_RESCHEDULE_NEXT_WITH_REMAINING_COUNT);
        factoryBean.afterPropertiesSet();
        return factoryBean.getObject();*/
    }

    /**
     * 创建 cron trigger
     * @param job
     * @param cronExpression
     *
     * @return
     */
    public static CronTrigger createCronTrigger(JobDetail job, String cronExpression) throws ParseException {
        CronTriggerFactoryBean factoryBean = new CronTriggerFactoryBean();
        factoryBean.setName(job.getKey().getName());
        factoryBean.setGroup(job.getKey().getGroup());
        factoryBean.setJobDetail(job);
        factoryBean.setCronExpression(cronExpression);
        factoryBean.setMisfireInstruction(SimpleTrigger.MISFIRE_INSTRUCTION_FIRE_NOW);
        factoryBean.afterPropertiesSet();
        return factoryBean.getObject();
    }


    /**
     * 创建需要执行的 job
     * @param jobClass
     * @return
     */
    public static JobDetailFactoryBean createJobDetail(Class jobClass) {
        JobDetailFactoryBean factoryBean = new JobDetailFactoryBean();
        factoryBean.setJobClass(jobClass);
        factoryBean.setDurability(true);
        return factoryBean;
    }

}
