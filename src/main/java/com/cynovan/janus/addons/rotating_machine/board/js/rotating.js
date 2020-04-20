define(['rotating_machine/board/js/rotating_device_init_data_config'], function (AppDataConfig) {
    var app = angular.module('app');

    app.controller('RotatingDeviceBoardController', ['$scope', '$state', 'DBUtils', 'dialog', 'http', '$element', 'util', 'database', 'AppConfigService', 'BindDevice', '$timeout', 'janus',
        function ($scope, $state, DBUtils, dialog, http, $element, util, database, AppConfigService, BindDevice, $timeout, janus) {

            var ctrl = this;

            $scope.model = database.get('janus-rotating-device-model') || 'kanban';
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initListOption();
                    ctrl.initKanbanOptions();
                    ctrl.bindEvent();
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
                        database.set('janus-rotating-device-model', newVal);
                    });
                    $scope.$on('device.statusChange', function () {
                        ctrl.refreshTable();
                    });
                    $timeout(function () {
                        AppConfigService.bind(AppDataConfig, '.app-config-btn');
                    }, 300);
                },
                changeModel: function (model) {
                    $scope.model = model;
                    ctrl.refreshTable();
                    util.apply($scope);
                },
                initKanbanOptions: function () {
                    ctrl.kanbanOptions = {
                        collection: 'device',
                        query: {
                            'rotating.show': true
                        },
                        projector: {},
                        sort: {},
                        itemRender: function (data) {
                            var imageUrl = ctrl.getRotatingImage(data);
                            var cls = data.online.toString() === 'true' ? 'active' : '';
                            var totalTime = _.get(data, 'dynamicData.18_value', '0');
                            totalTime = '<span>' + totalTime + '</span>';
                            return `<div class="thumbnail kanban-list-item">
                                            
                                            ${imageUrl}
                                            <div class="welding-device-kanban-list-info">
                                                <a class="kanban-item-title" data-key="uuidKey" data="${data.uuid}"> ${data.uuid}</a>
                                                <div class="text-center" style="font-weight: bold">${data.baseInfo.name}</div>
                                                 <div class="kanban-item-state">
                                                    <span class="kanban-item-info device_online_state ${cls}" id="device_online_state_${data.id}"></span>
                                                    <span><i class="fa fa-clock-o"></i>${totalTime}</span>
                                                </div>
                                            </div>
                                        </div>`;
                        }
                    };
                },
                getRotatingImage: function (itemData) {
                    var imageId = _.get(itemData, 'rotating.image_id', '');
                    if (imageId) {
                        var imageUrl = util.getImageUrl(imageId, 'rotating_machine/img/app-rotating.png', true);
                        return `<a class="imgWrap fancy-img" data-type="image" href="${imageUrl + '?thumb=false'}"><img src="${imageUrl}"/></a>`;
                    } else {
                        return `<a class="imgWrap"><img src="resource/rotating_machine/img/app-rotating.png"/></a>`;
                    }
                },
                showDeviceDetail: function (uuid) {
                    janus.goToMenuDetailByName('机台', uuid);
                },
                bindDeviceToRotating: function () {
                    BindDevice.bind('rotating.show').done(function () {
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
                        query: {
                            'rotating.show': true
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
                            name: 'rotating_col',
                            title: '操作',
                            orderable: false,
                            render: function (data, type, row) {
                                return '<button class="btn btn-primary btn-xs btn-outline" data-key="detailKey" type="button">详细信息</button>';
                            }
                        }]
                    }
                }
            });
            ctrl.initialize();
        }]);
});