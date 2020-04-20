define(['echarts'], function (echarts) {
    var app = angular.module('app');

    app.controller('WeldRobotTcpXyzChartController', ['$scope', 'util', 'WeldService', 'AppDataService', 'dialog', 'DBUtils', '$filter', '$timeout',
        function ($scope, util, WeldService, AppDataService, dialog, DBUtils, $filter, $timeout) {
            var list = $scope.list;
            var dateformat = 'yyyy-MM-dd HH:mm:ss.sss';
            var ctrl = this;
            _.extend(ctrl, {
                initialize: function () {
                    $timeout(function () {
                        ctrl.processData();
                    }, 300);
                },
                processData: function () {
                    list = _.sortBy(list, 'time');
                    ctrl.renderChart(list);
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
                getValueDiff: function (item, field1, field2) {
                    var value1 = _.get(item, field1, '');
                    value1 = parseFloat(value1);
                    if (_.isNaN(value1)) {
                        value1 = 0;
                    }

                    var value2 = _.get(item, field2, '');
                    value2 = parseFloat(value2);
                    if (_.isNaN(value2)) {
                        value2 = 0;
                    }

                    var diff = value1 - value2;
                    return diff.toFixed(3);
                },
                getChartOptions: function (list) {
                    var dataMap = {};

                    _.each(list, function (item) {
                        var value = _.get(item, 'barcode', '');
                        ctrl.addValueToDataMap(dataMap, 'barcode', value);

                        var x = ctrl.getValueDiff(item, '182_TCP_X', '199_M_TCP_X');
                        ctrl.addValueToDataMap(dataMap, 'x', x);

                        var y = ctrl.getValueDiff(item, '183_TCP_Y', '200_M_TCP_Y');
                        ctrl.addValueToDataMap(dataMap, 'y', y);

                        var z = ctrl.getValueDiff(item, '184_TCP_Z', '201_M_TCP_Z');
                        ctrl.addValueToDataMap(dataMap, 'z', z);
                    });

                    var series = [];
                    series.push({
                        type: 'line',
                        name: 'TCP_X偏差值',
                        data: dataMap['x']
                    });

                    series.push({
                        type: 'line',
                        name: 'TCP_Y偏差值',
                        data: dataMap['y']
                    });

                    series.push({
                        type: 'line',
                        name: 'TCP_Z偏差值',
                        data: dataMap['z']
                    });

                    var options = {
                        tooltip: {
                            trigger: 'axis'
                        },
                        legend: {
                            data: ['TCP_X偏差值', 'TCP_Y偏差值', 'TCP_Z偏差值'],
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
                                data: dataMap['barcode']
                            }
                        ],
                        toolbox: {
                            feature: {
                                dataZoom: {
                                    yAxisIndex: 'none'
                                },
                                restore: {},
                                dataView: {},
                                saveAsImage: {
                                    name: 'chart'
                                }
                            }
                        },
                        yAxis: [{
                            type: 'value',
                            name: 'mm',
                        }],
                        series: series
                    };

                    return options;
                },
                renderChart: function (list) {
                    var options = ctrl.getChartOptions(list);
                    var chartObj = echarts.init(document.getElementById('robotTcpXyzChart'));
                    chartObj.setOption(options);
                }
            });

            ctrl.initialize();
        }]);
});