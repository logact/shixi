define(['echarts'], function (echarts) {
    var app = angular.module('app');

    app.controller('WeldRobotDataLineChartController', ['$scope', 'util', 'WeldService', 'AppDataService', 'dialog', 'DBUtils', '$filter', 'http',
        function ($scope, util, WeldService, AppDataService, dialog, DBUtils, $filter, http) {
            var entity = $scope.entity;

            var dateformat = 'yyyy-MM-dd HH:mm:ss.sss';
            var ctrl = this;

            $scope.chartOptions = {
                chartFields: [{
                    id: '118_Par_WeldingCurrent',
                    name: '给定电流曲线',
                    unit: '电流(A)',
                    width: 50,
                    checked: false
                }, {
                    id: '191_Status_WeldingCurrent_NoFilter',
                    name: '反馈电流曲线',
                    unit: '电流(A)',
                    width: 50,
                    checked: false
                }, {
                    id: '119_Par_WeldingVoltage',
                    name: '给定电压曲线',
                    unit: '电压(V)',
                    width: 50,
                    checked: false
                }, {
                    id: '192_Status_WeldingVoltage_NoFilter',
                    name: '反馈电压曲线',
                    unit: '电压(V)',
                    width: 50,
                    checked: false
                }, {
                    name: '送丝实际速度曲线',
                    id: '174_WireFeedSpeed',
                    unit: '送丝速度\n(m/min)',
                    width: 60,
                    checked: false
                }, {
                    name: '送丝负荷曲线',
                    id: '175_WireFeedCurrent',
                    unit: '负荷(A)',
                    width: 50,
                    checked: false
                }, {
                    name: '焊接速度设定值曲线',
                    id: '157_WeldingSpeed',
                    unit: '焊接速度\n(mm/s)',
                    width: 60,
                    checked: false
                }, {
                    name: '焊接速度实际值曲线',
                    id: '076_LineVelocity',
                    unit: '焊接速度\n(mm/s)',
                    width: 60,
                    checked: false
                }, {
                    name: '主板温度曲线',
                    id: '180_WelderTemperature',
                    unit: '度',
                    width: 40,
                    checked: false
                }, {
                    name: '风扇转速曲线',
                    id: '181_WelderFanSpeed',
                    unit: '转/分',
                    width: 50,
                    checked: false
                }]
            };

            $scope.chartUnits = [];
            var chartObj;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.initConfig();
                },
                initConfig: function () {
                    AppDataService.get('app_weld_robot_chart_config').success(function (result) {
                        if (_.isEmpty(result)) {
                            /*系统中没有config的配置，则让用户选择*/
                            $('.weldChartDesignBox').removeClass('hide');
                            $('.weldChartShowBox').addClass('hide');
                        } else {
                            var fields = _.get(result, 'fields', []);
                            $scope.chartUnits = [];
                            _.each(fields, function (field) {
                                var findItem = _.find($scope.chartOptions.chartFields, {id: field});
                                findItem.checked = true;

                                if (_.indexOf($scope.chartUnits, findItem.unit) === -1) {
                                    $scope.chartUnits.push(findItem.unit);
                                }
                            });
                            ctrl.generateLine(true);
                        }
                    });
                },
                resetChart: function () {
                    $('.weldChartDesignBox').removeClass('hide');
                    $('.weldChartShowBox').addClass('hide');
                },
                generateLine: function (configFromDataBase) {
                    if (!$scope.chartUnits.length) {
                        dialog.noty('请选择曲线');
                        return false;
                    }

                    if (configFromDataBase !== true) {
                        var fields = _.map(_.filter($scope.chartOptions.chartFields, {checked: true}), function (field) {
                            return field.id;
                        });

                        AppDataService.set('app_weld_robot_chart_config', {
                            fields: fields
                        });
                    }

                    $('.weldChartDesignBox').addClass('hide');
                    $('.weldChartShowBox').removeClass('hide');

                    dialog.elemWaiting($('.weldChartShowBox'));

                    ctrl.loadData().success(function (result) {
                        var list = result || [];
                        list = _.sortBy(list, 'time');
                        ctrl.renderChart(list);
                    });
                },
                addValueToDataMap: function (dataMap, key, value) {
                    var values = _.get(dataMap, key, []);
                    values.push(value);
                    _.set(dataMap, key, values);
                },
                formatTime: function (item) {
                    var time = $filter('date')(item.time, dateformat);
                    time = time.substring(11);
                    return time;
                },
                appendMarkLine: function (list, series) {
                    /*计算不同的区域*/
                    var map = {};
                    var flagArr = ['1', '3', '4', '6'];
                    _.each(list, function (item) {
                        var flag = _.get(item, 'data.188_Status_DI_ArcWelding_Status', '-1');

                        var time = ctrl.formatTime(item);
                        if (!map[flag] && _.indexOf(flagArr, flag) !== -1) {
                            map[flag] = time;
                        }
                        if (flag === '6') {
                            map[flag] = time;
                        }
                    });

                    /*生成三个区域的markarea*/
                    if (_.keys(map).length === 4) {
                        /*生成第一个区域*/
                        series.push({
                            type: 'line',
                            name: 1,
                            markLine: {
                                lineStyle: {
                                    normal: {
                                        type: 'solid'
                                    }
                                },
                                symbol: "none",
                                animation: false,
                                label: {
                                    formatter: function (param) {
                                        return '起弧开始';
                                    }
                                },
                                data: [{
                                    xAxis: map['1']
                                }]
                            },
                        });

                        series.push({
                            type: 'line',
                            name: 2,
                            markLine: {
                                lineStyle: {
                                    normal: {
                                        type: 'solid'
                                    }
                                },
                                symbol: "none",
                                animation: false,
                                label: {
                                    formatter: function (param) {
                                        return '焊接开始';
                                    }
                                },
                                data: [{
                                    xAxis: map['3']
                                }]
                            },
                        });

                        series.push({
                            type: 'line',
                            name: 3,
                            markLine: {
                                lineStyle: {
                                    normal: {
                                        type: 'solid'
                                    }
                                },
                                symbol: "none",
                                animation: false,
                                label: {
                                    formatter: function (param) {
                                        return '熄弧开始';
                                    }
                                },
                                data: [{
                                    xAxis: map['4']
                                }]
                            },
                        });

                        series.push({
                            type: 'line',
                            name: 4,
                            markLine: {
                                lineStyle: {
                                    normal: {
                                        type: 'solid'
                                    }
                                },
                                symbol: "none",
                                animation: false,
                                label: {
                                    formatter: function (param) {
                                        return '熄弧结束';
                                    }
                                },
                                data: [{
                                    xAxis: map['6']
                                }]
                            }
                        });
                    }
                },
                processChartOptions: function (list) {
                    var dataMap = {};
                    var selectedFields = _.filter($scope.chartOptions.chartFields, {checked: true});
                    _.each(list, function (item) {
                        ctrl.addValueToDataMap(dataMap, 'time', ctrl.formatTime(item));
                        /*所有的栏位*/
                        _.each(selectedFields, function (fieldItem) {
                            var field = fieldItem.id;

                            var fieldValue = _.get(item, `data.${field}`, 0);
                            ctrl.addValueToDataMap(dataMap, field, fieldValue);
                        });
                    });

                    var legendDatas = _.map(selectedFields, function (item) {
                        return item.name;
                    });

                    var yAxisArr = [], seriesArr = [];
                    var leftOffset = 0, rightOffset = 0;

                    var unitArr = [];
                    _.each(selectedFields, function (item, idx) {
                        var findUnit = _.find(unitArr, {unit: item.unit});
                        if (!findUnit) {
                            unitArr.push({
                                unit: item.unit,
                                width: item.width,
                                idx: unitArr.length
                            });
                        }
                    });
                    _.each(unitArr, function (unitItem) {
                        var yAxis = {
                            type: 'value',
                            name: unitItem.unit
                        };
                        if (unitItem.idx % 2 === 0) {
                            yAxis.position = 'left';
                            yAxis.offset = leftOffset;
                            leftOffset += unitItem.width;
                        } else {
                            yAxis.position = 'right';
                            yAxis.offset = rightOffset;
                            rightOffset += unitItem.width;
                        }
                        yAxisArr.push(yAxis);
                    })
                    _.each(selectedFields, function (field) {
                        var findUnit = _.find(unitArr, {unit: field.unit});
                        seriesArr.push({
                            name: field.name,
                            type: 'line',
                            data: dataMap[field.id],
                            yAxisIndex: findUnit.idx
                        });
                    });

                    ctrl.appendMarkLine(list, seriesArr);

                    var gridTop = 90;
                    var perRow = selectedFields.length / 4;
                    if (perRow > 4) {
                        gridTop = 150;
                    } else if (perRow >= 3) {
                        gridTop = 130;
                    } else {
                        gridTop = 90;
                    }

                    var options = {
                        tooltip: {
                            trigger: 'axis',
                            formatter: function (params) {
                                if (_.isArray(params)) {
                                    var html = [];
                                    html.push('<div>' + _.get(params, '0.name', '') + '</div>');
                                    _.each(params, function (item) {
                                        if (item.seriesName && item.value !== undefined) {
                                            html.push('<div>');
                                            html.push(item.seriesName);
                                            html.push(' : ');
                                            html.push(item.value);
                                            html.push('</div>');
                                        }
                                    });
                                    return _.join(html, '');
                                }
                                return '';
                            }
                        },
                        legend: {
                            data: legendDatas,
                            left: leftOffset + 50,
                            right: rightOffset + 40
                        },
                        grid: {
                            left: leftOffset + 40,
                            right: rightOffset + 40,
                            top: gridTop
                        },
                        dataZoom: [
                            {
                                show: true,
                                realtime: true
                            },
                            {
                                type: 'inside'
                            }
                        ],
                        xAxis: [
                            {
                                type: 'category',
                                data: dataMap['time']
                            }
                        ],
                        toolbox: {
                            feature: {
                                dataZoom: {
                                    yAxisIndex: 'none'
                                },
                                restore: {},
                                saveAsImage: {
                                    name: 'chart'
                                }
                            }
                        },
                        yAxis: yAxisArr,
                        series: seriesArr
                    };
                    return options;
                },
                renderChart: function (result) {
                    var options = ctrl.processChartOptions(result);
                    dialog.elemWaiting($('.weldChartShowBox'));
                    if (chartObj) {
                        chartObj.clear();
                    }
                    chartObj = echarts.init(document.getElementById('weldChart1'));
                    chartObj.setOption(options);
                },
                bindEvent: function () {
                    $scope.$watch('chartOptions', function () {
                        ctrl.applyUnit();
                    }, true);
                },
                applyUnit: _.debounce(function () {
                    $scope.chartUnits = [];
                    _.each($scope.chartOptions.chartFields, function (item) {
                        if (item.checked && _.indexOf($scope.chartUnits, item.unit) === -1) {
                            $scope.chartUnits.push(item.unit);
                        }
                    });
                    util.apply($scope);
                }, 300),
                loadData: function () {
                    var filter = {
                        uuid: entity.uuid,
                        start_id: entity.start_id,
                        end_id: entity.end_id,
                        start: moment(entity.start),
                        end: moment(entity.end)
                    };

                    var fields = [];

                    _.each($scope.chartOptions.chartFields, function (item) {
                        if (item.checked) {
                            fields.push(item.id);
                        }
                    });

                    var params = {
                        uuid: filter.uuid,
                        start: filter.start.valueOf(),
                        end: filter.end.valueOf(),
                        fields: fields
                    };
                    params = util.encodeJSON(params);
                    return http.get('weld/lineChartData', {
                        data: params
                    });
                }
            });
            ctrl.initialize();
        }]);
});
