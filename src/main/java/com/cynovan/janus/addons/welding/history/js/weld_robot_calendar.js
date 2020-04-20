define(['echarts', 'fullcalendar', 'welding/history/js/weld_robot_history_service'], function (echarts) {
    var app = angular.module('app');

    app.controller('AppWeldController', ['$scope', 'AppComponent', '$timeout', '$element', 'dialog', 'DBUtils', 'Route',
        function ($scope, AppComponent, $timeout, $element, dialog, DBUtils, Route) {
            var ctrl = this;
            var pageRoute = null;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initRoute();
                },

                initRoute: function () {
                    pageRoute = Route.element($element)
                        .state('calendar', {
                            template: 'app_weld_calendar_template'
                        }).state('daylist', {
                            template: 'app_weld_barcode_template'
                        }).state('barcodelist', {
                            template: 'app_weld_barcode_list_template'
                        });

                    pageRoute.go('calendar', {
                        pageRoute: pageRoute
                    });
                }
            });
            $timeout(function () {
                ctrl.initialize();
            }, 300);
        }]);

    app.controller('AppWeldCalendarController', ['$scope', '$element', '$timeout', 'AppComponent', 'DBUtils', 'dialog', 'WeldService', 'util', 'AppDataService',
        function ($scope, $element, $timeout, AppComponent, DBUtils, dialog, WeldService, util, AppDataService) {

            var paramConfig;

            /** -------------- THE END --------------**/
            const app_key = 'weld_robot_history';
            var gotoday = $scope.gotoday;
            var ctrl = this;
            var device = $scope.device || {}, pageRoute = $scope.pageRoute;
            var indexedDay = 0, currentMonthCount = 0;

            var totalStateMap = {};
            var barcodeXYZList = [];
            var weldShifts = $scope.weldShifts = [];
            var weldDetailShifts = [];
            var eventMap = {};
            var workdaySet = new Set();
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.getOldUuid();
                    ctrl.initCalendar();
                },
                getOldUuid: function () {
                    AppDataService.get('welding', 'welding_device_history').success(function (result) {
                        if (!_.isEmpty(result)) {
                            device.uuid = _.get(result, 'uuid', '');
                        }
                        ctrl.initDeviceSelect();
                    });
                },
                initDeviceSelect: function () {
                    AppComponent.deviceselect($element.find('#appWeldDeviceSelect'), {
                        'welding.show': true
                    }, device.uuid || '').progress(function (bind) {
                        if (bind.uuid) {
                            AppDataService.set('welding', 'welding_device_history', {uuid: bind.uuid});
                        } else {
                            AppDataService.set('welding', 'welding_device_history', {});
                        }
                        device = bind;
                        ctrl.loadCalendarEvents();
                    });
                },
                appConfig: function () {
                    if (!device.uuid) {
                        dialog.noty('请选择设备!');
                        return false;
                    }
                    dialog.show({
                        template: 'app_weld_data_config_template',
                        title: "应用配置",
                        width: 1100,
                        data: {
                            bind: device
                        },
                        controller: 'WeldDataConfigController',
                        controllerAs: 'ctrl',
                    });
                },
                tcpXyzLineChart: function () {
                    if (!device.uuid) {
                        dialog.noty('请选择设备!');
                        return false;
                    }

                    if (!_.size(barcodeXYZList)) {
                        dialog.noty('本月没有焊接记录!');
                        return false;
                    }
                    dialog.show({
                        template: 'weld_robot_tcp_xyz_dialog',
                        title: '工具坐标系TCP参数曲线',
                        width: 1200,
                        data: {
                            list: barcodeXYZList
                        },
                        controller: 'WeldRobotTcpXyzChartController',
                        controllerAs: 'ctrl',
                        buttons: {}
                    });
                },
                appDataExport: _.debounce(function () {
                    if (!device.uuid) {
                        dialog.noty('请选择设备!');
                        return false;
                    }
                    var view = $element.find('.app_weld_body').fullCalendar('getView');
                    if (view) {
                        var start = view.start.format('YYYY-MM-DD') + ' 00:00:00';
                        var end = view.end.format('YYYY-MM-DD') + ' 00:00:00';
                        var currentYear = view.calendar.getDate().year();
                        var currentMonth = view.calendar.getDate().month() + 1;

                        dialog.waiting('生成文件中，请稍等...');

                        ctrl.startLoadDatas().progress(function (total, eventsLength) {
                            dialog.hideWaiting();
                            if (eventsLength === 0) {
                                dialog.noty('本月未查询到数据，导出失败');
                                return false;
                            } else {
                                dialog.noty(`本月共加载${eventsLength}条焊缝数据,导出中...`);
                                window.open('/weld/export?uuid=' + device.uuid + '&year=' + currentYear + '&month=' + currentMonth);
                            }
                        });
                    }
                }, 300),
                selectShift: function (idx) {
                    var shift = weldShifts[idx];
                    if (shift) {
                        $('.app_weld_summary .shiftLabel').text(shift.name);
                        ctrl.renderAllShift(shift);
                    } else {
                        $('.app_weld_summary .shiftLabel').text('所有班别');
                        ctrl.renderAllShift();
                    }
                },
                loadCalendarEvents: _.debounce(function () {
                    if (!device.uuid) {
                        dialog.noty('请选择设备');
                        return false;
                    }

                    ctrl.initLoading();
                    ctrl.startLoadDatas().progress(function (total, eventsLength) {
                        if (eventsLength === 0) {
                            dialog.noty('本月未加载到数据');
                        } else {
                            dialog.noty(`本月共加载${eventsLength}条焊缝数据`);
                        }
                    });
                }, 300),
                initLoading: function () {
                    /*.fc-day-top:按月加载；.fc-day-header:按周加载*/
                    let classNameArr;
                    if (!_.isEmpty($('.fc-content-skeleton .fc-day-top'))) {
                        classNameArr = $('.fc-content-skeleton .fc-day-top');
                    } else if (!_.isEmpty($('.fc-head-container .fc-day-header'))) {
                        classNameArr = $('.fc-head-container .fc-day-header');
                    }
                    _.each(classNameArr, function (e) {
                        $(e).find('span').remove();
                        $(e).find('.day-download-icon').remove();
                        let date = $(e).data('date');
                        let span = `<span class="loading-history-data-span fa fa-spinner" id=${date + '_loading_span'}></span>`;
                        $(e).append(span);
                    });
                },
                bindEvent: function () {
                    $(window).resize(function () {
                        ctrl.autoLayout();
                    });

                    $($element).on('click', '.day-download-icon', function () {
                        var ele = $(this);

                        ctrl.exportDayData(ele.data('date'));
                    })
                },
                autoLayout: _.debounce(function () {
                    var height = $(window).height();
                    height -= 290;
                    $element.find('.app_weld_body').fullCalendar('option', 'contentHeight', height);
                    // $element.find('.app_weld_list').height(height);
                }, 300),
                removeAllEvents: function () {
                    var ele = $element.find('.app_weld_body');
                    if (ele.fullCalendar) {
                        ele.fullCalendar('removeEvents');
                    }
                },
                loadSingleDayEvent: function (date, config, totalDays, loadDeferred) {
                    WeldService.loadDayEvents(device.uuid, date, config).progress(function (result) {
                        $('#' + date.format('YYYY-MM-DD') + '_loading_span').removeClass('loading-history-data-span fa-spinner').addClass('loading-ok-span fa-check');
                        indexedDay++;
                        ctrl.calcDayEvent(result, date);
                        if (indexedDay === totalDays) {
                            ctrl.renderAllShift();
                            loadDeferred.notify(indexedDay, currentMonthCount);
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
                    ctrl.addTotal('okPercent', okPercent);
                    $('.app_weld_summary .app_weld_summary_item_value').each(function () {
                        var item = $(this);

                        var valueKey = item.data('key');
                        var value = _.get(totalStateMap, valueKey, '');
                        if (valueKey === 'period') {
                            value = ctrl.formatPeriod(value);
                        }
                        if (valueKey === 'okPercent') {
                            if (!value) {
                                value = 0;
                            }

                            value = value.toFixed(2);
                        }
                        if (valueKey === 'wire_density') {
                            if (value > 1000) {
                                value = value / 1000;
                                $('#app_weld_item_wire_density').text('千克');
                            } else {
                                $('#app_weld_item_wire_density').text('克');
                            }
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
                loadParams: function () {
                    var deferred = $.Deferred();
                    if (paramConfig) {
                        ctrl.calcWeldShift();
                        deferred.notify(paramConfig);
                    } else {
                        WeldService.getConfigParams().progress(function (param) {
                            paramConfig = param;
                            ctrl.calcWeldShift();
                            deferred.notify(paramConfig);
                        });
                    }
                    return deferred;
                },
                calcWeldShift: function () {
                    weldShifts = [];
                    weldDetailShifts = [];
                    var shifts = _.get(paramConfig, 'shifts', []);
                    if (_.size(shifts)) {
                        shifts = _.sortBy(shifts, ['s_hour', 's_minute', 'e_hour', 'e_minute']);
                        weldShifts = shifts;
                        var ele = $element.find('.app_weld_body');
                        var view = ele.fullCalendar('getView');
                        if (view) {
                            var start = moment(view.start).add(-1, 'days');
                            start.set('hour', 0);
                            start.set('minute', 0);
                            start.set('second', 0);
                            start.set('millisecond', 0);

                            var end = moment(view.end).add(1, 'days');
                            end.set('hour', 0);
                            end.set('minute', 0);
                            end.set('second', 0);
                            end.set('millisecond', 0);

                            var totalDays = end.diff(start, 'day');
                            var clone = moment(start);
                            var diff = clone.diff(end, 'minutes');
                            var idx = 0
                            while (diff < 0) {
                                _.each(shifts, function (shift, idx) {
                                    var targetShift = {};

                                    var year = clone.get('year');
                                    var month = clone.get('month');
                                    var date = clone.get('date');
                                    var s_date = date;
                                    if (shift.s_type === 'yest') {
                                        s_date = s_date - 1;
                                    }
                                    var start = moment(new Date(year, month, s_date, shift.s_hour, shift.s_minute, 0, 0));


                                    var e_date = date;
                                    if (shift.e_type === 'tomorrow') {
                                        e_date = e_date + 1;
                                    }
                                    var end = moment(new Date(year, month, e_date, shift.e_hour, shift.e_minute, 59, 999));
                                    targetShift.start = start;
                                    targetShift.end = end;
                                    targetShift.start_value = start.valueOf();
                                    targetShift.end_value = end.valueOf();
                                    targetShift.shift_index = idx;
                                    targetShift.sort = idx;
                                    weldDetailShifts.push(targetShift);
                                    idx++;
                                });
                                clone = clone.add(1, 'day');
                                diff = clone.diff(end, 'minutes');
                            }
                        }
                        $scope.weldShifts = weldShifts;
                        util.apply($scope);
                    }
                },
                loadData: function (config, loadDeferred) {
                    ctrl.removeAllEvents();
                    barcodeXYZList = [];
                    totalStateMap = {};
                    eventMap = {};
                    // 控制 返回视图
                    var ele = $element.find('.app_weld_body'), view = null;
                    var view = ele.fullCalendar('getView');
                    if (view) {
                        var start = view.start;
                        start.set('hour', 0);
                        start.set('minute', 0);
                        start.set('second', 0);
                        start.set('millisecond', 0);

                        var end = view.end;
                        end.set('hour', 0);
                        end.set('minute', 0);
                        end.set('second', 0);
                        end.set('millisecond', 0);

                        var totalDays = end.diff(start, 'day');
                        var clone = moment(start);
                        var diff = clone.diff(end, 'minutes');
                        while (diff < 0) {
                            ctrl.loadSingleDayEvent(moment(clone), config, totalDays, loadDeferred);
                            clone = clone.add(1, 'day');
                            diff = clone.diff(end, 'minutes');
                        }
                    }
                },
                startLoadDatas: function () {
                    indexedDay = 0;
                    currentMonthCount = 0;
                    var deferred = $.Deferred();
                    ctrl.loadParams().progress(function (config) {
                        ctrl.loadData(config, deferred);
                    });
                    return deferred;
                },
                checkItemShiftID: function (event) {
                    var eventStart = moment(event.start);
                    var eventTimestamp = eventStart.valueOf();
                    var year = eventStart.get('year');
                    var month = eventStart.get('month') + 1;
                    var date = eventStart.get('date');

                    var hour = eventStart.get('hour');
                    var minute = eventStart.get('minute');

                    var shift = {};
                    var ShiftID = '';
                    if (_.size(weldDetailShifts)) {
                        for (var i = 0; i < weldDetailShifts.length; i++) {
                            var targetShift = weldDetailShifts[i];
                            if (eventTimestamp >= targetShift.start_value && eventTimestamp <= targetShift.end_value) {
                                shift.start = targetShift.start;
                                shift.end = targetShift.end;
                                ShiftID = shift.start.format('YYYY-MM-DD');
                                var shiftItem = weldShifts[targetShift.shift_index];
                                ShiftID = ShiftID + '-shift-' + (targetShift.shift_index || 0);
                                shift.index = targetShift.shift_index;
                                shift.shift_name = shiftItem.name;
                                break;
                            }
                        }
                    }
                    if (!shift.start) {
                        ShiftID = _.join([year, month, date], '-');
                        var s = moment(eventStart);
                        s.set('hour', 0);
                        s.set('minute', 0);
                        s.set('second', 0);
                        shift.start = s;

                        var e = moment(eventStart);
                        e.set('hour', 23);
                        e.set('minute', 59);
                        e.set('second', 59);
                        shift.end = e;
                    }
                    shift.id = ShiftID;
                    return shift;
                },
                addEventToMap: function (item) {
                    currentMonthCount++;
                    var shift = ctrl.checkItemShiftID(item);

                    var summary = _.get(eventMap, shift.id, {});
                    summary.shift_index = shift.index;
                    summary.start = shift.start;
                    summary.end = shift.end;
                    summary.id = shift.id;
                    summary.shift_name = shift.shift_name;
                    var list = _.get(summary, 'list', []);
                    list.push(item);
                    _.set(summary, 'list', list);
                    _.set(eventMap, shift.id, summary);
                },
                renderAllShift: function (shift) {
                    ctrl.removeAllEvents();
                    barcodeXYZList = [];
                    totalStateMap = {};
                    workdaySet.clear();
                    _.each(eventMap, function (summary) {
                        var list = _.get(summary, 'list', []);
                        list = _.sortBy(list, ['start']);

                        _.set(summary, 'list', list);
                        if (shift) {

                            if (shift.name === summary.shift_name) {
                                ctrl.renderShift(summary);
                            }
                        } else {
                            ctrl.renderShift(summary);
                        }
                    });
                    ctrl.addTotal('days', workdaySet.size);
                    ctrl.renderTotal();
                },
                valueTo2Decimal: function (value) {
                    value = parseFloat(value);
                    if (_.isNaN(value)) {
                        value = 0;
                    }
                    value = value.toFixed(2);
                    return value;
                },
                renderShift: function (summary) {
                    var ele = $element.find('.app_weld_body');
                    var list = _.get(summary, 'list', []);

                    var fullcanlendarEvent = {
                        id: summary.id
                    };

                    var total = 0, okTimes = 0, ngTimes = 0, noResultTimes = 0, period = 0.0;
                    var barcodeMap = {};
                    _.each(list, function (item) {
                        if (!fullcanlendarEvent.start) {
                            fullcanlendarEvent.start = moment(item.start);
                        }

                        var itemPeriod = parseFloat(item.period);

                        if (_.isNaN(itemPeriod)) {
                            itemPeriod = 0;
                        }
                        period += itemPeriod;
                        // 计算 工作天数
                        var date = moment(item.start).format('YYYY-MM-DD');
                        workdaySet.add(date);

                        var barcode = item.barcode;
                        var barcodeArr = barcodeMap[barcode] || [];
                        barcodeArr.push(item);
                        _.set(barcodeMap, barcode, barcodeArr);
                    });

                    total = _.keys(barcodeMap).length;

                    _.each(barcodeMap, function (list, barcode) {
                        var barcodeNGTimes = 0, barcodeOkTimes = 0, barcodeNoResult = 0;
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
                        });
                        if (barcodeNGTimes > 0) {
                            ngTimes++;
                        } else {
                            if (barcodeNoResult > 0) {
                                noResultTimes++;
                            } else {
                                okTimes++;
                            }
                        }

                        var barcodeItem = _.first(list);
                        var barCodeXYZ = {
                            barcode: barcode,
                            time: barcodeItem.start,
                            "182_TCP_X": _.get(barcodeItem, 'show_data.182_TCP_X', ''),
                            "183_TCP_Y": _.get(barcodeItem, 'show_data.183_TCP_Y', ''),
                            "184_TCP_Z": _.get(barcodeItem, 'show_data.184_TCP_Z', ''),
                            "199_M_TCP_X": _.get(barcodeItem, 'show_data.199_M_TCP_X', ''),
                            "200_M_TCP_Y": _.get(barcodeItem, 'show_data.200_M_TCP_Y', ''),
                            "201_M_TCP_Z": _.get(barcodeItem, 'show_data.201_M_TCP_Z', '')
                        };

                        barcodeXYZList.push(barCodeXYZ);
                    });

                    ctrl.addTotal('period', period);
                    period = ctrl.formatPeriod(period);
                    // ctrl.addTotal('days', 1);
                    ctrl.addTotal('product', total);
                    fullcanlendarEvent.end = moment(_.get(_.last(list), 'end'));
                    var okPercent = okTimes / (okTimes + ngTimes) * 100;
                    if (_.isNaN(okPercent)) {
                        okPercent = 0;
                    }
                    ctrl.addTotal('okTimes', okTimes);
                    ctrl.addTotal('ngTimes', ngTimes);
                    var title = [];
                    okPercent = okPercent.toFixed(2);
                    title.push(`<span class="w_label">总数量:</span><span class="w_value">${total}</span><br/>`);
                    title.push(`<span class="w_label">良率:</span><span class="w_value">${okPercent}%</span><br/>`);
                    title.push(`<span class="w_label">良品:</span><span class="w_value">${okTimes}</span>`);
                    title.push(`<span class="w_label">不良:</span><span class="w_value">${ngTimes}</span>`);
                    // title.push(`<span class="w_label">未检:</span><span class="w_value">${noResultTimes}</span>`);
                    if (summary.shift_name) {
                        title.push(`<span class="w_shift_title">${summary.shift_name}</span>`);
                    }
                    title = _.join(title, '');
                    fullcanlendarEvent.title = title;
                    if (summary.start && summary.end) {
                        fullcanlendarEvent.start = summary.start.format('YYYY-MM-DD HH:mm:ss');
                        if (summary.start.get('date') !== summary.end.get('date')) {
                            fullcanlendarEvent.end = moment(summary.end).add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
                        }
                    }
                    fullcanlendarEvent.sort = summary.sort;
                    fullcanlendarEvent.shift_name = summary.shift_name;
                    fullcanlendarEvent.shift_index = summary.shift_index;
                    ele.fullCalendar('renderEvent', fullcanlendarEvent, true);
                },
                calcDayEvent: function (dayData, date) {
                    var dayList = dayData.arr;
                    if (_.size(dayList)) {
                        ctrl.addDayExport(date);
                        _.each(dayList, function (item) {
                            ctrl.addEventToMap(item);
                        });
                    }
                },
                addDayExport: function (date) {
                    var dateStr = date.format('YYYY-MM-DD');
                    var loadingElement = $('#' + dateStr + '_loading_span');
                    loadingElement.after(`<i class="fa fa-download day-download-icon" title="下载当天数据" data-date="${dateStr}"></i>`);
                },
                exportDayData: function (date) {
                    window.open('/weld/dayData?uuid=' + device.uuid + '&date=' + date);
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
                initCalendar: function () {
                    var ele = $element.find('.app_weld_body');
                    if (ele.length && ele.fullCalendar) {
                        var height = $(window).height();
                        height -= 290;
                        ele.fullCalendar({
                            header: {
                                left: 'prev,next today',
                                center: 'title',
                                right: 'month,basicWeek'
                            },
                            navLinks: true,
                            contentHeight: height,
                            defaultView: 'month',
                            fixedWeekCount: false,
                            showNonCurrentDates: false,
                            timezone: false,
                            viewRender: function () {
                                ctrl.loadCalendarEvents();
                            },
                            eventRender: function (event, element) {
                                element.addClass('shiftWeld');
                                element.find('.fc-content').html(event.title);
                                if (!_.isUndefined(event.shift_index)) {
                                    var shift = weldShifts[event.shift_index];
                                    if (shift && shift.color) {
                                        element.css({
                                            'backgroundColor': shift.color
                                        });
                                    }
                                }
                            },
                            eventClick: function (event) {
                                if (event.id) {
                                    ctrl.goDayList(event.id);
                                }
                            }
                        });
                        if (gotoday) {
                            ele.fullCalendar('gotoDate', moment(gotoday));
                        }
                    } else {
                        $timeout(function () {
                            ctrl.initCalendar();
                        }, 400);
                    }
                },
                goDayList: function (eventId) {
                    if (pageRoute) {
                        var summary = eventMap[eventId];
                        pageRoute.go('daylist', {
                            start: summary.start,
                            end: summary.end,
                            shift_name: summary.shift_name,
                            device: device,
                            pageRoute: pageRoute
                        });
                    }
                }
            });
            ctrl.initialize();
        }]);
});