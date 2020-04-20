define([], function () {
    var app = angular.module('app');

    app.controller('ModulelineDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$timeout', 'janus', 'DevicePushService',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $timeout, janus, DevicePushService) {
            var ctrl = this;
            var uuid = ctrl.uuid = $stateParams.id;
            $scope.entity = {};
            var appName = 'moduleline_device';

            ctrl.subNavOptions = {
                collection: 'device',
                query: {'moduleline.show': true}
            };
            let output;// 产量
            $scope.model = 'init';

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$on('BeforePush', function (event, pushObject) {
                        _.each(pushObject, function (value, key) {
                            value = parseFloat(value) * 10;
                            value = _.parseInt(value);
                            pushObject[key] = value;
                        });
                    });
                },
                initData: function () {
                    DBUtils.find('device', {
                        uuid: uuid
                    }).success(function (result) {
                        var device = _.get(result, 'datas.result', {});
                        let dynamicData = _.get(device, "dynamicData", {});
                        ctrl.updateField(dynamicData);
                        _.extend($scope.entity, dynamicData);
                        output = _.get(dynamicData, "1-2149", 0);// 产量
                        ctrl.calcProductCompletionRate();
                    });

                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
                        onmessage: function (data) {
                            let newData = _.get(data, 'data', {});
                            ctrl.updateField(newData);
                        }
                    });
                },
                planOutputChange: function () {
                    $scope.$watch('entity.PlanOutput', _.debounce(function () {
                        ctrl.calcProductCompletionRate();
                    }, 1000));
                },
                calcProductCompletionRate: function () {
                    // 产品完成率 = 产量/计划产量
                    var entity = $scope.entity;
                    if (entity.PlanOutput !== undefined) {
                        let rate = (Math.round(output / entity.PlanOutput * 10000) / 100) + '%';
                        entity.ProductCompletionRate = rate;
                        util.apply($scope);
                    }
                },
                eidtInfo: function () {
                    $scope.model = 'edit';
                },
                saveInfo: function () {
                    var entity = $scope.entity;
                    DBUtils.update('device', {
                        'uuid': uuid
                    }, {
                        $set: {
                            'dynamicData.DeviceType': entity.DeviceType,
                            'dynamicData.DeviceSpec': entity.DeviceSpec,
                            'dynamicData.DeviceSize': entity.DeviceSize,
                            'dynamicData.DeviceRatedVoltage': entity.DeviceRatedVoltage,
                            'dynamicData.DeviceRatedAirPressure': entity.DeviceRatedAirPressure,
                            'dynamicData.DeviceRatedPower': entity.DeviceRatedPower,
                            'dynamicData.ProcessedProduct': entity.ProcessedProduct,
                            'dynamicData.ProductFactory': entity.ProductFactory,
                        }
                    }).success(function (result) {
                        dialog.noty('操作成功');
                        $scope.model = 'init';
                    })
                },
                savePlanOutput: function () {
                    var entity = $scope.entity;
                    DBUtils.update('device', {
                        'uuid': uuid
                    }, {
                        $set: {
                            'dynamicData.PlanOutput': entity.PlanOutput,
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
                                if (fieldKey == '1-2149') { // 产量值发生变化时,更新产品完成率.
                                    output = newValue;
                                    ctrl.calcProductCompletionRate();
                                }
                            }
                        });
                    });

                    /* switch update */
                    var updateSwitchs = $element.find('.static-switch-state');
                    _.each(updateSwitchs, function (switchElement) {
                        var target = $(switchElement);
                        var targetValue = target.hasClass('active') ? true : false;

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
                goList: function () {
                    janus.goToMenuByName('机台')
                }
            });

            ctrl.initialize();
        }]);
});