define([], function () {
    var app = angular.module('app');

    app.controller('AppWeldBarcodeListController', ['$scope', 'AppDataService', 'AppComponent', 'dialog', '$timeout', 'http', 'util',
        function ($scope, AppDataService, AppComponent, dialog, $timeout, http, util) {

            var ctrl = this;
            let appConfig = {};
            const app_key = 'weld_robot_history';

            $scope.list = [];
            /** --------------- start 由 Calendar 跳转 20180612 ------------ **/
            var device = $scope.device;
            $scope.bind = device;

            var barcode = $scope.barcode;

            var start = $scope.start;
            var end = $scope.end;

            var barcodeStart = $scope.barcodeStart;
            var barcodeEnd = $scope.barcodeEnd;

            $scope.entity = {
                uuid: device.uuid,
                year: barcodeStart.get('year'),
                month: barcodeStart.get('month') + 1,
                day: barcodeStart.get('date')
            }

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initLayout();
                    ctrl.initData();
                },
                goCalendarView: function () {
                    if ($scope.pageRoute) {
                        $scope.pageRoute.go('calendar', {
                            gotoday: start.format('YYYY-MM-DD'),
                            device: device,
                            pageRoute: $scope.pageRoute
                        });
                    }
                },
                goBarcodeView: function () {
                    if ($scope.pageRoute) {
                        $scope.pageRoute.go('daylist', {
                            start: start,
                            end: end,
                            device: device,
                            shift_name: $scope.shift_name,
                            pageRoute: $scope.pageRoute
                        });
                    }
                },
                viewActualLineChart: function () {
                    dialog.show({
                        title: '机器人实际运行速度曲线',
                        template: 'weld_robot_barcode_linechart_template',
                        width: 1200,
                        controller: 'WeldRobotBarcodeLineChartController',
                        controllerAs: 'ctrl',
                        data: {
                            entity: {
                                uuid: $scope.entity.uuid,
                                barcode: barcode,
                                start: barcodeStart,
                                end: barcodeEnd
                            }
                        },
                        buttons: {}
                    });
                },
                initLayout: function () {
                    var height = $(window).height();
                    $('.widget-body').height(height - 180);
                    $('.weldBody').height(height - 280);
                },
                initData: function () {
                    var data_key = `weld_robot_history_${device.uuid}_${barcodeStart.format('YYYY_M_D')}`;
                    dialog.waiting('数据加载中...');
                    AppDataService.get(data_key).success(function (result) {
                        var list = result || {
                            arr: []
                        };
                        if (_.size(list.arr)) {
                            list.arr = _.filter(list.arr, {'barcode': barcode});
                            list.arr = _.sortBy(list.arr, ['start']);

                            barcodeStart = _.get(_.first(list.arr), 'start', '');
                            barcodeEnd = _.get(_.last(list.arr), 'end', '');
                        }
                        _.each(list.arr, function (item) {
                            if (item.result === 'NG') {
                                item.result_desc = '不合格';
                            } else if (item.result === 'OK') {
                                item.result_desc = '合格';
                            }
                        });
                        $scope.list = list;
                        util.apply($scope);
                        dialog.hideWaiting();
                    });
                },
                viewDetail: function (index) {
                    var entity = $scope.list.arr[index];
                    var key = ctrl.getItemKey(entity);
                    dialog.show({
                        template: 'app_weld_detail_template',
                        title: false,
                        data: {
                            entity: entity,
                            datamap: {'parentId': key}
                        },
                        width: 1200,
                        controller: 'WeldingDetailController',
                        controllerAs: 'ctrl',
                        buttons: {}
                    })
                },
                getItemKey:function(item){
                    var start = moment(item.start);
                    var year = start.get('year');
                    var month = start.get('month') + 1;
                    var date = start.get('date');
                    var key = "weld_robot_history_" + $scope.entity.uuid + "_" + year + '_' + month + '_' + date;
                    return key;
                },
                showParam: function (index) {
                    var row = $scope.list.arr[index];
                    var key =ctrl.getItemKey(row);
                    dialog.show({
                        template: 'app_weld_data_param_template',
                        title: '焊接参数',
                        width: 1200,
                        data: {
                            datamap: {'parentId': key},
                            entity: row
                        },
                        controller: 'WeldingDataParamtController',
                        controllerAs: 'ctrl'
                    });
                },
                showLineChart: function (index) {
                    var row = $scope.list.arr[index];
                    var key = ctrl.getItemKey(row);
                    dialog.show({
                        template: 'weld_robot_data_linechart_dialog',
                        title: '焊接曲线',
                        width: 1200,
                        data: {
                            datamap: {'parentId': key},
                            entity: row
                        },
                        controller: 'WeldRobotDataLineChartController',
                        controllerAs: 'ctrl',
                        buttons: {}
                    });
                }
            });

            ctrl.initialize();
        }]);
})