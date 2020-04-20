define([], function () {
    var app = angular.module('app');

    app.controller('AppWeldBarcodeController', ['$scope', 'dialog', 'AppDataService', 'util', 'DBUtils', 'WeldService',
        function ($scope, dialog, AppDataService, util, DBUtils, WeldService) {
            var ctrl = this;

            const app_key = 'weld_robot_history';
            let device = $scope.device;
            var start = $scope.start;
            var end = $scope.end;

            var startMill = start.valueOf();
            var endMill = end.valueOf();
            var pageRoute = $scope.pageRoute;

            $scope.barcodeTitleDate = start.format('YYYY-MM-DD HH:mm:ss') + ' ~ ' + end.format('YYYY-MM-DD HH:mm:ss');

            var totalStateMap = {}

            var dateArr = [];

            $scope.showTimelineBtn = false;

            $scope.barcodeList = [];
            $scope.config = {};
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initLayout();
                    ctrl.loadConfig();
                    ctrl.initDateList();
                    ctrl.loadBarcodeList();
                },
                initDateList: function () {
                    var date1 = start.format('YYYY_M_D');
                    var date2 = end.format('YYYY_M_D');
                    dateArr.push(date1);
                    if (date1 !== date2) {
                        dateArr.push(date2);
                    }
                },
                addTotal: function (key, value) {
                    if (value) {
                        value = parseFloat(value);
                        if (_.isNaN(value)) {
                            value = 0;
                        }
                        var total = _.get(totalStateMap, key, 0);
                        total += value;
                        _.set(totalStateMap, key, total);
                    }
                },
                loadConfig: function () {
                    AppDataService.get('weld_robot_history_config').success(function (config) {
                        $scope.config = config;
                        if (config.timeline === '1') {
                            $scope.showTimelineBtn = true;
                        }
                    });
                },
                formatPeriod: function (input) {
                    var sec_num = parseInt(input, 10);
                    var hours = Math.floor(sec_num / 3600);
                    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
                    var seconds = sec_num - (hours * 3600) - (minutes * 60);

                    var strArr = [];
                    if (hours > 0) {
                        strArr.push(hours);
                        strArr.push('时');
                    }
                    if (minutes > 0) {
                        strArr.push(minutes);
                        strArr.push('分');
                    }
                    if (seconds > 0) {
                        strArr.push(seconds);
                        strArr.push('秒');
                    }
                    return _.join(strArr, '');
                },
                inShiftDate: function (item) {
                    var value = new Date(item.start).getTime();
                    return value >= startMill && value <= endMill;
                },
                valueTo2Decimal: function (value) {
                    value = parseFloat(value);
                    if (_.isNaN(value)) {
                        value = 0;
                    }
                    value = value.toFixed(2);
                    return value;
                },
                loadBarcodeList: function () {
                    var keys = [];
                    _.each(dateArr, function (item) {
                        var key = `weld_robot_history_${device.uuid}_${item}`;
                        keys.push(key);
                    });
                    /*根据班次决定是否加载多天数据*/
                    dialog.waiting('数据加载中...');
                    DBUtils.list('appData', {
                        key: {
                            $in: keys
                        }
                    }).success(function (result) {
                        var resultList = _.get(result, 'datas.result', []);

                        var list = [];
                        _.each(resultList, function (item) {
                            var sublist = _.get(item, 'data.arr', []);
                            list = _.concat(list, sublist);
                        });
                        /*筛选确定在排班时间内的数据*/

                        list = _.filter(list, function (item) {
                            return ctrl.inShiftDate(item);
                        });

                        list = _.sortBy(list, 'start');

                        var barcodeMap = {};
                        _.each(list, function (item) {
                            var barcode = item.barcode;
                            var barcodeArr = barcodeMap[barcode] || [];
                            barcodeArr.push(item);
                            _.set(barcodeMap, barcode, barcodeArr);
                        });

                        var barcodeList = [];

                        _.each(barcodeMap, function (list, barcode) {
                            var barcodeNGTimes = 0, barcodeOkTimes = 0, barcodeNoResult = 0, period = 0;
                            var barcodeItem = {};
                            _.each(list, function (item) {
                                ctrl.addTotal('wire_length', ctrl.valueTo2Decimal(item.wire_length));
                                ctrl.addTotal('wire_density', ctrl.valueTo2Decimal(item.wire_density));
                                if (item.result === 'OK') {
                                    barcodeOkTimes++;
                                } else if (item.result === 'NG') {
                                    barcodeNGTimes++;
                                } else {
                                    barcodeNoResult++;
                                }
                                if (!barcodeItem.start) {
                                    barcodeItem.start = item.start;
                                }
                                barcodeItem.end = item.end;
                                var itemPeriod = parseFloat(item.period);
                                if (_.isNaN(itemPeriod)) {
                                    itemPeriod = 0;
                                }
                                period += itemPeriod;
                            });
                            ctrl.addTotal('product', 1);
                            barcodeItem.ngTimes = barcodeNGTimes;
                            barcodeItem.okTimes = barcodeOkTimes;
                            barcodeItem.noResultTimes = barcodeNoResult;
                            barcodeItem.barcode = barcode;
                            ctrl.addTotal('period', period);
                            barcodeItem.period = period.toFixed(2);

                            if (barcodeNGTimes > 0) {
                                barcodeItem.result = 'NG';
                                barcodeItem.result_desc = '不合格';
                                ctrl.addTotal('ngTimes', 1);
                            } else {
                                if (barcodeNoResult > 0) {
                                    barcodeItem.result = '';
                                    barcodeItem.result_desc = '';
                                } else {
                                    barcodeItem.result = 'OK';
                                    barcodeItem.result_desc = '合格';
                                    ctrl.addTotal('okTimes', 1);
                                }
                            }

                            var firstItem = _.first(list);
                            barcodeItem.MaterialName = _.get(firstItem, 'show_data.MaterialName', '');
                            barcodeItem.MaterialBatch = _.get(firstItem, 'show_data.MaterialBatch', '');
                            barcodeItem.times = list.length;
                            barcodeList.push(barcodeItem);
                        });

                        ctrl.renderTotal();
                        _.sortBy(barcodeList, ['start', 'MaterialName', 'MaterialBatch', 'barcode']);
                        $scope.barcodeList = barcodeList;
                        var timeline = _.get($scope, 'timeline', '0');
                        if (timeline === '1') {
                            delete totalStateMap['period'];
                            _.each(dateArr, function (date) {
                                ctrl.calcBarcodePeriod(date);
                            });
                        }
                        util.apply($scope);
                        dialog.hideWaiting();
                    });
                },
                processPeriod: function (dayItem) {
                    var list = _.get(dayItem, 'list', []);

                    var timeMap = {};
                    _.each(list, function (item) {
                        timeMap[item.barcode] = item;
                    });

                    _.each($scope.barcodeList, function (item) {
                        var barcode = item.barcode;
                        var barcodeItem = timeMap[barcode];
                        if (barcodeItem) {
                            item.start = barcodeItem.start;
                            item.end = barcodeItem.end;
                            var period = parseFloat(barcodeItem.period);
                            if (_.isNaN(period)) {
                                period = 0;
                            }
                            ctrl.addTotal('period', period);
                            item.period = period.toFixed(2);
                        }
                    });
                    ctrl.renderTotal();
                    util.apply($scope);
                },
                calcBarcodePeriod: function (date) {
                    var dataKey = `weld_robot_bar_period_${device.uuid}_${date}`;

                    AppDataService.get(dataKey).success(function (result) {
                        if (result.diffed === true) {
                            ctrl.processPeriod(result);
                        } else {
                            var dateFormat = _.replace(date, /_/g, '-');
                            var startDate = moment(new Date(dateFormat));
                            startDate.set('hour', 0);
                            startDate.set('minute', 0);
                            startDate.set('second', 0);

                            var endDate = moment(startDate);
                            endDate.set('hour', 23);
                            endDate.set('minute', 59);
                            endDate.set('second', 59);
                            DBUtils.aggregator('deviceData', {
                                $match: {
                                    uuid: device.uuid,
                                    time: {
                                        $gte: {
                                            //时区的处理
                                            '$date': startDate.valueOf()
                                        },
                                        $lt: {
                                            '$date': endDate.valueOf()
                                        }
                                    },
                                    'data.198_OneCompleteProcess': {
                                        $in: ["TRUE", "1", "true"]
                                    }
                                }
                            }, {
                                $sort: {
                                    'time': 1
                                }
                            }, {
                                $group: {
                                    _id: {
                                        barcode: '$data.168_MaterialBarcode'
                                    },
                                    start: {
                                        $first: '$time'
                                    },
                                    end: {
                                        $last: '$time'
                                    },
                                }
                            }).success(function (aggregateResult) {
                                var list = _.get(aggregateResult, 'datas.result', []);
                                var passedDay = WeldService.isPassedDay(startDate);
                                var barcodeTimeList = [];
                                _.each(list, function (item) {
                                    var barcode = _.get(item, '_id.barcode', '');
                                    if (barcode) {
                                        var period = (new Date(item.end).getTime() - new Date(item.start).getTime()) / 1000;
                                        barcodeTimeList.push({
                                            barcode: barcode,
                                            start: item.start,
                                            end: item.end,
                                            period: period
                                        });
                                    }
                                });
                                var timeData = {
                                    diffed: passedDay,
                                    list: barcodeTimeList
                                };
                                ctrl.processPeriod(timeData);
                                AppDataService.set(dataKey, timeData);
                            });
                        }
                    });
                },
                renderTotal: function () {
                    /*计算良率*/
                    var okTimes = _.get(totalStateMap, 'okTimes', 0);
                    var ngTimes = _.get(totalStateMap, 'ngTimes', 0);
                    var okPercent = okTimes / (okTimes + ngTimes) * 100;
                    if (_.isNaN(okPercent)) {
                        okPercent = 0;
                    }
                    totalStateMap['okPercent'] = okPercent;
                    $('.app_weld_summary .app_weld_summary_item_value').each(function () {
                        var item = $(this);

                        var valueKey = item.data('key');
                        var value = _.get(totalStateMap, valueKey, '');
                        if (valueKey === 'period') {
                            value = ctrl.formatPeriod(value);
                        }
                        if (valueKey === 'wire_density') {
                            if (value > 1000) {
                                value = value / 1000;
                                $('#app_weld_item_wire_density').text('千克');
                            } else {
                                $('#app_weld_item_wire_density').text('克');
                            }
                        }
                        if (valueKey === 'okPercent') {
                            if (!value) {
                                value = 0;
                            }

                            value = value.toFixed(2);
                        }
                        if (_.isNumber(value)) {
                            if (valueKey === 'product' || valueKey === 'days') {
                                value = parseInt(value);
                            } else {
                                value = value.toFixed(3);
                            }
                        }
                        item.html(value);
                    });
                },
                initLayout: function () {
                    var height = $(window).height();
                    $('.widget-body').height(height - 180);
                    $('.weldBody').height(height - 280);
                },
                showBarcodeDetail: function (index) {
                    var item = $scope.barcodeList[index];
                    if (pageRoute) {
                        pageRoute.go('barcodelist', {
                            start: start,
                            end: end,
                            barcodeStart: moment(item.start),
                            barcodeEnd: moment(item.end),
                            barcode: item.barcode,
                            device: device,
                            pageRoute: pageRoute,
                            shift_name: $scope.shift_name
                        });
                    }
                },
                showClockChart: function (index) {
                    var item = $scope.barcodeList[index];
                    if (item) {
                        dialog.show({
                            title: `时间轴分析(${item.barcode}) - ${item.period}秒`,
                            template: 'weld_robot_clock_chart_template',
                            width: 1200,
                            controller: 'WeldRobotClockChartController',
                            controllerAs: 'ctrl',
                            data: {
                                entity: {
                                    uuid: device.uuid,
                                    barcode: item.barcode,
                                    start: item.start,
                                    end: item.end
                                }
                            },
                            buttons: {}
                        });
                    }
                },
                exportBarcodeDatas: function (index) {
                    var item = $scope.barcodeList[index];
                    var date = moment(item.start);
                    var route_date = date.format('YYYY-MM-DD');

                    window.open('/weld/exportBarcode?uuid=' + device.uuid + '&date=' + route_date + '&barcode=' + item.barcode);
                },
                goCalendarView: function () {
                    if (pageRoute) {
                        pageRoute.go('calendar', {
                            gotoday: start.format('YYYY-MM-DD'),
                            device: device,
                            pageRoute: pageRoute
                        });
                    }
                },
            });
            ctrl.initialize();
        }]);
})