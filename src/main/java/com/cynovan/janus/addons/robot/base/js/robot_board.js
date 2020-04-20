define(['robot/base/js/robot_init_data_config'], function (AppDataConfig) {
    var app = angular.module('app');

    app.controller('RobotBoardController', ['AppConfigService', '$scope', '$state', 'DBUtils', 'dialog', 'http', '$element', 'util',
        'database', 'session', '$timeout', 'BindDevice', 'janus',
        function (AppConfigService, $scope, $state, DBUtils, dialog, http, $element, util, database, session, $timeout, BindDevice, janus) {

            var ctrl = this;
            $scope.model = database.get('janus-robot-board-model') || 'kanban';
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initListOption();
                    ctrl.initKanbanOptions();
                    ctrl.bindEvent();
                    ctrl.initAppDataConfig();
                },
                initAppDataConfig: function () {
                    $timeout(function () {
                        AppConfigService.bind(AppDataConfig, '.app-data-config')
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
                        database.set('janus-robot-board-model', newVal);
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
                        query: {'robot.show': true},
                        projector: {},
                        sort: {},
                        itemRender: function (data) {
                            var imageUrl = ctrl.getRobotImageUrl(data);
                            var imageInfo;
                            if (_.includes(imageUrl, 'robot/base/assets/robot.png')) {
                                // 无图片
                                imageInfo = `<a class="imgWrap"><img src="${imageUrl}"/></a>`;
                            } else {
                                // 有图片
                                imageInfo = `<a class="imgWrap fancy-img" data-type="image" href="${imageUrl + '?thumb=false'}"><img src="${imageUrl}"/></a>`;
                            }
                            var cls = data.online.toString() === 'true' ? 'active' : '';
                            var alarmData = _.get(data, 'dynamicData.068_ERRORStatus', '0');
                            var alarmInfo;
                            if (data.online.toString() !== 'true') {
                                alarmInfo = '<span class="fa fa-question"></span>';
                            } else {
                                if (alarmData === '0' || !alarmData) {
                                    alarmInfo = '<span class="fa fa-circle-o-notch fa-spin robot-normal "></span>';
                                } else {
                                    alarmInfo = '<span class="fa fa-exclamation-triangle robot-warning animated flash infinite"></span>';
                                }
                            }
                            return `<div class="thumbnail kanban-list-item">
                                            ${imageInfo}
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
                getRobotImageUrl: function (itemData) {
                    var imageId = _.get(itemData, 'robot.image_id', '');
                    return util.getImageUrl(imageId, 'robot/base/assets/robot.png', true);
                },
                showDeviceDetail: function (uuid) {
                    janus.goToMenuDetailByIndex(1, uuid);
                },
                bindDeviceToRobot: function () {
                    BindDevice.bind('robot.show').done(function () {
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
                        query: {'robot.show': true},
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
                            name: 'dynamicData.068_ERRORStatus',
                            title: '报警状态',
                            width: '100px',
                            targets: 0,
                            orderable: true,
                            render: function (data, type, row) {
                                if (row.online.toString() !== 'true') {
                                    return `<span class="fa fa-question"></span>`;
                                }
                                if (!data || data === '0') {
                                    return `<span class="fa fa-circle-o-notch fa-spin robot-normal "></span>`;
                                } else {
                                    return `<span class="fa fa-exclamation-triangle robot-warning animated flash infinite"></span>`;
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
                            name: 'robot',
                            title: '操作',
                            orderable: false,
                            render: function (data, type, row) {
                                return '<button class="btn btn-primary btn-xs btn-outline" data-key="detailKey" type="button">机器人信息</button>';
                            }
                        }]
                    }
                }
            });
            ctrl.initialize();
        }]);

    app.controller('RobotDynamicController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'session', 'AppConfigService', '$state', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, session, AppConfigService, $state, janus) {
            var ctrl = this;
            var uuid = $stateParams.id;
            $scope.entity = {};
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadDeviceData();
                    ctrl.bindEvent();
                    ctrl.initSubNavOption();
                },
                bindEvent: function () {
                    $scope.$watch('entity.robot.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: uuid
                                }, {
                                    $set: {
                                        'robot.image_id': newValue
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
                        query: {'robot.show': true},
                        label: "机器人列表",
                        selected: $stateParams.id
                    }
                },
                updateField: _.throttle(function (lastData) {
                    if (!_.isEmpty(lastData)) {
                        /*改为jq操作,以增强响应*/
                        var updateFields = $element.find('.static-field-value');
                        // AppConfigService.query(AppDataConfig.app).then(function () {
                        _.each(updateFields, function (fieldElement) {
                            var target = $(fieldElement);
                            var fieldKey = target.data('key');
                            AppConfigService.getFieldData(AppDataConfig.app, fieldKey, lastData).done(function (newValue) {
                                if (newValue !== target.text()) {
                                    target.text(newValue);
                                }
                            });
                        });
                        // });
                    }
                }, 200),
                goList: function () {
                    janus.goToMenuByIndex(1);
                }
            });
            ctrl.initialize();
        }]);
});
