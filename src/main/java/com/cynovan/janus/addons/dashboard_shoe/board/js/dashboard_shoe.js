define(["echarts"], function (echarts) {
    var app = angular.module('app');

    app.controller('DashBoardShoeController', ['$scope', 'DBUtils', 'websocket', 'util', function ($scope, DBUtils, websocket, util) {
        var ctrl = this;
        var oee_chart = null, oee_history_chart = null, line_pie_chart = null, product_line_history_chart = null,
            good_bad_chart = null, bad_info_chart = null ,okRatio_pie_chart = null;
        $scope.showAllDashBoard = true;
        var uuidArray = [];

        _.extend(ctrl, {
            initialize: function () {
                ctrl.bindEvent();
                ctrl.initOeeRatio();
                ctrl.initOeeChart();
                ctrl.initOeeProduct();
                ctrl.initOeeHistoryChart();
                ctrl.initLineDevice();
                ctrl.initLineChart();
                ctrl.initLineHistoryChart();
                ctrl.initGoodBadChart();
                ctrl.initBadInfoChart();
                ctrl.initOkRatioPieChart();
                ctrl.initYelidinfo();
            },
            bindEvent: function () {
                $scope.needle={};
                $scope.v1=$scope.needle['14_value']?$scope.needle['14_value']:'150';
                $scope.v2=$scope.needle['TodayGoal']?$scope.needle['TodayGoal']:'300';
                $scope.bili=parseInt($scope.v1)/parseInt($scope.v2)*100+'%';
                $scope.bilivalue=parseInt($scope.v1)/parseInt($scope.v2)*100;
                $scope.$on("$destroy", function () {
                    //取消订阅
                    _.each(uuidArray, function (value) {
                        websocket.unsub('deviceData/' + value);
                    })
                });
            },
            initOeeRatio: function () {
                $scope.useRatio = ctrl.getRandomNum(70, 99);
                $scope.showRatio = ctrl.getRandomNum(70, 99);
                $scope.productRatio = ctrl.getRandomNum(70, 99);
                $scope.oeeRatio = parseInt(($scope.useRatio / 100) * ($scope.showRatio / 100) * ($scope.productRatio / 100) * 100);
                $scope.oeeTrend = ctrl.getRandomNum(1, 5);
            },
            getRandomNum: function (Min, Max) {
                // 获取最小值到最大值之前的整数随机数
                let Range = Max - Min;
                let Rand = Math.random();
                return (Min + Math.round(Rand * Range));
            },
            initOeeChart: function () {
                if (!oee_chart) {
                    let options = {
                        series: [
                            {
                                name: 'OEE',
                                type: 'pie',
                                radius: ['50%', '70%'],
                                avoidLabelOverlap: false,
                                color: ['#488eff', '#f4f5f9'],
                                label: {
                                    normal: {
                                        show: true,
                                        position: 'center',
                                        textStyle: {
                                            fontSize: '30',
                                            color: '#488efe'
                                        },
                                        formatter: `${$scope.oeeRatio + '%'}\nOEE`
                                    }
                                },
                                data: [
                                    {value: $scope.oeeRatio, name: 'OEE'},
                                    {value: 100 - $scope.oeeRatio, name: ''}
                                ]
                            }
                        ]
                    };
                    let oee_chartEle = $('.pie-chart');
                    oee_chart = echarts.init(oee_chartEle[0]);
                    oee_chart.setOption(options);
                }
            },
            initYelidinfo:function(){
                let options = {
                    tooltip: {
                        trigger: 'item',
                        formatter: "{a} <br/>{b}: {c} ({d}%)"
                    },
                    legend: {
                        orient: 'vertical',
                        y: 'center',
                        right: 30,
                        data: ['unfinished', 'completed']
                    },
                    series: [
                        {
                            name: 'completion',
                            type: 'pie',
                            radius: ['50%', '70%'],
                            avoidLabelOverlap: false,
                            color: ['#488eff', '#55B737'],
                            label: {
                                normal: {
                                    show: true,
                                    position: 'center',
                                    textStyle: {
                                        fontSize: '30',
                                        color: '#488efe'
                                    },
                                    formatter: $scope.bili
                                }
                            },
                            center: ["28%","50%"],
                            data: [
                                {value:parseInt($scope.v2)-parseInt($scope.v1), name: 'unfinished'},
                                {value: parseInt($scope.v1), name: 'completed'}
                            ]
                        }
                    ]
                };
                let oee_chartEle = $('.line-yield-chart-info');
                oee_chart = echarts.init(oee_chartEle[0]);
                oee_chart.setOption(options);
            },
            initOkRatioPieChart:function(){
                if(!okRatio_pie_chart){
                    let options = {
                        series: [
                            {
                                name: 'okRatioPie',
                                type: 'pie',
                                radius: ['50%', '70%'],
                                avoidLabelOverlap: false,
                                color: ['#488eff', '#f4f5f9'],
                                label: {
                                    normal: {
                                        show: true,
                                        position: 'center',
                                        textStyle: {
                                            fontSize: '15',
                                            color: '#488efe'
                                        },
                                        formatter: `${$scope.okRatio + '%'}\nYield Rate`
                                    }
                                },
                                data: [
                                    {value: $scope.okRatio, name: 'OEE'},
                                    {value: 100 -$scope.okRatio , name: ''}
                                ]
                            }
                        ]
                    };
                    let okRatio_pieEle = $('.okRatio-pie');
                    okRatio_pie_chart = echarts.init(okRatio_pieEle[0]);
                    okRatio_pie_chart.setOption(options);
                }
            },
            initOeeProduct: function () {
                $scope.nowProductCount = ctrl.getRandomNum(20, 50);
                $scope.allProductCount = 0;
                $scope.targetNum = ctrl.getRandomNum(280, 300);
                $scope.okNum = ctrl.getRandomNum(200, 280);
                $scope.UPPH = ctrl.getRandomNum(5, 30);
                $scope.noNum = $scope.targetNum - $scope.okNum;
                if ($scope.noNum < 0) {
                    $scope.noNum = 0;
                }
                $scope.okRatio = parseInt(($scope.okNum / $scope.targetNum) * 100);
            },
            initOeeHistoryChart: function () {
                let xarr = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], yarr = [];
                for (let i = 0; i < 7; i++) {
                    //xarr暂时固定为周一至周日
                    // xarr.unshift(moment().subtract(i, "days").format("YYYY-MM-DD"));
                    let yvalue = ctrl.getRandomNum(500, 1500);
                    yarr.unshift(yvalue);
                    $scope.allProductCount += yvalue;
                }
                if (!oee_history_chart) {
                    let options = {
                        grid: {
                            left: 50,
                            right: 15,
                            top: 30
                        },
                        color: ['#488eff'],
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                                type: 'line'        // 默认为直线，可选为：'line' | 'shadow'
                            }
                        },
                        xAxis: [
                            {
                                type: 'category',
                                data: xarr,
                                axisTick: {
                                    alignWithLabel: true
                                }
                            }
                        ],
                        yAxis: [
                            {
                                type: 'value'
                            }
                        ],
                        series: [
                            {
                                name: 'Yield',
                                type: 'bar',
                                barWidth: '30%',
                                data: yarr
                            }
                        ]
                    };
                    let oee_history_chartEle = $('.oee-history-chart');
                    oee_history_chart = echarts.init(oee_history_chartEle[0]);
                    oee_history_chart.setOption(options);
                }
            },
            showLineDashBoard: function () {
                $scope.showAllDashBoard = !$scope.showAllDashBoard;
            },
            initLineDevice: function () {
                DBUtils.find('device', {
                    'vulcanizing.show': true
                }).success(function (result) {
                    let device = _.get(result, 'datas.result', {});
                    let uuid = _.get(device, "uuid", '');
                    $scope.vulcanizing = _.get(device, "dynamicData", {});
                    if (uuid) {
                        uuidArray.push(uuid);
                        websocket.sub({
                            topic: 'deviceData/' + uuid,
                            scope: $scope,
                            onmessage: function (data) {
                                $scope.vulcanizing = _.get(data, 'data', {});
                                util.apply($scope);
                            }
                        });
                    }
                });
                DBUtils.find('device', {
                    'wall_press_machine.show': true
                }).success(function (result) {
                    let device = _.get(result, 'datas.result', {});
                    let uuid = _.get(device, "uuid", '');
                    $scope.wall = _.get(device, "dynamicData", {});
                    if (uuid) {
                        uuidArray.push(uuid);
                        websocket.sub({
                            topic: 'deviceData/' + uuid,
                            scope: $scope,
                            onmessage: function (data) {
                                $scope.wall = _.get(data, 'data', {});
                                util.apply($scope);
                            }
                        });
                    }
                });
                DBUtils.find('device', {
                    'rearSetting.show': true
                }).success(function (result) {
                    let device = _.get(result, 'datas.result', {});
                    let uuid = _.get(device, "uuid", '');
                    $scope.rearSetting = _.get(device, "dynamicData", {});
                    if (uuid) {
                        uuidArray.push(uuid);
                        websocket.sub({
                            topic: 'deviceData/' + uuid,
                            scope: $scope,
                            onmessage: function (data) {
                                $scope.rearSetting = _.get(data, 'data', {});
                                util.apply($scope);
                            }
                        });
                    }
                });
                DBUtils.find('device', {
                    'rotating.show': true
                }).success(function (result) {
                    let device = _.get(result, 'datas.result', {});
                    let uuid = _.get(device, "uuid", '');
                    $scope.rotating = _.get(device, "dynamicData", {});
                    if (uuid) {
                        uuidArray.push(uuid);
                        websocket.sub({
                            topic: 'deviceData/' + uuid,
                            scope: $scope,
                            onmessage: function (data) {
                                $scope.rotating = _.get(data, 'data', {});
                                util.apply($scope);
                            }
                        });
                    }
                });
                DBUtils.find('device', {
                    'needle.show': true
                }).success(function (result) {
                    let device = _.get(result, 'datas.result', {});
                    let uuid = _.get(device, "uuid", '');
                    $scope.needle = _.get(device, "dynamicData", {});
                    if (uuid) {
                        uuidArray.push(uuid);
                        websocket.sub({
                            topic: 'deviceData/' + uuid,
                            scope: $scope,
                            onmessage: function (data) {
                                $scope.needle = _.get(data, 'data', {});
                                util.apply($scope);
                            }
                        });
                    }
                });
                DBUtils.find('device', {
                    'refrigerating.show': true
                }).success(function (result) {
                    let device = _.get(result, 'datas.result', {});
                    let uuid = _.get(device, "uuid", '');
                    $scope.refrigerating = _.get(device, "dynamicData", {});
                    if (uuid) {
                        uuidArray.push(uuid);
                        websocket.sub({
                            topic: 'deviceData/' + uuid,
                            scope: $scope,
                            onmessage: function (data) {
                                $scope.refrigerating = _.get(data, 'data', {});
                                util.apply($scope);
                            }
                        });
                    }
                });
            },
            initLineChart: function () {
                if (!line_pie_chart) {
                    let options = {
                        tooltip: {
                            trigger: 'item',
                            formatter: "{a} <br/>{b}: {c} ({d}%)"
                        },
                        legend: {
                            orient: 'vertical',
                            y: 'center',
                            right: 50,
                            data: ['Normal', 'Fault', 'Warning', 'Offline']
                        },
                        color: ["#55B737", "#ef6c40", "#fecc55", "#999999"],
                        series: [
                            {
                                name: 'state',
                                type: 'pie',
                                radius: ['40%', '80%'],
                                minShowLabelAngle: 10,
                                label: {
                                    normal: {
                                        show: true,
                                        position: 'inner',
                                        formatter: "{d}%"
                                    }
                                },
                                center:["30%","50%"],
                                data: [
                                    {value: 5, name: 'Normal'},
                                    {value: 2, name: 'Fault'},
                                    {value: 1, name: 'Warning'},
                                    {value: 2, name: 'Offline'}
                                ]
                            }
                        ]
                    };

                    let line_pie_chartEle = $('.line-pie-chart');
                    line_pie_chart = echarts.init(line_pie_chartEle[0]);
                    line_pie_chart.setOption(options);
                }
            },
            initLineHistoryChart: function () {
                let xarr = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], yarr = [];
                for (let i = 0; i < 7; i++) {
                    //xarr暂时固定为周一至周日
                    // xarr.unshift(moment().subtract(i, "days").format("YYYY-MM-DD"));
                    let yvalue = ctrl.getRandomNum(50, 300);
                    yarr.unshift(yvalue);
                    $scope.allProductCount += yvalue;
                }
                if (!product_line_history_chart) {
                    let options = {
                        grid: {
                            left: 50,
                            right: 15,
                            top: 15,
                            bottom: 30
                        },
                        color: ['#3398DB'],
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                                type: 'line'        // 默认为直线，可选为：'line' | 'shadow'
                            }
                        },
                        xAxis: [
                            {
                                type: 'category',
                                data: xarr,
                                axisTick: {
                                    alignWithLabel: true
                                }
                            }
                        ],
                        yAxis: [
                            {
                                type: 'value'
                            }
                        ],
                        series: [
                            {
                                name: 'Yield',
                                type: 'bar',
                                barWidth: '30%',
                                data: yarr
                            }
                        ]
                    };
                    let product_line_history_chartEle = $('.product-line-history-chart');
                    product_line_history_chart = echarts.init(product_line_history_chartEle[0]);
                    product_line_history_chart.setOption(options);
                }
            },
            initGoodBadChart: function () {
                if (!good_bad_chart) {
                    let options = {
                        color: ['#55B737', '#ef6c40', '#fecc55'],
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                                type: 'line'        // 默认为直线，可选为：'line' | 'shadow'
                            }
                        },
                        legend: {
                            data: ['fine', 'Fault', 'Warning']
                        },
                        grid: {
                            left: '3%',
                            right: '4%',
                            bottom: '3%',
                            containLabel: true
                        },
                        xAxis: {
                            type: 'value'
                        },
                        yAxis: {
                            type: 'category',
                            data: ['Plan Cutting machine', 'stitching machine', 'Backparts moulding machine', 'U type heat setting machine', 'Assembly line', 'Wall-sole press machine', 'U type chiller', 'Metal detector']
                        },
                        series: [
                            {
                                name: 'fine',
                                type: 'bar',
                                stack: 'total',
                                label: {
                                    normal: {
                                        show: true,
                                        position: 'insideRight'
                                    }
                                },
                                data: [7, 6, 6, 7, 7, 6, 7, 7]
                            },
                            {
                                name: 'Fault',
                                type: 'bar',
                                stack: 'total',
                                label: {
                                    normal: {
                                        show: true,
                                        position: 'insideRight'
                                    }
                                },
                                data: [1, 1, 2, 1, 1, 1, 1, 1]
                            },
                            {
                                name: 'Warning',
                                type: 'bar',
                                stack: 'total',
                                label: {
                                    normal: {
                                        show: true,
                                        position: 'insideRight'
                                    }
                                },
                                data: [1, 1, 1, 1, 1, 1, 1, 1]
                            }
                        ]
                    };
                    let good_bad_chartEle = $('.good-bad-chart');
                    good_bad_chart = echarts.init(good_bad_chartEle[0]);
                    good_bad_chart.setOption(options);
                }
            },
            initBadInfoChart: function () {
                if (!bad_info_chart) {
                    let options = {
                        color: ['#fecc55'],
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                                type: 'line'        // 默认为直线，可选为：'line' | 'shadow'
                            }
                        },
                        xAxis: {
                            type: 'category',
                            boundaryGap: false,
                            data: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                        },
                        yAxis: {
                            type: 'value'
                        },
                        series: [{
                            data: [5, 3, 4, 3, 5, 2, 1],
                            type: 'line',
                            areaStyle: {}
                        }]
                    };
                    let bad_info_chartEle = $('.bad-info-chart');
                    bad_info_chart = echarts.init(bad_info_chartEle[0]);
                    bad_info_chart.setOption(options);
                }

            }
        });
        ctrl.initialize();
    }])
});