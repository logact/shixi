define(["echarts"], function (echarts) {
    var app = angular.module('app');

    app.controller('RefrigeratingDeviceDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$timeout', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $timeout, janus) {
            var ctrl = this;
            var uuid = ctrl.uuid = $stateParams.id;
            $scope.entity = {};
            var appName = 'refrigerating_device';

            var ysj_chart = null, fs_chart = null, xt_chart = null, md_chart = null, timestamps = [];
            var ysjData = [], fsData = [], xtData = [], mdData = [];

            ctrl.subNavOptions = {
                collection: 'device',
                query: {'refrigerating.show': true}
            };
            $scope.showData = {
                'DeviceType': '',
                "DeviceSpec": '',
                "DeviceSize": '',
                "ProductFactory": '',
                "ProductDate": '',
                "ProductCapacity": '',
                "CompressorMax": '',
                "CompressorMin": '',
                "FanMax": '',
                "FanMin": '',
                "BoxMax": '',
                "BoxMin": '',
                "MotorMax": '',
                "MotorMin": ''
            };

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$watch('entity.refrigerating.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'refrigerating.image_id': newValue
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
                    if (!ysj_chart) {
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
                                data: ['压缩机工作电流']
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
                                    name: '压缩机工作电流',
                                    data: []
                                }
                            ]
                        };

                        var ysj_chartEle = $('.ysj_chart');
                        ysj_chart = echarts.init(ysj_chartEle[0]);
                        ysj_chart.setOption(options);
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
                                data: ['压缩机散热风扇工作电流']
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
                                    name: '压缩机散热风扇工作电流',
                                    data: []
                                }
                            ]
                        };

                        var fs_chartEle = $('.fs_chart');
                        fs_chart = echarts.init(fs_chartEle[0]);
                        fs_chart.setOption(options);
                    }

                    if (!xt_chart) {
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
                                data: ['箱体内温度']
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
                                    name: '箱体内温度',
                                    data: []
                                }
                            ]
                        };

                        var xt_chartEle = $('.xt_chart');
                        xt_chart = echarts.init(xt_chartEle[0]);
                        xt_chart.setOption(options);
                    }

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
                                data: ['输送带马达工作电流']
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
                                    name: '输送带马达工作电流',
                                    data: []
                                }
                            ]
                        };

                        var md_chartEle = $('.md_chart');
                        md_chart = echarts.init(md_chartEle[0]);
                        md_chart.setOption(options);
                    }
                },
                updateChart: function (data) {
                    if (timestamps.length > 50) {
                        timestamps.shift();
                    }
                    if (ysjData.length > 50) {
                        ysjData.shift();
                    }
                    if (fsData.length > 50) {
                        fsData.shift();
                    }
                    if (xtData.length > 50) {
                        xtData.shift();
                    }
                    if (mdData.length > 50) {
                        mdData.shift();
                    }

                    var time = _.get(data, 'time', '');
                    timestamps.push(time.substring(11));
                    ysjData.push(_.get(data, 'data.CompressorNowValue', 0));
                    fsData.push(_.get(data, 'data.FanNowValue', 0));
                    xtData.push(_.get(data, 'data.BoxNowValue', 0));
                    mdData.push(_.get(data, 'data.MotorNowValue', 0));

                    if (ysj_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: ysjData,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.CompressorMax, $scope.showData.CompressorMin)
                                    }
                                }
                            ]
                        };
                        ysj_chart.setOption(opts);
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

                    if (xt_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: xtData,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.BoxMax, $scope.showData.BoxMin)
                                    }
                                }
                            ]
                        };
                        xt_chart.setOption(opts);
                    }
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
                    $scope.showData.CompressorMax = _.get(data, 'CompressorMax', $scope.showData.CompressorMax);
                    $scope.showData.CompressorMin = _.get(data, 'CompressorMin', $scope.showData.CompressorMin);
                    $scope.showData.FanMax = _.get(data, 'FanMax', $scope.showData.FanMax);
                    $scope.showData.FanMin = _.get(data, 'FanMin', $scope.showData.FanMin);
                    $scope.showData.BoxMax = _.get(data, 'BoxMax', $scope.showData.BoxMax);
                    $scope.showData.BoxMin = _.get(data, 'BoxMin', $scope.showData.BoxMin);
                    $scope.showData.MotorMin = _.get(data, 'MotorMin', $scope.showData.MotorMin);
                    $scope.showData.MotorMax = _.get(data, 'MotorMax', $scope.showData.MotorMax);
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
                saveParameter: function () {
                    DBUtils.update('device', {
                        'uuid': uuid
                    }, {
                        $set: {
                            'dynamicData.CompressorMax': $scope.showData.CompressorMax,
                            'dynamicData.CompressorMin': $scope.showData.CompressorMin,
                            'dynamicData.FanMax': $scope.showData.FanMax,
                            'dynamicData.FanMin': $scope.showData.FanMin,
                            'dynamicData.BoxMax': $scope.showData.BoxMax,
                            'dynamicData.BoxMin': $scope.showData.BoxMin,
                            'dynamicData.MotorMin': $scope.showData.MotorMin,
                            'dynamicData.MotorMax': $scope.showData.MotorMax,
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