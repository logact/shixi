define(['echarts'], function (echarts) {
    var app = angular.module('app');

    app.controller('WeldingDeviceDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$timeout', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $timeout, janus) {
            var ctrl = this;
            var uuid = ctrl.uuid = $stateParams.id;
            $scope.entity = {};
            var appName = 'welding_device';

            var tempChart = null, speedChart = null, timestamps = [];
            var tempData = [], speedData = [];

            ctrl.subNavOptions = {
                collection: 'device',
                query: {'welding.show': true}
            }

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                    ctrl.initWarningOptions();
                },
                bindEvent: function () {
                    $scope.$watch('entity.welding.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'welding.image_id': newValue
                                    }
                                }).success(function () {
                                    dialog.noty('操作成功');
                                });
                            }
                        }
                    });
                },
                initCharts: function () {
                    if (!tempChart) {
                        var options = {
                            xAxis: [
                                {
                                    type: 'category',
                                    data: []
                                }
                            ],
                            tooltip: {
                                trigger: 'axis'
                            },
                            legend: {
                                data: ['主板温度']
                            },
                            yAxis: [
                                {
                                    type: 'value',
                                    name: '温度(°C)'
                                }
                            ],
                            series: [
                                {
                                    type: 'line',
                                    name: '主板温度',
                                    data: []
                                }
                            ]
                        };

                        var temp_chartEle = $('.temp_chart');
                        tempChart = echarts.init(temp_chartEle[0]);
                        tempChart.setOption(options);
                    }

                    if (!speedChart) {
                        var options = {
                            xAxis: [
                                {
                                    type: 'category',
                                    data: []
                                }
                            ],
                            tooltip: {
                                trigger: 'axis'
                            },
                            legend: {
                                data: ['风扇转速']
                            },
                            yAxis: [
                                {
                                    type: 'value',
                                    name: '转速(rpm)'
                                }
                            ],
                            series: [
                                {
                                    type: 'line',
                                    name: '风扇转速',
                                    data: []
                                }
                            ]
                        };

                        var speed_chartEle = $('.speed_chart');
                        speedChart = echarts.init(speed_chartEle[0]);
                        speedChart.setOption(options);
                    }
                },
                updateChart: function (data) {
                    if (timestamps.length > 50) {
                        timestamps.shift();
                    }
                    if (speedData.length > 50) {
                        speedData.shift();
                    }
                    if (tempData.length > 50) {
                        tempData.shift();
                    }

                    var time = _.get(data, 'time', '');
                    timestamps.push(time.substring(11));
                    tempData.push(_.get(data, 'data.180_WelderTemperature', 0));
                    speedData.push(_.get(data, 'data.181_WelderFanSpeed', 0));

                    if (tempChart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: tempData
                                }
                            ]
                        };
                        tempChart.setOption(opts);
                    }

                    if (speedChart) {
                        var opts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: speedData
                                }
                            ]
                        };
                        speedChart.setOption(opts);
                    }
                },
                initWarningOptions: function () {
                    ctrl.warningOptions = {
                        collection: 'messages',
                        query: {
                            'type': 'DataMonitor',
                            'uuid': uuid
                        },
                        columns: [{
                            name: '_id',
                            visible: false
                        }, {
                            name: 'create_date',
                            title: '报警时间',
                            width: '150px',
                            orderable: true
                        }, {
                            name: 'title',
                            title: '名称',
                            width: '130px',
                            orderable: false
                        }, {
                            name: 'content',
                            search: true,
                            title: '内容',
                            orderable: false
                        }]
                    };
                },
                initData: function () {
                    DBUtils.find('device', {
                        uuid: uuid
                    }).success(function (result) {
                        var device = _.get(result, 'datas.result', {});
                        ctrl.updateField(_.get(device, "dynamicData", {}));
                        delete device.dynamicData;
                        $scope.entity = device;
                    });

                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
                        onmessage: function (data) {
                            let newData = _.get(data, 'data', {});
                            ctrl.updateField(newData);
                            ctrl.updateChart(data);
                        }
                    });
                },
                updateField: _.throttle(function (lastData) {
                    /*改为jq操作,以增强响应*/
                    var updateFields = $element.find('.static-field-value');
                    _.each(updateFields, function (fieldElement) {
                        var target = $(fieldElement);

                        var fieldKey = target.data('key');
                        AppConfigService.getFieldData(appName, fieldKey, lastData).done(function (newValue) {
                            if (newValue !== target.text()) {
                                target.text(newValue);
                            }
                        });
                    });

                    var updateSwitchs = $element.find('.static-switch-state');
                    _.each(updateSwitchs, function (switchElement) {
                        var target = $(switchElement);
                        var targetValue = target.hasClass('active');

                        var switchKey = target.data('key');
                        var newValue = _.get(lastData, switchKey, false);
                        if (_.isString(newValue)) {
                            newValue = _.toLower(newValue);
                            if (newValue === 'false' || newValue === '0') {
                                newValue = false;
                            }
                        }
                        if (newValue !== targetValue) {
                            if (newValue) {
                                target.addClass('active');
                            } else {
                                target.removeClass('active');
                            }
                        }
                    })
                }, 200),
                goList: function () {
                    janus.goToMenuByName('设备');
                }
            });

            ctrl.initialize();
        }]);
});