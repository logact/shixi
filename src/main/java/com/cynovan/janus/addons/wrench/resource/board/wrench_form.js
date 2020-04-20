define(['wrench/resource/board/wrench_board_init_data_config', 'echarts'], function (AppDataConfig, echarts) {
    var app = angular.module('app');

    app.controller('WrenchDynamicController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$timeout', '$state', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $timeout, $state, janus) {
            var ctrl = this;
            var uuid = $stateParams.id;
            var deviceData = {};
            $scope.entity = {};
            _.extend(ctrl, {
                initialize: function () {
                    $timeout(function () {
                        ctrl.initData();
                    }, 300);
                    ctrl.initLogOptions();
                    ctrl.getWorkList();
                    ctrl.bindSelectChange();
                    ctrl.bindEvent();
                    ctrl.initSubNavOption();
                },
                initLogOptions: function () {
                    ctrl.logOptions = {
                        collection: 'wrenchLog',
                        query: {
                            uuid: uuid
                        },
                        columns: [{
                            name: 'create_date',
                            title: '请求时间',
                            width: '120px'
                        }, {
                            name: 'state',
                            title: '状态',
                            width: '80px',
                            orderable: false,
                            render: function (data, type, row) {
                                if (row.state === 'success') {
                                    return '<button class="btn btn-success btn-xs" type="button"><i class="fa fa-check"></i>请求成功</button>';
                                } else {
                                    return '<button class="btn btn-danger btn-xs" type="button"><i class="fa fa-times"></i>请求失败</button>';
                                }
                            }
                        }, {
                            name: 'response',
                            visible: false,
                        }, {
                            name: 'request_data',
                            visible: false,
                        }, {
                            name: 'msg',
                            title: '信息',
                            width: '300px',
                            orderable: false
                        }, {
                            name: '_id',
                            title: '详细',
                            width: '150px',
                            orderable: false,
                            render: function (data, type, row) {
                                return `<button type="button" data-key="log_info" class="btn btn-primary btn-xs btn-outline"><i class="fa fa-info"></i>&nbsp;&nbsp;详细信息</button><button type="button" data-key="chart_view" style="margin-left: 10px" class="btn btn-primary btn-xs btn-outline"><i class="fa fa-line-chart"></i>&nbsp;&nbsp;查看图表</button>`;
                            }
                        }]
                    };
                },
                initSubNavOption: function () {
                    ctrl.subNavOptions = {
                        collection: 'device',
                        query: {'wrench.show': true},
                        label: "扳手列表",
                        selected: $stateParams.id
                    }
                },
                showLogDetail: function (rowdata) {
                    dialog.show({
                        title: '请求详情',
                        template: 'wrench_show_log_detail_template',
                        width: 1200,
                        data: {
                            entity: rowdata
                        },
                        buttons: {}
                    })
                },
                showChart: function (rowdata) {
                    dialog.show({
                        title: '图表',
                        template: 'wrench_show_log_chart_template',
                        width: 1300,
                        fullScreen: true,
                        data: {
                            entity: rowdata
                        },
                        controller: 'ViewChartController',
                        controllerAs: 'ctrl',
                        cancel: false
                    });
                },
                initData: function () {
                    DBUtils.find('device', {
                        uuid: uuid
                    }).success(function (result) {
                        var device = _.get(result, 'datas.result', {});
                        deviceData = _.get(device, "dynamicData", {});
                        ctrl.updateField(_.get(device, "dynamicData", {}));
                        delete device.dynamicData;

                        var items = _.get(device, 'wrench.items', '');
                        if (items) {
                            _.each(items, function (item) {
                                if (_.isArray(item.value)) {
                                    item.value = _.join(item.value, ',');
                                }
                            })
                        }

                        $scope.entity = device;
                    });

                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
                        throttle: '0',
                        onmessage: function (data) {
                            /*为了满足用户直接点击获取后直接点击下发*/
                            deviceData = Object.assign(deviceData, _.get(data, 'data', {}));
                            ctrl.updateField(_.get(data, 'data', {}));
                        }
                    });
                },
                bindSelectChange: function () {
                    $scope.$watch('entity.wrench.screw_id', function (newValue) {
                        var screw = null;
                        if (newValue) {
                            screw = _.find(ctrl.screwList, {id: newValue});
                        }
                        $scope.screw = screw;
                        util.apply($scope);
                    });

                    $scope.$watch('entity.wrench.config_id', function (newValue) {
                        var config = null;
                        if (newValue) {
                            config = _.find(ctrl.configList, {id: newValue});
                        }
                        $scope.config = config;
                        util.apply($scope);
                    });

                    $scope.$watch('entity.wrench.material_id', function (newValue) {
                        var material = null;
                        if (newValue) {
                            material = _.find(ctrl.materialList, {id: newValue});
                        }
                        $scope.material = material;
                        util.apply($scope);
                    });
                },
                getWorkList: function () {
                    DBUtils.list('wrench_craftsConfig', {}).success(function (result) {
                        var configList = _.get(result, 'datas.result', []);
                        ctrl.configList = configList;
                    });
                    DBUtils.list('wrench_material', {}).success(function (result) {
                        var materialList = _.get(result, 'datas.result', []);
                        ctrl.materialList = materialList;
                    });
                    DBUtils.list('wrench_screw', {}).success(function (result) {
                        var screwList = _.get(result, 'datas.result', []);
                        ctrl.screwList = screwList;
                    });
                },
                getKeyArray: function (a) {
                    var array = [];
                    _.forEach(a, function (value) {
                        AppConfigService.getFieldKey(AppDataConfig.app, value).done(function (mapKey) {
                            array.push(mapKey);
                        });
                    });
                    return array;
                },
                pushAction: function (command) {
                    var data = {};

                    if (command === "PutMotorPara") {
                        data = _.pick(deviceData, ctrl.getKeyArray(["MotorID", "Poles", "EncoderLine", "ReductionRatio", "Power", "MaxPhaseCurrent", "PhaseResistance", "PhaseInductance", "NoLoadSpeed", "NominalSpeed", "NominalTorque", "NominalCurrent", "CurrentFrequency", "PlanFrequency"]));
                    }
                    if (command === "PutCraftPara") {
                        data = _.pick(deviceData, ctrl.getKeyArray(["CraftID", "CraftName", "SpdUp1", "Ref_High", "SpdDn1", "Ref_Final1", "Keeppoints1", "SpdDn2", "Ref_Reverse", "Keeppoints4", "SpdUp2", "Ref_Final2", "Keeppoints2", "SpdDn3", "Keeppoints3"]));
                    }

                    data.type = "canbus";
                    data.datatype = "wrench";
                    data.command = command;
                    _.forEach(data, function (value, key) {
                        _.set(data, key, value + "");
                    });
                    DeviceService.push(uuid, 'update', data);
                },
                updateField: _.throttle(function (lastData) {
                    if (!_.isEmpty(lastData)) {
                        /*改为jq操作,以增强响应*/
                        var updateFields = $element.find('.static-field-value');
                        _.each(updateFields, function (fieldElement) {
                            var target = $(fieldElement);
                            if (target.length) {
                                var fieldKey = target.data('key');
                                AppConfigService.getFieldData(AppDataConfig.app, fieldKey, lastData).done(function (newValue) {
                                    if (newValue !== target.text()) {
                                        target.text(newValue);
                                    }
                                });
                            }
                        });
                    }
                }, 200),
                bindEvent: function () {
                    $scope.$watch('entity.wrench.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'wrench.image_id': newValue
                                    }
                                }).success(function () {
                                    dialog.noty('操作成功');
                                });
                            }
                        }
                    });

                    $element.on('click', '.static-field-push', function () {
                        var ele = $(this);
                        var dataKey = ele.data('pushkey');
                        if (dataKey) {
                            var value = ele.siblings('.static-field-value').text();
                            ctrl.pushAction(dataKey, value);
                        }
                    });

                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('.btn').data('key');
                        if (buttonKey === "log_info") {
                            ctrl.showLogDetail(rowdata);
                        }
                        if (buttonKey === "chart_view") {
                            ctrl.showChart(rowdata);
                        }
                    });
                },
                saveWrenchConfig: function () {
                    var remote_url = $scope.entity.wrench.remote_url;
                    if (!remote_url) {
                        dialog.noty('Http Server地址为空,将导致数据扭力扳手不能自动计算！');
                    }

                    var data = _.cloneDeep($scope.entity.wrench);
                    data.items = util.removeHashKey(data.items);
                    data.items = _.filter(data.items, function (item) {
                        return item.key && item.value;
                    });
                    /*if the value is array */
                    _.each(data.items, function (item) {
                        item.value = _.replace(item.value, '，', ',');
                        if (item.value.indexOf(',') !== -1) {
                            item.value = _.split(item.value, ',');
                            item.value = _.map(item.value, function (val) {
                                return parseFloat(val);
                            });
                        } else {
                            item.value = parseFloat(item.value);
                        }
                    });

                    var updateFields = _.pick(data, ['items', 'remote_url', 'config_id', 'screw_id', 'material_id']);
                    DBUtils.update('device', {
                        uuid: uuid
                    }, {
                        $set: {
                            'wrench.items': updateFields.items,
                            'wrench.remote_url': updateFields.remote_url,
                            'wrench.config_id': updateFields.config_id,
                            'wrench.screw_id': updateFields.screw_id,
                            'wrench.material_id': updateFields.material_id,
                        }
                    }).success(function () {
                        dialog.noty('配置已保存完成');
                    });
                },
                addRow: function () {
                    var items = _.get($scope.entity, 'wrench.items', []);
                    items.push({});
                    _.set($scope.entity, 'wrench.items', items);
                },
                removeRow: function (index) {
                    $scope.entity.wrench.items.splice(index, 1);
                },
                goList: function () {
                    janus.goToMenuByName('智能扭力扳手');
                }
            });

            ctrl.initialize();
        }]);

    app.controller('ViewChartController', ['$scope', '$timeout', function ($scope, $timeout) {

        var ctrl = this;
        var dataZoom = [{
            type: 'inside',
            start: 0,
            end: 100
        }, {
            start: 0,
            end: 100,
            handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
            handleSize: '80%',
            handleStyle: {
                color: '#fff',
                shadowBlur: 3,
                shadowColor: 'rgba(0, 0, 0, 0.6)',
                shadowOffsetX: 2,
                shadowOffsetY: 2
            }
        }];

        _.extend(ctrl, {
            initialize: function () {
                if (_.isString($scope.entity.request_data)) {
                    $scope.entity.request_data = $.parseJSON($scope.entity.request_data);
                }
                ctrl.initChars();
            },
            initXaxis: function (data) {
                let arr = Array.from({length: _.size(data)}, (v, k) => k);
                return arr;
            },
            initChars: function () {
                /*给定电压、给定电流、电流反馈、速度反馈、力矩对应key1-key5*/
                let voltageData = _.get($scope.entity, 'request_data.key1', []);
                let xData = ctrl.initXaxis(voltageData);
                let giveElectData = _.get($scope.entity, 'request_data.key2', []);
                let backElectData = _.get($scope.entity, 'request_data.key3', []);
                let speedData = _.get($scope.entity, 'request_data.key4', []);
                let torqueData = _.get($scope.entity, 'request_data.key5', []);

                let colors = ['#e07216', '#ff0000', '#675bba', '#10c469', '#5793f3'];
                let options = {
                    color: colors,

                    tooltip: {
                        trigger: 'axis'
                    },
                    grid: {
                        left: '10%'
                    },
                    dataZoom: dataZoom,
                    legend: {
                        data: ['给定电流（A）', '反馈电流（A）', '给定电压（V）', '反馈速度（r/min）', '力矩（Nm）']
                    },
                    xAxis: [
                        {
                            type: 'category',
                            axisTick: {
                                alignWithLabel: true
                            },
                            data: xData
                        }
                    ],
                    yAxis: [
                        {
                            type: 'value',
                            name: '电流（A）',
                            position: 'left',
                            axisLine: {
                                lineStyle: {
                                    color: colors[0]
                                }
                            }
                        },
                        {
                            type: 'value',
                            name: '电压（V）',
                            position: 'left',
                            offset: 80,
                            axisLine: {
                                lineStyle: {
                                    color: colors[2]
                                }
                            }
                        },
                        {
                            type: 'value',
                            name: '速度（r/min）',
                            position: 'right',
                            axisLine: {
                                lineStyle: {
                                    color: colors[3]
                                }
                            }
                        },
                        {
                            type: 'value',
                            name: '力矩（Nm）',
                            position: 'right',
                            offset: 80,
                            axisLine: {
                                lineStyle: {
                                    color: colors[4]
                                }
                            }
                        }
                    ],
                    series: [
                        {
                            name: '给定电流（A）',
                            type: 'line',
                            data: giveElectData
                        },
                        {
                            name: '反馈电流（A）',
                            type: 'line',
                            data: backElectData
                        },
                        {
                            name: '给定电压（V）',
                            type: 'line',
                            yAxisIndex: 1,
                            data: voltageData
                        },
                        {
                            name: '反馈速度（r/min）',
                            type: 'line',
                            yAxisIndex: 2,
                            data: speedData
                        },
                        {
                            name: '力矩（Nm）',
                            type: 'line',
                            yAxisIndex: 3,
                            data: torqueData
                        }
                    ]
                };
                ctrl.initEcharts('key-chart', options);

            },
            initEcharts: function (id, option) {
                var chartObject = echarts.init(document.getElementById(id));
                chartObject.setOption(option);
            }
        });
        $timeout(function () {
            ctrl.initialize();
        }, 200);

    }]);
});
