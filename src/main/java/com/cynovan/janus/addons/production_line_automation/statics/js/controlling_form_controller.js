define(['production_line_automation/statics/js/controlling_service'], function () {
    var app = angular.module('app');

    app.controller('ControllingDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', '$timeout', 'SelectDeviceService', 'dialog',
        '$element', 'SelectRelatedDevice', 'ControllingEditCode', 'http', '$state', 'MonacoEditor', 'janus', 'I18nService',
        function ($scope, $stateParams, DBUtils, util, $timeout, SelectDeviceService, dialog, $element, SelectRelatedDevice, ControllingEditCode, http, $state, MonacoEditor, janus, I18nService) {
            var ctrl = this;
            $scope.entity = {
                config: '{}'
            };
            $scope.title = '';

            var configEditor;
            var removeDevices = [];

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initEntity();
                    ctrl.bindEvent();
                    ctrl.initBaseConfig();
                    ctrl.initTriggerRule();
                    ctrl.initTimeUnit();
                },
                initEntity: function () {
                    var controllingId = $stateParams.id;
                    if (controllingId === 'new') {
                        $scope.title = I18nService.getValue('自动化规则-新建', 'production.line.rule.new');
                    } else {
                        DBUtils.find('controlling', {
                            id: controllingId
                        }).success(function (result) {
                            var entity = _.get(result, 'datas.result', {});
                            $scope.entity = entity;
                            $scope.title = _.join([I18nService.getValue('自动化', 'production.automation'), entity.name], '-');
                            util.apply($scope);
                            ctrl.setConfigValue($scope.entity.config);
                        });
                    }
                },
                bindEvent: function () {
                    $scope.$on('$destroy', function () {
                        MonacoEditor.disposeAll();
                    });
                },
                initBaseConfig: function () {
                    MonacoEditor.initEditor('controlling_base_config_textarea', {
                        language: 'json'
                    });
                    ctrl.setConfigValue($scope.entity.config);
                },
                initTimeUnit: function () {
                    ctrl.timeUnit = [{
                        id: 'ms',
                        name: I18nService.getValue('毫秒', 'millisecond')
                    }, {
                        id: 's',
                        name: I18nService.getValue('秒', 'millisecond')
                    }, {
                        id: 'm',
                        name: I18nService.getValue('分', 'millisecond')
                    }];
                },
                initTriggerRule: function () {
                    ctrl.triggerRule = [{
                        id: 'data_drive',
                        name: I18nService.getValue('数据驱动', 'data.drive')
                    }, {
                        id: 'time_push',
                        name: I18nService.getValue('定时下发', 'time.issue')
                    }];

                    ctrl.triggerTypes = [{
                        id: 'normal',
                        name: I18nService.getValue('满足条件即触发', 'fill_trigger')
                    }, {
                        id: 'changed',
                        name: I18nService.getValue('仅结果变更时触发', 'result_trigger')
                    }];
                },

                checkSave: function () {
                    var success = true;
                    if (_.isEmpty($scope.entity.name)) {
                        dialog.noty(I18nService.getValue('请输入自动化规则的名称', 'input.automation.rule.name'));
                        success = false;
                        return success;
                    }

                    if ($scope.entity.open) {
                        if (_.isEmpty($scope.entity.devices)) {
                            dialog.noty(I18nService.getValue('请设置设备范围', 'config.device.range'));
                            success = false;
                            return success;
                        }
                        _.each($scope.entity.devices, function (value) {
                            if (_.isEmpty(_.get(value, 'name'))) {
                                dialog.noty(I18nService.getValue('请配置好设备范围中的设备', 'config.device.range.device'));
                                success = false;
                                return success;
                            }
                        });
                        if (_.isEmpty($scope.entity.rules)) {
                            dialog.noty(I18nService.getValue('请设置规则', 'setting.rule'));
                            success = false;
                            return success;
                        }
                        _.each($scope.entity.rules, function (value) {
                            if (_.isEmpty(value)) {
                                dialog.noty(I18nService.getValue('请设置规则', 'setting.rule'));
                                success = false;
                                return success;
                            }
                            let trigger = _.get(value, 'triggerRule');
                            if (_.isEmpty(trigger)) {
                                dialog.noty(I18nService.getValue('请设置触发规则', 'setting.trigger.rule'));
                                success = false;
                                return success;
                            }

                            if (trigger === I18nService.getValue('定时下发', 'time.issue')) {
                                let time = _.get(value, 'time');
                                if (_.isEmpty(time)) {
                                    dialog.noty(I18nService.getValue('请设置定时下发', 'setting.time.issue'));
                                    success = false;
                                    return success;
                                }
                            }

                            if (trigger === I18nService.getValue('数据驱动', 'data.drive')) {
                                if (_.isEmpty(_.get(value, 'relatedDevice'))) {
                                    dialog.noty(I18nService.getValue('请选择相关设备', 'select.relation.device'));
                                    success = false;
                                    return success;
                                }
                                if (_.isEmpty(_.get(value, 'dataProcess'))) {
                                    dialog.noty(I18nService.getValue('请设置数据处理', 'setting.data.exchange'));
                                    success = false;
                                    return success;
                                }
                            }

                            if (_.isEmpty(_.get(value, 'triggerCondition'))) {
                                dialog.noty(I18nService.getValue('请设置触发条件', 'setting.trigger.condition'));
                                success = false;
                                return success;
                            }
                        });
                        let overAlias = ctrl.checkAliasName();
                        if (!_.isEmpty(overAlias)) {
                            dialog.confirm(I18nService.getValue('检测到规则中选中的设备别名不存在，是否保存？若保存则默认不启用当前自动化规则！', 'check.automation.rule.device')).on('success', function () {
                                $scope.entity.open = false;
                                ctrl.saveControlToDB();
                            });
                            success = false;
                            return success;
                        }
                    } else {
                        $scope.entity.open = false;
                    }
                    return success;
                },

                saveControlData: function () {
                    ctrl.getConfigValue();
                    let success = ctrl.checkSave();
                    if (success) {
                        ctrl.saveControlToDB();
                    }
                },
                checkAliasName: function () {
                    let ruleDeviceAlias = [], deviceAlias = [];
                    $scope.entity.devices = util.removeHashKey($scope.entity.devices);
                    $scope.entity.rules = util.removeHashKey($scope.entity.rules);
                    _.each($scope.entity.rules, function (value) {
                        if (!_.isEmpty(value)) {
                            ruleDeviceAlias = _.concat(ruleDeviceAlias, _.get(value, 'relatedDevice', []), _.get(value, 'pushDevice', []));
                        }
                    });
                    ruleDeviceAlias = _.uniqBy(ruleDeviceAlias, 'name');
                    _.each($scope.entity.devices, function (value) {
                        let alias = _.get(value, 'alias', '');
                        if (!_.isEmpty(alias)) {
                            deviceAlias.push({
                                'name': alias
                            })
                        }
                    });
                    return _.differenceBy(ruleDeviceAlias, deviceAlias, 'name');
                },
                saveControlToDB: function () {
                    $scope.entity.rules = $scope.entity.rules ? $scope.entity.rules : [];
                    $scope.entity.devices = $scope.entity.devices ? $scope.entity.devices : [];
                    $scope.entity.devices = util.removeHashKey($scope.entity.devices);
                    $scope.entity.rules = util.removeHashKey($scope.entity.rules);
                    var data = util.encodeJSON(_.cloneDeep($scope.entity));
                    http.post('controlling/save', {
                        data: data
                    }).success(function (result) {
                        let message = _.get(result, 'messages', []);
                        if (_.size(message) > 0 && message[0] === "设备冲突，请检查！") {
                            dialog.noty(message[0]);
                            let conflict = _.get(result, 'datas.conflict', []);
                            let tip = [I18nService.getValue('检测到设备范围中的设备与其他自动化规则冲突，是否保存？若保存则默认不启用当前自动化规则！', 'check.automation.rule.conflict')];
                            _.each(conflict, function (value) {
                                tip.push(I18nService.getValue('设备', 'device') + '：' + _.get(value, 'deviceName', '') + '，' + I18nService.getValue('自动化规则', 'production.line.rule') + '：' + _.get(value, 'controlName', '') + '；');
                            });
                            dialog.confirm(tip).on('success', function () {
                                $scope.entity.open = false;
                                ctrl.saveControlToDB();
                            });

                        } else {
                            var id = _.get(result, 'datas.id', '');
                            dialog.noty(I18nService.getValue('操作成功', 'operation_success'));
                            janus.goToMenuDetailByName('自动化规则', id);
                        }
                    });
                },
                setConfigValue: function (value) {
                    MonacoEditor.setValue('controlling_base_config_textarea', value);
                },
                getConfigValue: function () {
                    $scope.entity.config = MonacoEditor.getValue('controlling_base_config_textarea');
                },
                addDeviceRow: function () {
                    $scope.entity.devices = $scope.entity.devices || [];
                    $scope.entity.devices.push({
                        unique: true
                    });
                },
                removeDeviceRow: function (index) {
                    let d = $scope.entity.devices;
                    if ($scope.entity.id && d[index].uuid) {
                        removeDevices.push(d[index]);//暂存删除的设备，便于保存时更新设备信息
                    }
                    $scope.entity.devices.splice(index, 1);
                },
                showSelectNotify: function (n) {
                    if (_.isEmpty(n)) {
                        dialog.noty(I18nService.getValue('请先选择设备', 'select.device.first'));
                        return;
                    }
                },
                addRuleRow: function () {
                    $scope.entity.rules = $scope.entity.rules || [];
                    var newRule = {
                        'rule_id': ctrl.getRuleId(),
                        triggerRule: 'data_drive',
                        triggerType: 'normal'
                    };
                    $scope.entity.rules.push(newRule);
                },
                getRuleId: function () {
                    let ruleId = util.uuid(10);
                    if (-1 === _.findIndex($scope.entity.rules, ['rule_id', ruleId])) {
                        return ruleId;
                    }
                    ctrl.getRuleId();
                },
                removeRuleRow: function (r, i) {
                    r.splice(i, 1);
                },
                selectDevice: function (device) {
                    SelectDeviceService.selectDevice().then(function (data) {
                        let uuid = _.get(data, 'uuid', '');
                        if (_.findIndex($scope.entity.devices, ['uuid', uuid]) === -1) {
                            device.name = _.get(data, 'name', '');
                            device.uuid = uuid;
                        } else {
                            dialog.noty(I18nService.getValue('设备重复，请重选', 'please_select_again'));
                        }
                    });
                },
                addRelatedDevice: function (index, key) {
                    let selectedArray = [];
                    let nowAliasName = [];

                    if (!$scope.entity.rules[index][key]) {
                        $scope.entity.rules[index][key] = [];
                    } else {
                        _.each($scope.entity.rules[index][key], function (v) {
                            nowAliasName.push(v.name);
                        });
                    }

                    SelectRelatedDevice.selectAliasName(_.get($scope.entity, 'devices', []), nowAliasName).then(function (data) {
                        _.each(data, function (value) {
                            selectedArray.push({
                                name: value
                            });
                        });
                        $scope.entity.rules[index][key] = _.concat($scope.entity.rules[index][key], selectedArray);
                        $scope.entity.rules[index][key] = _.uniqBy(util.removeHashKey($scope.entity.rules[index][key]), 'name');
                        util.apply($scope);
                    });
                },
                deleteRelatedDevice: function (d, index) {
                    d.splice(index, 1);
                },
                editCode: function (i, k) {
                    let code = $scope.entity.rules[i][k];
                    ControllingEditCode.writeExpressionCode(code, _.get($scope.entity, 'devices', [])).then(function (data) {
                        $scope.entity.rules[i][k] = data;
                    });
                },
                goList: function () {
                    janus.goToMenuByName('自动化规则');
                }
            });
            $timeout(function () {
                ctrl.initialize();
            }, 300);
        }]);
});
