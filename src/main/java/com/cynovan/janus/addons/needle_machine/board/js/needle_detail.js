define(["echarts"], function (echarts) {
    var app = angular.module('app');

    app.controller('NeedleDeviceDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$timeout', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $timeout, janus) {
            var ctrl = this;
            var uuid = ctrl.uuid = $stateParams.id;
            $scope.entity = {};
            var appName = 'needle_device';

            var md_chart = null, lmd_chart = null, timestamps = [];
            var mdData = [], lmdData = [];

            ctrl.subNavOptions = {
                collection: 'device',
                query: {'needle.show': true}
            };
            $scope.showData = {
                'DeviceType': '',
                "DeviceSpec": '',
                "DeviceSize": '',
                "ProductFactory": '',
                "ProductDate": '',
                "DeviceVoltage": '',
                "DevicePower": '',
                "DetectHeight": '',
                "DetectWidth": '',
                "MotorMax": '',
                "MotorMin": '',
                "SensitivityMax": '',
                "SensitivityMin": '',
                "TodayGoal": ''
            };

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$watch('entity.needle.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'needle.image_id': newValue
                                    }
                                }).success(function () {
                                    dialog.noty('操作成功');
                                });
                            }
                        }
                    });
                },
                initMarkLine: function (max, min) {
                    let dataArr = [];
                    if (max) {
                        dataArr.push({'yAxis': max});
                    }
                    if (min) {
                        dataArr.push({'yAxis': min});
                    }
                    return dataArr;
                },
                initCharts: function () {
                    if (!md_chart) {
                        var options = {
                            xAxis: [
                                {
                                    type: 'category',
                                    data: []
                                }
                            ],
                            tooltip: {
                                trigger: 'axis'
                            },
                            legend: {
                                data: ['输送马达工作电流']
                            },
                            yAxis: [
                                {
                                    type: 'value',
                                    name: '电流(A)'
                                }
                            ],
                            series: [
                                {
                                    type: 'line',
                                    name: '输送马达工作电流',
                                    data: []
                                }
                            ]
                        };

                        var md_chartEle = $('.md_chart');
                        md_chart = echarts.init(md_chartEle[0]);
                        md_chart.setOption(options);
                    }

                    if (!lmd_chart) {
                        var options = {
                            xAxis: [
                                {
                                    type: 'category',
                                    data: []
                                }
                            ],
                            tooltip: {
                                trigger: 'axis'
                            },
                            legend: {
                                data: ['灵敏度调节']
                            },
                            yAxis: [
                                {
                                    type: 'value',
                                    name: '电流(A)'
                                }
                            ],
                            series: [
                                {
                                    type: 'line',
                                    name: '灵敏度调节',
                                    data: []
                                }
                            ]
                        };

                        var lmd_chartEle = $('.lmd_chart');
                        lmd_chart = echarts.init(lmd_chartEle[0]);
                        lmd_chart.setOption(options);
                    }
                },
                updateChart: function (data) {
                    if (timestamps.length > 50) {
                        timestamps.shift();
                    }
                    if (mdData.length > 50) {
                        mdData.shift();
                    }
                    if (lmdData.length > 50) {
                        lmdData.shift();
                    }

                    var time = _.get(data, 'time', '');
                    timestamps.push(time.substring(11));
                    mdData.push(_.get(data, 'data.MotorNowValue', 0));
                    lmdData.push(_.get(data, 'data.SensitivityNowValue', 0));

                    if (md_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: mdData,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.MotorMax, $scope.showData.MotorMin)
                                    }
                                }
                            ]
                        };
                        md_chart.setOption(opts);
                    }

                    if (lmd_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: lmdData,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.SensitivityMax, $scope.showData.SensitivityMin)
                                    }
                                }
                            ]
                        };
                        lmd_chart.setOption(opts);
                    }
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
                            ctrl.updateChart(data);
                        }
                    });
                },
                initShowData: function (data) {
                    $scope.showData.DeviceType = _.get(data, 'DeviceType', $scope.showData.DeviceType);
                    $scope.showData.DeviceSpec = _.get(data, 'DeviceSpec', $scope.showData.DeviceSpec);
                    $scope.showData.DeviceSize = _.get(data, 'DeviceSize', $scope.showData.DeviceSize);
                    $scope.showData.ProductFactory = _.get(data, 'ProductFactory', $scope.showData.ProductFactory);
                    $scope.showData.ProductDate = _.get(data, 'ProductDate', $scope.showData.ProductDate);
                    $scope.showData.DeviceVoltage = _.get(data, 'DeviceVoltage', $scope.showData.DeviceVoltage);
                    $scope.showData.DevicePower = _.get(data, 'DevicePower', $scope.showData.DevicePower);
                    $scope.showData.DetectHeight = _.get(data, 'DetectHeight', $scope.showData.DetectHeight);
                    $scope.showData.DetectWidth = _.get(data, 'DetectWidth', $scope.showData.DetectWidth);
                    $scope.showData.MotorMax = _.get(data, 'MotorMax', $scope.showData.MotorMax);
                    $scope.showData.MotorMin = _.get(data, 'MotorMin', $scope.showData.MotorMin);
                    $scope.showData.SensitivityMax = _.get(data, 'SensitivityMax', $scope.showData.SensitivityMax);
                    $scope.showData.SensitivityMin = _.get(data, 'SensitivityMin', $scope.showData.SensitivityMin);
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
                            'dynamicData.DeviceSize': $scope.showData.DeviceSize,
                            'dynamicData.ProductFactory': $scope.showData.ProductFactory,
                            'dynamicData.ProductDate': $scope.showData.ProductDate,
                            'dynamicData.DeviceVoltage': $scope.showData.DeviceVoltage,
                            'dynamicData.DevicePower': $scope.showData.DevicePower,
                            'dynamicData.DetectHeight': $scope.showData.DetectHeight,
                            'dynamicData.DetectWidth': $scope.showData.DetectWidth,
                        }
                    }).success(function (result) {
                        dialog.noty('操作成功');
                    })
                },
                saveTodayGoal: function () {
                    DBUtils.update('device', {
                        'uuid': uuid
                    }, {
                        $set: {
                            'dynamicData.TodayGoal': $scope.showData.TodayGoal,
                        }
                    }).success(function (result) {
                        dialog.noty('操作成功');
                    })
                },
                saveParameter: function () {
                    DBUtils.update('device', {
                        'uuid': uuid
                    }, {
                        $set: {
                            'dynamicData.MotorMax': $scope.showData.MotorMax,
                            'dynamicData.MotorMin': $scope.showData.MotorMin,
                            'dynamicData.SensitivityMax': $scope.showData.SensitivityMax,
                            'dynamicData.SensitivityMin': $scope.showData.SensitivityMin
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
                    janus.goToMenuByName('机台');
                }
            });

            ctrl.initialize();
        }]);
});