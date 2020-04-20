define(['rear_setting_machine/board/resource/rear_setting_machine_data_config', "echarts"], function (AppDataConfig, echarts) {
    var app = angular.module('app');

    app.controller('RearSettingMachineDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'session', 'AppConfigService', '$timeout', '$state', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element,
                  session, AppConfigService, $timeout, $state, janus) {
            var ctrl = this;
            var uuid = $stateParams.id;
            $scope.uuid = uuid;
            $scope.showData = {
                'brand': '新盛展',
                "capac": '1500-2000双/8h'
            };

            $scope.rearFields = AppDataConfig.fields;

            var appName = 'rear_setting_machine_board';

            var fieldEnumMap = {
                'WorkSts': {
                    'true': '正常',
                    'false': '报警'
                }
            };

            ctrl.subNavOptions = {
                collection: 'device',
                query: {'rear_setting_machine.show': true}
            };

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                    ctrl.initOpts();
                },
                bindEvent: function () {
                    $scope.$watch('entity.rear_setting_machine.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'rear_setting_machine.image_id': newValue
                                    }
                                }).success(function () {
                                    dialog.noty('操作成功');
                                });
                            }
                        }
                    });
                },
                initOpts: function () {
                    ctrl.rear_setting_opts = {
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
                            title: '时间',
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
                showProduction: function () {
                    var yieldOptions = {
                        xAxis: [
                            {
                                type: 'category',
                                data: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
                            }
                        ],
                        tooltip: {
                            trigger: 'axis'
                        },
                        legend: {
                            data: ['产线实时曲线']
                        },
                        yAxis: [
                            {
                                type: 'value',
                                name: '产量'
                            }
                        ],
                        series: [
                            {
                                type: 'line',
                                name: '产量',
                                data: [173, 175, 150, 170, 155, 160]
                            }
                        ]
                    };
                    var yieldChart = $('#yield_chart');
                    var yieldChartObj = echarts.init(yieldChart[0]);
                    yieldChartObj.setOption(yieldOptions);


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
                        }
                    });
                },
                updateField: _.throttle(function (lastData) {
                    /*改为jq操作,以增强响应*/
                    var updateFields = $element.find('.static-field-value');
                    // AppConfigService.query(appName).then(function () {
                    _.each(updateFields, function (fieldElement) {
                        var target = $(fieldElement);

                        var fieldKey = target.data('key');
                        AppConfigService.getFieldData(appName, fieldKey, lastData).done(function (newValue) {
                            if (fieldEnumMap[fieldKey]) {
                                var enumKey = _.toLower(newValue);
                                newValue = _.get(fieldEnumMap, fieldKey + '.' + enumKey, '');
                            }
                            if (newValue !== target.text()) {
                                target.text(newValue);
                            }
                        });
                    });
                    // });

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
                    });

                    var updateStates = $element.find('.static-state-state');
                    _.each(updateStates, function (switchElement) {
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
                    janus.goToMenuByName('机台（两冷四热）')
                }
            });

            ctrl.initialize();
        }]);
});