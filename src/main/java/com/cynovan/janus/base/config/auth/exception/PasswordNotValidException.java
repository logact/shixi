package com.cynovan.janus.base.config.auth.exception;

import org.springframework.security.core.AuthenticationException;

public class PasswordNotValidException extends AuthenticationException {

    public PasswordNotValidException(String msg) {
        super(msg);
    }

    public PasswordNotValidException(String msg, Throwable t) {
        super(msg, t);
    }
}
