package com.cynovan.janus.base.config.bean;

import com.cynovan.janus.base.api.document.jdo.QAPIDocument;
import com.cynovan.janus.base.api.document.jdo.QAPIDocumentEn;
import com.cynovan.janus.base.api.provider.ImageAttributeProvider;
import com.cynovan.janus.base.appstore.jdo.QOpenAppsResource;
import com.cynovan.janus.base.device.database.BaseJDO;
import com.cynovan.janus.base.device.database.jdo.*;
import com.cynovan.janus.base.i18n.jdo.QI18n;
import com.cynovan.janus.base.utils.*;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import com.googlecode.htmlcompressor.compressor.HtmlCompressor;
import com.mongodb.client.model.Filters;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.reflect.FieldUtils;
import org.apache.commons.text.StringEscapeUtils;
import org.bson.Document;
import org.commonmark.Extension;
import org.commonmark.ext.gfm.tables.TablesExtension;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.AttributeProvider;
import org.commonmark.renderer.html.AttributeProviderContext;
import org.commonmark.renderer.html.AttributeProviderFactory;
import org.commonmark.renderer.html.HtmlRenderer;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.reflections.Reflections;
import org.reflections.scanners.ResourcesScanner;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Created by Aric on 2016/11/8.
 * 初始化一些服务
 */
public class
InitializeService {

    public void initialize() {
        initializeDocumentIndex();
        initializeXmlMenu();
        initializeTemplate();
        initJanus();
        initClearStrategy();
        initApiDocument();
        initI18n();
    }

    private void initI18n() {
        DBUtils.drop(QI18n.collectionName);
        Set<String> sets = scanFile("com.cynovan", ".*\\.properties");
        List<Document> i18nList = Lists.newArrayList();
        for (String path : sets) {
            try {
                ClassPathResource resource = new ClassPathResource(path);
                InputStream stream = resource.getInputStream();
                String str = IOUtils.toString(stream, StringLib.UTF_8);
                if (StringLib.isNotEmpty(str)) {
                    Properties props = new Properties();
                    props.load(new ByteArrayInputStream(str.getBytes("utf-8")));
                    if (props != null) {
                        /*得到properties文件的名称，解析出语言类型*/
                        String filename = StringLib.lowerCase(resource.getFilename());
                        String lang = StringLib.replace(filename, ".properties", "");

                        String appId = props.getProperty("appId");
                        if (StringLib.isEmpty(appId)) {
                            appId = "system";//默认是系统
                        }
                        Set<Object> propsKeys = props.keySet();
                        String finalAppId = appId;
                        propsKeys.stream().forEach(key -> {
                            String strKey = StringLib.toString(key);
                            if (StringLib.isNotEmpty(strKey)) {
                                Document doc = new Document();
                                doc.put("key", strKey);
                                doc.put("desc", StringLib.toString(props.get(strKey)));
                                doc.put("lang", lang);
                                doc.put("appId", finalAppId);
                                i18nList.add(doc);
                            }
                        });
                    }
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        DBUtils.insertMany(QI18n.collectionName, i18nList);
    }

    private void initApiDocument() {
        /*扫描文档目录下的MD文件，解析为HTML文件*/
        /*加载文档的JSON文件*/
        /*把目录下的api文档分语言保存*/
        DBUtils.drop(QAPIDocument.collectionName);
        DBUtils.drop(QAPIDocumentEn.collectionName);
        saveApiDocument("zh-cn");
        saveApiDocument("en-us");
    }

    private void saveApiDocument(String language) {
        String menuJsonStr = FileUtils.getClassPathFileContent("com/cynovan/janus/addons/api/document/api_menu.json");
        if (StringLib.isNotEmpty(menuJsonStr)) {

            List<Document> list = Lists.newArrayList();
            language = StringLib.replace(language, "-", "_");

            String basePath = "com/cynovan/janus/addons/api/document/files/";
            basePath = StringLib.join(basePath, language, "/");//根据系统语言觉定从哪个目录下读取md文件
            ArrayNode menuArr = (ArrayNode) JsonLib.parseJSON(menuJsonStr);
            for (int i = 0; i < menuArr.size(); i++) {
                ObjectNode menuNode = (ObjectNode) menuArr.get(i);
                String path = JsonLib.getString(menuNode, "path");
                Document apiDocument = DocumentLib.parse(menuNode.toString());
                String filePath = basePath + path;

                String keywords = "addons";
                String parentPath = StringLib.substring(filePath, StringLib.indexOf(filePath, keywords) + keywords.length() + 1, StringLib.lastIndexOf(filePath, "/"));
                String imgPath = "/resource/" + parentPath + '/';

                List<Extension> extensions = Arrays.asList(TablesExtension.create());
                Parser markdownParser = Parser.builder().extensions(extensions).build();
                HtmlRenderer htmlRenderer = HtmlRenderer.builder().attributeProviderFactory(new AttributeProviderFactory() {
                    @Override
                    public AttributeProvider create(AttributeProviderContext attributeProviderContext) {
                        return new ImageAttributeProvider(imgPath);
                    }
                }).extensions(extensions).build();

                filePath = StringLib.replaceAll(filePath, "//", "/");
                String fileContent = FileUtils.getClassPathFileContent(filePath);
                if (StringLib.isNotEmpty(fileContent)) {
                    if (StringLib.endsWith(path, ".md")) {
                        Node document = markdownParser.parse(fileContent);
                        fileContent = htmlRenderer.render(document);
                    }
                }
                apiDocument.put("html", fileContent);
                apiDocument.put("index", i);

                list.add(apiDocument);
            }

            if (CollectionUtils.isNotEmpty(list)) {
                DBUtils.insertMany(StringLib.join("apiDocument_", language), list);
            }
        }
    }


    private  void initJanus() {
        long count = DBUtils.count(QJanus.collectionName, null);
        /*当Janus初始化信息为空时,才进行Janus的初始化*/
        if (count == 0) {
            Document janusInfo = DocumentLib.newDoc();

            List<String> macAddresses = StringLib.getMACAddresses();
            Collections.sort(macAddresses);
            String mac_address = StringLib.join(macAddresses, ", ");
            janusInfo.put("mac", mac_address);
            System.out.println(mac_address);

            String mac_address_security = StringLib.join(mac_address, "@janus@ston_$%^&");
            janusInfo.put("mac_address_secret", DigestLib.md5Hex(mac_address_security));

            List<String> ipAddresses = StringLib.getIPAddresses();
            janusInfo.put("ip", StringLib.join(ipAddresses, ", "));

            /*system information*/
            Document vm = DocumentLib.newDoc();
            Set<Object> vmKeys = System.getProperties().keySet();
            vmKeys.stream().forEach(key -> {
                String vmKey = StringLib.replace(StringLib.toString(key), ".", "_");
                vm.put(vmKey, System.getProperties().get(key));
            });
            janusInfo.put("vm", vm);
            janusInfo.put("create_date", new Date());
            DBUtils.save(QJanus.collectionName, janusInfo);
        }
    }

    private void initClearStrategy() {
        long count = DBUtils.count("autoClearStrategy", null);
        if (count == 0) {
            Document strategy = DocumentLib.newDoc();
            strategy.put("plan", "A");
            strategy.put("peak", 15);
            strategy.put("clearProportion", "30");
            DBUtils.save("autoClearStrategy", strategy);
        }
    }

    public void initializeDocumentIndex() {
        DBUtils.drop(QJdoList.collectionName);

        List<Document> list = Lists.newArrayList();
        Reflections reflections = new Reflections("com.cynovan");
        Set<Class<? extends BaseJDO>> classes = reflections.getSubTypesOf(BaseJDO.class);
        try {
            for (Class cls : classes) {
                Object instance = ClassLib.getInstance(cls);
                if (instance != null) {
                    ClassLib.invokeMethodByName(instance, "createIndex", null);

                    Field field = FieldUtils.getField(cls, "collectionName");
                    if (field != null) {
                        Object fieldValue = field.get(null);
                        if (fieldValue != null) {
                            String collectionName = StringLib.toString(fieldValue);
                            if (StringLib.isNotEmpty(collectionName)) {
                                Document dbObject = DocumentLib.newDoc();
                                dbObject.put("collection", collectionName);
                                dbObject.put("instance", cls.getName());
                                BaseJDO baseJdo = (BaseJDO) ClassLib.getInstance(cls);
                                if (baseJdo != null) {

                                }
                                dbObject.put("autoRemoveData", baseJdo.autoRemoveData());
                                list.add(dbObject);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        if (CollectionUtils.isNotEmpty(list)) {
            DBUtils.insertMany(QJdoList.collectionName, list);
        }
    }

    public void initializeTemplate() {

        DBUtils.drop(QTemplate.collectionName);

        Set<String> sets = scanFile("com.cynovan", ".*\\.html");
        List<Document> templateList = Lists.newArrayList();
        HtmlCompressor compressor = new HtmlCompressor();
        sets.stream().forEach(path -> {
            String str = FileUtils.getClassPathFileContent(path);
            if (StringLib.isNotEmpty(str)) {
                org.jsoup.nodes.Document doc = Jsoup.parse(str, StringLib.UTF_8);
                Elements elements = doc.getElementsByTag("template");
                if (elements != null && elements.size() > 0) {
                    Iterator<Element> tor = elements.iterator();
                    while (tor.hasNext()) {
                        Element element = tor.next();
                        Document template = DocumentLib.newDoc();
//                        将openApp上的所有的app的资源全部加入到这个里面。
                        template.put(QTemplate.name, element.attr("name"));
                        String html = StringEscapeUtils.unescapeHtml4(element.html());
                        html = compressor.compress(html);
                        template.put(QTemplate.template, html);
//                        此时的template有两个属性 一个是name，一个是template
                        templateList.add(template);
                    }
                }
            }
        });

        List<Document> appHtmlList = DBUtils.list(QOpenAppsResource.collectionName, Filters.eq("fileType", "html"));
        if (CollectionUtils.isNotEmpty(appHtmlList)) {
            appHtmlList.stream().forEach(appResource -> {
                String appId = DocumentLib.getString(appResource, "appId");
                String path = DocumentLib.getString(appResource, "path");
                String templateId = StringLib.join(appId, "_", DigestLib.md5Hex(path));
                String html = DocumentLib.getString(appResource, "code");

                Document template = new Document();
                template.put("name", templateId);
                html = compressor.compress(html);
                template.put("template", html);
                templateList.add(template);
            });
        }

        DBUtils.insertMany(QTemplate.collectionName, templateList);
    }
    private void initializeXmlMenu() {
        DBUtils.drop(QMenu.collectionName);
        DBUtils.drop(QAppMenu.collectionName);
        DBUtils.drop(QApps.collectionName);

        Set<String> sets = scanFile("com.cynovan", ".*\\.json");
        Set<String> jsFiles = scanFile("com.cynovan", ".*\\.js");
        Set<String> cssFiles = scanFile("com.cynovan", ".*\\.css");

        if (CollectionUtils.isNotEmpty(sets)) {
            List<Document> menuList = Lists.newArrayList();
            List<Document> appMenuList = Lists.newArrayList();
            List<Document> appList = Lists.newArrayList();
            try {
                String keywords = "addons";
                for (String path : sets) {
                    String jsonStr = FileUtils.getClassPathFileContent(path);
//                    以包名为文件名 appName=包名
                    String appName = StringLib.substring(path, StringLib.indexOf(path, keywords) + keywords.length() + 1, StringLib.lastIndexOf(path, "/"));
                    if (StringLib.contains(appName, "/")) {
                        /*在内部目录的JSON一律不解析*/
                        continue;
                    }
//                    通过这个Document 方法可以将这个字符串解析为一个键值对。
                    Document appNode = Document.parse(jsonStr);

                    appNode.put("icon", "resource/" + appName + "/" + DocumentLib.getString(appNode, "icon"));
                    /*Check if app*/
                    boolean isApp = DocumentLib.getBoolean(appNode, "app");
                    if (isApp == true) {
                        appList.add(appNode);
                    }

                    String appId = DocumentLib.getString(appNode, "appId");
                    List subMenuList = DocumentLib.getList(appNode, "menus");
                    if (null != subMenuList) {
                        int menuIndex = 0;
                        for (int i = 0; i < subMenuList.size(); i++) {
                            Document menu = (Document) subMenuList.get(i);
                            menu.put("appId", appId);
                            menu.put("menuIndex", menuIndex);
                            String icon = DocumentLib.getString(menu, "icon");
//                            存入的时候给定一个uuid
                            if (StringLib.isNotEmpty(icon)) {
                                menu.put("icon", StringLib.join("resource/", icon, "?v=", RandomUtils.uuid2()));
                            }
                            menuIndex++;

                            List dependList = (List) menu.get("depend");
                            if (CollectionUtils.isNotEmpty(dependList)) {
                                List transferDependList = Lists.newArrayList();
                                Set<String> filePath = Sets.newHashSet();
                                dependList.stream().forEach(obj -> {
                                    String item = StringLib.toString(obj);
                                    if (StringLib.contains(item, ".css") || StringLib.contains(item, ".js")) {
                                        item = processRequireJSPath(appName, item);
                                        filePath.add(item);
                                    } else {
                                        String jsFileName = StringLib.join("com/cynovan/janus/addons/", appName, "/");
                                        Set<String> jsFile = jsFiles.stream().filter(str -> {
                                            return StringLib.startsWith(str, jsFileName);
                                        }).collect(Collectors.toSet());

                                        Set<String> cssFile = cssFiles.stream().filter(str -> {
                                            return StringLib.startsWith(str, jsFileName);
                                        }).collect(Collectors.toSet());

                                        String replacePath = "com/cynovan/janus/addons/" + appName + "/";
                                        jsFile.stream().forEach(js -> {
                                            filePath.add(processRequireJSPath(appName, js.replace(replacePath, "")));
                                        });
                                        cssFile.stream().forEach(css -> {
                                            filePath.add(processRequireJSPath(appName, css.replace(replacePath, "")));
                                        });
                                    }
                                });
                                filePath.stream().forEach(file -> {
                                    transferDependList.add(file);
                                });
                                menu.put("depend", transferDependList);
                            }
                            if (isApp == true) {
                                appMenuList.add(menu);
                            } else {
                                menuList.add(menu);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            DBUtils.insertMany(QMenu.collectionName, menuList);
            DBUtils.insertMany(QAppMenu.collectionName, appMenuList);
            DBUtils.insertMany(QApps.collectionName, appList);
        }
    }

    private String processRequireJSPath(String folder, String file) {
        StringBuilder builder = new StringBuilder();
        if (StringLib.contains(file, ".css")) {
            builder.append("css!");
        }
        if (!StringLib.startsWith(file, folder + "/")) {
            builder.append(folder);
            builder.append("/");
        }
        if (StringLib.indexOf(file, ".") != -1) {
            builder.append(StringLib.substring(file, 0, StringLib.indexOf(file, ".")));
        } else {
            builder.append(file);
        }
        String path = builder.toString();
        path = StringLib.replace(path, "//", "/");
        return path;
    }
//   扫描包下所有非类文件的所有文件将这些文件名放在一个set中然后返回。

    private  Set<String> scanFile(String path, String filePattern) {
        Reflections reflections = new Reflections(path, new ResourcesScanner());
        Set<String> sets = reflections.getResources(Pattern.compile(filePattern));
        return sets;
    }



}
