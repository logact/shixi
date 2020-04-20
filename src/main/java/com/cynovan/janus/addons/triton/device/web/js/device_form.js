define(['triton/device/web/js/conn_types/conn_types',
    'triton/device/web/service/exchange_code_service'], function (ConnTypes) {
    var app = angular.module('app');

    app.controller('DeviceDetailController', ['$scope', '$state', '$stateParams', 'DBUtils', 'dialog', 'http', 'util', 'websocket', '$timeout',
        'template', '$compile', '$element', 'MonacoEditor', 'janus', 'I18nService', 'ExchangeCodeService',
        function ($scope, $state, $stateParams, DBUtils, dialog, http, util, websocket, $timeout, template, $compile, $element, MonacoEditor, janus, I18nService, ExchangeCodeService) {
            var ctrl = this;
            $scope.entity = {};
            $scope.rateinfo = -1;
            var uuid = $scope.uuid = $stateParams.id;
            var maxLogCount = 15, currentLogCount = 0;

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.rate = I18nService.getValue('计算中', 'calculating');
                    ctrl.initSubNavOption();
                    ctrl.initDeviceInfo();
                    ctrl.initDataExchangeInfo();
                    $timeout(function () {
                        ctrl.calcBottomBoxHeight();
                    }, 100);
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $(window).resize(function () {
                        ctrl.calcBottomBoxHeight();
                    });
                    $scope.$on('device.statusChange', function (event, message) {
                        var paramMap = message.paramMap;
                        let uuid = _.get(paramMap, "id", "");
                        let state = _.get(paramMap, "state", "");
                        if (uuid && uuid === $scope.uuid) {
                            $scope.stateName = ctrl.getStateName(state);
                            util.apply($scope);
                        }
                    });
                    $scope.$on('device.onlineChange', function (event, message) {
                        ctrl.reloadEntityState();
                        var paramMap = message.paramMap;
                        var content = message.content;
                        var id = _.get(paramMap, I18nService.getValue('设备', 'Device'), {});
                        if (content) {
                            dialog.noty(content);
                        }
                        if (id) {
                            if (message.title === I18nService.getValue('设备上线通知', 'device.online.noty')) {
                                $('#device_online_state_' + id).addClass("active");
                            } else {
                                $('#device_online_state_' + id).removeClass("active");
                            }
                        }
                    });
                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
                        onmessage: function (message, rate) {
                            $scope.rateinfo = rate;
                            if (rate !== -1) {
                                ctrl.rate = rate + 'ms';
                            }
                            util.apply($scope);
                            if (message) {
                                ctrl.onData(message);
                            }
                        },
                        rate: true
                    });
                    $scope.$on('$destroy', function () {
                        websocket.unsub('deviceData/' + uuid);
                        MonacoEditor.disposeAll();
                    });
                    $scope.$watch('entity.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'image_id': newValue
                                    }
                                }).success(function () {
                                    dialog.noty('操作成功');
                                });
                            }
                        }
                    });
                    $scope.$watch("entity.state", function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if ($scope.entity.online) {
                                $scope.stateName = ctrl.getStateName(newValue);
                            } else {
                                $scope.stateName = "离线";
                            }
                        }
                    });
                },
                reloadEntityState: function () {
                    DBUtils.find("device", {
                        "uuid": $scope.entity.uuid
                    }, {
                        state: 1
                    }).success(function (result) {
                        let state = _.get(result, "datas.result.state", "");
                        $scope.stateName = ctrl.getStateName(state);
                        util.apply($scope);
                    });
                },
                getStateName: function (state) {
                    let stateName;
                    if (state === "normal") {
                        stateName = "正常";
                    } else if (state === "warning") {
                        stateName = "警告";
                    } else if (state === "alarm") {
                        stateName = "报警";
                    } else {
                        stateName = "未绑定设备类型/未设置状态栏位"
                    }
                    return stateName;
                },
                getGroupName: function (groups, tId) {
                    var result = "";
                    _.each(groups, function (group) {
                        var childrenList = _.get(group, "children", []);
                        if (!_.isEmpty(childrenList)) {
                            var childrenResult = ctrl.getGroupName(childrenList, tId);
                            if (childrenResult === "") {
                                if (group.tId === tId) {
                                    result = group.name;
                                }
                            } else {
                                result = childrenResult;
                            }
                        } else {
                            if (group.tId === tId) {
                                result = group.name;
                            }
                        }
                    });
                    return result;
                },
                calcBottomBoxHeight: _.debounce(function () {
                    var top = 500;
                    var panel = $('.auto-height-panel');
                    var logBox = $('.log_box');
                    var codeBox = $('.code-panel');
                    var height = $(window).height() - top - 10;

                    if (height > 350) {
                        panel.height(height);
                        logBox.height(height - 75);
                    } else {
                        panel.height(350);
                        logBox.height(275);
                    }
                    var codeheight = panel.height() - 95;
                    codeBox.height(codeheight);
                }, 300),
                onData: function (message) {
                    var text = JSON.stringify(message);
                    var container = $('#data_container_' + uuid);
                    if (currentLogCount >= maxLogCount) {
                        container.find('.log_row:first').remove();
                    }
                    container.append(`<div class="log_row" style="padding-left: 10px"><div class="log_text"> ${text}</div></div>`);
                    currentLogCount++;
                },
                initSubNavOption: function () {
                    ctrl.subNavOptions = {
                        collection: 'device',
                        query: {},
                        selected: uuid
                    }
                },
                showDeveloperPanel: function () {
                    var uuid = $stateParams.id;
                    dialog.show({
                        template: 'device_developer_panel',
                        title: I18nService.getValue('设备调试面板', 'device.debug.panel'),
                        fullscreen: true,
                        controller: 'DeviceDebugDialogController',
                        controllerAs: 'ctrl',
                        data: {
                            uuid: uuid
                        }
                    });
                },
                initDeviceInfo: function () {
                    DBUtils.find('device', {
                        uuid: uuid
                    }).success(function (result) {
                        result = _.get(result, 'datas.result', {});
                        _.extend($scope.entity, result);
                        $timeout(function () {
                            if ($scope.entity.online) {
                                $('.device_online_state').addClass("active");
                            }
                        }, 300);
                    });
                },
                initDataExchangeInfo: function () {
                    http.post('connections/deviceDataExchange', {
                        uuid: uuid
                    }).success(function (result) {
                        _.extend($scope.entity, result);
                        ctrl.showConnInfo();
                        util.apply($scope);
                    });
                },
                showConnInfo: function () {
                    var deviceConType = $scope.entity.conn_type || 'triton';
                    var connType = _.find(ConnTypes, {id: deviceConType});
                    if (connType) {
                        var displayHtml = template.get(connType.display);
                        if (displayHtml) {
                            var connPanel = $element.find('.device-conn-info-panel');
                            connPanel.html(displayHtml);
                            $compile(connPanel)($scope);
                        }
                    }
                },
                parseDeviceGroup: function (groups) {
                    var result = [];
                    _.each(groups, function (node) {
                        if (node.code === "root") {
                            return;
                        }
                        var item = {
                            name: node.name,
                            code: node.code
                        };
                        result.push(item);
                    });
                    return result;
                },
                getDeviceInfoEntity: function () {
                    var _entity = {};
                    if ($scope.entity) {
                        var array = ["id", "uuid_type", "tag", "group", "baseInfo", "classification", "uuid", "poi", "sync_neptune"];
                        _entity = _.pick($scope.entity, array);
                    } else {
                        _entity = {
                            uuid_type: '1',
                            tag: []
                        };
                    }
                    return _entity;
                },
                editDeviceInfo: function () {
                    var _entity = ctrl.getDeviceInfoEntity();
                    var dialogElement = dialog.show({
                        template: 'app_triton_add_device_template',
                        width: 1200,
                        title: I18nService.getValue('修改设备信息', 'device.edit.info'),
                        controller: 'DeviceAddController',
                        controllerAs: 'ctrl',
                        data: {
                            entity: _entity
                        }
                    });
                    dialogElement.on('hidden.bs.modal', function () {
                        ctrl.initDeviceInfo();
                    });
                },
                editDeviceConnType: function () {
                    var entity = _.cloneDeep($scope.entity);
                    dialog.show({
                        template: 'device_conn_type_template',
                        width: 1200,
                        title: I18nService.getValue('修改设备接入方式', 'edit_device_connect'),
                        controller: 'TritonConnTypeController',
                        controllerAs: 'ctrl',
                        data: {
                            uuid: uuid,
                            entity: entity,
                            trigger: {
                                onSuccess: function (data) {
                                    _.extend($scope.entity, data);
                                    ctrl.showConnInfo();
                                }
                            }
                        }
                    });
                },
                showProcessingCode: function () {
                    var exchange = _.pick($scope.entity, ['open', 'code', 'testdata', 'output']);
                    ExchangeCodeService.editExchangeCode(exchange).done(function (result) {
                        _.extend($scope.entity, result || {});
                        util.apply($scope);
                        result = util.encodeJSON(result);
                        http.post('device/saveExchangeCode', {
                            uuid: $scope.entity.uuid,
                            data: result
                        }).success(function () {
                            dialog.noty(I18nService.getValue('保存成功', 'save_success'));
                        });
                    });
                },
                back: function () {
                    janus.goToMenuByIndex(2);
                }
            });
            ctrl.initialize();
        }]);
});
