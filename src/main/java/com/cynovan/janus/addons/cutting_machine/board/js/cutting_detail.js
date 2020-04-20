define(["echarts"], function (echarts) {
    var app = angular.module('app');

    app.controller('CuttingDeviceDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$timeout', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $timeout, janus) {
            var ctrl = this;
            var uuid = ctrl.uuid = $stateParams.id;
            $scope.entity = {};
            var appName = 'cutting_device';

            var zkb_chart = null, dt1_chart = null, dt2_chart = null, fs_chart = null, timestamps = [];
            var zkbData = [], dt1Data = [], dt2Data = [], fsData = [];

            ctrl.subNavOptions = {
                collection: 'device',
                query: {'cutting.show': true}
            };
            $scope.showData = {
                'DeviceType': '',
                "DeviceSpec": '',
                "CuttingSpeed": '',
                "ProductFactory": '',
                "ProductDate": '',
                "DeviceVoltage": '',
                "CuttingMaterial": '',
                "CuttingCount": '',
                "PumpMax": '',
                "PumpMin": '',
                "CuttingHeadMax1": '',
                "CuttingHeadMin1": '',
                "CuttingHeadMax2": '',
                "CuttingHeadMin2": '',
                "FanMax": '',
                "FanMin": '',
                "TodayGoal": ''
            };

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$watch('entity.cutting.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'cutting.image_id': newValue
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
                    if (!zkb_chart) {
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
                                data: ['真空泵工作电流']
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
                                    name: '真空泵工作电流',
                                    data: []
                                }
                            ]
                        };

                        var zkb_chartEle = $('.zkb_chart');
                        zkb_chart = echarts.init(zkb_chartEle[0]);
                        zkb_chart.setOption(options);
                    }
                    if (!dt1_chart) {
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
                                data: ['切割刀头1工作电流']
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
                                    name: '切割刀头1工作电流',
                                    data: []
                                }
                            ]
                        };

                        var dt1_chartEle = $('.dt1_chart');
                        dt1_chart = echarts.init(dt1_chartEle[0]);
                        dt1_chart.setOption(options);
                    }
                    if (!dt2_chart) {
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
                                data: ['切割刀头2工作电流']
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
                                    name: '切割刀头2工作电流',
                                    data: []
                                }
                            ]
                        };

                        var dt2_chartEle = $('.dt2_chart');
                        dt2_chart = echarts.init(dt2_chartEle[0]);
                        dt2_chart.setOption(options);
                    }

                    if (!fs_chart) {
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
                                data: ['散热风扇工作温度']
                            },
                            yAxis: [
                                {
                                    type: 'value',
                                    name: '温度(℃)'
                                }
                            ],
                            series: [
                                {
                                    type: 'line',
                                    name: '散热风扇工作温度',
                                    data: []
                                }
                            ]
                        };

                        var fs_chartEle = $('.fs_chart');
                        fs_chart = echarts.init(fs_chartEle[0]);
                        fs_chart.setOption(options);
                    }
                },
                updateChart: function (data) {
                    if (timestamps.length > 50) {
                        timestamps.shift();
                    }
                    if (zkbData.length > 50) {
                        zkbData.shift();
                    }
                    if (dt1Data.length > 50) {
                        dt1Data.shift();
                    }
                    if (dt2Data.length > 50) {
                        dt2Data.shift();
                    }
                    if (fsData.length > 50) {
                        fsData.shift();
                    }

                    var time = _.get(data, 'time', '');
                    timestamps.push(time.substring(11));
                    zkbData.push(_.get(data, 'data.PumpNowValue', 0));
                    dt1Data.push(_.get(data, 'data.CuttingHeadNowValue1', 0));
                    dt2Data.push(_.get(data, 'data.CuttingHeadNowValue2', 0));
                    fsData.push(_.get(data, 'data.FanNowTemp', 0));

                    if (zkb_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: zkbData,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.PumpMax, $scope.showData.PumpMin)
                                    }
                                }
                            ]
                        };
                        zkb_chart.setOption(opts);
                    }

                    if (dt1_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: dt1Data,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.CuttingHeadMax1, $scope.showData.CuttingHeadMin1)
                                    }
                                }
                            ]
                        };
                        dt1_chart.setOption(opts);
                    }
                    if (dt2_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: dt2Data,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.CuttingHeadMax2, $scope.showData.CuttingHeadMin2)
                                    }
                                }
                            ]
                        };
                        dt2_chart.setOption(opts);
                    }
                    if (fs_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: fsData,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.FanMax, $scope.showData.FanMin)
                                    }
                                }
                            ]
                        };
                        fs_chart.setOption(opts);
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
                    $scope.showData.CuttingSpeed = _.get(data, 'DeviceSize', $scope.showData.CuttingSpeed);
                    $scope.showData.ProductFactory = _.get(data, 'ProductFactory', $scope.showData.ProductFactory);
                    $scope.showData.ProductDate = _.get(data, 'ProductDate', $scope.showData.ProductDate);
                    $scope.showData.DeviceVoltage = _.get(data, 'DeviceVoltage', $scope.showData.DeviceVoltage);
                    $scope.showData.CuttingCount = _.get(data, 'DetectHeight', $scope.showData.CuttingCount);
                    $scope.showData.CuttingMaterial = _.get(data, 'DetectWidth', $scope.showData.CuttingMaterial);
                    $scope.showData.PumpMax = _.get(data, 'PumpMax', $scope.showData.PumpMax);
                    $scope.showData.PumpMin = _.get(data, 'PumpMin', $scope.showData.PumpMin);
                    $scope.showData.CuttingHeadMax1 = _.get(data, 'CuttingHeadMax1', $scope.showData.CuttingHeadMax1);
                    $scope.showData.CuttingHeadMin1 = _.get(data, 'CuttingHeadMin1', $scope.showData.CuttingHeadMin1);
                    $scope.showData.CuttingHeadMax2 = _.get(data, 'CuttingHeadMax2', $scope.showData.CuttingHeadMax2);
                    $scope.showData.CuttingHeadMin2 = _.get(data, 'CuttingHeadMin2', $scope.showData.CuttingHeadMin2);
                    $scope.showData.FanMax = _.get(data, 'FanMax', $scope.showData.FanMax);
                    $scope.showData.FanMin = _.get(data, 'FanMin', $scope.showData.FanMin);
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
                            'dynamicData.CuttingSpeed': $scope.showData.CuttingSpeed,
                            'dynamicData.ProductFactory': $scope.showData.ProductFactory,
                            'dynamicData.ProductDate': $scope.showData.ProductDate,
                            'dynamicData.DeviceVoltage': $scope.showData.DeviceVoltage,
                            'dynamicData.CuttingMaterial': $scope.showData.CuttingMaterial,
                            'dynamicData.CuttingCount': $scope.showData.CuttingCount
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
                            'dynamicData.PumpMax': $scope.showData.PumpMax,
                            'dynamicData.PumpMin': $scope.showData.PumpMin,
                            'dynamicData.CuttingHeadMax1': $scope.showData.CuttingHeadMax1,
                            'dynamicData.CuttingHeadMin1': $scope.showData.CuttingHeadMin1,
                            'dynamicData.CuttingHeadMax2': $scope.showData.CuttingHeadMax2,
                            'dynamicData.CuttingHeadMin2': $scope.showData.CuttingHeadMin2,
                            'dynamicData.FanMax': $scope.showData.FanMax,
                            'dynamicData.FanMin': $scope.showData.FanMin
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