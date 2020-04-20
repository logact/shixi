define(['imm/js/imm_board_init_data_config'], function (AppDataConfig) {
    var app = angular.module('app');

    var stringMap = ['MachineType', 'MachineID', 'Material', 'Type', 'Company', 'MaintenanceDate'];
    var stateMap = {
        WorkMode: {
            0: 'Idle',
            1: '设定模式',
            2: '手动模式',
            3: '半自动模式',
            4: '全自动模式'
        },
        DeviceState: {
            1000: 'Idle',
            1001: 'Clamp Open - Stage 1 (Break)',
            1002: 'Clamp Open - Stage 2',
            1003: 'Clamp Open - Stage 3',
            1004: 'Clamp Open - Fast Stage',
            1005: 'Clamp Open - Slow Stage',
            1006: 'Core A - Out',
            1007: 'Core B - Out',
            1008: 'Core C - Out',
            1009: 'Core D - Out',
            1010: 'Clamp Close - Stage 1 (Fast)',
            1011: 'Clamp Close - Stage 2',
            1012: 'Clamp Close - Stage 3',
            1013: 'Clamp Close - Low Pressure',
            1014: 'Clamp Close - High Pressure',
            1015: 'Core A - In',
            1016: 'Core B - In',
            1017: 'Core C - In',
            1018: 'Core D - In',
            1019: 'Clamping Force',
            1020: 'Injection - Stage 1',
            1021: 'Injection - Stage 2',
            1022: 'Injection - Stage 3',
            1023: 'Injection - Stage 4',
            1024: 'Injection - Stage 5',
            1025: 'Not Used',
            1026: 'Holding - Stage 1',
            1027: 'Holding - Stage 2',
            1028: 'Holding - Stage 3',
            1029: 'Holding - Stage 4',
            1030: 'Holding - Stage 5',
            1031: 'Plasticizing - Stage 1',
            1032: 'Plasticizing - Stage 2',
            1033: 'Plasticizing - Stage 3',
            1034: 'Decompression',
            1035: 'Purge Injection Unit',
            1036: 'Purge Plasticizing Unit',
            1037: 'Purge Decompression',
            1038: 'Ejector Out - Stage 1',
            1039: 'Ejector Out - Stage 2',
            1040: 'Ejector In - Stage 1',
            1041: 'Ejector In - Stage 2',
            1042: 'Carriage Forward - Fast Stage',
            1043: 'Carriage Forward - Slow Stage',
            1044: 'Carriage Backward',
            1045: 'Core A - In',
            1046: 'Core A - Out',
            1047: 'Core B - In',
            1048: 'Core B - Out',
            1049: 'Core C - In',
            1050: 'Core C - Out',
            1051: 'Core D - In',
            1052: 'Core D - Out',
            1053: 'Aux 12',
            1054: 'Aux 13',
            1055: 'Aux 14',
            1056: 'Aux 15',
            1057: 'Aux 16',
            1058: 'Aux 17',
            1059: 'Aux 18',
            1060: 'Aux 19',
            1061: 'Aux 20',
            1062: 'Aux 21',
            1063: 'Aux 22',
            1064: 'Aux 23',
            1065: 'Aux 24',
            1076: 'Special Aux 1',
            1077: 'Special Aux 2',
            1078: 'Special Aux 3',
            1079: 'Special Aux 4',
            1080: 'Special Aux 5',
            1081: 'Special Aux 6',
            1082: 'Special Aux 7',
            1083: 'Special Aux 8',
            1084: 'Special Aux 9',
            1085: 'Special Aux 10'
        }
    };

    app.controller('IMMBoardController', ['$scope', '$state', 'DBUtils', 'dialog', 'http', '$element', 'util', 'database',
        'AppConfigService', 'session', 'BindDevice', '$timeout', 'janus',
        function ($scope, $state, DBUtils, dialog, http, $element, util, database, AppConfigService, session, BindDevice, $timeout, janus) {

            var ctrl = this;
            $scope.model = database.get('janus-imm-board-model') || 'kanban';
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initListOption();
                    ctrl.initKanbanOptions();
                    ctrl.bindEvent();
                    ctrl.initAppDataConfig();
                },
                initAppDataConfig: function () {
                    $timeout(function () {
                        AppConfigService.bind(AppDataConfig, 'app-config-btn');
                    }, 300);
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.data('key');
                        if (buttonKey === "detailKey") {
                            ctrl.showDeviceDetail(rowdata.uuid);
                        }
                    });
                    $scope.$on('buttonClicked.kanban', function (event, element, options, data) {
                        var buttonKey = element.data('key');
                        if (buttonKey === 'uuidKey') {
                            ctrl.showDeviceDetail(data);
                        }
                    });
                    $scope.$watch('model', function (newVal) {
                        database.set('janus-imm-board-model', newVal);
                    });
                    $scope.$on('device.statusChange', function () {
                        ctrl.refreshTable();
                    });
                },
                changeModel: function (model) {
                    $scope.model = model;
                    ctrl.refreshTable();
                    util.apply($scope);
                },
                initKanbanOptions: function () {
                    ctrl.kanbanOptions = {
                        collection: 'device',
                        query: {'imm.show': true},
                        projector: {},
                        sort: {},
                        itemRender: function (data) {
                            var imageUrl = ctrl.getImmImageUrl(data);
                            var cls = data.online.toString() === 'true' ? 'active' : '';
                            var alarmData = _.get(data, 'dynamicData.3_12320', '0');
                            var alarmInfo;
                            if (data.online.toString() !== 'true') {
                                alarmInfo = '<span class="fa fa-question"></span>';
                            } else {
                                if (alarmData === '0' || !alarmData) {
                                    alarmInfo = '<span class="fa fa-circle-o-notch fa-spin imm-normal "></span>';
                                } else {
                                    alarmInfo = '<span class="fa fa-exclamation-triangle imm_warning animated flash infinite"></span>';
                                }
                            }
                            return `<div class="thumbnail kanban-list-item">
                                            ${imageUrl}
                                            <div class="kanban-list-info">
                                                <a class="kanban-item-title" data-key="uuidKey" data="${data.uuid}"> ${data.uuid}</a>
                                                <div class="text-center">${data.baseInfo.name}</div>
                                                <div class="kanban-item-state">
                                                    <span class="kanban-item-info device_online_state ${cls}" id="device_online_state_${data.id}"></span>
                                                    ${alarmInfo}
                                                </div>
                                            </div>
                                        </div>`;
                        }
                    };
                },
                getImmImageUrl: function (itemData) {
                    var imageId = _.get(itemData, 'imm.image_id', '');
                    if (imageId) {
                        var imageUrl = util.getImageUrl(imageId, 'imm/assets/imm.png', true);
                        return `<a class="imgWrap fancy-img" data-type="image" href="${imageUrl + '?thumb=false'}"><img src="${imageUrl}"/></a>`;
                    } else {
                        return `<a class="imgWrap"><img src="resource/imm/assets/imm.png"/></a>`;
                    }
                },
                showDeviceDetail: function (uuid) {
                    janus.goToMenuDetailByName('机床', uuid);
                },
                bindDeviceToIMM: function () {
                    BindDevice.bind('imm.show').done(function () {
                        ctrl.refreshTable();
                    });
                },
                refreshTable: function () {
                    if ($scope.model === 'list') {
                        var table = $($element).find('.c-table');
                        table.DataTable().ajax.reload();
                    } else {
                        var kanbanBox = $($element).find('.c-kanban');
                        kanbanBox.pagination('refresh');
                    }
                },
                initListOption: function () {
                    ctrl.options = {
                        collection: 'device',
                        filled: true,
                        query: {'imm.show': true},
                        columns: [{
                            name: '_id',
                            visible: false
                        }, {
                            name: 'online',
                            title: '活动状态',
                            width: '100px',
                            targets: 0,
                            orderable: true,
                            render: function (data, type, row) {
                                var cls = row.online.toString() === 'true' ? 'active' : '';
                                return `<span class="device_online_state ${cls}" id="device_online_state_${row.id}"></span>`;
                            }
                        }, {
                            name: 'dynamicData.3_12320',
                            title: '报警状态',
                            width: '100px',
                            targets: 0,
                            orderable: true,
                            render: function (data, type, row) {
                                if (row.online.toString() !== 'true') {
                                    return `<span class="fa fa-question"></span>`;
                                }
                                if (!data || data === '0') {
                                    return `<span class="fa fa-circle-o-notch fa-spin imm-normal "></span>`;
                                } else {
                                    return `<span class="fa fa-exclamation-triangle imm_warning animated flash infinite"></span>`;
                                }
                            }
                        }, {
                            name: 'uuid',
                            title: '序列号',
                            search: true,
                            width: '25%'
                        }, {
                            name: 'baseInfo.name',
                            title: '设备名称',
                            width: '20%',
                            search: true
                        }, {
                            name: 'tag',
                            title: '设备标签',
                            search: true
                        }, {
                            name: 'imm',
                            title: '操作',
                            orderable: false,
                            render: function (data, type, row) {
                                return '<button class="btn btn-primary btn-xs btn-outline" data-key="detailKey" type="button">机台信息</button>';
                            }
                        }]
                    }
                }
            });
            ctrl.initialize();
        }]);

    app.controller('IMMDynamicController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$state', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $state, janus) {
            var ctrl = this;
            var uuid = $stateParams.id;
            $scope.entity = {};

            var mergeFieldSettings = {
                'MachineType': {
                    start: 12288,
                    end: 12307
                },
                'MachineID': {
                    start: 12308,
                    end: 12317
                },
                'Material': {
                    start: 12329,
                    end: 12338
                },
                'Type': {
                    start: 12339,
                    end: 12348
                },
                'Company': {
                    start: 12349,
                    end: 12358
                },
                'MaintenanceDate': {
                    start: 12359,
                    end: 12368
                }
            };

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadDeviceData();
                    ctrl.initSubNavOption();
                },
                bindEvent: function () {
                    $scope.$watch('entity.imm.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: uuid
                                }, {
                                    $set: {
                                        'imm.image_id': newValue
                                    }
                                }).success(function () {
                                    dialog.noty('操作成功');
                                });
                            }
                        }
                    });
                },
                loadDeviceData: function () {
                    DBUtils.find('device', {
                        uuid: uuid
                    }).success(function (result) {
                        var device = _.get(result, 'datas.result', {});
                        ctrl.updateField(_.get(device, "dynamicData", {}));
                        delete device.dynamicData;
                        $scope.entity = device;
                        util.apply($scope);
                        ctrl.bindEvent();
                    });

                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
                        onmessage: function (data) {
                            ctrl.updateField(_.get(data, 'data', {}));
                        }
                    });

                },
                initSubNavOption: function () {
                    ctrl.subNavOptions = {
                        collection: 'device',
                        query: {'imm.show': true},
                        selected: $stateParams.id
                    }
                },
                mergeFields: function (datas) {
                    _.each(mergeFieldSettings, function (fieldSetting, fieldName) {
                        var valueArr = [];
                        for (let idx = fieldSetting.start; idx <= fieldSetting.end; idx++) {
                            var value = _.get(datas, `3_${idx}`, '');
                            if (value) {
                                valueArr.push(value);
                            }
                        }
                        var chunkArr = _.chunk(valueArr, 4);
                        _.each(chunkArr, function (item, idx) {
                            chunkArr[idx] = item.reverse();
                        });
                        valueArr = _.flatten(valueArr);
                        let fieldValue = String.fromCharCode.apply(null, valueArr) || '';
                        _.set(datas, fieldName, fieldValue);
                    });
                },
                workMode: function (datas) {
                    var value = _.get(datas, '3_12318', '0');
                    value = _.parseInt(value);
                    _.set(datas, 'WorkMode_Desc', stateMap.WorkMode[value]);
                },
                deviceState: function (datas) {
                    var value = _.get(datas, '3_12319', '0');
                    value = _.parseInt(value);
                    _.set(datas, 'MachineStatus_Desc', stateMap.DeviceState[value]);
                },
                updateField: _.throttle(function (lastData) {
                    if (!_.isEmpty(lastData)) {
                        // ctrl.mergeFields(lastData);
                        // ctrl.workMode(lastData);
                        // ctrl.deviceState(lastData);
                        /*改为jq操作,以增强响应*/
                        var updateFields = $element.find('.static-field-value');
                        _.each(updateFields, function (fieldElement) {
                            var target = $(fieldElement);
                            var fieldKey = target.data('key');
                            AppConfigService.getFieldData(AppDataConfig.app, fieldKey, lastData).done(function (newValue) {
                                if (newValue !== target.text()) {
                                    target.text(newValue);
                                }
                            });
                        });

                        /* switch update */
                        var updateSwitchs = $element.find('.static-switch-state');
                        _.each(updateSwitchs, function (switchElement) {
                            var target = $(switchElement);
                            var targetValue = target.hasClass('active') ? true : false;

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
                    }
                }, 200),
                goList: function () {
                    janus.goToMenuByName('机床')
                }
            });
            ctrl.initialize();
        }]);
});
