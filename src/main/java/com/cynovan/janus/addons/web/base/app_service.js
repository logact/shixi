define(['chosen'], function () {

    var app = angular.module('cnv.appservice', ['ngResource']);

    app.service('AppDataService', ['http', 'util', function (http, util) {
        var service = {
            get: function (app_key, data_key) {
                return http.get('app/data/get', {
                    app_key: app_key,
                    data_key: data_key
                });
            },
            set: function (app_key, data_key, value) {
                if (_.isObject(data_key)) {
                    value = data_key;
                    data_key = '';
                }
                value = util.encodeJSON(value);
                return http.post('app/data/set', {
                    app_key: app_key,
                    data_key: data_key,
                    value: value
                });
            }
        };
        return service;
    }]);

    app.service('AppComponent', ['http', 'DBUtils', 'I18nService',
        function (http, DBUtils, I18nService) {
            var service = {
                deviceselect: function (element, queryFilter, targetUuid) {
                    var deferred = $.Deferred();
                    if (element.length && !element.find('select.deviceselect').length) {
                        element.html(`<select class="form-control input-sm deviceselect" data-placeholder="${I18nService.getValue('选择设备', 'select.device')}"></select>`);
                        // http.get('device/list').success(function (result) {
                        var filter = {};
                        if (_.isObject(queryFilter)) {
                            _.extend(filter, queryFilter);
                        }
                        http.get('dbs/pagelist', {
                            collection: 'device',
                            filter: {
                                query: filter
                            },
                        }).success(function (pagelist) {
                            var result = _.get(pagelist, 'data', []);
                            var html = [];
                            html.push('<option value=""></option>');
                            _.each(result, function (device) {
                                html.push(`<option value="${device.uuid}">${device.baseInfo.name} (${device.uuid})</option>`);
                            });
                            html = html.join('');
                            var select = element.find('.deviceselect');
                            select.html(html);
                            if (targetUuid) {
                                select.val(targetUuid);
                            }
                            select.chosen({
                                search_contains: true,
                                allow_single_deselect: true
                            }).change(function (event, item) {
                                var uuid = '', deviceName = '';
                                if (item) {
                                    uuid = _.get(item, 'selected', '');
                                    deviceName = $(this).find("option:selected").text();
                                }
                                deferred.notify({
                                    uuid: uuid,
                                    deviceName: deviceName
                                });
                            });
                        });
                    }
                    return deferred;
                },
                ncfileselect: function (element, defaultFileId) {
                    var deferred = $.Deferred();
                    if (element.length && !element.find('select.ncfileselect').length) {
                        element.html(`<select class="form-control input-sm ncfileselect" data-placeholder="${I18nService.getValue('请选择nc文件', 'select.nc.file')}"></select>`);
                        DBUtils.list('ncfile', {}).success(function (data) {
                            var result = _.get(data, 'datas.result', []);
                            var html = [];
                            html.push('<option value=""></option>');
                            _.each(result, function (ncfile) {
                                html.push(`<option value="${ncfile.id}">${ncfile.filename}</option>`);
                            });
                            html = html.join('');
                            var select = element.find('.ncfileselect');
                            select.html(html);
                            if (defaultFileId) {
                                select.val(defaultFileId);
                            }
                            select.chosen({
                                search_contains: true,
                                allow_single_deselect: true
                            }).change(function (event, item) {
                                var id = '', filename = '';
                                if (item) {
                                    id = _.get(item, 'selected', '');
                                    filename = $(this).find("option:selected").text();
                                }
                                deferred.notify({
                                    id: id,
                                    filename: filename
                                });
                            });
                        });
                    }
                    return deferred;
                }
            };
            return service;
        }]);


    app.service('AppConfigService', ['$q', 'DBUtils', 'dialog', 'database', 'util', 'AppDataService', 'I18nService',
        function ($q, DBUtils, dialog, database, util, AppDataService, I18nService) {
            var configService = {
                /* 把 配置文件的 key 放入 lastKey */
                init: function (appDataConfig) {
                    configService.get(appDataConfig.app).done(function (data) {
                        if (_.isEmpty(data)) {
                            let fields = appDataConfig.fields;
                            var templateFields = _.map(fields, function (field) {
                                field['lastKey'] = field.key;
                                return field;
                            });
                            appDataConfig['fields'] = templateFields;
                            configService.save(appDataConfig, true);
                        }
                    });
                },
                bind: function (appDataConfig, element) {
                    element = $(element);
                    element.click(function () {
                        configService.showSetting(appDataConfig);
                    });
                    configService.init(appDataConfig);
                },
                save: function (appConfig, init) {
                    var appName = appConfig.app;
                    var newFields = appConfig.fields;
                    var dataKey = 'appDataConfig_' + appName;
                    if (appName) {
                        AppDataService.get(dataKey).success(function (result) {
                            var oldFields = _.get(result, 'fields', []);

                            var newKeys = _.map(newFields, function (item) {
                                return item.key;
                            });

                            /*不删除旧的数据，只添加新增的栏位*/
                            _.each(oldFields, function (item) {
                                if (_.indexOf(newKeys, item.key) === -1) {
                                    newFields.push(item);
                                }
                            });

                            AppDataService.set(dataKey, {
                                app: appName,
                                fields: newFields
                            }).success(function () {
                                if (init !== true) {
                                    dialog.noty(I18nService.getValue("保存成功", "save_success"));
                                }
                            });
                        });
                        database.set(dataKey, '');
                    }
                },
                get: function (appName) {
                    var deferred = $.Deferred();
                    var dataKey = 'appDataConfig_' + appName;
                    var data = database.get(dataKey);
                    if (_.isEmpty(data)) {
                        $.ajax({
                            type: 'get',
                            url: 'app/data/get',
                            data: {
                                app_key: dataKey
                            },
                            dataType: 'json',
                            async: false
                        }).success(function (result) {
                            data = _.get(result, 'fields', []);
                            database.set(dataKey, data);
                            deferred.resolve(data);
                        })
                    } else {
                        deferred.resolve(data);
                    }
                    return deferred;
                },

                getFieldData: function (appName, fieldKey, lastData) {
                    var deferred = $.Deferred();
                    configService.getFieldKey(appName, fieldKey).done(function (mapKey) {
                        let value = _.get(lastData, mapKey, '');
                        deferred.resolve(value);
                    });
                    return deferred;
                },

                getFieldKey: function (appName, fieldKey) {
                    var deferred = $.Deferred();
                    configService.get(appName).done(function (fields) {
                        let index = _.findIndex(fields, ['key', fieldKey]);
                        var mapKey = fieldKey;

                        if (index !== -1) {
                            mapKey = fields[index].lastKey;
                        }

                        deferred.resolve(mapKey);
                    });
                    return deferred;
                },
                showSetting: function (appDataConfig) {
                    let appName = appDataConfig.app;
                    if (appName) {
                        // 从 DB/Cache 中获取最新的 配置
                        dialog.show({
                            title: I18nService.getValue('应用配置', 'app.config'),
                            template: 'app_init_config_service_dialog',
                            width: 1200,
                            controller: 'AppDataConfigController',
                            controllerAs: 'ctrl',
                            data: {
                                appDataConfig: appDataConfig
                            }
                        });
                    }
                }
            };

            return configService;
        }]);

    app.controller('AppDataConfigController', ['$scope', 'AppConfigService', 'util', 'http', 'AppDataService',
        function ($scope, AppConfigService, util, http, AppDataService) {
            var ctrl = this;
            $scope.entity = {
                fields: []
            };
            var appDataConfig = $scope.appDataConfig;

            var dataKey = 'appDataConfig_' + appDataConfig.app;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadFields();
                    ctrl.bindOnSave();
                },
                loadFields: function () {
                    AppDataService.get(dataKey).success(function (config) {
                        console.log(config, 123);
                        $scope.entity.fields = _.get(config, 'fields', []);
                        util.apply($scope);
                    });
                },
                bindOnSave: function () {
                    $scope.$on('success', function () {
                        var data = util.removeHashKey($scope.entity.fields);
                        var appConfig = _.cloneDeep(appDataConfig);
                        appConfig['fields'] = data;

                        AppConfigService.save(appConfig);
                    });
                }
            });
            ctrl.initialize();
        }]);
});

