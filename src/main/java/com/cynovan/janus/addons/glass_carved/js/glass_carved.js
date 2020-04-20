define(["echarts", 'fullpage'], function (echarts) {
    var app = angular.module('app');
    app.factory('GlassEchartsOptionFactory', function () {
        var options = {};

        function init() {
            initMyChartOption();// 中长
            initMyChart2Option();// 中宽
        };

        function initMyChartOption() {
            options['myChart'] = {
                title: {
                    text: '中长:未开启智能刀补与开启智能刀补的数据对比',
                    left: "10%",
                    textStyle: {
                        color: '#fdfdfd'
                    }
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['未开启刀补', '开启刀补', '标准值'],
                    right: "10%",
                    textStyle: {
                        color: '#fcfcfc'
                    }
                },
                grid: {
                    containLabel: false,
                },
                textStyle: {//图例文字的样式
                    color: '#f0f0f0'
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    axisLine: {
                        lineStyle: {
                            color: 'white'
                        }
                    },
                    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]
                },
                yAxis: {
                    min: 154.065,
                    max: 154.085,
                    axisLine: {
                        lineStyle: {
                            color: 'white'
                        }
                    },

                    splitLine: {
                        show: false
                    }
                },
                series: [
                    {
                        lineStyle: {
                            width: 2
                        },
                        color: "rgb(254,67,101)",
                        name: '未开启刀补',
                        type: 'line',
                        data: [
                            154.0747,
                            154.0751,
                            154.0769,
                            154.0747,
                            154.0748,
                            154.0752,
                            154.0756,
                            154.0757,
                            154.0758,
                            154.074,
                            154.0764,
                            154.0763,
                            154.076,
                            154.075,
                            154.0748,
                            154.079,
                            154.0786,
                            154.0775,
                            154.079,
                            154.0774,
                            154.0796,
                            154.0782,
                            154.0804,
                            154.0802,
                            154.0776,
                            154.0789,
                            154.0794,
                            154.0787,
                            154.0798,
                            154.0784,
                            154.081,
                            154.0789,
                            154.0801,
                            154.0785,
                            154.082,
                            154.08,
                            154.0787,
                            154.0796,
                            154.0805,
                            154.0766
                        ]
                    }, {
                        name: '开启刀补',
                        type: 'line',
                        lineStyle: {
                            width: 2
                        },
                        color: "rgb(174,221,129)",
                        data: [
                            154.0698,
                            154.0683,
                            154.0744,
                            154.0715,
                            154.0738,
                            154.0714,
                            154.0732,
                            154.0733,
                            154.0736,
                            154.0738,
                            154.0745,
                            154.0721,
                            154.0711,
                            154.0715,
                            154.0741,
                            154.0722,
                            154.0736,
                            154.0759,
                            154.0754,
                            154.0732,
                            154.0725,
                            154.0735,
                            154.0742,
                            154.0719,
                            154.0759,
                            154.0711,
                            154.0752,
                            154.0727,
                            154.0759,
                            154.0724,
                            154.0693,
                            154.0741,
                            154.0718,
                            154.0718,
                            154.0734,
                            154.0736,
                            154.0724,
                            154.0731,
                            154.0723,
                            154.0716

                        ]
                    }, {
                        smooth: true,
                        symbol: 'none',
                        name: '标准值',
                        type: 'line',
                        color: "rgb(90,136,193)",
                        lineStyle: {
                            width: 2
                        },
                        data: [
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07,
                            154.07
                        ]
                    }
                ]
            }
        };

        function initMyChart2Option() {
            options['myChart2'] = {
                title: {
                    text: '中宽: 未开启智能刀补与开启智能刀补的数据对比',
                    left: "10%",
                    textStyle: {
                        color: '#f9f9f9'
                    }
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['未开启刀补', '开启刀补', '标准值'],
                    right: "10%",
                    textStyle: {
                        color: '#f9f9f9'
                    }
                },
                grid: {
                    containLabel: false
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    axisLine: {
                        lineStyle: {
                            color: 'white'
                        }
                    },
                    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]
                },
                textStyle: {
                    color: '#f0f0f0'
                },
                yAxis: {
                    min: 74.445,
                    max: 74.465,
                    axisLine: {
                        lineStyle: {
                            color: 'white'
                        }
                    },
                    splitLine: {
                        show: false
                    },
                },
                series: [
                    {
                        lineStyle: {
                            width: 2
                        },
                        color: "rgb(254,67,101)",
                        name: '未开启刀补',
                        type: 'line',
                        data: [
                            74.4554,
                            74.4523,
                            74.4551,
                            74.4517,
                            74.4563,
                            74.4537,
                            74.4567,
                            74.4553,
                            74.4574,
                            74.4527,
                            74.4574,
                            74.4547,
                            74.4589,
                            74.4534,
                            74.4565,
                            74.453,
                            74.4561,
                            74.4516,
                            74.4585,
                            74.4525,
                            74.4572,
                            74.4528,
                            74.4609,
                            74.4561,
                            74.4565,
                            74.4549,
                            74.4623,
                            74.4536,
                            74.4559,
                            74.4532,
                            74.4593,
                            74.4542,
                            74.4602,
                            74.4536,
                            74.4564,
                            74.452,
                            74.4574,
                            74.4546,
                            74.4578,
                            74.4525

                        ]
                    }, {
                        lineStyle: {
                            width: 2
                        },
                        color: "rgb(174,221,129)",
                        name: '开启刀补',
                        type: 'line',
                        data: [
                            74.46,
                            74.4559,
                            74.4592,
                            74.4565,
                            74.4597,
                            74.4568,
                            74.4599,
                            74.4558,
                            74.4592,
                            74.4567,
                            74.4601,
                            74.4567,
                            74.4597,
                            74.456,
                            74.4591,
                            74.4589,
                            74.4631,
                            74.459,
                            74.4631,
                            74.4579,
                            74.4602,
                            74.4594,
                            74.4618,
                            74.4592,
                            74.4642,
                            74.4592,
                            74.4633,
                            74.4595,
                            74.4637,
                            74.4594,
                            74.4606,
                            74.458,
                            74.4608,
                            74.4581,
                            74.4622,
                            74.4589,
                            74.4634,
                            74.4591,
                            74.4619,
                            74.4575

                        ]
                    }, {
                        smooth: true,
                        symbol: 'none',
                        name: '标准值',
                        type: 'line',
                        color: "rgb(90,136,193)",
                        lineStyle: {
                            width: 2
                        },
                        data: [
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45,
                            74.45
                        ]
                    }
                ]
            }
        };

        init();

        var _getOption = function (key) {
            if (options.hasOwnProperty(key)) {
                return options[key];
            }
            return {};
        };

        return {
            getOption: _getOption
        }
    });
    app.factory('GlassDynamicDataConfigFactory', function () {
        var config = [];

        function initDataConfing() {
            config = [
                {
                    page: 1, // 设备联网页
                    rules: [
                        {
                            timeout: 3000,
                            target: "mes-message-box",
                            msg: "下达生产指令",
                        },
                        {
                            timeout: 6000,
                            target: "janus-message-box",
                            msg: "查找NC文件,转发“启动加工”",
                            cmdValue: {
                                "action": "update",
                                "data": {
                                    "CNCstart": true
                                }
                            }
                        },
                        {
                            item: {
                                CNCstart: "true"
                            },
                            target: "glass-message-box",
                            msg: "启动加工,等待送料",
                        }
                    ]
                },
                {
                    page: 2, // 取件
                    rules: [
                        {
                            item: {
                                CNCmaterial: "false",
                                position: "1"
                            },
                            target: "janus-message-box",
                            msg: "转发缺料信号",
                            timeoutList: [
                                {
                                    timeout: 1000,
                                    target: "agv-message-box",
                                    msg: "移动至毛坯料仓"
                                },
                                {
                                    timeout: 2500,
                                    target: "janus-message-box",
                                    msg: "转发到位信号",
                                },
                                {
                                    timeout: 3500,
                                    target: "agv-message-box",
                                    msg: "从毛坯料仓取毛坯料"
                                },
                                {
                                    timeout: 6000,
                                    target: "janus-message-box",
                                    msg: "转发取料完成信号",
                                },
                                {
                                    timeout: 7000,
                                    target: "agv-message-box",
                                    msg: "移动至精雕玻璃机",
                                },
                                {
                                    timeout: 8000,
                                    pageNext: 3
                                }
                            ]
                        }
                    ]
                },
                {
                    page: 3,
                    rules: [
                        {
                            item: {
                                Agvdone: "true",
                                position: "1"
                            },
                            target: "janus-message-box",
                            msg: "转发物料就绪信号",
                            timeoutList: [
                                {
                                    timeout: 2000,
                                    target: "glass-message-box",
                                    msg: "打开门罩，等待放料"
                                },
                                {
                                    timeout: 4000,
                                    target: "janus-message-box",
                                    msg: "转发开门完成信号",
                                },
                                {
                                    timeout: 6000,
                                    target: "agv-message-box",
                                    msg: "毛坯料放入精雕玻璃机工作台中"
                                }
                            ]
                        }
                    ]
                },
                {
                    page: 4, // 加工
                    rules: [
                        {
                            item: {
                                Agvdone: "true",
                                position: "2"
                            },
                            target: "janus-message-box",
                            msg: "转发“放料完成”信号",
                            timeoutList: [
                                {
                                    timeout: 3000,
                                    target: "glass-message-box",
                                    msg: "关闭门罩,启动加工,直到加工完成"
                                }
                            ]
                        },
                        {
                            nextSignal: true,
                            item: {
                                CNCfinish: "true",
                                position: "2"
                            },
                            target: "janus-message-box",
                            msg: "转发“加工完成”信号",
                            timeoutList: [
                                {
                                    timeout: 1500,
                                    target: "agv-message-box",
                                    msg: "从精雕玻璃机工作台中取出工件"
                                },
                                {
                                    timeout: 4000,
                                    target: "janus-message-box",
                                    msg: "转发“取工件完成”信号",
                                }
                            ]
                        }
                    ]
                },
                {
                    page: 5, // 检测
                    rules: [
                        {
                            timeout: 100,
                            target: "agv-message-box",
                            msg: "移动至AOI",
                        },
                        {
                            timeout: 2000,
                            target: "janus-message-box",
                            msg: "转发“到位”信号",
                        },
                        {
                            timeout: 3000,
                            target: "agv-message-box",
                            msg: "将工件放入AOI工作台中"
                        },
                        {
                            timeout: 6500,
                            target: "janus-message-box",
                            msg: "转发“放置完成”信号",
                        },
                        {
                            timeout: 8000,
                            target: "aoi-message-box",
                            msg: "启动检测，上传测试数据"
                        }
                    ]
                },
                {
                    page: 6, // 刀补计算
                    rules: [
                        {
                            timeout: 100,
                            target: "janus-message-box",
                            msg: "刀补计算",
                        },
                        {
                            timeout: 2000,
                            target: "janus-message-box",
                            msg: "转发“刀补调整值”",
                            cmdValue: {
                                "action": "update",
                                "data": {
                                    "cmd": "WriteTool",
                                    "Z1_T1_H": "0.01"
                                }
                            }
                        },
                        {
                            timeout: 3500,
                            target: "glass-message-box",
                            msg: "更新刀补"
                        }
                    ]
                },
                {
                    page: 7, // 放件
                    rules: [
                        {
                            item: {
                                AOIdone: "true",
                                position: "3"
                            },
                            target: "janus-message-box",
                            msg: "转发“检测完成”信号",
                            timeoutList: [
                                {
                                    timeout: 1000,
                                    target: "agv-message-box",
                                    msg: "取出工件"
                                },
                                {
                                    timeout: 4000,
                                    target: "janus-message-box",
                                    msg: "转发“取件完成”信号",
                                },
                                {
                                    timeout: 6000,
                                    target: "agv-message-box",
                                    msg: "移动至成品仓"
                                },
                                {
                                    timeout: 7500,
                                    pageNext: 8
                                },
                                {
                                    timeout: 10500,
                                    target: "janus-message-box",
                                    msg: "转发“到位”信号",
                                },
                                {
                                    timeout: 12500,
                                    target: "agv-message-box",
                                    msg: "放工件至成品仓"
                                },
                                {
                                    timeout: 16000,
                                    pageNext: 9
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        initDataConfing();
        var _getConfig = function () {
            return config;
        };
        return {
            getConfig: _getConfig
        }
    });
    app.controller("GlassController", ['$scope', 'dialog', 'GlassEchartsOptionFactory', 'AppDataService', 'websocket', 'GlassDynamicDataConfigFactory', 'DevicePushService', '$element',
        function ($scope, dialog, GlassEchartsOptionFactory, AppDataService, websocket, GlassDynamicDataConfigFactory, DevicePushService, $element) {
            var ctrl = this;
            var appName = 'glass', configKey = 'carved';
            var config = GlassDynamicDataConfigFactory.getConfig();

            var uuid;
            var prevData = {};
            var currentPage = 0;
            var pageChange = true;

            var timeoutEventArr = [];

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.initBindDevice();
                    ctrl.initFullpage();
                    ctrl.initEcharts();
                    ctrl.calcPageHeight();
                },
                calcPageHeight: function () {
                    var height = $(window).height();
                    height = height - 59;
                    $('#app-main').height(height);
                },
                bindEvent: function () {
                    ctrl.switchCarouselStatus();
                    ctrl.checkJanusData();
                    ctrl.onBindDeviceBtn();
                },
                switchCarouselStatus: function () {
                    // 监听开始暂停按钮function
                    $(".glass-pause").on("click", function () {
                        if (this.value == "暂停") {
                            ctrl.stopCarousel(this);
                        } else {
                            ctrl.startCarousel(this)
                        }
                    });
                },
                checkJanusData: function () {
                    // 查看Janus设备连接情况
                    $(".checkJanusData").on("click", function () {
                        var url = window.location.href;
                        url = url.split("#")[0];
                        if ($(this).hasClass('linkdata')) {
                            url = url + "#/app/triton/menu/1"; // 查看Janus设备连接情况>>
                        } else if ($(this).hasClass('knife')) {
                            url = url + "#/app/cnc/menu/1/r/" + uuid + '?tab=1';// 查看Janus智能刀补 tab=2
                        } else {
                            url = url + "#/app/cnc/menu/1/r/" + uuid + '?tab=2'; // 查看Janus设备实时数据 tab=3
                        }
                        window.open(url, '_blank');
                        // var btn = $(this).closest(".rightinfo").find(".glass-pause")[0];
                        // ctrl.stopCarousel(btn);// 暂停
                    });
                },
                onBindDeviceBtn: function () {
                    // 绑定设备function
                    $(".bindDevice").on("click", function () {
                        var btn = $(this).closest(".rightinfo").find(".glass-pause")[0];
                        ctrl.stopCarousel(btn);
                        ctrl.bindDevice();
                    });
                },
                initBindDevice: function () {
                    AppDataService.get(appName, configKey).success(function (result) {
                        if (_.isEmpty(result)) {
                            dialog.noty("请绑定相关设备"); // 未绑定相关设备时,页面为暂停
                            var bindDeviceBtn = $(".bindDevice").closest(".rightinfo").find(".glass-pause")[0];
                            ctrl.stopCarousel(bindDeviceBtn);
                        } else {
                            uuid = result.uuid;
                            ctrl.subscribeData(uuid);
                        }
                    });
                },
                initFullpage: function () {
                    if ($('html').hasClass('fp-enabled')) {
                        $.fn.fullpage.destroy("all"); // 解决
                        clearInterval(ctrl.time);
                    }
                    $('#fullpage').fullpage({
                        controlArrows: false,
                        scrollingSpeed: "SCROLLING_SPEED",
                        keyboardScrolling: false,
                        afterSlideLoad: function (anchorLink, index, slideAnchor) {

                            //removeClass:使下次轮播时可以重新添加class实现动画效果
                            if ($(".needremove1:eq(0)").hasClass("remove-1")) {
                                $(".needremove1:eq(0)").removeClass("remove-1");
                            }
                            if ($(".needremove2:eq(0)").hasClass("remove-2")) {
                                $(".needremove2:eq(0)").removeClass("remove-2");
                            }
                            if ($(".needremove3:eq(0)").hasClass("remove-3")) {
                                $(".needremove3:eq(0)").removeClass("remove-3");
                            }
                            for (var i = 1; i < 7; i++) {
                                if ($(".nowon" + i + ":eq(0)").hasClass("nowon")) {
                                    $(".nowon" + i + ":eq(0)").removeClass("nowon");
                                }
                            }

                            switch (slideAnchor.index) {
                                case 0:
                                    break;
                                case 1:  // 设备联网
                                    $(".nowon1:eq(0)").addClass("nowon");// 控制流程状态样式
                                    $(".to-disconnet").removeClass('to-disconnet').addClass("to-connect");//工作指示灯,全部连接表示联网成功
                                    setTimeout(function () {
                                        $(".to-connect").removeClass('to-connect').addClass("to-disconnet");
                                    }, 3000);
                                    break;
                                case 2: // 取件,AGV位于仓库
                                    $(".agv-message-box .to-disconnet").removeClass('to-disconnet').addClass("to-connect");
                                    $(".nowon2:eq(0)").addClass("nowon");
                                    break;
                                case 3: // 取件,AGV位于玻璃精雕机
                                    $(".needremove1:eq(0)").addClass("remove-1"); // 从仓库移动到精雕玻璃机
                                    break;
                                case 4: // 加工
                                    $(".nowon3:eq(0)").addClass("nowon");
                                    break;
                                case 5: // 检测
                                    $(".nowon4:eq(0)").addClass("nowon");
                                    $(".needremove2:eq(0)").addClass("remove-2"); // 从精雕玻璃机移动到AOI
                                    break;
                                case 6: // 刀补计算
                                    $(".nowon5:eq(0)").addClass("nowon");
                                    break;
                                case 7: // 放件,AGV位于AOI
                                    $(".nowon6:eq(0)").addClass("nowon");
                                    break;
                                case 8: // 放件,AGV位于仓库
                                    $(".needremove3:eq(0)").addClass("remove-3"); // 从AOI移动到仓库
                                    break;
                                default:
                                    break;
                            }
                        }
                    });
                },
                initEcharts: function () {
                    var myChart = echarts.init($('.chart-content')[0]);
                    var option = GlassEchartsOptionFactory.getOption('myChart');
                    myChart.setOption(option);

                    var myChart2 = echarts.init($('.chart-content')[1]);
                    var option2 = GlassEchartsOptionFactory.getOption('myChart2');
                    myChart2.setOption(option2);
                },
                subscribeData: function (uuid) {
                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
                        onmessage: function (data) {
                            ctrl.onData(data.data);
                            prevData = data.data;
                        }
                    });
                },
                onData: function (data) {
                    ctrl.setPage(data);
                    ctrl.setNoty(data);

                    // 栏位绑定.
                    var dynamicSpan = $element.find('.dynamicSpan');
                    _.each(dynamicSpan, function (element) {
                        var key = $(element).data('key');
                        var value = data[key];
                        $(element).text(value);
                    });
                },
                setPage: function (data) {
                    var page = parseInt(data.page);
                    var prevPage = parseInt(prevData.page);
                    if (page !== prevPage) {
                        currentPage = page;
                        pageChange = true;
                        $('.show-content').removeClass('active');
                        $.fn.fullpage.moveTo(1, currentPage);
                    } else {
                        if (currentPage != page) {
                            pageChange = true;
                        } else {
                            pageChange = false;
                        }
                    }
                },
                sendTimeout: function (rule) {
                    var timeEvent = setTimeout(function () {
                        ctrl.showNoty(rule.target, rule.msg);
                        _.remove(timeoutEventArr, timeEvent);
                        if (rule.cmdValue) {// 下发命令
                            DevicePushService.pushAction(uuid, rule.cmdValue);
                        }
                    }, rule.timeout);
                    return timeEvent;
                },
                sendTimeout2: function (item) {
                    var timeEvent = setTimeout(function () {
                        if (item.pageNext) {// 取件&放件时需手动驱动下一页,设备不会上来页码数据
                            $.fn.fullpage.moveTo(1, item.pageNext);
                            currentPage = item.pageNext;
                            if (currentPage === 9) {
                                // 当页面跑到最后一页echart图时,停留7s后返回第一页
                                setTimeout(function () {
                                    $.fn.fullpage.moveTo(1, 0);
                                }, 20000)
                            }
                        } else {
                            ctrl.showNoty(item.target, item.msg);
                        }
                        _.remove(timeoutEventArr, timeEvent);
                    }, item.timeout);
                    return timeEvent;
                },
                setNoty: function (data) {
                    var currentPageConfig = _.find(config, {page: currentPage});
                    var rules = _.get(currentPageConfig, 'rules', []);
                    for (var i = 0; i < rules.length; i++) {
                        var rule = rules[i];
                        if (rule.timeout && pageChange == true) {
                            var timeEvent = ctrl.sendTimeout(rule);
                            timeoutEventArr.push(timeEvent);
                        } else {
                            var flag = true;

                            var currentValueSet = [];
                            var prevValueSet = [];
                            _.each(rule.item, function (value, key) { // 判断当前数据是否符合规则
                                var currentValue = _.lowerCase(_.toString(_.get(data, key, '')));
                                currentValueSet.push(currentValue);
                                var prevValue = _.lowerCase(_.toString(_.get(prevData, key, '')));
                                prevValueSet.push(prevValue);
                                if (currentValue !== value) { // 不符合规则时,气泡不显示
                                    flag = false;
                                }
                            });

                            // 判断一组规则是否都没发生变化,
                            if (flag === true && !_.isEmpty(prevData)) {
                                currentValueSet = _.join(currentValueSet, ',')
                                prevValueSet = _.join(prevValueSet, ',');
                                if (currentValueSet === prevValueSet) {
                                    flag = false;
                                }
                            }
                            // 当所有条件都满足时,才显示气泡.
                            if (flag === true) {
                                ctrl.showNoty(rule.target, rule.msg);
                                if (rule.timeoutList) {
                                    if (pageChange == true || rule.nextSignal) {
                                        _.each(rule.timeoutList, function (item) {
                                            var timeEvent = ctrl.sendTimeout2(item);
                                            timeoutEventArr.push(timeEvent);
                                        })
                                    }
                                }
                            }
                        }
                    }
                },
                showNoty: function (target, msg) {
                    $('.to-connect').removeClass('to-connect').addClass('to-disconnet');
                    $('.show-content').removeClass('active');
                    $('.' + target + ' .to-disconnet').removeClass('to-disconnet').addClass('to-connect');
                    $('.' + target + ' .show-content').addClass('active').text(msg);
                },
                bindDevice: function () {
                    dialog.show({
                        template: 'glass_carved_bind_device_template',
                        title: "绑定设备",
                        width: 800,
                        controller: 'GlassCarvedBindDeviceController',
                        controllerAs: 'ctrl',
                        data: {
                            trigger: {
                                onSuccess: function (AppConfig) {
                                    AppDataService.set(appName, configKey, AppConfig);
                                    dialog.notyWithRefresh('绑定成功,2秒后自动刷新页面运行', $scope);
                                    var bindDeviceBtn = $(".bindDevice").closest(".rightinfo").find(".glass-pause")[0];
                                    ctrl.startCarousel(bindDeviceBtn);// 绑定设备后,页面开始
                                },
                                onCancel: function (Appconfig) {
                                    if (_.isEmpty(Appconfig)) {
                                        dialog.noty("请绑定相关设备");
                                    } else {
                                        var bindDeviceBtn = $(".bindDevice").closest(".rightinfo").find(".glass-pause")[0];
                                        ctrl.startCarousel(bindDeviceBtn);
                                    }
                                }
                            }
                        }
                    });
                },
                stopCarousel: function (btn) {
                    btn.value = "开始";
                    _.each(timeoutEventArr, function (event) {
                        if (event) {
                            window.clearTimeout(event);
                        }
                    });
                    timeoutEventArr = [];
                    var cmdValue = {
                        "action": "update",
                        "data": {
                            "stop": true
                        }
                    };
                    DevicePushService.pushAction(uuid, cmdValue);
                },
                startCarousel: function (btn) {
                    btn.value = "暂停";
                    var cmdValue = {
                        "action": "update",
                        "data": {
                            "stop": false
                        }
                    };
                    DevicePushService.pushAction(uuid, cmdValue);
                },
            });
            ctrl.initialize();
        }]);
    app.controller('GlassCarvedBindDeviceController', ['$scope', 'AppComponent', '$timeout', 'dialog', 'AppDataService',
        function ($scope, AppComponent, $timeout, dialog, AppDataService) {
            var ctrl = this;
            var AppConfig = {};
            var appName = 'glass', configKey = 'carved';
            _.extend(ctrl, {
                initialize: function () {
                    $scope.$on('success', function (event, checkMessage) {
                        if (!AppConfig.uuid) {
                            dialog.noty("绑定的设备不能为空");
                            checkMessage.success = false;
                            return false;
                        }
                        $scope.trigger.onSuccess(AppConfig);
                    });

                    $scope.$on('cancel', function () {
                        $scope.trigger.onCancel(AppConfig);
                    });
                    $timeout(function () {
                        ctrl.initDeviceSelect();
                    }, 100);
                    // ctrl.initDeviceSelect();
                },
                initDeviceSelect: function () {
                    AppDataService.get(appName, configKey).success(function (result) {
                        if (!_.isEmpty(result)) {
                            AppConfig = result;
                        }
                        /*玻璃精雕机*/
                        var uuid = _.get(AppConfig, 'uuid', '');
                        AppComponent.deviceselect($('#glass_carved_bind_device_box'), {}, uuid).progress(function (bind) {
                            _.set(AppConfig, 'uuid', bind.uuid);
                            _.set(AppConfig, 'deviceName', bind.deviceName);
                        });
                    });
                },
            });
            ctrl.initialize();
        }]);
});