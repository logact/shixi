package com.cynovan.janus.base.schedule.service;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.schedule.utils.QuartzScheduleUtils;
import com.cynovan.janus.base.utils.StringLib;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.quartz.*;
import org.springframework.scheduling.quartz.QuartzJobBean;

@DisallowConcurrentExecution
public abstract class JanusScheduleJobBase extends QuartzJobBean {

    protected Log logger = LogFactory.getLog(getClass());

    protected String name;
    protected String group = null;
    private JobDataMap jobDataMap = new JobDataMap();

    protected Long interval;
    protected String cron;

    public void setName(String name) {
        this.name = name;
    }

    /**
     * set job group, job name + job group = job key
     *
     * @param _group
     */
    public void setGroup(String _group) {
        if (StringLib.isNotEmpty(_group)) {
            group = _group;
        }
    }

    /**
     * set job runtime data, can be used when job executed
     */
    public void addJobData(String key, Object value) {
        jobDataMap.put(key, value);
    }

    public void setInterval(long interval) {
        this.interval = interval;
    }

    public void setCron(String cron) {
        this.cron = cron;
    }

    public void start() {
        if (StringUtils.isEmpty(name)) {
            logger.warn("schedule name must not be empty !!");
            return;
        }

        try {
            JobDetail jobDetail = JobBuilder.newJob(getClass()).withIdentity(name, group).setJobData(jobDataMap).storeDurably().requestRecovery().build();

            Trigger trigger = null;
            if (interval != null && interval > 0) {
                trigger = QuartzScheduleUtils.createTrigger(jobDetail, interval);
            }
            if (trigger == null && StringLib.isNotBlank(cron)) {
                trigger = QuartzScheduleUtils.createCronTrigger(jobDetail, cron);
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
