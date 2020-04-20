package com.cynovan.janus.base.connection.conns.activemq.policy;

import com.cynovan.janus.base.utils.StringLib;
import org.apache.activemq.broker.region.MessageReference;
import org.apache.activemq.broker.region.Subscription;
import org.apache.activemq.broker.region.policy.SimpleDispatchPolicy;
import org.apache.activemq.command.ActiveMQDestination;
import org.apache.activemq.filter.MessageEvaluationContext;

import java.util.List;

/**
 * Created by Aric on 2016/12/21.
 */
public class ClientIdDispatchPolicy extends SimpleDispatchPolicy {

    public static final String PTP_CLIENTID = "PTP_CLIENTID";

    @Override
    public boolean dispatch(MessageReference node, MessageEvaluationContext msgContext, List<Subscription> consumers) throws Exception {
        String _clientId = StringLib.toString(node.getMessage().getProperty(PTP_CLIENTID));
        ActiveMQDestination _destination = node.getMessage().getDestination();
        int count = 0;
        if (StringLib.isNotEmpty(_clientId)) {
            for (Subscription sub : consumers) {
                // Don't deliver to browsers
                if (sub.getConsumerInfo().isBrowser()) {
                    continue;
                }
                // Only dispatch to interested subscriptions
                if (!sub.matches(node, msgContext)) {
                    sub.unmatched(node);
                    continue;
                }

                if (_destination.isTopic() && StringLib.equalsIgnoreCase(_clientId, sub.getContext().getClientId())) {
                    sub.add(node);
                    count++;
                }
            }
        }

        return count > 0;
    }
}
