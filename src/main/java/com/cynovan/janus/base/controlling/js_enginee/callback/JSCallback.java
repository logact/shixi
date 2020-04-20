package com.cynovan.janus.base.controlling.js_enginee.callback;

import com.eclipsesource.v8.JavaVoidCallback;
import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Object;

/**
 * @author Aric.Chen
 * @date 2020/4/2 15:26
 */
public class JSCallback implements JavaVoidCallback {

    @Override
    public void invoke(V8Object v8Object, V8Array v8Array) {
        System.out.println("case in ");
    }
}
