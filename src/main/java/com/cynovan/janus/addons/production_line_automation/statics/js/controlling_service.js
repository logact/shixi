define(['chosen'], function () {
    var app = angular.module('app');

    app.service('SelectDeviceService', ['dialog', 'DBUtils', '$q', 'I18nService', function (dialog, DBUtils, $q, I18nService) {
        var service = {
            selectDevice: function () {
                var defer = $q.defer();
                var deviceDialog = dialog.show({
                    title: I18nService.getValue('选择设备', 'select.device'),
                    template: 'control_select_device_template',
                    width: 1200,
                    buttons: {},
                    data: {
                        'device': {},
                        defer: defer
                    },
                    controllerAs: 'ctrl',
                    controller: ['$scope', function ($scope) {
                        let deviceData = $scope.device;
                        let defer = $scope.defer;
                        var ctrl = this;
                        _.extend(ctrl, {
                            initialize: function () {
                                ctrl.initOptions();
                                ctrl.bindEvent();
                            },
                            bindEvent: function () {
                                $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                                    var buttonKey = element.closest('.btn').data('key');
                                    if (buttonKey === 'select-this') {
                                        ctrl.confirmDevice(rowdata);
                                    }
                                });
                            },
                            confirmDevice: function (rowdata) {
                                _.set(deviceData, 'name', rowdata.baseInfo.name);
                                _.set(deviceData, 'uuid', rowdata.uuid);
                                defer.resolve(deviceData);
                                deviceDialog.modal('hide');
                            },
                            initOptions: function () {
                                ctrl.options = {
                                    collection: 'device',
                                    columns: [{
                                        name: '_id',
                                        visible: false
                                    }, {
                                        name: 'controlling',
                                        visible: false
                                    }, {
                                        name: 'online',
                                        title: I18nService.getValue('联网状态', 'link_status'),
                                        width: '100px',
                                        targets: 0,
                                        orderable: true,
                                        render: function (data, type, row) {
                                            var cls = row.online.toString() === 'true' ? 'active' : '';
                                            return `<span class="device_online_state ${cls}" id="device_online_state_${row.id}"></span>`;
                                        }
                                    }, {
                                        name: 'uuid',
                                        title: I18nService.getValue('序列号', 'device.uuid'),
                                        search: true,
                                        width: '25%'
                                    }, {
                                        name: 'baseInfo.name',
                                        title: I18nService.getValue('设备名称', 'device.name'),
                                        width: '20%',
                                        search: true
                                    }, {
                                        name: 'tag',
                                        title: I18nService.getValue('设备标签', 'device.tag'),
                                        search: true
                                    }, {
                                        name: 'do',
                                        title: I18nService.getValue('操作', 'do'),
                                        render: function () {
                                            return `<button class="btn btn-success btn-xs" data-key="select-this" type="button"><i' +
                                                ' class="fa fa-check"></i>${I18nService.getValue('选择此设备', 'select.this.device')}</button>`;
                                        }
                                    }]
                                }
                            }
                        });
                        ctrl.initialize();
                    }]
                });
                return defer.promise;
            }
        };
        return service;
    }]);

    app.service('SelectRelatedDevice', ['dialog', '$q', 'I18nService', function (dialog, $q, I18nService) {
        return {
            selectAliasName: function (devices, aliasName) {
                var defer = $q.defer();
                dialog.show({
                    title: I18nService.getValue('选择相关设备', 'select.relate.device'),
                    template: 'related_device_template',
                    controllerAs: 'ctrl',
                    controller: 'RelatedDeviceController',
                    width: 800,
                    data: {
                        'defer': defer,
                        'aliasName': aliasName,
                        'devices': devices
                    }
                });
                return defer.promise;
            }
        }

    }]);

    app.controller('RelatedDeviceController', ['$scope', 'util', '$element', '$timeout', 'dialog', 'I18nService', function (dscope, util, $element, $timeout, dialog, I18nService) {
        var ctrl = this;
        let html = [];
        let defer = dscope.defer;
        let aliasName = dscope.aliasName;
        dscope.names = [];

        _.extend(ctrl, {
            initialize: function () {
                ctrl.bindEvent();
                $timeout(function () {
                    ctrl.initSelectData();
                }, 150);
            },
            bindEvent: function () {
                dscope.$on('success', function () {
                    dscope.selectedArray = _.uniq($element.find('#related_device_select').val());
                    defer.resolve(dscope.selectedArray);
                })
            },
            initSelectData: function () {
                if (dscope.devices) {
                    _.each(dscope.devices, function (value) {
                        if (value.alias) {
                            if (-1 === _.findIndex(dscope.names, ['name', value.alias])) {
                                dscope.names.push({
                                    'name': value.alias
                                });
                            }
                        }
                    });

                    if (_.isEmpty(dscope.names)) {
                        dialog.noty(I18nService.getValue('请先在设备范围处添加设备别名', 'add.device.alias'));
                    }
                    _.each(dscope.names, function (tag) {
                        html.push(`<option value="${tag.name}">${tag.name}</option>`);
                    });
                }
                let selectElement = $element.find('#related_device_select');
                selectElement.html(html.join(''));
                if (_.isArray(aliasName)) {
                    selectElement.val(aliasName);
                }
                selectElement.chosen({
                    search_contains: true,
                    allow_single_deselect: true,
                    widget: 100
                });
            }
        });
        ctrl.initialize();
    }]);

    app.service('ControllingEditCode', ['dialog', '$q', 'I18nService', function (dialog, $q, I18nService) {
        return {
            writeExpressionCode: function (code, devices) {
                var defer = $q.defer();
                dialog.show({
                    title: I18nService.getValue('编辑表达式', 'edit_express'),
                    template: 'edit_controlling_code_expression_template',
                    controllerAs: 'ctrl',
                    controller: 'EditControllingExpressCodeController',
                    width: 1200,
                    data: {
                        'defer': defer,
                        'code': code,
                        'devices': devices
                    }
                });
                return defer.promise;
            }
        }
    }]);

    app.controller('EditControllingExpressCodeController', ['$scope', 'dialog', '$timeout', '$element', 'MonacoEditor', 'I18nService',
        function ($scope, dialog, $timeout, $element, MonacoEditor, I18nService) {

            var ctrl = this;

            let defer = $scope.defer;
            let code = $scope.code;
            $scope.names = [];

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initAlias();
                    ctrl.initSelectAlias();
                    $timeout(function () {
                        ctrl.initEditor();
                    }, 300);
                    ctrl.bindEvent();
                },
                initAlias: function () {
                    _.each($scope.devices, function (value) {
                        if (value.alias) {
                            if (-1 === _.findIndex($scope.names, ['name', value.alias])) {
                                $scope.names.push({
                                    'name': value.alias
                                });
                            }
                        }
                    });
                },
                initSelectAlias: function () {
                    let html = [];
                    html.push('<option value=""></option>');
                    _.each($scope.names, function (tag) {
                        html.push(`<option value="${tag.name}">${tag.name}</option>`);
                    });

                    var element = $element.find('#alias_name_select');
                    html = html.join('');
                    element.html(html);
                    element.chosen({
                        search_contains: true,
                        allow_single_deselect: true
                    }).change(function (event, item) {
                        var name = _.get(item, 'selected', '');
                        if (name) {
                            name = _.join(['$', name, '$'], '');
                            ctrl.addExpress(name);
                        }
                    });
                },
                addExpress: function (express) {
                    MonacoEditor.insertValue('code_expression_editor', express);
                },
                bindEvent: function () {
                    $scope.$on('success', function (event, checkMessage) {
                        let flag = ctrl.checkCode();
                        if (flag === false) {
                            checkMessage.success = false;
                            dialog.noty(I18nService.getValue('表达式错误,请修正', ''));
                            return false;
                        }
                        ctrl.getEditorValue();
                    });
                },
                initEditor: function () {
                    MonacoEditor.initEditor('code_expression_editor', {
                        height: 150,
                        language: 'javascript'
                    });
                    ctrl.setEditorValue();
                },
                formatCode: function () {
                    MonacoEditor.format('code_expression_editor');
                },
                setEditorValue: function () {
                    MonacoEditor.setValue('code_expression_editor', code);
                },
                getEditorValue: function () {
                    var code = MonacoEditor.getValue('code_expression_editor');
                    if (_.isEmpty(code)) {
                        defer.resolve("");
                    } else {
                        defer.resolve(_.trim(code));
                    }
                },
                checkCode: function () {
                    code = MonacoEditor.getValue('code_expression_editor');
                    if (code.indexOf('return') === -1) {
                        dialog.noty(I18nService.getValue('表达式中需要包含明确的return语句', 'contain_return'));
                        return false;
                    }
                    try {
                        let re = /\$(.*?)\$/g;
                        let m = re.exec(code);
                        while (m) {
                            let name = m[1];
                            if (name !== 'config' && -1 === _.findIndex($scope.names, ['name', name])) {
                                dialog.noty(`表达式中 ${name} 不在别名列表中`);
                                return false;
                            }
                            m = re.exec(code);
                        }
                    } catch (e) {
                        return false;
                    }
                    return true;
                }
            });
            $timeout(function () {
                ctrl.initialize();
            }, 100);
        }]);

});