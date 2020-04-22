define(['echarts'], function (echarts) {
    var app = angular.module('app');
//    AppComponent 从哪里来的？
    app.controller('EfficiencyIndexController', ['$scope', 'DBUtils', 'dialog', 'http', 'util', "I18nService", "$element", 'janus', '$timeout',
        'AppComponent',
        function ($scope, DBUtils, dialog, http, util, I18nService, $element, janus, $timeout, AppComponent) {
            var ctrl = this;
            console.log("this this this this :::: effciency"  )
            console.log(this)
            var hadDrawAlarm = false;
            var alarmNumOption;
//            这里的属性都是放到了this的原型链上吗？根据测试结果这个好像并不是绑定在原型链上面的
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.initData();
                    ctrl.initDeviceStateChart();
                    ctrl.initAlarmList();
                    ctrl.initDataChart();
                    http.post("dataDefinition/setClsIdToCode", {});
                },
                bindEvent: function () {
                },
                initData: function () {
                    $scope.datamodel = 'utilization';
                },
                initDeviceStateChart: function () {
                    DBUtils.list('device', {}, {
                        online: 1,
                        state: 1
                    }).success(function (result) {
                        let offlineDeviceNum = 0;
                        let normalDeviceNum = 0;
                        let alarmDeviceNum = 0;
                        let warnDeviceNum = 0;
                        let devices = _.get(result, 'datas.result', []);
                        _.forEach(devices, function (device) {
                            let isOnline = _.get(device, "online", false);
                            if (isOnline === true) {
                                let state = _.get(device, "state", "");
                                if (state === "normal") {
                                    normalDeviceNum++;
                                } else if (state === "warning") {
                                    warnDeviceNum++;
                                } else if (state === "alarm") {
                                    alarmDeviceNum++;
                                }
                            } else {
                                offlineDeviceNum++;
                            }
                        });
//                        这里为什么要加#号呢？
                        let statechart = echarts.init($("#state_chart")[0]);
                        let option = {
                            tooltip: {
                                trigger: 'item',
                                formatter: '{b}: {c}'
                            },

                            legend: {
                                icon: 'circle',
                                orient: 'hoverAnimation',
                                right: '100px',
                                y: 'center',
                                itemGap: 20,
                                textStyle: {
                                    fontSize: 15,
                                },
                                data: ['正常', '警告', '报警', '离线']
                            },
                            series: [
                                {
                                    type: 'pie',
                                    center: ['40%', '50%'],
                                    radius: ['40%', '90%'],
                                    color: ['#5AD8A6', '#EEEE00', 'red', '#7D7D7D'],
                                    label: {
                                        normal: {
                                            show: true,
                                            position: 'inside',
                                            formatter: function (data) {
                                                if (data.value > 0) {
                                                    return data.percent + '%';
                                                }
                                                return ' ';
                                            }
                                        }
                                    },
                                    data: [
                                        {value: normalDeviceNum, name: '正常'},
                                        {value: warnDeviceNum, name: '警告'},
                                        {value: alarmDeviceNum, name: '报警'},
                                        {value: offlineDeviceNum, name: '离线'},
                                    ]
                                }
                            ]
                        };
                        statechart.setOption(option);
                    });
                },
                initAlarmList: function () {
                    http.post("alarmIndex/getTenAlarmList", {}).success(function (result) {
                        $scope.alarmList = _.get(result, "datas.alarmList", []);
                    });
                },
                initDeviceUtilizationChart: function (todayonlinetime, todaynormaltime) {
                    let uchart = echarts.init($(".total_chart")[0]);
                    let todayalarmtime = todayonlinetime - todaynormaltime;
                    if(todayonlinetime==0){
                        $scope.todayUtilization = 0;
                    }else {
                        $scope.todayUtilization = _.round(todaynormaltime / todayonlinetime * 100, 2);
                    }
                    let option = {
                        tooltip: {
                            trigger: 'item',
                            formatter: '{b}: {c}'
                        },
                        legend: {
                            icon: 'circle',
                            orient: 'hoverAnimation',
                            right: '100px',
                            y: 'center',
                            itemGap: 20,
                            textStyle: {
                                fontSize: 15,
                            },
                            data: ['有效时间', '无效时间']
                        },
                        series: [
                            {
                                type: 'pie',
                                center: ['40%', '50%'],
                                radius: ['40%', '90%'],
                                color: ['#5AD8A6', '#7D7D7D'],
                                label: {
                                    normal: {
                                        show: true,
                                        position: 'inside',
                                        formatter: function (data) {
                                            if (data.value > 0) {
                                                return data.percent + '%';
                                            }
                                            return ' ';
                                        }
                                    }
                                },
                                data: [
                                    {value: todaynormaltime, name: '有效时间'},
                                    {value: todayalarmtime, name: '无效时间'}
                                ]
                            }
                        ]
                    };
                    uchart.setOption(option);
                },
                initDataChart: function () {
                    http.post("alarmIndex/dataStatistics", {
                        startdate: moment().subtract(6, 'days').format('YYYY-MM-DD'),
                    }).success(function (result) {
                        let datas = _.get(result, 'datas', []);
                        ctrl.initutilizationChart(datas.devicenormaltime, datas.deviceonlinetime);
                        ctrl.initAlarmNumChart(datas.alarmNum);
                    });
                },
                changemodel: function (type) {
                    $scope.datamodel = type;
                    if ($scope.datamodel == 'alarmlist' && hadDrawAlarm == false) {
                        hadDrawAlarm = true;
                        setTimeout(function () {
                            var alarmchart = echarts.init($('.alarmChart')[0]);
                            alarmchart.setOption(alarmNumOption);
                        }, 300);
                    }
                    util.apply($scope);
                },
                initutilizationChart: function (devicenormaltime, deviceonlinetime) {
                    var today=moment().format('YYYY-MM-DD');
                    let normaltimeTable = {};
                    let utilizaListTable = {}
                    var totaldate = [];
                    var totaltype = [];
                    var todayonlinetime=0;
                    var todaynormaltime=0;
                    _.forEach(devicenormaltime, function (data) {
                        if(_.isEqual(data._id.yearmonthday,today)){
                            todaynormaltime+=data.time;
                        }
                        _.set(normaltimeTable, data._id.yearmonthday + '.' + data._id.type, data.time);
                    });
                    _.forEach(deviceonlinetime, function (data) {
                        if(_.isEqual(data._id.yearmonthday,today)){
                            todayonlinetime+=data.time;
                        }
                        let time = _.get(normaltimeTable, data._id.yearmonthday + '.' + data._id.type, 0);
                        let utilization = 0;
                        if (data.time != 0 || time != 0) {
                            utilization = _.round((time / data.time), 2)
                        }
                        totaldate.push(data._id.yearmonthday)
                        totaltype.push(data._id.type)
                        _.set(utilizaListTable, data._id.yearmonthday + '.' + data._id.type, utilization);
                    });
                    ctrl.initDeviceUtilizationChart(todayonlinetime,todaynormaltime);
                    totaldate = _.uniq(totaldate);
                    totaltype = _.uniq(totaltype);
                    let utilizationOption = {
                        tooltip: {
                            trigger: 'axis'
                        },
                        legend: {
                            data: totaltype
                        },
                        grid: {
                            left: '3%',
                            right: '7%',
                            bottom: '3%',
                            containLabel: true
                        },
                        xAxis: {
                            type: 'category',
                            boundaryGap: false,
                            data: totaldate
                        },
                        yAxis: {
                            type: 'value',
                            axisLine: {show: false}
                        },
                        series: []
                    };
                    _.forEach(totaltype, function (type) {
                        utilizationOption.series.push({
                            name: type,
                            type: 'line',
                            data: []
                        })
                        _.forEach(totaldate, function (date) {
                            var value = _.get(utilizaListTable, date + '.' + type, 0);
                            let data = _.find(utilizationOption.series, {name: type}).data;
                            data.push(value);
                        })
                    });
                    var alarmchart = echarts.init($('.utilizationchart')[0]);
                    alarmchart.setOption(utilizationOption);
                },
                initAlarmNumChart: function (alarmNum) {
                    let totalAlarmDate = [];
                    let totalAlarmType = [];
                    var alarmNumTable = {};
                    _.forEach(alarmNum, function (item) {
                        _.set(alarmNumTable, item._id.yearmonthday + '.' + item._id.type, item.count);
                        totalAlarmDate.push(item._id.yearmonthday);
                        totalAlarmType.push(item._id.type);
                    });
                    totalAlarmDate = _.uniq(totalAlarmDate);
                    totalAlarmType = _.uniq(totalAlarmType);
                    alarmNumOption = {
                        tooltip: {
                            trigger: 'axis'
                        },
                        legend: {
                            data: totalAlarmType
                        },
                        grid: {
                            left: '3%',
                            right: '7%',
                            bottom: '3%',
                            containLabel: true
                        },
                        xAxis: {
                            type: 'category',
                            boundaryGap: false,
                            data: totalAlarmDate
                        },
                        yAxis: {
                            type: 'value',
                            axisLine: {show: false}
                        },
                        series: []
                    };
                    _.forEach(totalAlarmType, function (type) {
                        alarmNumOption.series.push({
                            name: type,
                            type: 'line',
                            data: []
                        })
                        _.forEach(totalAlarmDate, function (date) {
                            let value = _.get(alarmNumTable, date + '.' + type, 0);
                            let data = _.find(alarmNumOption.series, {name: type}).data;
                            data.push(value);
                        })
                    });
                }
            });
            ctrl.initialize();
        }]);
});