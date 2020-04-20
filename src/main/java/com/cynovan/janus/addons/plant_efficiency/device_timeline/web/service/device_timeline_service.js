;(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        global.DeviceTimelineService = factory()
    }
}(this, (function () {
    'use strict';

    var echarts = null;

    var renderItem = function (params, api) {
        // 设备
        var categoryIndex = api.value(0);
        // 时间块左上点坐标
        var start = api.coord([api.value(1), categoryIndex]);
        // 时间块右上点坐标
        var end = api.coord([api.value(2), categoryIndex]);
        // 时间块的高度
        //var height = api.size([0, 1])[1] * 0.6;
        var height = 40;
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
    };

    var getStateColor = function (item) {
        var color = '#CCCCCC';
        if (item.stateType === 'offline') {
            color = '#CCCCCC';
        } else if (item.stateType === 'normal') {
            color = '#029359';
        } else if (item.stateType === 'warning') {
            color = '#F0C600';
        } else if (item.stateType === 'alarm') {
            color = '#D50C38';
        }
        return color;
    };

    var _options = {
        tooltip: {
            formatter: function (params) {
                moment.locale('zh-cn');
                var start = moment(params.value[1]);
                var end = moment(params.value[2]);
                var duration = params.value[3];
                var stateName = params.value[4];
                return '<div style="text-align: left"><i class="fa fa-circle" style="font-size: 1.1em;color:' + params.color + '"></i> ' + stateName + '<br/>' +
                    '<i class="fa fa-circle" style="font-size: 5px;color:' + params.color + '"></i> 持续时间: ' + moment.duration(duration).humanize() + '<br />' +
                    '<i class="fa fa-circle" style="font-size: 5px;color:' + params.color + '"></i> 开始时间: ' + start.format("MM-DD HH:mm:ss") + '<br />' +
                    '<i class="fa fa-circle" style="font-size: 5px;color:' + params.color + '"></i> 结束时间: ' + end.format("MM-DD HH:mm:ss") + `</div>`;
            }
        },
        dataZoom: [{
            type: 'slider',
            filterMode: 'weakFilter',
            showDataShadow: false,
            show: true,
            realtime: true
        }, {
            type: 'inside',
            filterMode: 'weakFilter'
        }],
        data: ['bar', 'error'],
        xAxis: {
            name: "时间",
            nameTextStyle: {
                fontWeight: "bold"
            },
            scale: true,
            splitLine: {
                show: false
            },
            axisLabel: {
                formatter: function (val) {
                    let d = moment(val);
                    return d.format("HH:mm");
                }
            }
        },
        yAxis: {
            name: "设备名称",
            nameTextStyle: {
                fontWeight: "bold"
            },
            data: [],
            splitLine: {
                show: false
            },
            interval: 5
        },
        series: [{
            type: 'custom',
            renderItem: renderItem,
            itemStyle: {
                normal: {
                    opacity: 1
                }
            },
            dimensions: ['持续时间', '开始时间', '结束时间'],
            encode: {
                x: [1, 2],
                y: 0,
                tooltip: [0, 1, 2]
            }
        }]
    };

    var stateOption = {
        series: [
            {
                type: 'pie',
                radius: ['40%', '60%'],
                avoidLabelOverlap: false,
                label: {
                    normal: {
                        show: true,
                        formatter: function (data) {
                            return data.name + '\n' + data.percent + '%';
                        }
                    }
                },
                color: ['#029359', '#F0C600', '#D50C38'],

                data: [
                    {value: 0, name: '正常'},
                    {value: 0, name: '警告'},
                    {value: 0, name: '报警'}
                ]
            }
        ]
    };

    var service = {
        _getTimelineChartData: function (uuid, date_type, start, end) {
            return $.ajax({
                url: '/device/timeline',
                type: 'get',
                data: {
                    uuid: uuid || '',
                    date_type: date_type || '',
                    start: start || '',
                    end: end || ''
                },
                dataType: 'json',
                cache: false
            });
        },
        getChartConfig: function (_echarts, uuid, date_type, start, end) {
            echarts = _echarts;
            var deviceName;
            $.ajax({
                url: '/device/getDeviceName',
                type: 'get',
                data: {uuid: uuid || ''}
            }).then(function (result) {
                deviceName = result;
            });
            var deferred = $.Deferred();
            service._getTimelineChartData(uuid, date_type, start, end).done(function (result) {

                var deviceNames = [];
                var chartDatas = [];
                var normalduration = 0;
                var warningduration = 0;
                var alarmduration = 0;
                var offlineduration = 0;

                deviceNames.push(deviceName);
                _.each(result, function (item) {
                    if (item.stateType === "normal") {
                        normalduration += item.duration;
                    } else if (item.stateType === "warning") {
                        warningduration += item.duration;
                    } else if (item.stateType === "alarm") {
                        alarmduration += item.duration;
                    } else if (item.stateType === "offline") {
                        offlineduration += item.duration;
                    }
                    var valueArr = [];
                    valueArr.push(0);
                    valueArr.push(new moment(item.start_date).valueOf());
                    valueArr.push(new moment(item.end_date).valueOf());
                    valueArr.push(item.duration);
                    valueArr.push(item.stateName);

                    var color = getStateColor(item);

                    chartDatas.push({
                        name: deviceName,
                        value: valueArr,
                        itemStyle: {
                            normal: {
                                color: color
                            }
                        }
                    });
                });

                var options = _.cloneDeep(_options);
                _.set(options, 'series[0].data', chartDatas);
                _.set(options, 'yAxis.data', deviceNames);
                _.set(stateOption, "series[0].data[0].value", normalduration);
                _.set(stateOption, "series[0].data[1].value", warningduration);
                _.set(stateOption, "series[0].data[2].value", alarmduration);
                var arg = {
                    "normalduration": normalduration,
                    "warningduration": warningduration,
                    "alarmduration": alarmduration,
                    "offlineduration": offlineduration,
                    "stateoptions": stateOption,
                    "options": options
                }
                deferred.resolve(arg);
            });
            return deferred;
        }
    };
    return service;
})));