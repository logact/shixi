package com.cynovan.janus.base.config.auth.exception;

import org.springframework.security.core.AuthenticationException;

public class JanusTokenWrongException extends AuthenticationException {
    public JanusTokenWrongException(String msg) {
        super(msg);
    }

    public JanusTokenWrongException(String msg, Throwable t) {
        super(msg, t);
    }
}
