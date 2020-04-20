define(['moduleline_machine/board/js/moduleline_init_data_config'], function (AppDataConfig) {
    var app = angular.module('app');

    app.controller('ModulelineBoardController', ['$scope', '$state', 'DBUtils', 'dialog', 'http', '$element', 'util', 'database', 'AppConfigService', 'BindDevice', '$timeout', 'janus',
        function ($scope, $state, DBUtils, dialog, http, $element, util, database, AppConfigService, BindDevice, $timeout, janus) {

            var ctrl = this;

            $scope.model = database.get('janus-moduleline-device-model') || 'kanban';
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.initListOption();
                    ctrl.initKanbanOptions();
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
                        database.set('janus-moduleline-device-model', newVal);
                    });
                    $scope.$on('device.statusChange', function () {
                        ctrl.refreshTable();
                    });
                    $timeout(function () {
                        AppConfigService.bind(AppDataConfig, '.app-config-btn');
                    }, 300);
                },
                initListOption: function () {
                    ctrl.options = {
                        collection: 'device',
                        filled: true,
                        query: {
                            'moduleline.show': true
                        },
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
                            name: 'sewing_col',
                            title: '操作',
                            orderable: false,
                            render: function (data, type, row) {
                                return '<button class="btn btn-primary btn-xs btn-outline" data-key="detailKey" type="button">详细信息</button>';
                            }
                        }]
                    }
                },
                initKanbanOptions: function () {
                    ctrl.kanbanOptions = {
                        collection: 'device',
                        query: {
                            'moduleline.show': true
                        },
                        projector: {},
                        sort: {},
                        itemRender: function (data) {
                            var cls = data.online.toString() === 'true' ? 'active' : '';
                            return `<div class="thumbnail kanban-list-item">
                                            <a class="imgWrap"><img src="resource/moduleline_machine/img/app-sewing.png"/></a>
                                            <div class="welding-device-kanban-list-info">
                                                <a class="kanban-item-title" data-key="uuidKey" data="${data.uuid}"> ${data.uuid}</a>
                                                <div class="text-center" style="font-weight: bold">${data.baseInfo.name}</div>
                                                 <div class="kanban-item-state">
                                                    <span class="kanban-item-info device_online_state ${cls}" id="device_online_state_${data.id}"></span>
                                                </div>
                                            </div>
                                        </div>`;
                        }
                    };
                },
                changeModel: function (model) {
                    $scope.model = model;
                    ctrl.refreshTable();
                    util.apply($scope);
                },
                showDeviceDetail: function (uuid) {
                    janus.goToMenuDetailByName('机台', uuid);
                },
                bindDeviceToModuleLine: function () {
                    BindDevice.bind('moduleline.show').done(function () {
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
            });
            ctrl.initialize();
        }]);
});