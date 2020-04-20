define(['echarts'], function (echarts) {
    var app = angular.module('app');

    app.controller('WeldRobotBarcodeLineChartController', ['$scope', 'util', 'WeldService', 'AppDataService', 'dialog', 'DBUtils', '$filter', '$timeout',
        function ($scope, util, WeldService, AppDataService, dialog, DBUtils, $filter, $timeout) {
            var entity = $scope.entity;
            var dateformat = 'yyyy-MM-dd HH:mm:ss.sss';
            var ctrl = this;
            _.extend(ctrl, {
                initialize: function () {
                    $timeout(function () {
                        ctrl.loadData();
                    }, 300);
                },
                loadData: function () {
                    var fields = {
                        'data.076_LineVelocity': '1',
                        'data.141_ArcOn_Time': "1",
                        'data.173_Status_DI_ArcWeldingStart_DataCollect': "1",
                        "time": 1
                    }
                    var element = $('#barcodeChart');
                    dialog.elemWaiting(element);
                    DBUtils.list('deviceData', {
                        'uuid': entity.uuid,
                        time: {
                            $gte: {
                                $date: moment(entity.start).add(-10, 'minutes').valueOf()
                            },
                            $lte: {
                                $date: moment(entity.end).add(10, 'minutes').valueOf()
                            }
                        },
                        'data.168_MaterialBarcode': entity.barcode,
                        'data.198_OneCompleteProcess': {
                            $in: ["TRUE", "1", "true"]
                        }
                    }, fields).success(function (result) {
                        dialog.elemWaiting(element);
                        var list = _.get(result, 'datas.result', []);
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
                getChartOptions: function (list) {
                    var dataMap = {};
                    var marklineMap = {};
                    var mLineIdx = 1;
                    _.each(list, function (item, idx) {
                        var time = ctrl.formatTime(item);
                        ctrl.addValueToDataMap(dataMap, 'time', time);
                        var value = _.get(item, 'data.076_LineVelocity', '');
                        ctrl.addValueToDataMap(dataMap, '076_LineVelocity', value);

                        var tag = _.get(item, 'data.141_ArcOn_Time', '');
                        var item173tag = _.get(item, 'data.173_Status_DI_ArcWeldingStart_DataCollect', '');
                        item173tag = _.toLower(item173tag);

                        var marklineKey = tag + '_' + item173tag;
                        var mline = marklineMap[marklineKey];
                        if (!mline) {
                            var add = false;
                            var type = 0;
                            var mlineTime = time;
                            var mLineIdxAdd = false;
                            if (item173tag === '0' || item173tag === 'false') {
                                if (marklineMap[tag + '_1'] || marklineMap[tag + '_true']) {
                                    add = true;
                                    mlineTime = ctrl.formatTime(list[idx - 1]);
                                    mLineIdxAdd = true;
                                    type = 1;
                                }
                            } else {
                                add = true;
                            }

                            if (add) {
                                mline = {
                                    time: mlineTime,
                                    idx: mLineIdx,
                                    type: type
                                }
                                if (item173tag === '1' || item173tag === 'true') {
                                    mline.type = 0;
                                } else {
                                    mline.type = 1;
                                }
                                marklineMap[marklineKey] = mline;
                                ctrl.addValueToDataMap(dataMap, 'markline', mline);

                                if (mLineIdxAdd) {
                                    mLineIdx++;
                                }
                            }
                        }
                    });

                    var series = [];
                    series.push({
                        type: 'line',
                        name: '实际运行速度曲线',
                        data: dataMap['076_LineVelocity']
                    });
                    _.each(dataMap['markline'], function (item, idx) {
                        var index = item.idx;

                        var name = `焊缝${index}开始`;
                        if (item.type === 1) {
                            name = `焊缝${index}结束`;
                        }
                        series.push({
                            type: 'line',
                            name: idx + '',
                            markLine: {
                                lineStyle: {
                                    normal: {
                                        type: 'solid'
                                    }
                                },
                                symbol: "none",
                                animation: false,
                                label: {
                                    show: true,
                                    formatter: function (param) {
                                        return name;
                                    }
                                },
                                data: [{
                                    xAxis: item.time,
                                }]
                            }
                        })
                    });

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
                            data: ['实际运行速度曲线'],
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
                        yAxis: [{
                            type: 'value',
                            name: 'mm/s'
                        }],
                        series: series
                    };

                    return options;
                },
                renderChart: function (list) {
                    var options = ctrl.getChartOptions(list);
                    var chartObj = echarts.init(document.getElementById('barcodeChart'));
                    chartObj.setOption(options);
                }
            });

            ctrl.initialize();
        }]);
});