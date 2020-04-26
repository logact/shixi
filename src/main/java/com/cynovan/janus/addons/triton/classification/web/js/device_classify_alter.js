define(['triton/device/web/service/exchange_code_service'], function () {
    var app = angular.module('app');
    app.controller('DeviceClassificationDetail', ['$scope', 'DBUtils', 'dialog', 'http', 'util', "I18nService", "$element", 'janus',
        "$stateParams", 'websocket',"$timeout", 'ExchangeCodeService', '$rootScope',
        function ($scope, DBUtils, dialog, http, util, I18nService, $element, janus,
                  $stateParams, websocket, $timeout, ExchangeCodeService, $rootScope) {
            var ctrl = this;
            var viewMap = {};
            var name = "";
            $scope.entity = {};
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                    $timeout(function () {
                        ctrl.calcBottomBoxHeight();
                    }, 100);
                },
                calcBottomBoxHeight: _.debounce(function () {
                    var top = 500;
                    var panel = $('.auto-height-panel');
                    var data_column = $('.data-column');
                    var codeBox = $('.code-panel');
                    var height = $(window).height() - top - 10;
                    if (height > 350) {
                        panel.height(height);
                    } else {
                        panel.height(350);
                    }
                    var codeheight = panel.height() - 95;
                    data_column.height(codeheight);
                    codeBox.height(codeheight);
                }, 300),
                initData: function () {
                    let classificationId = $scope.classificationId = $stateParams.id;
                    ctrl.subNavOptions = {
                        collection: 'deviceClassification',
                        code: "id",
                        query: {"appId": null},
                        label: "设备类型列表",
                        selected: $stateParams.id,
                        name: 'name'
                    };
                    DBUtils.find("deviceClassification", {id: classificationId}).success(function (result) {
                        $scope.entity = _.get(result, "datas.result", {});
                        if (!$scope.entity.exchange) {
                            _.extend($scope.entity, {exchange: {}})
                        }
                        if (!$scope.entity.isapp) {
                            _.extend($scope.entity, {isapp: false});
                        }
                        let data_definition = _.get($scope, "entity.data_definition.details", []);
                        _.set($scope, "entity.data_definition.details", data_definition);
                        name = $scope.entity.name;
                        let alarmList = _.get($scope, "entity.alarm.alarmList", []);
                        if (_.isEmpty(alarmList)) {
                            $scope.template = [{
                                stateSetting: "normal"
                            }, {
                                stateSetting: "warning"
                            }, {
                                stateSetting: "alarm"
                            }];
                            _.set($scope, "entity.alarm.alarmList", $scope.template);
                        }
                        $scope.Appstatu = $scope.entity.isapp == true ? '是' : '否';
                    });
                },
                bindEvent: function () {
                    $scope.$watch("entity.alarm.column", function (newV) {
                        let details = _.get($scope, "entity.data_definition.details", []);
                        _.each(details, function (item) {
                            if (item.key === newV) {
                                _.set($scope, "alarm.columnName", item.name);
                            }
                        });
                    });
                },
                goList: function () {
                    janus.goToMenuByName("设备类型");
                },
                addDataStruc: function (entity, index) {
                    var updateValue = true;
                    if (!entity) {
                        updateValue = false;
                        entity = {
                            'rule': 'str',
                            values: [{}]
                        };
                    }
                    dialog.show({
                        template: 'device_add_datastruc_template',
                        title: '数据端点',
                        width: 1100,
                        controller: ['$scope', function (dialogScope) {
                            dialogScope.entity = entity;
                            dialogScope.ruleOptions = [{
                                id: 'str',
                                name: '普通文本'
                            }, {
                                id: 'boo',
                                name: '布尔类型'
                            }, {
                                id: 'number',
                                name: '数字'
                            }, {
                                id: 'enum',
                                name: '枚举'
                            }];

                            dialogScope.decimalOpts = [{
                                id: '0',
                                name: '不保留小数',
                            }, {
                                id: '1',
                                name: '保留1位小数'
                            }, {
                                id: '2',
                                name: '保留2位小数'
                            }, {
                                id: '3',
                                name: '保留3位小数'
                            }, {
                                id: '4',
                                name: '保留4位小数'
                            }, {
                                id: '5',
                                name: '保留5位小数'
                            }, {
                                id: '6',
                                name: '保留6位小数'
                            }, {
                                id: '7',
                                name: '保留7位小数'
                            }, {
                                id: '8',
                                name: '保留8位小数'
                            }]

                            dialogScope.addTransferRow = function () {
                                if (!entity.values) {
                                    entity.values = [];
                                }
                                entity.values.push({});
                            }

                            dialogScope.removeStruc = function ($index) {
                                entity.values.splice($index, 1);
                                if (!entity.values.length) {
                                    entity.values.push({});
                                }
                            };

                            dialogScope.valueBlur = function ($index) {
                                var row = entity.values[$index];
                                if (row.value && !row.desc) {
                                    row.desc = row.value;
                                }
                            };

                            dialogScope.$on('success', function (event, checkMessage) {
                                /*check the 数据ID & 数据名称*/
                                if (!dialogScope.entity.key) {
                                    dialog.noty('请输入数据ID');
                                    checkMessage.success = false;
                                    return false;
                                }

                                var regexp = /^[0-9a-zA-Z_]*$/g
                                if (!regexp.test(dialogScope.entity.key)) {
                                    dialog.noty('数据ID不符合规则，请修改！');
                                    checkMessage.success = false;
                                    return false;
                                }

                                if (dialogScope.entity.key.length > 40) {
                                    dialog.noty('数据ID最大长度不能大于40位, 请检查！');
                                    checkMessage.success = false;
                                    return false;
                                }

                                if (!dialogScope.entity.name) {
                                    dialog.noty('请输入数据名称');
                                    checkMessage.success = false;
                                    return false;
                                }

                                var targetRule = _.find(dialogScope.ruleOptions, function (item) {
                                    return item.id === dialogScope.entity.rule;
                                });
                                if (targetRule) {
                                    dialogScope.entity.rule_name = targetRule.name;
                                }

                                dialogScope.entity.values = _.chain(dialogScope.entity.values).filter(function (item) {
                                    return !!item.value;
                                }).map(function (item) {
                                    return util.removeHashKey(item);
                                }).value();
                                /*omit all field*/
                                var data = util.removeHashKey(dialogScope.entity);
                                data.id = data.id || util.uuid();
                                var strucList = _.get($scope.entity, 'data_definition.details', []);


                                var exists = !!_.size(_.find(strucList, function (item) {
                                    return item.key === data.key && item.id !== data.id;
                                }));

                                if (exists) {
                                    dialog.noty('数据ID已存在,请修改!');
                                    return false;
                                }

                                if (!_.isUndefined(index)) {
                                    strucList[index] = data;
                                } else {
                                    strucList.push(data);
                                }

                                if (updateValue) {
                                    DBUtils.update('deviceClassification', {
                                        id: $scope.classificationId,
                                        'data_definition.details.id': data.id
                                    }, {
                                        $set: {
                                            'data_definition.details.$': data
                                        }
                                    }, false, {
                                        deleteCache: 'classification_datastruc_%'
                                    }).success(function () {
                                        dialog.noty('操作成功！');
                                    });
                                } else {
                                    DBUtils.update('deviceClassification', {
                                        id: $scope.classificationId,
                                    }, {
                                        $addToSet: {
                                            'data_definition.details': data,
                                        }
                                    }, true, {
                                        deleteCache: 'classification_datastruc_%'
                                    }).success(function () {
                                        dialog.noty('操作成功！');
                                    });
                                }
                                http.post("dataDefinition/removeCache");
                            });
                        }]
                    });
                },
                removeStruc: function ($index) {
                    dialog.confirm('确定要删除?').on('success', function () {
                        /*remove from server*/
                        $scope.entity.data_definition.details.splice($index, 1);

                        var strucList = util.removeHashKey($scope.entity.data_definition.details);
                        DBUtils.update('deviceClassification', {
                            id: $scope.classificationId
                        }, {
                            $set: {
                                "data_definition.details": strucList
                            }
                        }).success(function () {
                            http.post("dataDefinition/removeCache");
                            dialog.noty('操作成功!');
                        });
                    });
                },
                editStruc: function ($index) {
                    var entity = $scope.entity.data_definition.details[$index];
                    entity = util.removeHashKey(_.cloneDeep(entity));
                    ctrl.addDataStruc(entity, $index);
                },
                importFromTemplate: function () {
                    dialog.show({
//                    显示的一个template 的名字
                        template: 'classification_alarm_import_from_excel_template',
                        title: '数据栏位定义导入',
                        width: 1100,
                        controller: ['$scope', '$element', function (dialogScope, $element) {
                            var uploadSuccess = false;
                            dialogScope.importing = false;
                            websocket.sub({
//                            订阅的主题 访问的路径 后端会向这个主题中推送消息
                                topic: 'importDataStruct/' + $scope.classificationId,
                                onmessage: function (message) {
                                    if (message) {
                                        // $('.import_result').append(message.message);
                                        var state = message.state;
                                        if (state) {
                                            switch (state) {
                                                case 'error':
                                                    $element.find('#import_result').append(errorMessage(message.message));
                                                    break;
                                                case 'success':
                                                    $element.find('#import_result').append(successMessage(message.message));
                                                    uploadSuccess = true;
                                                    break;
                                                case 'finished':
                                                    $element.find('#import_result').append(finishedMessage(message.message));
                                                    break;
                                            }
                                        }
                                    }
                                }
                            });

                            function errorMessage(message) {
                                return '<div style="color: red;">' + message + '</div>';
                            }

                            function successMessage(message) {
                                return '<div style="color: green;">' + message + '</div>';
                            }

                            function finishedMessage(message) {
                                return '<div>' + message + '</div>';
                            }
//                            这里访问后台的控制器的接口
                            // dropzone init
                            var config = {
                                url: 'dataDefinition/importTemplate',
                                paramName: 'FILE',
                                parallelUploads: 1,
                                autoProcessQueue: false,
                                withCredentials: true,
                                acceptedFiles: 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//                                这里的params因该xx
                                params: {
                                    classificationId: $scope.classificationId
                                }
                            }
//                           初始化一个dropzone服务？？？？
                            dropzone = new Dropzone('#data-struct-import', config);

                            var eventHandlers = {
                                'addedfile': function (file) {
                                    dialogScope.file = file;
                                    if (this.files[1] != null) {
                                        this.removeFile(this.files[0]);
                                    }
                                    $element.find('#import_result').height(194);
                                    dialogScope.$apply(function () {
                                        dialogScope.fileAdded = true;
                                    })
                                },
                                'success': function (file, response) {
                                    // go import message
                                    dialog.noty('上传成功！');
                                },
                                'error': function (error, msg) {
                                    if (msg === "You can't upload files of this type.") {
                                        dialog.noty('只支持excel格式导入');
                                        dropzone.removeAllFiles();
                                    } else {
                                        dialog.noty('上传失败!请重试！');
                                    }
                                }
                            }
                            angular.forEach(eventHandlers, function (handler, event) {
                                dropzone.on(event, handler);
                            })

                            dialogScope.startImport = function () {
                                dropzone.processQueue();
                                $element.find('#import_result').html('');
                            }

                            dialogScope.resetImport = function () {
                                var importResult = $element.find('#import_result');
                                importResult.height(178);
                                importResult.html('');
                                dropzone.removeAllFiles();
                            }

                            dialogScope.exportTemplate = function () {
                                ctrl.exportTemplate();
                            }

                            dialogScope.$on('success', function () {
                                websocket.unsub('importDataStruct/' + $scope.classificationId);
                                if (uploadSuccess) {
                                    http.post("dataDefinition/removeCache");
                                    dialog.notyWithRefresh('2秒后自动刷新', $scope);
                                }
                            });

                            dialogScope.$on('cancel', function () {
                                websocket.unsub('importDataStruct/' + $scope.classificationId);
                                if (uploadSuccess) {
                                    dialog.notyWithRefresh('2秒后自动刷新', $scope);
                                }
                            })
                        }]//controller end
                    });
                },
                exportFromData: function () {
                    window.open('dataDefinition/exportFromData?classificationId=' + $scope.classificationId);
                },
                exportTemplate: function () {
                    window.open('dataDefinition/exportTemplate?classificationId=' + $scope.classificationId, '_blank');
                },
                alterClassification: function () {
                    dialog.show({
                        template: 'classification_edit_production_info_template',
                        width: 650,
                        title: '设备类型编辑',
                        data: {
                            entity: _.cloneDeep($scope.entity)
                        },
                        controller: ['$scope', function (dialogScope) {
                            dialogScope.deviceView = {
                                value: {},
                                projection: {
                                    _id: 1,
                                    name: 1,
                                    code: 1
                                }
                            };
                            dialogScope.deviceView.value = {
                                code: _.get(dialogScope, "entity.view.viewCode"),
                                name: _.get(dialogScope, "entity.view.viewName")
                            };
                            dialogScope.$watch("deviceView.value", function (checked_view) {
                                let entity_view = {};
                                let view_code = _.get(checked_view, "code", "");
                                if (!_.isEmpty(view_code)) {
                                    entity_view.viewCode = view_code;
                                    entity_view.viewName = _.get(checked_view, "name");
                                }
                                _.set(dialogScope.entity, "view", entity_view);
                            });
                            dialogScope.$on('success', function (event, checkMessage) {
                                let name = _.get(dialogScope, "entity.name");
                                if (_.isEmpty(name)) {
                                    dialog.noty("请输入设备类型名称!");
                                    checkMessage.success = false;
                                }
                                if (checkMessage.success) {
                                    var cls = {
                                        name: name,
                                        remark: _.get(dialogScope, "entity.remark", ""),
                                        isapp: _.get(dialogScope, "entity.isapp", false),
                                        view: _.get(dialogScope, "entity.view", {}),
                                        code: _.get(dialogScope, "entity.code", "")
                                    };
                                    http.post("dataDefinition/updateCls", {
                                        clsCode: _.get(dialogScope, "entity.code", ""),
                                        entity: JSON.stringify(cls)
                                    }).success(function (result) {
                                        if (result.success) {
                                            dialog.noty("操作成功!");
                                            ctrl.updateEntity();
                                            $rootScope.$broadcast('refreshMenus');
                                        } else {
                                            dialog.noty(result.messages[0]);
                                        }
                                    });
                                }
                            });
                        }]
                    });
                },
                updateEntity: function () {
                    DBUtils.find("deviceClassification", {
                        id: $stateParams.id
                    }, {}).success(function (result) {
                        $scope.entity = _.get(result, "datas.result", $scope.entity);
                        $scope.Appstatu = $scope.entity.isapp == true ? '是' : '否';
                    });
                },
                alarmSetting: function () {
                    var settingDialog = dialog.show({
                        template: 'classification_edit_alarm_setting_template',
                        width: 1200,
                        title: '设备状态',
                        data: {
                            entity: _.cloneDeep($scope.entity)
                        },
                        controller: "deviceClassificationAlarmEditController",
                        controllerAs: 'ctrl'
                    });
                    settingDialog.on("hidden.bs.modal", function () {
                        let cid = _.get($scope, "entity.id", "");
                        DBUtils.find("deviceClassification", {
                            id: cid
                        }).success(function (result) {
                            let data = _.get(result, "datas.result", {});
                            if (!_.isEmpty(data)) {
                                $scope.entity = data;
                                let alarmList = _.get($scope, "entity.alarm.alarmList", []);
                                if (_.isEmpty(alarmList)) {
                                    _.set($scope, "entity.alarm.alarmList", $scope.template);
                                }
                            }
                        });
                    });
                },
                showProcessingCode: function () {
                    var exchange = $scope.entity.exchange || {};
                    ExchangeCodeService.editExchangeCode(exchange).done(function (result) {
                        _.extend($scope.entity, result || {});
                        util.apply($scope);
                        result = util.encodeJSON(result);
                        http.post('dataDefinition/saveExchangeCode', {
                            classificationId: $scope.entity.id,
                            data: result
                        }).success(function () {
                            dialog.noty(I18nService.getValue('保存成功', 'save_success'));
                        });
                    });
                }
            });
            ctrl.initialize();
        }]);

    app.controller("deviceClassifyImportAlarmController", ['$scope', '$element', 'websocket', 'dialog', 'DBUtils',
        function (dialogScope, $element, websocket, dialog, DBUtils) {
            var uploadSuccess = false;
            var ctrl = this;
            _.extend(ctrl, {
                exportTemplate: function () {
                    window.open('/DeviceDataTimeLine/getTemplate', '_blank');
                }
            });
            dialogScope.importing = false;

            websocket.sub({
                topic: 'importDataStruct/' + dialogScope.classificationId,
                onmessage: function (message) {
                    if (message) {
                        var state = message.state;
                        if (state) {
                            switch (state) {
                                case 'error':
                                    $element.find('#import_result').append(errorMessage(message.message));
                                    break;
                                case 'success':
                                    $element.find('#import_result').append(successMessage(message.message));
                                    uploadSuccess = true;
                                    break;
                                case 'finished':
                                    $element.find('#import_result').append(finishedMessage(message.message));
                                    break;
                            }
                        }
                    }
                }
            });

            function errorMessage(message) {
                return '<div style="color: red;">' + message + '</div>';
            }

            function successMessage(message) {
                return '<div style="color: green;">' + message + '</div>';
            }

            function finishedMessage(message) {
                return '<div>' + message + '</div>';
            }

            // dropzone init
            var config = {
                url: '/DeviceDataTimeLine/importAlarmDataByExcel',
                paramName: 'FILE',
                parallelUploads: 1,
                autoProcessQueue: false,
                withCredentials: true,
                acceptedFiles: 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                params: {
                    classificationId: dialogScope.classificationId
                }
            };
            dropzone = new Dropzone('#data-struct-import', config);

            var eventHandlers = {
                'addedfile': function (file) {
                    dialogScope.file = file;
                    if (this.files[1] != null) {
                        this.removeFile(this.files[0]);
                    }
                    $element.find('#import_result').height(194);
                    dialogScope.$apply(function () {
                        dialogScope.fileAdded = true;
                    })
                },
                'success': function (file, response) {
                    // go import message
                    dialog.noty("上传成功!");
                },
                'error': function (error, msg) {
                    console.log(error);
                    console.log(msg);
                    if (msg === "You can't upload files of this type.") {
                        dialog.noty('只支持excel格式导入');
                        dropzone.removeAllFiles();
                    } else {
                        dialog.noty('上传失败!请重试！');
                    }
                }
            };


            angular.forEach(eventHandlers, function (handler, event) {
                dropzone.on(event, handler);
            });

            dialogScope.startImport = function () {
                dropzone.processQueue();
                $element.find('#import_result').html('');
            };

            dialogScope.resetImport = function () {
                var importResult = $element.find('#import_result');
                importResult.height(178);
                importResult.html('');
                dropzone.removeAllFiles();
            };

            dialogScope.exportTemplate = function () {
                ctrl.exportTemplate();
            };

            dialogScope.$on('success', function () {
                websocket.unsub('importDataStruct/' + dialogScope.classificationId);
                if (uploadSuccess) {
                    //dialog.notyWithRefresh('2秒后自动刷新', dialogScope);
                }
            });

            dialogScope.$on('cancel', function () {
                websocket.unsub('importDataStruct/' + dialogScope.classificationId);
            });
        }]);

    app.controller("deviceClassificationAlarmEditController", ['$scope', '$element', 'websocket', 'dialog', "DBUtils", 'util', '$timeout',
        'http',
        function (dialogScope, $element, websocket, dialog, DBUtils, util, $timeout, http) {
            var ctrl = this;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.initData();
                    ctrl.initAlarmSelect();
                },
                initData: function () {
                    dialogScope.state = [{
                        "name": "正常",
                        "state": "normal"
                    }, {
                        "name": "警告",
                        "state": "warning"
                    }, {
                        "name": "报警(此状态将会产生一条报警数据)",
                        "state": "alarm"
                    }];
                },
                bindEvent: function () {
                    dialogScope.$on("success", function (event, checkMessage) {
                        let alarmObject = _.get(dialogScope, "entity.alarm", {});
                        if (_.isEmpty(alarmObject.column)) {
                            dialog.noty("请选择报警栏位");
                            checkMessage.success = false;
                        } else {
                            let alarmList = alarmObject.alarmList;
                            _.each(alarmList, function (item, index) {
                                let i = index + 1;
                                if (_.isEmpty(_.get(item, "stateSetting", ""))) {
                                    dialog.noty("请选择第" + i + "行的状态");
                                    checkMessage.success = false;
                                } else if (_.get(item, "alarmValue", "") === "") {
                                    dialog.noty("第" + i + "行的警报值不能为空!");
                                    checkMessage.success = false;
                                    return false;
                                } else if (_.isEmpty(_.get(item, "alarmName"))) {
                                    dialog.noty("第" + i + "行的报警名称不能为空!");
                                    checkMessage.success = false;
                                    return false;
                                }
                            });
                        }
                        if (checkMessage.success) {
                            let alarmList = _.get(dialogScope, "entity.alarm.alarmList", []);
                            _.set(dialogScope, "entity.alarm.alarmList", util.removeHashKey(alarmList));
                            DBUtils.update("deviceClassification", {
                                id: dialogScope.entity.id
                            }, {
                                $set: {
                                    alarm: dialogScope.entity.alarm
                                }
                            }).success(function (result) {
                                if (result.success) {
                                    dialog.noty("设置成功!");
                                }
                            });
                            http.post("dataDefinition/removeCache");
                        }
                    });
                },
                addFieldRow: function () {
                    let alarmList = _.get(dialogScope.entity, "alarm.alarmList", []);
                    alarmList.push({});
                    _.set(dialogScope, "entity.alarm.alarmList", alarmList);
                },
                removeFieldRow: function (index) {
                    dialogScope.entity.alarm.alarmList.splice(index, 1);
                },
                initAlarmSelect: function () {
                    var element = $element.find('#data_column_select');

                    DBUtils.find('deviceClassification', {
                        id: dialogScope.entity.id
                    }).success(function (result) {
                        createFileListHtml(_.get(result, 'datas.result', {}));
                    });

                    function createFileListHtml(result) {
                        result = _.get(result, "data_definition.details");
                        var html = [];
                        html.push('<option value=""></option>');
                        _.each(result, function (value) {
                            html.push('<option value="' + value.key + '">' + value.name + '</option>');
                        });
                        html = html.join('');
                        element.html(html);
                        ctrl.setSelectIndex(element);
                        $timeout(function () {
                            var data_column_info_div = $(".data-column-info-div");
                            var tipElement = data_column_info_div.find('.control-info');
                            var myOpentip = new Opentip(tipElement, {
                                myOpentip: 'right'
                            });
                            myOpentip.setContent("该栏位数据描述设备的状态");
                        });
                        element.chosen({
                            search_contains: true,
                            allow_single_deselect: true
                        }).change(function (event, item) {
                            _.set(dialogScope, "entity.alarm.column", item.selected);
                        });
                    }
                },
                setSelectIndex: function (element) {
                    let column = _.get(dialogScope, "entity.alarm.column", "");
                    if (!_.isEmpty(column)) {
                        let data = _.get(dialogScope, "entity.data_definition.details");
                        _.each(data, function (item, index) {
                            if (item.key === column) {
                                element[0].selectedIndex = index + 1;
                            }
                        });
                    }
                },
                importFromExcel: function () {
                    let importDialog = dialog.show({
                        title: "导入报警数据",
                        template: "classification_alarm_import_from_excel_template",
                        width: 1200,
                        controller: "deviceClassifyImportAlarmController",
                        controllerAs: 'ctrl',
                        data: {
                            classificationId: dialogScope.entity.id,
                            entity: dialogScope.entity
                        }
                    });
                    importDialog.on("hidden.bs.modal", function () {
                        let cid = _.get(dialogScope, "entity.id", "");
                        DBUtils.find("deviceClassification", {
                            id: cid
                        }).success(function (result) {
                            let data = _.get(result, "datas.result", {});
                            if (!_.isEmpty(data)) {
                                dialogScope.entity = data;
                            }
                        });
                    });
                }
            });
            ctrl.initialize();
        }]);

    app.filter('stateChange', function () {
        return function (text) {
            let result;
            if (text === "normal") {
                result = "正常";
            } else if (text === "warning") {
                result = "警告";
            } else if (text === "alarm") {
                result = "报警";
            }
            return result;
        }
    });
});
