package com.cynovan.janus.base.neptune.inter;

public abstract class AbstractPipelineProcess {

    public abstract void process(PipelineStream pipelineStream);

    public Integer getPipelineOrder() {
        return ORDER_AFTER_EXCHANGE;
    }

    public static final int ORDER_EXCHANGE = 1000;

    public static final int ORDER_AFTER_EXCHANGE = 2000;

    public static final int ORDER_BEFORE_EXCHANGE = 500;
}
