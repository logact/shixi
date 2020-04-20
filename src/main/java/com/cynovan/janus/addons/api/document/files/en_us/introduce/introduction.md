## Overview

This document mainly focuses on the usage of Janus' internal API.

## API access endpoint

Due to the nature of Janus deployments, the access endpoint may vary depending on the on-site network configuration.

It is recommended to use externally accessible IP/domain address(es) to access Janus API in order to maintain the
best compatibility in different environments.

You can decide on which address should be preferable in the following manner.

### Example 1

```
Current page address: http://192.168.33.208:8082/api#/doc/intro

API access base URL should be: http://192.168.33.208:8082/

An example of a full path to an API endpoint: http://192.168.33.208:8082/api/device/create
```

### Example 2

```
Current page address: http://192.168.33.208/api#/doc/intro

API access base URL should be: http://192.168.33.208/

An example of a full path to an API endpoint: http://192.168.33.208/api/device/create
```