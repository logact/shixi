define(['rear_setting_machine/board_v2/js/rear_setting_machine_data_config_v2'], function (AppDataConfig) {
    var app = angular.module('app');

    app.controller('RearSettingMachineBoardV2Controller', ['$scope', '$state', 'DBUtils', 'dialog', 'http', '$element', 'util',
        'database', 'AppConfigService', 'BindDevice', '$timeout', 'janus',
        function ($scope, $state, DBUtils, dialog, http, $element, util, database, AppConfigService, BindDevice, $timeout, janus) {

            var ctrl = this;

            $scope.model = database.get('janus-rear-setting-machine-model') || 'kanban';
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initListOption();
                    ctrl.initKanbanOptions();
                    ctrl.bindEvent();
                    ctrl.initAppDataConfig();
                },
                initAppDataConfig: function () {
                    $timeout(function () {
                        AppConfigService.bind(AppDataConfig, '.app-data-config');
                    }, 300);
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('.btn').data('key');
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
                        database.set('janus-rear-setting-machine-model', newVal);
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
                    var query = {'rear_setting_machine_v2.show': true};
                    ctrl.kanbanOptions = {
                        collection: 'device',
                        query: query,
                        projector: {},
                        sort: {},
                        itemRender: function (data) {
                            var imageUrl = ctrl.getRearImageUrl(data);
                            var cls = _.toString(data.online) === 'true' ? 'active' : '';
                            var alarm = _.get(data, 'dynamicData.DeviceAlarm', '');

                            var status = _.get(data, 'dynamicData.WorkSts', 'true');
                            if (_.eq(status, 'true')) {
                                status = '<span>正常</span>';
                            } else {
                                status = '报警';
                            }
                            var totalTime = _.get(data, 'dynamicData.DeviceTotalRunTime', '0');
                            totalTime = '<span>' + totalTime + '</span>';
                            return `<div class="thumbnail kanban-list-item">
                                            ${imageUrl}
                                            <div class="rear-setting-machine-kanban-list-info">
                                                <a class="kanban-item-title" data-key="uuidKey" data="${data.uuid}"> ${data.uuid}</a>
                                                <div class="text-center" style="font-weight: bold">${data.baseInfo.name}</div>
                                                
                                                <div class="kanban-item-status">
                                                    <div class="col-xs-6">${status}</div>
                                                    <div class="col-xs-6"><i class="fa fa-clock-o"></i>${totalTime}天</div>
                                                </div>
                                                <div class="kanban-item-state">
                                                    <span class="kanban-item-info device_online_state ${cls}" id="device_online_state_${data.id}"></span>
                                                </div>
                                            </div>
                                        </div>`;
                        }
                    };
                },
                getRearImageUrl: function (itemData) {
                    var imageId = _.get(itemData, 'rear_setting_machine_v2.image_id', '');
                    if (imageId) {
                        var imageUrl = util.getImageUrl(imageId, 'rear_setting_machine/img/app-rear.png', true);
                        return `<a class="imgWrap fancy-img" data-type="image" href="${imageUrl + '?thumb=false'}"><img src="${imageUrl}"/></a>`;
                    } else {
                        return `<a class="imgWrap"><img src="resource/rear_setting_machine/img/app-rear.png"/></a>`;
                    }
                },
                showDeviceDetail: function (uuid) {
                    janus.goToMenuDetailByIndex(2, uuid);
                },
                bindDeviceToRearSettingMachine: function () {
                    BindDevice.bind('rear_setting_machine_v2.show').done(function () {
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
                    var query = {'rear_setting_machine_v2.show': true};

                    ctrl.options = {
                        collection: 'device',
                        filled: true,
                        query: query,
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
                                var cls = _.toString(row.online) === 'true' ? 'active' : '';
                                return `<span class="device_online_state ${cls}" id="device_online_state_${row.id}"></span>`;
                            }
                        }, {
                            name: 'dynamicData.DeviceAlarm',
                            title: '报警状态',
                            width: '100px',
                            targets: 0,
                            orderable: true,
                            render: function (data, type, row) {
                                if (_.toString(row.online) !== 'true') {
                                    return `<span class="fa fa-question"></span>`;
                                }
                                if (!data) {
                                    return `<span class="fa fa-circle-o-notch fa-spin rear-normal"></span>`;
                                } else {
                                    return `<span class="fa fa-exclamation-triangle rear_warning animated flash infinite"></span>`;
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
                            name: 'cnc',
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
});
