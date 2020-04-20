package com.cynovan.janus.base.utils;

import com.cynovan.janus.base.config.bean.InitializeData;
import com.cynovan.janus.base.config.bean.SpringContext;
import com.cynovan.janus.base.utils.bean.FreemarkerStaticModels;
import com.google.common.collect.Maps;
import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapper;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.view.freemarker.FreeMarkerConfigurer;
import org.springframework.web.servlet.view.freemarker.FreeMarkerView;
import org.springframework.web.servlet.view.freemarker.FreeMarkerViewResolver;

import java.io.*;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class FreeMarkerLib {

    @SuppressWarnings({"unchecked", "rawtypes"})
    public static String renderTemplate(String viewname, Map<String, Object> model) {
        if (model == null) {
            model = Maps.newHashMap();
        }
        FreeMarkerViewResolver resolver = SpringContext.getBean(FreeMarkerViewResolver.class);
        FreemarkerStaticModels models = SpringContext.getBean(FreemarkerStaticModels.class);
        model.putAll((HashMap) models);
        FreeMarkerConfigurer configure = SpringContext.getBean(FreeMarkerConfigurer.class);
        ByteArrayOutputStream baos;
        try {
            FreeMarkerView view = (FreeMarkerView) resolver.resolveViewName(viewname, Locale.getDefault());
            Template tpl = configure.getConfiguration().getTemplate(view.getUrl());
            baos = new ByteArrayOutputStream();
            OutputStreamWriter writer = new OutputStreamWriter(baos);
            tpl.process(model, writer);
            writer.flush();
            return new String(baos.toByteArray());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public static String renderTemplate(Template template, Object model) {
        try {
            StringWriter result = new StringWriter();
            template.process(model, result);
            return result.toString();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public static String renderSysTemplate(String templateName, Map<String, Object> model) {
        String template = InitializeData.getTemplate(templateName);
        Configuration cfg = new Configuration(Configuration.getVersion());
        cfg.setObjectWrapper(new DefaultObjectWrapper(Configuration.getVersion()));
        try {
            Template t = new Template(templateName, new StringReader(template), cfg);
            Writer out = new StringWriter();
            t.process(model, out);
            return out.toString();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (TemplateException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static Configuration buildConfiguration(String directory) throws IOException {
        Configuration cfg = new Configuration();
        Resource path = new DefaultResourceLoader().getResource(directory);
        cfg.setDirectoryForTemplateLoading(path.getFile());
        return cfg;
    }
}
