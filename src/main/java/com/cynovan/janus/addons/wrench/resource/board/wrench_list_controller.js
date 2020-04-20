define(['wrench/resource/board/wrench_board_init_data_config'], function (AppDataConfig) {
    var app = angular.module('app');

    app.controller('WrenchListController', ['$scope', 'AppDataService', 'AppConfigService', 'util', 'dialog', '$state', 'database', '$element',
        'session', '$timeout', 'BindDevice', 'janus',
        function ($scope, AppDataService, AppConfigService, util, dialog, $state, database, $element, session, $timeout, BindDevice, janus) {
            var ctrl = this;
            $scope.model = database.get('janus-wrench-board-model') || 'kanban';
            $scope.entity = {};
            _.extend(ctrl, {
                initialize: function () {
                    // ctrl.loadConfig();
                    ctrl.initListOption();
                    ctrl.initKanbanOptions();
                    ctrl.bindEvent();
                    ctrl.initAppDataConfig()
                },
                initAppDataConfig: function () {
                    $timeout(function () {
                        AppConfigService.bind(AppDataConfig, '.app-data-config');
                    }, 300);
                },
                initListOption: function () {
                    ctrl.options = {
                        collection: 'device',
                        query: {'wrench.show': true},
                        filled: true,
                        columns: [{
                            name: 'online',
                            title: '活动状态',
                            width: '100px',
                            targets: 0,
                            orderable: true,
                            render: function (data, type, row) {
                                var html = '';
                                if (row.online.toString() === 'true') {
                                    html = '<span class="device_online_state active" id="device_online_state_${row.id}"></span>';
                                } /*else if (row.online == 'exception') {
                                    html = `<button class="btn btn-danger btn-xs list_btn" data-key="onlineException" type="button">
                                        <i class="fa fa-exclamation-triangle animated flash infinite"></i>
                                        异常
                                        </button>`;
                                }*/ else {
                                    html = '<span class="device_online_state" id="device_online_state_${row.id}"></span>';
                                }
                                return html;
                            }
                        }, {
                            name: 'online_exception',
                            visible: false
                        }, {
                            name: 'uuid',
                            title: '序列号',
                            search: true,
                            width: '25%'
                        }, {
                            name: 'baseInfo.name',
                            title: '设备名称',
                            width: '20%',
                            search: true,
                            render: function (data, type, row) {
                                return `<a data-key='detailKey' class="list_btn" href="javascript:void(0);">${data}</a>`;
                            }
                        }, {
                            name: 'tag',
                            title: '设备标签',
                            search: true
                        }, {
                            name: '_id',
                            title: '操作',
                            orderable: false,
                            render: function (data, type, row) {
                                return `<button type="button" data-key="wrench_info" class="btn btn-primary btn-xs list_btn btn-outline"> 扳手信息</button>`;
                            }
                        }]
                    };
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('.btn').data('key');
                        if (buttonKey === "detailKey" || buttonKey === "wrench_info") {
                            ctrl.showWrenchDetail(rowdata.uuid);
                        }
                    });
                    $scope.$on('buttonClicked.kanban', function (event, element, options, data) {
                        var buttonKey = element.data('key');
                        if (buttonKey === 'uuidKey') {
                            ctrl.showWrenchDetail(data);
                        }
                    });
                    $scope.$watch('model', function (newVal) {
                        database.set('janus-wrench-board-model', newVal);
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
                        query: {'wrench.show': true},
                        projector: {},
                        sort: {},
                        itemRender: function (data) {
                            var imageUrl = ctrl.getWrenchImageUrl(data);
                            var imageInfo;
                            if (_.includes(imageUrl, 'wrench/resource/icon/wrench.png')) {
                                // 无图片
                                imageInfo = `<a class="imgWrap"><img src="${imageUrl}"/></a>`;
                            } else {
                                // 有图片
                                imageInfo = `<a class="imgWrap fancy-img" data-type="image" href="${imageUrl + '?thumb=false'}"><img src="${imageUrl}"/></a>`;
                            }
                            var cls = data.online.toString() === 'true' ? 'active' : '';
                            return `<div class="thumbnail kanban-list-item">
                                            ${imageInfo}
                                            <div class="cnc-kanban-list-info">
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
                getWrenchImageUrl: function (itemData) {
                    var imageId = _.get(itemData, 'board.image_id', '');
                    return util.getImageUrl(imageId, 'wrench/resource/icon/wrench.png', true);
                },
                showWrenchDetail: function (uuid) {
                    janus.goToMenuDetailByName('智能扭力扳手', uuid);
                },
                bindDeviceToWrench: function () {
                    BindDevice.bind('wrench.show').done(function () {
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
                }
            });
            ctrl.initialize();
        }]);
});
