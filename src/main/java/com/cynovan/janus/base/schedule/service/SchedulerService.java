package com.cynovan.janus.base.schedule.service;

import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.stereotype.Service;

@Service
public class SchedulerService {

    @Autowired
    private SchedulerFactoryBean schedulerFactoryBean;

    public void scheduleJob(JobDetail job, Trigger trigger) throws SchedulerException {
        schedulerFactoryBean.getScheduler().scheduleJob(job, trigger);
    }

    public void unScheduleJob(String name, String group) {
        try {
            TriggerKey triggerKey = new TriggerKey(name, group);
            schedulerFactoryBean.getScheduler().unscheduleJob(triggerKey);
        } catch (SchedulerException e) {
            e.printStackTrace();
        }
    }

    public void unScheduleJob(String name) {
        unScheduleJob(name, null);
    }

    public void deleteJob(String name, String group) {
        try {
            JobKey jobKey = new JobKey(name, group);
            schedulerFactoryBean.getScheduler().deleteJob(jobKey);
        } catch (SchedulerException e) {
            e.printStackTrace();
        }
    }

    public void deleteJob(String name) {
        deleteJob(name, null);
    }

    public boolean checkJobExists(String name) {
        return checkJobExists(name, null);
    }

    public boolean checkJobExists(String name, String group) {
        try {
            return schedulerFactoryBean.getScheduler().checkExists(new JobKey(name, group));
        } catch (SchedulerException e) {
            e.printStackTrace();
        }
        return false;
    }
}
