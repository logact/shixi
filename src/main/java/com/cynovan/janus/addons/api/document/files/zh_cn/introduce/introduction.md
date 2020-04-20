## 概述

本文档为Janus帮助文档,文档目前描述Janus中内置API接口的使用方法。

## API接口地址

Janus部署在工业现场,不同的Janus实例的地址是不同的

请使用外部IP访问Janus，避免使用localhost或者127.0.0.1

查看您当前页面的Janus地址,根据如下的示例来决定您的API请求地址

### 示例一

```
当前页面的地址为： http://192.168.33.208:8082/api#/doc/intro

则API请求地址为: http://192.168.33.208:8082/

API创建设备的完整路径为:http://192.168.33.208:8082/api/device/create
```

### 示例二

```
当前页面的地址为： http://192.168.33.208/api#/doc/intro

则API请求地址为: http://192.168.33.208/

API创建设备的完整路径为:http://192.168.33.208/api/device/create
```