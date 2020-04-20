define(["echarts"], function (echarts) {
    var app = angular.module('app');

    app.controller('RotatingDeviceDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$timeout', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $timeout, janus) {
            var ctrl = this;
            var uuid = ctrl.uuid = $stateParams.id;
            $scope.entity = {};
            var appName = 'rotating_device';

            var dd1_chart = null, dd2_chart = null, dd3_chart = null, xm1_chart = null, xm2_chart = null,
                xm3_chart = null, timestamps = [];
            var dd1Data = [], dd2Data = [], dd3Data = [], xm1Data = [], xm2Data = [], xm3Data = [];

            ctrl.subNavOptions = {
                collection: 'device',
                query: {'rotating.show': true}
            };
            $scope.showData = {
                'DeviceType': '',
                "DeviceSpec": '',
                "DeviceSize": '',
                "ProductFactory": '',
                "ProductDate": '',
                "ProductCapacity": '',
                "Outsole1Max": '',
                "Vamp1Max": '',
                "Outsole2Max": '',
                "Vamp2Max": '',
                "Outsole3Max": '',
                "Vamp3Max": '',
                "Outsole1Min": '',
                "Vamp1Min": '',
                "Outsole2Min": '',
                "Vamp2Min": '',
                "Outsole3Min": '',
                "Vamp3Min": ''
            };

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$watch('entity.rotating.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'rotating.image_id': newValue
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
                    if (!dd1_chart) {
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
                                data: ['1#大底温度']
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
                                    name: '1#大底温度',
                                    data: []
                                }
                            ]
                        };

                        var dd1_chartEle = $('.dd1_chart');
                        dd1_chart = echarts.init(dd1_chartEle[0]);
                        dd1_chart.setOption(options);
                    }

                    if (!xm1_chart) {
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
                                data: ['1#鞋面温度']
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
                                    name: '1#鞋面温度',
                                    data: []
                                }
                            ]
                        };

                        var xm1_chartEle = $('.xm1_chart');
                        xm1_chart = echarts.init(xm1_chartEle[0]);
                        xm1_chart.setOption(options);
                    }
                    if (!dd2_chart) {
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
                                data: ['2#大底温度']
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
                                    name: '2#大底温度',
                                    data: []
                                }
                            ]
                        };

                        var dd2_chartEle = $('.dd2_chart');
                        dd2_chart = echarts.init(dd2_chartEle[0]);
                        dd2_chart.setOption(options);
                    }

                    if (!xm2_chart) {
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
                                data: ['2#鞋面温度']
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
                                    name: '2#鞋面温度',
                                    data: []
                                }
                            ]
                        };

                        var xm2_chartEle = $('.xm2_chart');
                        xm2_chart = echarts.init(xm2_chartEle[0]);
                        xm2_chart.setOption(options);
                    }
                    if (!dd3_chart) {
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
                                data: ['3#大底温度']
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
                                    name: '3#大底温度',
                                    data: []
                                }
                            ]
                        };

                        var dd3_chartEle = $('.dd3_chart');
                        dd3_chart = echarts.init(dd3_chartEle[0]);
                        dd3_chart.setOption(options);
                    }

                    if (!xm3_chart) {
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
                                data: ['3#鞋面温度']
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
                                    name: '3#鞋面温度',
                                    data: []
                                }
                            ]
                        };

                        var xm3_chartEle = $('.xm3_chart');
                        xm3_chart = echarts.init(xm3_chartEle[0]);
                        xm3_chart.setOption(options);
                    }


                },
                updateChart: function (data) {
                    if (timestamps.length > 50) {
                        timestamps.shift();
                    }
                    if (dd1Data.length > 50) {
                        dd1Data.shift();
                    }
                    if (dd2Data.length > 50) {
                        dd2Data.shift();
                    }
                    if (dd3Data.length > 50) {
                        dd3Data.shift();
                    }
                    if (xm1Data.length > 50) {
                        xm1Data.shift();
                    }

                    if (xm2Data.length > 50) {
                        xm2Data.shift();
                    }

                    if (xm3Data.length > 50) {
                        xm3Data.shift();
                    }

                    var time = _.get(data, 'time', '');
                    timestamps.push(time.substring(11));
                    dd1Data.push(_.get(data, 'data.Outsole1NowValue', 0));
                    dd2Data.push(_.get(data, 'data.Outsole2NowValue', 0));
                    dd3Data.push(_.get(data, 'data.Outsole3NowValue', 0));
                    xm1Data.push(_.get(data, 'data.Vamp1NowValue', 0));
                    xm2Data.push(_.get(data, 'data.Vamp2NowValue', 0));
                    xm3Data.push(_.get(data, 'data.Vamp3NowValue', 0));

                    if (dd1_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: dd1Data,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.Outsole1Max, $scope.showData.Outsole1Min)
                                    }
                                }
                            ]
                        };
                        dd1_chart.setOption(opts);
                    }

                    if (dd2_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: dd2Data,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.Outsole2Max, $scope.showData.Outsole2Min)
                                    }
                                }
                            ]
                        };
                        dd2_chart.setOption(opts);
                    }

                    if (dd3_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: dd3Data,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.Outsole3Max, $scope.showData.Outsole3Min)
                                    }
                                }
                            ]
                        };
                        dd3_chart.setOption(opts);
                    }

                    if (xm1_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: xm1Data,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.Vamp1Max, $scope.showData.Vamp1Min)
                                    }
                                }
                            ]
                        };
                        xm1_chart.setOption(opts);
                    }
                    if (xm2_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: xm2Data,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.Vamp2Max, $scope.showData.Vamp2Min)
                                    }
                                }
                            ]
                        };
                        xm2_chart.setOption(opts);
                    }
                    if (xm3_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: xm3Data,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.Vamp3Max, $scope.showData.Vamp3Min)
                                    }
                                }
                            ]
                        };
                        xm3_chart.setOption(opts);
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
                    $scope.showData.ProductCapacity = _.get(data, 'ProductCapacity', $scope.showData.ProductCapacity);
                    $scope.showData.Outsole1Max = _.get(data, 'Outsole1Max', $scope.showData.Outsole1Max);
                    $scope.showData.Outsole1Min = _.get(data, 'Outsole1Min', $scope.showData.Outsole1Min);
                    $scope.showData.Outsole2Max = _.get(data, 'Outsole2Max', $scope.showData.Outsole2Max);
                    $scope.showData.Outsole2Min = _.get(data, 'Outsole2Min', $scope.showData.Outsole2Min);
                    $scope.showData.Outsole3Max = _.get(data, 'Outsole3Max', $scope.showData.Outsole3Max);
                    $scope.showData.Outsole3Min = _.get(data, 'Outsole3Min', $scope.showData.Outsole3Min);
                    $scope.showData.Vamp1Max = _.get(data, 'Vamp1Max', $scope.showData.Vamp1Max);
                    $scope.showData.Vamp1Min = _.get(data, 'Vamp1Min', $scope.showData.Vamp1Min);
                    $scope.showData.Vamp2Max = _.get(data, 'Vamp2Max', $scope.showData.Vamp2Max);
                    $scope.showData.Vamp2Min = _.get(data, 'Vamp2Min', $scope.showData.Vamp2Min);
                    $scope.showData.Vamp3Max = _.get(data, 'Vamp3Max', $scope.showData.Vamp3Max);
                    $scope.showData.Vamp3Min = _.get(data, 'Vamp3Min', $scope.showData.Vamp3Min);

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
                            'dynamicData.ProductCapacity': $scope.showData.ProductCapacity,
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
                            'dynamicData.Outsole1Max': $scope.showData.Outsole1Max,
                            'dynamicData.Outsole2Max': $scope.showData.Outsole1Max,
                            'dynamicData.Outsole3Max': $scope.showData.Outsole1Max,
                            'dynamicData.Outsole1Min': $scope.showData.Outsole1Min,
                            'dynamicData.Outsole2Min': $scope.showData.Outsole2Min,
                            'dynamicData.Outsole3Min': $scope.showData.Outsole3Min,
                            'dynamicData.Vamp1Max': $scope.showData.Vamp1Max,
                            'dynamicData.Vamp2Max': $scope.showData.Vamp2Max,
                            'dynamicData.Vamp3Max': $scope.showData.Vamp3Max,
                            'dynamicData.Vamp1Min': $scope.showData.Vamp1Min,
                            'dynamicData.Vamp2Min': $scope.showData.Vamp2Min,
                            'dynamicData.Vamp3Min': $scope.showData.Vamp3Min,
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