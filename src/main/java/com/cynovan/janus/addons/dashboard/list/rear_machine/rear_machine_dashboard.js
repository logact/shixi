define(['echarts', 'web/base/app_service'], function (echarts) {
    var app = angular.module('dashboard', ['cnv.appservice']);

    app.controller('RearMachineDashboardController', ['$scope', 'DBUtils', '$filter', 'AppComponent', 'AppDataService', 'dialog', 'websocket', 'util', 'http',
        function ($scope, DBUtils, $filter, AppComponent, AppDataService, dialog, websocket, util, http) {
            var ctrl = this;
            let form_url = cynovan.c_path + '/authenticate';

            var AppConfig = {};
            var temperatureChartObj, leftStationChartObj, rightStationChartObj;
            var t_fieldArr = [{
                name: '热风1温度',
                id: 'LhaTempCur'
            }, {
                name: '热风2温度',
                id: 'RhaTempCur'
            }, {
                name: '铝热1温度',
                id: 'LahTempCur'
            }, {
                name: '铝热2温度',
                id: 'RahTempCur'
            }, {
                name: '冷模温度',
                id: 'LacTempCur'
            }];
            var t_seriesArr = [];
            var t_dataMap = {};

            var leftFinishArr = [];
            var rightFinishArr = [];
            var leftChartsData = [];
            var leftTimeData = [];
            var rightChartsData = [];
            var rightTimeData = [];
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.setWidth();
                    ctrl.bindEvent();
                    ctrl.initData();
                },
                bindEvent: function () {
                    $(window).resize(_.debounce(function () {
                        ctrl.setWidth();
                        if (temperatureChartObj) {
                            temperatureChartObj.resize();
                        }
                        if (leftStationChartObj) {
                            leftStationChartObj.resize();
                        }
                        if (rightStationChartObj) {
                            rightStationChartObj.resize();
                        }
                    }, 300));
                },
                setWidth: function () {
                    var width = $(window).width();
                    if (width < 1024) {
                        $(".dashboard").css("width", "768px");
                    } else {
                        $(".dashboard").css("width", "auto");
                    }
                },
                initData: function () {
                    http.post(form_url, {
                        password: 123456
                    }).success(function (result) {
                        if (result.success) {
                            AppDataService.get('dashboard', 'rear_machine').success(function (result) {
                                if (_.isEmpty(result)) {
                                    ctrl.initTemperatureCharts([]);
                                    ctrl.initStationCharts({});
                                } else {
                                    AppConfig = result;
                                    ctrl.loadTemperatureData(result.uuid).success(function (item) {
                                        var temperatureList = _.get(item, 'datas.result', []);
                                        ctrl.initTemperatureCharts(temperatureList);
                                    });
                                    ctrl.loadStationData(result.uuid).success(function (aggregateResult) {
                                        var stationList = _.get(aggregateResult, 'datas.result', []);
                                        var chartData = ctrl.countStationChartsShowData(stationList);
                                        ctrl.initStationCharts(chartData);
                                    })
                                }
                                ctrl.initDeviceSelect();
                                ctrl.subscribeData();
                            });
                        }
                    });
                },
                initDeviceSelect: function () {
                    var uuid = _.get(AppConfig, 'uuid', '');
                    AppComponent.deviceselect($('#dashboard_deviceSelectBox'), {}, uuid).progress(function (bind) {
                        _.set(AppConfig, 'uuid', bind.uuid);
                        _.set(AppConfig, 'deviceName', bind.deviceName);
                        AppDataService.set('dashboard', 'rear_machine', AppConfig);
                        dialog.notyWithRefresh('数据配置已完成,2秒后自动刷新页面运行', $scope);
                    });
                },
                subscribeData: function () {
                    var uuid = _.get(AppConfig, 'uuid', '');
                    if (!uuid) {
                        dialog.noty('请选择设备运行');
                        return false;
                    }
                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
                        onmessage: function (data) {
                            var time = _.get(data, 'time', '');
                            var dataitem = _.get(data, 'data', {});
                            ctrl.updateTemperatureCharts(dataitem, time);
                            ctrl.updateStationCharts(dataitem)
                        }
                    });
                },

                // 温度监控
                loadTemperatureData: function (uuid) {
                    var dataAmount = 6000;
                    var startDate = moment();
                    startDate.set('hour', 0);
                    startDate.set('minute', 0);
                    startDate.set('second', 0);

                    var endDate = moment(startDate);
                    endDate.set('hour', 23);
                    endDate.set('minute', 59);
                    endDate.set('second', 59);

                    var fields = {
                        "_id": 1,
                        "time": 1,
                    };
                    _.each(t_fieldArr, function (item) {
                        var completeField = 'data.' + item.id;
                        fields[completeField] = 1;
                    });
                    return DBUtils.list('deviceData', {
                        'uuid': uuid,
                        time: {
                            $gte: {
                                $date: startDate.valueOf()
                            },
                            $lte: {
                                $date: endDate.valueOf()
                            }
                        },
                    }, fields, {
                        time: 1
                    }, dataAmount);
                },
                addValueToTemperatureDataMap: function (dataMap, key, value) {
                    var values = _.get(dataMap, key, []);
                    values.push(value);
                    _.set(dataMap, key, values);
                },
                formatTime: function (item) {
                    var dateformat = 'yyyy-MM-dd HH:mm:ss.sss';
                    var time = $filter('date')(item.time, dateformat);
                    time = time.substring(11);
                    return time;
                },
                initTemperatureCharts: function (list) {
                    _.each(list, function (item) {
                        ctrl.addValueToTemperatureDataMap(t_dataMap, 'time', ctrl.formatTime(item));
                        _.each(t_fieldArr, function (field) {
                            var fieldValue = _.get(item, `data.${field.id}`, 0);
                            ctrl.addValueToTemperatureDataMap(t_dataMap, field.id, fieldValue);
                        });
                    });
                    _.each(t_fieldArr, function (field) {
                        t_seriesArr.push({
                            name: field.name,
                            type: 'line',
                            data: t_dataMap[field.id],
                        });
                    });
                    var options = {
                        tooltip: {
                            trigger: 'axis'
                        },
                        legend: {
                            data: t_fieldArr
                        },
                        toolbox: {
                            feature: {
                                restore: {},
                                saveAsImage: {
                                    name: 'chart'
                                }
                            }
                        },
                        xAxis: [
                            {
                                type: 'category',
                                data: t_dataMap['time']
                            }
                        ],
                        yAxis: [
                            {
                                type: 'value',
                                name: '温度℃'
                            }
                        ],
                        series: t_seriesArr
                    };
                    temperatureChartObj = echarts.init(document.getElementById('temperatureCharts'));
                    temperatureChartObj.setOption(options);
                },
                updateTemperatureCharts: function (data, time) {
                    if (time.length > 10) {
                        time = time.substring(11);
                    }
                    ctrl.addValueToTemperatureDataMap(t_dataMap, 'time', time);// 时间轴更新
                    _.forEach(data, function (value, key) { // 数据更新
                        ctrl.addValueToTemperatureDataMap(t_dataMap, key, value);
                    });
                    if (temperatureChartObj) {
                        var options = {
                            xAxis: [
                                {
                                    data: t_dataMap['time']
                                }
                            ],
                            series: [
                                {data: t_dataMap['LhaTempCur']},
                                {data: t_dataMap['RhaTempCur']},
                                {data: t_dataMap['LahTempCur']},
                                {data: t_dataMap['RahTempCur']},
                                {data: t_dataMap['LacTempCur']}
                            ]
                        };
                        temperatureChartObj.setOption(options);
                    }
                },

                // 产量监控
                loadStationData: function (uuid) {
                    var endDate = moment();// 当天时间
                    var startDate = moment(endDate).add(-7, 'days');

                    return DBUtils.aggregator('deviceData', {
                        $match: {
                            uuid: uuid,
                            time: {
                                $gte: {
                                    $date: startDate.valueOf()
                                },
                                $lte: {
                                    $date: endDate.valueOf()
                                }
                            }
                        }
                    }, {
                        $sort: {
                            'time': 1
                        }
                    }, {
                        $group: {
                            _id: {
                                year: {
                                    $year: {
                                        date: '$time',
                                        timezone: 'Asia/Shanghai'
                                    }
                                },
                                month: {
                                    $month: {
                                        date: '$time',
                                        timezone: 'Asia/Shanghai'
                                    }
                                },
                                date: {
                                    $dayOfMonth: {
                                        date: '$time',
                                        timezone: 'Asia/Shanghai'
                                    }
                                },
                            },
                            data: {$last: "$data"},
                            time: {$last: "$time"}
                        }
                    }, {
                        $sort: {
                            'time': 1
                        }
                    });
                },
                countStationChartsShowData: function (list) {
                    var dates = [];
                    var endDate = moment();// 当天时间
                    var startDate = moment(endDate).add(-8, 'days');
                    var currDate = moment(startDate).startOf('day');
                    var lastDate = moment(endDate).startOf('day');
                    while (currDate.add('days', 1).diff(lastDate) <= 0) {
                        var dateformat = 'yyyy-MM-dd HH:mm:ss.sss';
                        var time = $filter('date')(currDate.clone().toDate(), dateformat);
                        dates.push(time);
                    }
                    _.each(dates, function (date) {
                        if (JSON.stringify(list).indexOf(date.substring(0, 10)) === -1) {
                            list.push({time: date});
                        }
                    });
                    list = _.orderBy(list, ['time', 'desc']);// 补全连续时间

                    _.each(list, function (item, idx) {
                        var left = _.get(item, 'data.LeftFinishProduction', 0);
                        var right = _.get(item, 'data.RightFinishProduction', 0);
                        leftFinishArr.push(left);
                        rightFinishArr.push(right);
                    });
                    _.map(leftFinishArr, function (item, idx) {
                        if (idx + 1 < _.size(leftFinishArr)) {
                            var time = list[idx + 1].time;
                            time = time.substr(5, 5);
                            var diff = leftFinishArr[idx + 1] - item;
                            if (diff < 0) {
                                diff = 0;
                            }
                            leftChartsData.push(diff);
                            leftTimeData.push(time)
                        }
                    });
                    _.map(rightFinishArr, function (item, idx) {
                        if (idx + 1 < _.size(rightFinishArr)) {
                            var time = list[idx + 1].time;
                            time = time.substr(5, 5);
                            var diff = rightFinishArr[idx + 1] - item;
                            if (diff < 0) {
                                diff = 0;
                            }
                            rightChartsData.push(diff);
                            rightTimeData.push(time);
                        }
                    });

                    var l_lastidx = _.size(leftChartsData) - 1;
                    var r_lastidx = _.size(rightChartsData) - 1;
                    $scope.currentLeftFinish = leftChartsData[l_lastidx];
                    $scope.currentRightFinish = rightChartsData[r_lastidx];

                    return {
                        "leftChartsData": leftChartsData,
                        "leftTimeData": leftTimeData,
                        "rightChartsData": rightChartsData,
                        "rightTimeData": rightTimeData
                    }
                },
                initStationCharts: function (chartData) {
                    var leftOptions = {
                        color: ['#188df0'],
                        xAxis: {
                            type: 'category',
                            data: chartData.leftTimeData,
                            axisTick: {
                                show: false
                            },
                        },
                        yAxis: {
                            type: 'value',
                            name: "历史7天产量"
                        },
                        series: [
                            {
                                type: 'bar',
                                barGap: '-100%',
                                barCategoryGap: '40%',
                                label: {
                                    normal: {
                                        show: true,
                                        position: 'inside'
                                    }
                                },
                                data: chartData.leftChartsData
                            }
                        ]
                    };
                    leftStationChartObj = echarts.init(document.getElementById('leftStationCharts'));
                    leftStationChartObj.setOption(leftOptions);

                    var rightOptions = {
                        color: ['#188df0'],
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: {
                                type: 'shadow'
                            }
                        },
                        xAxis: {
                            type: 'category',
                            data: chartData.rightTimeData,
                            axisTick: {
                                show: false
                            },
                        },
                        yAxis: {
                            type: 'value',
                            name: "历史7天产量"
                        },
                        series: [
                            {
                                type: 'bar',
                                barGap: '-100%',
                                barCategoryGap: '40%',
                                label: {
                                    normal: {
                                        show: true,
                                        position: 'inside'
                                    }
                                },
                                data: chartData.rightChartsData
                            }
                        ]
                    };
                    rightStationChartObj = echarts.init(document.getElementById('rightStationCharts'));
                    rightStationChartObj.setOption(rightOptions);
                },
                updateStationCharts: function (data) {
                    var left = _.get(data, 'LeftFinishProduction', 0);
                    var right = _.get(data, 'RightFinishProduction', 0);
                    var l_lastidx = _.size(leftChartsData) - 1;
                    var r_lastidx = _.size(rightChartsData) - 1;
                    $scope.currentLeftFinish = leftChartsData[l_lastidx] = left - leftFinishArr[_.size(leftFinishArr) - 2];// 当前数据 - 前一天数据
                    $scope.currentRightFinish = rightChartsData[r_lastidx] = right - rightFinishArr[_.size(rightFinishArr) - 2];
                    util.apply($scope);

                    if (leftStationChartObj) {
                        var leftOptions = {
                            series: [
                                {data: leftChartsData}
                            ]
                        };
                        leftStationChartObj.setOption(leftOptions);
                    }
                    if (rightStationChartObj) {
                        var rightOptions = {
                            series: [
                                {data: rightChartsData}
                            ]
                        };
                        rightStationChartObj.setOption(rightOptions);
                    }
                }
            });
            ctrl.initialize();
    }]);
})