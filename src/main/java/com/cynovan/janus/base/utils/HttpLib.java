package com.cynovan.janus.base.utils;

import com.cynovan.janus.base.config.bean.SpringContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import org.apache.commons.collections4.MapUtils;
import org.apache.http.NameValuePair;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.utils.HttpClientUtils;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.DefaultHttpRequestRetryHandler;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.springframework.core.env.Environment;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

public class HttpLib {

    private static RequestConfig requestConfig = null;

    static {
        try {
            requestConfig = RequestConfig.custom()
                    .setConnectionRequestTimeout(3000)
                    .setSocketTimeout(3000)
                    .setConnectTimeout(3000)
                    .build();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static CloseableHttpClient getConnection() {
        CloseableHttpClient httpClient = HttpClients.custom()
                .setSSLSocketFactory(SSLConnectionSocketFactory.getSocketFactory())
                // 设置请求配置
                .setDefaultRequestConfig(requestConfig)
                // 设置重试次数
                .setRetryHandler(new DefaultHttpRequestRetryHandler(0, false))
                .useSystemProperties()
                .build();

        return httpClient;
    }

    public static JsonNode get(String url) {
        return get(url, null);
    }

    public static JsonNode get(String url, Map<String, String> params) {
        String returnValue = getReturnString(url, params);
        if (StringLib.isNotEmpty(returnValue)) {
            return JsonLib.parseJSON(returnValue);
        }
        return null;
    }

    public static String getReturnString(String url, Map<String, String> params) {
        CloseableHttpClient httpclient = getConnection();
        CloseableHttpResponse responseBody = null;
        try {
            URIBuilder builder = new URIBuilder(url);
            if (MapUtils.isNotEmpty(params)) {
                params.forEach((key, value) -> {
                    builder.addParameter(key, value);
                });
            }
            HttpGet httpget = new HttpGet(builder.build());
            responseBody = httpclient.execute(httpget);
            String value = EntityUtils.toString(responseBody.getEntity());
            return value;
        } catch (Exception exception) {
            exception.printStackTrace();
        } finally {
            HttpClientUtils.closeQuietly(responseBody);
            HttpClientUtils.closeQuietly(httpclient);
        }
        return null;
    }

    public static JsonNode post(String url) {
        return post(url, null);
    }

    public static JsonNode post(String url, Map<String, ? extends Object> params) {
        CloseableHttpClient httpclient = getConnection();
        CloseableHttpResponse responseBody = null;
        try {
            URIBuilder builder = new URIBuilder(url);
            HttpPost httppost = new HttpPost(builder.build());
            if (MapUtils.isNotEmpty(params)) {
                List<NameValuePair> nameValuePairs = Lists.newArrayList();
                for (String key : params.keySet()) {
                    nameValuePairs.add(new BasicNameValuePair(key, StringLib.toString(params.get(key))));
                }
                httppost.setEntity(new UrlEncodedFormEntity(nameValuePairs, "UTF-8"));
            }
            responseBody = httpclient.execute(httppost);
            String value = EntityUtils.toString(responseBody.getEntity());
            return JsonLib.parseJSON(value);
        } catch (Exception exception) {
            exception.printStackTrace();
        } finally {
            HttpClientUtils.closeQuietly(responseBody);
            HttpClientUtils.closeQuietly(httpclient);
        }
        return null;
    }

    public static String postReturnString(String url, Map<String, String> params) {
        CloseableHttpClient httpclient = getConnection();
        CloseableHttpResponse responseBody = null;
        try {
            URIBuilder builder = new URIBuilder(url);
            HttpPost httppost = new HttpPost(builder.build());
            if (MapUtils.isNotEmpty(params)) {
                List<NameValuePair> nameValuePairs = Lists.newArrayList();
                for (String key : params.keySet()) {
                    nameValuePairs.add(new BasicNameValuePair(key, StringLib.toString(params.get(key))));
                }
                httppost.setEntity(new UrlEncodedFormEntity(nameValuePairs, "UTF-8"));
            }
            responseBody = httpclient.execute(httppost);
            String value = EntityUtils.toString(responseBody.getEntity());
            return value;
        } catch (Exception exception) {
            exception.printStackTrace();
        } finally {
            HttpClientUtils.closeQuietly(responseBody);
            HttpClientUtils.closeQuietly(httpclient);
        }
        return null;
    }

    public static Map<String, Object> pageAttributes(HttpServletRequest request) {
        Environment env = SpringContext.getBean(Environment.class);
        Map<String, Object> attributes = Maps.newHashMap();
        attributes.put("r_path", request.getContextPath() + "/resource/");
        attributes.put("version", env.getProperty("version"));
        boolean debug = StringLib.equalsIgnoreCase(env.getProperty("debug"), "true");
        attributes.put("debug", debug);
        attributes.put("c_path", request.getContextPath());
        return attributes;
    }
}
