define([], function () {
    var app = angular.module('app');

    app.controller('SewingDeviceDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$timeout', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $timeout, janus) {
            var ctrl = this;
            var uuid = ctrl.uuid = $stateParams.id;
            $scope.entity = {};
            var appName = 'sewing_device';


            ctrl.subNavOptions = {
                collection: 'device',
                query: {'sewing.show': true}
            };
            $scope.showData = {
                'DeviceType': '',
                "DeviceSpec": '',
                "ProductFactory": '',
                "ProductDate": '',
                "DeviceVoltage": '',
                "ProcessMaterial": '',
                "Pitch": '',
                "Contacts": '',
                "TodayGoal": ''
            };

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$watch('entity.sewing.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'sewing.image_id': newValue
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
                        ctrl.updateField(dynamicData);
                        ctrl.initShowData(dynamicData);
                        delete device.dynamicData;
                        $scope.entity = device;
                    });

                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
                        onmessage: function (data) {
                            let newData = _.get(data, 'data', {});
                            ctrl.updateField(newData);
                            ctrl.initShowData(newData);
                        }
                    });
                },
                initShowData: function (data) {
                    $scope.showData.DeviceType = _.get(data, 'DeviceType', $scope.showData.DeviceType);
                    $scope.showData.DeviceSpec = _.get(data, 'DeviceSpec', $scope.showData.DeviceSpec);
                    $scope.showData.ProductFactory = _.get(data, 'ProductFactory', $scope.showData.ProductFactory);
                    $scope.showData.ProductDate = _.get(data, 'ProductDate', $scope.showData.ProductDate);
                    $scope.showData.DeviceVoltage = _.get(data, 'DeviceVoltage', $scope.showData.DeviceVoltage);
                    $scope.showData.ProcessMaterial = _.get(data, 'DetectWidth', $scope.showData.ProcessMaterial);
                    $scope.showData.Contacts = _.get(data, 'Contacts', $scope.showData.Contacts);
                    $scope.showData.Pitch = _.get(data, 'Pitch', $scope.showData.Pitch);
                    $scope.showData.TodayGoal = _.get(data, 'TodayGoal', $scope.showData.TodayGoal);
                    util.apply($scope);
                },
                saveInfo: function () {
                    DBUtils.update('device', {
                        'uuid': uuid
                    }, {
                        $set: {
                            'dynamicData.DeviceType': $scope.showData.DeviceType,
                            'dynamicData.DeviceSpec': $scope.showData.DeviceSpec,
                            'dynamicData.ProductFactory': $scope.showData.ProductFactory,
                            'dynamicData.ProductDate': $scope.showData.ProductDate,
                            'dynamicData.DeviceVoltage': $scope.showData.DeviceVoltage,
                            'dynamicData.ProcessMaterial': $scope.showData.ProcessMaterial
                        }
                    }).success(function (result) {
                        dialog.noty('操作成功');
                    })
                },
                saveRunInfo: function () {
                    DBUtils.update('device', {
                        'uuid': uuid
                    }, {
                        $set: {
                            'dynamicData.Pitch': $scope.showData.Pitch,
                            'dynamicData.Contacts': $scope.showData.Contacts
                        }
                    }).success(function (result) {
                        dialog.noty('操作成功');
                    })
                },
                updateField: _.throttle(function (lastData) {
                    /*改为jq操作,以增强响应*/
                    var updateFields = $element.find('.static-field-value');
                    _.each(updateFields, function (fieldElement) {
                        var target = $(fieldElement);

                        var fieldKey = target.data('key');
                        AppConfigService.getFieldData(appName, fieldKey, lastData).done(function (newValue) {
                            if (newValue !== target.text()) {
                                target.text(newValue);
                            }
                        });
                    });

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
                                //此app下状态表示是否警告
                                // target.addClass('active');
                                target.addClass('waring');
                            } else {
                                target.removeClass('active');
                            }
                        }
                    })
                }, 200),
                goList: function () {
                    janus.goToMenuByName('机台')
                }
            });

            ctrl.initialize();
        }]);
});