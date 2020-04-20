define(['echarts'], function (echarts) {
    var app = angular.module('app');

    app.controller('WeldRobotClockChartController', ['$scope', 'dialog', 'DBUtils', '$timeout',
        function ($scope, dialog, DBUtils, $timeout) {
            var ctrl = this;

            var colors = [
                '#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae', '#749f83', '#ca8622'];

            var entity = $scope.entity;
            _.extend(ctrl, {
                initialize: function () {
                    $timeout(function () {
                        ctrl.loadData();
                    }, 300);
                },
                loadData: function () {
                    var fields = {
                        'data.206_CloudSend_RobotWorkFlag': 1,
                        'data.141_ArcOn_Time': 1,
                        "time": 1
                    }
                    var element = $('.weld_clock_chart');
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
                    }, fields, {
                        time: 1
                    }).success(function (result) {
                        dialog.elemWaiting(element);
                        var list = _.get(result, 'datas.result', []);
                        list = _.sortBy(list, 'time');
                        ctrl.renderChart(list);
                    });
                },
                dateDiff: function (start, end) {
                    return Math.abs(moment(start).diff(moment(end)));
                },
                plusMapValue: function (dataMap, key, value) {
                    var baseValue = _.get(dataMap, key, 0);
                    baseValue += value;
                    _.set(dataMap, key, baseValue);
                },
                getChartOptions: function (list) {
                    var step = [];
                    var seqFlag = '', seqTime = '';
                    var tagList = [];
                    var valueList = [];
                    _.each(list, function (item, idx) {
                        var tag = _.get(item, 'data.141_ArcOn_Time', '');
                        var flag = _.get(item, 'data.206_CloudSend_RobotWorkFlag', '');
                        if (flag === '7' || flag === '8' || flag === '9') {
                            flag = '6';
                        }

                        var tag_flag = tag + '_' + flag;
                        if (tagList.indexOf(tag) === -1) {
                            tagList.push(tag);
                        }
                        if (tag_flag) {
                            var time = _.get(item, 'time', '');
                            if (!seqFlag) {
                                seqFlag = tag_flag;
                                seqTime = time;
                            }
                            if (idx > 0) {
                                var preFlag = _.get(list[idx - 1], 'data.206_CloudSend_RobotWorkFlag', '');
                                if (preFlag === '7' || preFlag === '8' || preFlag === '9') {
                                    preFlag = '6';
                                }
                                var prevTag = _.get(list[idx - 1], 'data.141_ArcOn_Time', '');

                                var prevTagFlag = prevTag + '_' + preFlag;
                                if (tag_flag !== prevTagFlag) {
                                    var diff = ctrl.dateDiff(time, seqTime);
                                    valueList.push({
                                        value: diff,
                                        flag: preFlag,
                                        tag: prevTag
                                    });
                                    seqFlag = tag_flag;
                                    seqTime = time;
                                }
                            }
                        }
                    });

                    var lastItem = _.last(list);
                    var diff = ctrl.dateDiff(lastItem['time'], seqTime);
                    var lastFlag = _.get(lastItem, 'data.206_CloudSend_RobotWorkFlag');
                    if (lastFlag === '7' || lastFlag === '8' || lastFlag === '9') {
                        lastFlag = '6';
                    }
                    valueList.push({
                        value: diff,
                        flag: lastFlag,
                        tag: _.get(lastItem, 'data.141_ArcOn_Time')
                    });

                    var seriesData = [];

                    var baseValue = 0;

                    var stepArr = [{
                        'id': '0',
                        'name': '移动阶段',
                        idx: 0
                    }, {
                        'id': '6',
                        'name': '拍照阶段',
                        idx: 1
                    }, {
                        'id': '1',
                        'name': '起弧阶段',
                        idx: 2
                    }, {
                        'id': '2',
                        'name': '上升阶段',
                        idx: 3
                    }, {
                        'id': '3',
                        'name': '焊接阶段',
                        idx: 4
                    }, {
                        'id': '4',
                        'name': '下降阶段',
                        idx: 5
                    }, {
                        'id': '5',
                        'name': '熄弧阶段',
                        idx: 6
                    }];

                    var stepMap = {};
                    _.each(stepArr, function (step) {
                        stepMap[step.id] = step;
                    });

                    _.each(valueList, function (item) {
                        var value = (item.value) / 1000;
                        if (_.isNaN(value)) {
                            value = 0;
                        }
                        item.value = value;
                    })

                    ctrl.renderPieChart(stepArr, valueList);

                    _.each(valueList, function (item, idx) {
                        var tagIdx = _.indexOf(tagList, item.tag);
                        var step = stepMap[item.flag];
                        var name = `${step.name}`;
                        seriesData.push({
                            'name': name,
                            value: [
                                idx,
                                baseValue,
                                baseValue += item.value,
                                item.value
                            ],
                            itemStyle: {
                                normal: {
                                    color: colors[step.idx]
                                }
                            }
                        });
                    });

                    function renderItem(params, api) {
                        var categoryIndex = api.value(0);
                        var start = api.coord([api.value(1), categoryIndex]);
                        var end = api.coord([api.value(2), categoryIndex]);
                        var height = api.size([0, 1])[1] * 0.6;

                        var rectShape = echarts.graphic.clipRectByRect({
                            x: start[0],
                            y: start[1] - height / 2,
                            width: end[0] - start[0],
                            height: height
                        }, {
                            x: params.coordSys.x,
                            y: params.coordSys.y,
                            width: params.coordSys.width,
                            height: params.coordSys.height
                        });

                        return rectShape && {
                            type: 'rect',
                            shape: rectShape,
                            style: api.style()
                        };
                    }

                    var options = {
                        tooltip: {
                            formatter: function (params) {
                                return params.marker + params.name + ': ' + params.value[3] + '秒';
                            }
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
                        xAxis: {
                            min: 0,
                            max: baseValue,
                            scale: true,
                            axisLabel: {
                                formatter: function (val) {
                                    val = Math.max(0, val);
                                    val = val.toFixed(2);
                                    return val + ' 秒';
                                }
                            }
                        },
                        grid: {
                            left: 20,
                            right: 20
                        },
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
                        yAxis: {
                            data: ['焊接总耗时'],
                            show: false
                        },
                        series: [{
                            'name': '焊接总耗时',
                            type: 'custom',
                            itemStyle: {
                                normal: {
                                    opacity: 0.8
                                }
                            },
                            encode: {
                                x: [1, 2],
                                y: 0
                            },
                            renderItem: renderItem,
                            data: seriesData
                        }]
                    };

                    return options;
                },
                renderChart: function (list) {
                    var options = ctrl.getChartOptions(list);
                    var chartObj = echarts.init(document.getElementById('weld_clock_chart'));
                    chartObj.setOption(options);
                },
                renderPieChart: function (stepArr, valueList) {
                    var legendData = _.map(stepArr, function (item) {
                        return item.name;
                    });

                    var seriesData = [];

                    var stepValueMap = {};
                    _.each(valueList, function (item) {
                        var step = item.flag;
                        var value = _.get(stepValueMap, step, 0);
                        value += item.value;
                        _.set(stepValueMap, step, value);
                    });

                    _.each(stepArr, function (item, idx) {
                        var value = _.get(stepValueMap, item.id, 0);
                        seriesData.push({
                            value: value.toFixed(2),
                            name: item.name,
                            itemStyle: {
                                color: colors[idx]
                            }
                        })
                    });
                    var options = {
                        title: {
                            text: '焊接时间分析',
                            x: 'center'
                        },
                        tooltip: {
                            trigger: 'item',
                            formatter: "{a} <br/>{b}: {c} 秒 ({d}%)"
                        },
                        toolbox: {
                            feature: {
                                saveAsImage: {
                                    name: 'chart'
                                }
                            }
                        },
                        grid: {
                            right: 10,
                            left: 10
                        },
                        legend: {
                            orient: 'vertical',
                            left: 'left',
                            data: legendData
                        },
                        series: [
                            {
                                name: '焊接时间分析',
                                type: 'pie',
                                radius: '55%',
                                center: ['65%', '50%'],
                                data: seriesData
                            }
                        ]
                    };

                    var chartObj = echarts.init(document.getElementById('weld_clock_pie_chart'));
                    chartObj.setOption(options);
                }
            });

            ctrl.initialize();
        }]);
})