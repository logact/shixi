define(['echarts', 'plant_efficiency/device_timeline/web/service/device_timeline_service'],
    function (echarts, DeviceTimelineService) {
        var app = angular.module('app');

        app.controller('DeviceTimeLineController', ['$scope', 'DBUtils', 'dialog', 'http', 'util',
            "I18nService", "$element", 'janus', '$timeout', 'AppComponent',
            function ($scope, DBUtils, dialog, http, util, I18nService, $element, janus, $timeout, AppComponent) {
                var ctrl = this;

                $scope.entity = {
                    uuid: '',
                    date_type: 'today',
                    start: '',
                    end: '',
                    chooseTime: moment().format("YYYY-MM-DD")
                };
                _.extend(ctrl, {
                    initialize: function () {
                        ctrl.initDeviceSelect();
                        $timeout(function () {
                            ctrl.calcPanelHeight();
                        }, 100);
                    },
                    setDateType: function (type) {
                        if (_.isEmpty($scope.entity.uuid)) {
                            dialog.noty("请选择设备");
                            return;
                        }
                        $scope.entity.date_type = type;

                        if (type === "today") {
                            $scope.entity.chooseTime = moment().format("YYYY-MM-DD");
                        } else if (type === "yesterday") {
                            $scope.entity.chooseTime = moment().subtract(1, "d").format("YYYY-MM-DD");
                        }
                        util.apply($scope);
                        ctrl.loadTimelineData();
                    },
                    getCustomDataDialog: function () {
                        if (_.isEmpty($scope.entity.uuid)) {
                            dialog.noty("请选择设备");
                            return;
                        }
                        $scope.entity.date_type = 'custom';
                        var dialogElement = dialog.show({
                            template: 'device_timeline_custom_data_dialog',
                            width: 550,
                            title: "自定义",
                            controller: 'DeviceTimelineCustomDialog',
                            controllerAs: "ctrl",
                            data: {
                                "entity": $scope.entity,
                            }
                        });
                        dialogElement.on('hidden.bs.modal', function () {
                            if ($scope.entity.start) {
                                $scope.entity.chooseTime = $scope.entity.start;
                                util.apply($scope);
                                ctrl.loadTimelineData();
                            }
                        });
                    },
                    initDeviceSelect: function () {
                        AppComponent.deviceselect($element.find('#deviceTimeline_device')).progress(function (bind) {
                            $scope.entity.uuid = _.get(bind, 'uuid', '');
                            if (_.isEmpty($scope.entity.uuid)) {
                                return;
                            }
                            ctrl.loadTimelineData();
                        });
                    },
                    calcPanelHeight: _.debounce(function () {
                        var top = 60 + 15 + 63 + 18;
                        var panel = $('.device_timeline_panel');
                        var height = $(window).height() - top - 10;
                        panel.height(height);
                    }, 300),
                    loadTimelineData: _.debounce(function (deviceName) {
                        var uuid = _.get($scope.entity, "uuid", "");
                        var date_type = _.get($scope.entity, 'date_type', '');
                        if (date_type === 'custom') {
                            date_type = '';
                        }

                        dialog.waiting();
                        DeviceTimelineService.getChartConfig(echarts, uuid, date_type, $scope.entity.start, $scope.entity.end).done(function (config) {
                            dialog.hideWaiting();
                            var dom = document.getElementById("device_timeline_container");
                            var statedom = document.getElementById("device_state_container");
                            let nduration = moment.duration(config.normalduration);
                            let wduration = moment.duration(config.warningduration);
                            let aduration = moment.duration(config.alarmduration);
                            let offduration = moment.duration(config.offlineduration);
                            $scope.normalduration = nduration.hours() + 'h' + nduration.minutes() + 'm' + nduration.seconds() + 's';
                            $scope.warningduration = wduration.hours() + 'h' + wduration.minutes() + 'm' + wduration.seconds() + 's';
                            $scope.alarmduration = aduration.hours() + 'h' + aduration.minutes() + 'm' + aduration.seconds() + 's';
                            $scope.offlineduration = offduration.hours() + 'h' + offduration.minutes() + 'm' + offduration.seconds() + 's';
                            var myChart = echarts.init(dom);
                            var stateChart = echarts.init(statedom);
                            stateChart.setOption(config.stateoptions);
                            myChart.setOption(config.options);
                            util.apply($scope);
                        });
                    }, 300)
                });
                ctrl.initialize();
            }]);

        app.controller('DeviceTimelineCustomDialog', ['$scope', 'DBUtils', 'dialog', 'http', 'util', "I18nService", "$element", 'janus', '$timeout',
            function (dialogScope, DBUtils, dialog, http, util, I18nService, $element, janus, $timeout) {
                var ctrl = this;
                _.extend(ctrl, {
                    initialize: function () {
                        ctrl.bindEvent();
                    },
                    bindEvent: function () {
                        dialogScope.$on("success", function (event, checkMessage) {
                            let today = moment().format("YYYY-MM-DD");
                            let startTime = _.get(dialogScope, "entity.start", "");
                            if (_.isEmpty(startTime)) {
                                dialog.noty("请选择日期!");
                                checkMessage.success = false;
                                return;
                            }
                            let Daysapart = moment(startTime).diff(moment(today), "day");
                            if (Daysapart > 0) {
                                dialog.noty("不能查看未来的数据");
                                checkMessage.success = false;
                            }
                        })
                    }
                });
                ctrl.initialize();
            }])
    });
