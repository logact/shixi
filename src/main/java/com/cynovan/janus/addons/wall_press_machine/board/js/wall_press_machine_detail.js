define(['rear_setting_machine/board/resource/rear_setting_machine_data_config', "echarts"], function (AppDataConfig, echarts) {
    var app = angular.module('app');

    app.controller('WallPressMachineDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element',
        'DeviceService', 'session', 'AppConfigService', '$timeout', '$state', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService,
                  session, AppConfigService, $timeout, $state, janus) {
            var ctrl = this;
            var uuid = $stateParams.id;
            $scope.uuid = uuid;
            $scope.showData = {
                'DeviceType': '',
                "ControlSystemVersion": '',
                "DeviceRatePressure": '',
                "DeviceRatePower": '',
                "DeviceRateVoltage": '',
                "OliPressure": ''
            };
            var fieldEnumMap = {
                'WorkSts': {
                    'true': '正常',
                    'false': '报警'
                },
                '1_2561': {
                    'true': '正常操作',
                    'false': '马靴专用',
                },
                '1_2562': {
                    'true': '成型前加压',
                    'false': '成型后加压',
                },
                '1_2568': {
                    'true': '正常操作',
                    'false': '马靴专用',
                },
                '1_2569': {
                    'true': '成型前加压',
                    'false': '成型后加压',
                }
            };

            $scope.rearFields = AppDataConfig.fields;

            var appName = 'wall_press_machine_board';

            ctrl.subNavOptions = {
                collection: 'device',
                query: {'wall_press_machine.show': true},
                selected: $stateParams.id
            };

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$watch('entity.wall_press_machine.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'wall_press_machine.image_id': newValue
                                    }
                                }).success(function () {
                                    dialog.noty('操作成功');
                                });
                            }
                        }
                    });
                },
                initData: function () {

                    DBUtils.find('device', {
                        uuid: uuid
                    }).success(function (result) {
                        var device = _.get(result, 'datas.result', {});
                        let dynamicData = _.get(device, "dynamicData", {});
                        delete device.dynamicData;
                        $scope.entity = device;
                        ctrl.initShowData(dynamicData);
                        ctrl.updateField(dynamicData);
                    });
                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
                        onmessage: function (data) {
                            let newData = _.get(data, 'data', {});
                            ctrl.initShowData(newData);
                            ctrl.updateField(newData);
                        }
                    });
                },
                initShowData: function (data) {
                    $scope.showData.DeviceType = _.get(data, 'DeviceType', $scope.showData.DeviceType);
                    $scope.showData.ControlSystemVersion = _.get(data, 'ControlSystemVersion', $scope.showData.ControlSystemVersion);
                    $scope.showData.DeviceRatePressure = _.get(data, 'DeviceRatePressure', $scope.showData.DeviceRatePressure);
                    $scope.showData.DeviceRatePower = _.get(data, 'DeviceRatePower', $scope.showData.DeviceRatePower);
                    $scope.showData.DeviceRateVoltage = _.get(data, 'DeviceRateVoltage', $scope.showData.DeviceRateVoltage);
                    $scope.showData.OliPressure = _.get(data, 'OliPressure', $scope.showData.OliPressure);
                    util.apply($scope);
                },
                updateField: _.throttle(function (lastData) {
                    /*改为jq操作,以增强响应*/
                    var updateFields = $element.find('.static-field-value');
                    // AppConfigService.query(appName).then(function () {
                    _.each(updateFields, function (fieldElement) {
                        var target = $(fieldElement);

                        var fieldKey = target.data('key');
                        AppConfigService.getFieldData(appName, fieldKey, lastData).done(function (newValue) {
                            if (fieldEnumMap[fieldKey]) {
                                var enumKey = _.toLower(newValue);
                                newValue = _.get(fieldEnumMap, fieldKey + '.' + enumKey, '');
                            }
                            if (newValue !== target.text()) {
                                target.text(newValue);
                                if (fieldKey === '3_4505' || fieldKey === '3_4504' || fieldKey === '3_4511' || fieldKey === '3_4512') {
                                    if (!_.isNaN(newValue / 10)) {
                                        target.text(newValue / 10);
                                    }
                                }
                            }
                        });
                        /*加工模式特殊处理*/
                        if (fieldKey === '1_2564') {
                            AppConfigService.getFieldData(appName, fieldKey, lastData).done(function (newValue) {
                                if (_.isEmpty(newValue) && !newValue) {
                                    AppConfigService.getFieldData(appName, '1_2565', lastData).done(function (newValue) {
                                        if (_.isEmpty(newValue) && !newValue) {
                                            AppConfigService.getFieldData(appName, '1_2566', lastData).done(function (newValue) {
                                                if (newValue) {
                                                    target.text('压上下前后左右');
                                                }
                                            });
                                        } else {
                                            target.text('压上下');
                                        }
                                    });
                                } else {
                                    target.text('压上下前后');
                                }
                            });
                        }
                        if (fieldKey === '1_2572') {
                            AppConfigService.getFieldData(appName, fieldKey, lastData).done(function (newValue) {
                                if (_.isEmpty(newValue) && !newValue) {
                                    AppConfigService.getFieldData(appName, '1_2571', lastData).done(function (newValue) {
                                        if (_.isEmpty(newValue) && !newValue) {
                                            AppConfigService.getFieldData(appName, '1_2574', lastData).done(function (newValue) {
                                                if (newValue) {
                                                    target.text('压上下前后左右');
                                                }
                                            });
                                        } else {
                                            target.text('压上下前后');
                                        }
                                    });
                                } else {
                                    target.text('压上下');
                                }
                            });
                        }
                    });
                    // });

                    var updateSwitchs = $element.find('.static-switch-state');
                    _.each(updateSwitchs, function (switchElement) {
                        var target = $(switchElement);
                        var targetValue = target.hasClass('active');

                        var switchKey = target.data('key');
                        var newValue = _.get(lastData, switchKey, false);
                        if (_.isString(newValue)) {
                            newValue = _.toLower(newValue);
                            if (newValue === 'false' || newValue === '0') {
                                newValue = false;
                            }
                        }
                        if (newValue !== targetValue) {
                            if (newValue) {
                                target.addClass('active');
                            } else {
                                target.removeClass('active');
                            }
                        }
                    });

                    var updateStates = $element.find('.static-state-state');
                    _.each(updateStates, function (switchElement) {
                        var target = $(switchElement);
                        var targetValue = target.hasClass('active');

                        var switchKey = target.data('key');
                        var newValue = _.get(lastData, switchKey, false);
                        if (_.isString(newValue)) {
                            newValue = _.toLower(newValue);
                            if (newValue === 'false' || newValue === '0') {
                                newValue = false;
                            }
                        }
                        if (newValue !== targetValue) {
                            if (newValue) {
                                target.addClass('active');
                            } else {
                                target.removeClass('active');
                            }
                        }
                    })
                }, 200),
                saveWallInfo: function () {
                    DBUtils.update('device', {
                        'uuid': uuid
                    }, {
                        $set: {
                            'dynamicData.DeviceType': $scope.showData.DeviceType,
                            'dynamicData.ControlSystemVersion': $scope.showData.ControlSystemVersion,
                            'dynamicData.DeviceRatePressure': $scope.showData.DeviceRatePressure,
                            'dynamicData.DeviceRatePower': $scope.showData.DeviceRatePower,
                            'dynamicData.DeviceRateVoltage': $scope.showData.DeviceRateVoltage,
                            'dynamicData.OliPressure': $scope.showData.OliPressure,
                        }
                    }).success(function (result) {
                        dialog.noty('操作成功');
                    })
                },
                goList: function () {
                    janus.goToMenuByName('机台')
                }
            });

            $timeout(function () {
                ctrl.initialize();
            }, 200);
        }]);
});
