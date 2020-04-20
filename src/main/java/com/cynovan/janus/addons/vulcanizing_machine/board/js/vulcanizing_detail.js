define(["echarts"], function (echarts) {
    var app = angular.module('app');

    app.controller('VulcanizingDeviceDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$timeout', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $timeout, janus) {
            var ctrl = this;
            var uuid = ctrl.uuid = $stateParams.id;
            $scope.entity = {};
            var appName = 'vulcanizing_device';

            var zq_chart = null, gf_chart = null, rf_chart = null, ss_chart = null, timestamps = [];
            var zqData = [], gfData = [], rfData = [], ssData = [];

            ctrl.subNavOptions = {
                collection: 'device',
                query: {'vulcanizing.show': true}
            };
            $scope.showData = {
                'DeviceType': '',
                "DeviceSpec": '',
                "DeviceSize": '',
                "ProductFactory": '',
                "ProductDate": '',
                "ProductCapacity": '',
                "SteamMax": '',
                "BlowerMax": '',
                "BlowerMin": '',
                "HotWindMax": '',
                "HotWindMin": '',
                "BoiledWaterMax": '',
                "BoiledWaterMin": '',
                "TodayGoal": ''
            };

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$watch('entity.vulcanizing.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'vulcanizing.image_id': newValue
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
                    if (!zq_chart) {
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
                                data: ['蒸汽压力']
                            },
                            yAxis: [
                                {
                                    type: 'value',
                                    name: '压力(V)'
                                }
                            ],
                            series: [
                                {
                                    type: 'line',
                                    name: '蒸汽压力',
                                    data: []
                                }
                            ]
                        };

                        var zq_chartEle = $('.zq_chart');
                        zq_chart = echarts.init(zq_chartEle[0]);
                        zq_chart.setOption(options);
                    }

                    if (!gf_chart) {
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
                                data: ['鼓风机工作电流']
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
                                    name: '鼓风机工作电流',
                                    data: []
                                }
                            ]
                        };

                        var gf_chartEle = $('.gf_chart');
                        gf_chart = echarts.init(gf_chartEle[0]);
                        gf_chart.setOption(options);
                    }

                    if (!rf_chart) {
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
                                data: ['热风电热管工作电流']
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
                                    name: '热风电热管工作电流',
                                    data: []
                                }
                            ]
                        };

                        var rf_chartEle = $('.rf_chart');
                        rf_chart = echarts.init(rf_chartEle[0]);
                        rf_chart.setOption(options);
                    }

                    if (!ss_chart) {
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
                                data: ['烧水电热管工作电流']
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
                                    name: '烧水电热管工作电流',
                                    data: []
                                }
                            ]
                        };

                        var ss_chartEle = $('.ss_chart');
                        ss_chart = echarts.init(ss_chartEle[0]);
                        ss_chart.setOption(options);
                    }
                },
                updateChart: function (data) {
                    if (timestamps.length > 50) {
                        timestamps.shift();
                    }
                    if (zqData.length > 50) {
                        zqData.shift();
                    }
                    if (gfData.length > 50) {
                        gfData.shift();
                    }
                    if (rfData.length > 50) {
                        rfData.shift();
                    }
                    if (ssData.length > 50) {
                        ssData.shift();
                    }

                    var time = _.get(data, 'time', '');
                    timestamps.push(time.substring(11));
                    zqData.push(_.get(data, 'data.SteamNowValue', 0));
                    gfData.push(_.get(data, 'data.BlowerNowValue', 0));
                    rfData.push(_.get(data, 'data.HotWindNowValue', 0));
                    ssData.push(_.get(data, 'data.BoiledWaterValue', 0));

                    if (zq_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: zqData,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.SteamMax)
                                    }
                                }
                            ]
                        };
                        zq_chart.setOption(opts);
                    }

                    if (gf_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: gfData,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.BlowerMax, $scope.showData.BlowerMin)
                                    }
                                }
                            ]
                        };
                        gf_chart.setOption(opts);
                    }

                    if (rf_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: rfData,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.HotWindMax, $scope.showData.HotWindMin)
                                    }
                                }
                            ]
                        };
                        rf_chart.setOption(opts);
                    }
                    if (ss_chart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: ssData,
                                    markLine: {
                                        lineStyle: {
                                            normal: {
                                                type: 'solid'
                                            }
                                        },
                                        symbol: "none",
                                        animation: false,
                                        data: ctrl.initMarkLine($scope.showData.BoiledWaterMax, $scope.showData.BoiledWaterMin)
                                    }
                                }
                            ]
                        };
                        ss_chart.setOption(opts);
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
                    $scope.showData.SteamMax = _.get(data, 'SteamMax', $scope.showData.SteamMax);
                    $scope.showData.BlowerMax = _.get(data, 'BlowerMax', $scope.showData.BlowerMax);
                    $scope.showData.BlowerMin = _.get(data, 'BlowerMin', $scope.showData.BlowerMin);
                    $scope.showData.HotWindMax = _.get(data, 'HotWindMax', $scope.showData.HotWindMax);
                    $scope.showData.HotWindMin = _.get(data, 'HotWindMin', $scope.showData.HotWindMin);
                    $scope.showData.BoiledWaterMax = _.get(data, 'BoiledWaterMax', $scope.showData.BoiledWaterMax);
                    $scope.showData.BoiledWaterMin = _.get(data, 'BoiledWaterMin', $scope.showData.BoiledWaterMin);
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
                            'dynamicData.SteamMax': $scope.showData.SteamMax,
                            'dynamicData.BlowerMax': $scope.showData.BlowerMax,
                            'dynamicData.BlowerMin': $scope.showData.BlowerMin,
                            'dynamicData.HotWindMax': $scope.showData.HotWindMax,
                            'dynamicData.HotWindMin': $scope.showData.HotWindMin,
                            'dynamicData.BoiledWaterMax': $scope.showData.BoiledWaterMax,
                            'dynamicData.BoiledWaterMin': $scope.showData.BoiledWaterMin,
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