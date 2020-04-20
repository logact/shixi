define(['press/board/js/press_board_init_data_config', 'press/board/js/press_change_value', 'echarts'], function (appDataConfig, PressInitData, echarts) {
    var app = angular.module('app');

    app.controller('PressBoardController', ['$scope', '$state', 'DBUtils', 'dialog', 'http', '$element', 'util', 'database', 'AppConfigService', '$timeout', 'BindDevice', 'janus',
        function ($scope, $state, DBUtils, dialog, http, $element, util, database, AppConfigService, $timeout, BindDevice, janus) {

            var ctrl = this;
            $scope.model = database.get('janus-press-board-model') || 'kanban';
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initListOption();
                    ctrl.initKanbanOptions();
                    ctrl.bindEvent();
                    ctrl.initAppDataConfig();
                },
                initAppDataConfig: function () {
                    $timeout(function () {
                        AppConfigService.bind(appDataConfig, '.app-data-config');
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
                        database.set('janus-press-board-model', newVal);
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
                        query: {
                            'press.show': true
                        },
                        projector: {},
                        sort: {},
                        itemRender: function (data) {
                            var imageUrl = ctrl.getPressImageUrl(data);
                            var imageInfo;
                            if (_.includes(imageUrl, 'press/img/app-press-icon.png')) {
                                // 无图片
                                imageInfo = `<a class="imgWrap"><img src="${imageUrl}"/></a>`;
                            } else {
                                // 有图片
                                imageInfo = `<a class="imgWrap fancy-img" data-type="image" href="${imageUrl + '?thumb=false'}"><img src="${imageUrl}"/></a>`;
                            }
                            var cls = data.online.toString() === 'true' ? 'active' : '';
                            var alarmData = _.get(data, 'dynamicData.Alrm_iAlarmIndex', '9999');
                            var alarmInfo;

                            var status = _.get(data, 'dynamicData.STATUS', '0');
                            var progress = _.get(data, 'dynamicData.Progress', '0') == 0 ? '0%&nbsp;&nbsp;' : _.get(data, 'dynamicData.Progress', '0') + '%';
                            var totalTime = _.get(data, 'dynamicData.TotalTime', '0');
                            var fileName = _.get(data, 'dynamicData.FileName', '0') == 0 ? '暂无' : _.get(data, 'dynamicData.FileName', '0');
                            if (data.online.toString() !== 'true') {
                                alarmInfo = '<span class="fa fa-question"></span>';
                            } else {
                                if (alarmData === '9999' || !alarmData) {
                                    alarmInfo = '<span class="fa fa-circle-o-notch fa-spin press-normal "></span>';
                                } else {
                                    alarmInfo = '<span class="fa fa-exclamation-triangle press_warning animated flash infinite"></span>';
                                }
                            }
                            if (status === '0') {
                                status = '<span>空闲</span>';
                            } else if (status === '1') {
                                status = '<span>加工</span>';
                            } else if (status === '2') {
                                status = '<span>暂停</span>';
                            } else {
                                status = '';
                            }
                            fileName = '<span>' + fileName + '</span>';
                            progress = '<span>' + progress + '</span>';
                            totalTime = '<span>' + totalTime + '</span>';
                            return `<div class="thumbnail kanban-list-item">
                                            ${imageInfo}
                                            <div class="press-kanban-list-info">
                                                <a class="kanban-item-title" data-key="uuidKey" data="${data.uuid}"> ${data.uuid}</a>
                                                <div class="text-center" style="font-weight: bold">${data.baseInfo.name}</div>
                                                
                                                <div class="kanban-item-status">
                                                    <div class="col-xs-6"><i class="fa fa-tasks"></i>${status}</div>
                                                    <div class="col-xs-6"><i class="fa fa-clock-o"></i>${totalTime}</div>
                                                </div>
                                                <div class="kanban-item-status">
                                                     <div class="col-xs-6"><i class="fa fa-spinner"></i>${progress}</div>
                                                    <div class="col-xs-6 kanban-fileName"><i class="fa fa-file"></i>${fileName}</div>
                                                </div>
                                                <div class="kanban-item-state">
                                                    <span class="kanban-item-info device_online_state ${cls}" id="device_online_state_${data.id}"></span>
                                                    ${alarmInfo}
                                                </div>
                                            </div>
                                        </div>`;
                        }
                    };
                },
                getPressImageUrl: function (itemData) {
                    var imageId = _.get(itemData, 'press.image_id', '');
                    return util.getImageUrl(imageId, 'press/img/app-press-icon.png', true);
                },
                showDeviceDetail: function (uuid) {
                    janus.goToMenuDetailByName('机台', uuid);
                },
                bindDeviceToPress: function () {
                    BindDevice.bind('press.show').done(function () {
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
                        query: {'press.show': true},
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
                            name: 'dynamicData.Alrm_iAlarmIndex',
                            title: '报警状态',
                            width: '100px',
                            targets: 0,
                            orderable: true,
                            render: function (data, type, row) {
                                if (row.online.toString() !== 'true') {
                                    return `<span class="fa fa-question"></span>`;
                                }
                                if (!data || data === '9999') {
                                    return `<span class="fa fa-circle-o-notch fa-spin press-normal "></span>`;
                                } else {
                                    return `<span class="fa fa-exclamation-triangle press_warning animated flash infinite"></span>`;
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
                            name: 'press',
                            title: '操作',
                            orderable: false,
                            render: function (data, type, row) {
                                return '<button class="btn btn-primary btn-xs btn-outline" data-key="detailKey" type="button">压机信息</button>';
                            }
                        }]
                    }
                }
            });
            ctrl.initialize();
        }]);

    app.controller('PressDynamicController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$state', 'BindDevice', '$timeout', 'janus', '$location',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $state, BindDevice, $timeout, janus, $location) {
            var ctrl = this;
            var uuid = $stateParams.id;
            var dynamicData = {}, pshuModelDynamicData = {};
            $scope.entity = {};
            $scope.defaultUnit = 'Kgf';
            var yarrPre = [], yarrPos = [];
            //需要随压装次数实时更新的栏位数组
            var checkNormalArray = ['PMP_iPushOverNum', 'iControlMode', 'rSetPushmountingPos', 'rSetPushmountingPre', 'bRelativePreMode', 'rSetPushmountingRelativePre', 'bRelativePosAlarmBack', 'rRelativePressCrossPos', 'bRelativeDisAlarmBack', 'rRelativeBandPressRange', 'rSetPushmountingDis', 'rBackPreStopLimt', 'rSetStartPos', 'rSetHoldTimeSec', 'rMinHoldPre', 'rMaxHoldPre', 'rSetFastForwardVel', 'rSetProbeVel', 'rPrePushPos', 'rAverageHoldPre', 'rSetPrePushVel', 'rSetPushmountingVel', 'rSetBackhaulVel', 'rSetBackhaulPre', 'rSetFastForwardToProbePos', 'bSetPrePushEnablel', 'bPreAlarmBack', 'rSetHoldPre', 'bSetHoldPreEnable', 'bBackPreAlarmBack'];

            var checkModelArray = ['iParamsCheckModeJudge', 'rAtlParamsCheckVal', 'rAtlParamsCheckValMax', 'rAtlParamsCheckValMin'];
            var checkDatas = ['bParamsEnable', 'bSetCheckMode', 'iParamsCheckModeDetect', 'rSetParamsCheckStartVal', 'rSetParamsCheckStopVal', 'iSetAddParam1', 'rSetParamsUpVal1', 'rSetParamsDownVal1', 'rSetParamsUpVal2', 'rSetParamsDownVal2', 'iSetAddParam2'];

            $scope.pushModel = '一次压装';
            $scope.pushModelArray = ['一次压装', '二次压装', '三次压装'];
            $scope.checkModel = '质量判断1';
            $scope.checkModels = ['质量判断1', '质量判断2', '质量判断3', '质量判断4', '质量判断5'];
            $scope.checkData = '质量检测1';//质量检测
            $scope.checkDataArray = ['质量检测1', '质量检测2', '质量检测3', '质量检测4', '质量检测5'];
            $scope.controlModel = '位置模式';
            $scope.controlModels = ['位置模式', '压力模式', '位移模式', '相对压力模式'];
            $scope.backModel = '位置模式回退';
            $scope.backModels = ['位置模式回退', '反拉拉力模式回退', '不启用'];

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    // ctrl.bindEvent();
                    ctrl.initSubNavOption();
                    $timeout(function () {
                        ctrl.autoShowTab();
                    }, 300);
                },
                autoShowTab: function () {
                    if ($location.search().tab) {
                        var tabindex = parseInt($location.search().tab)
                        $element.find('.nav-tabs li').eq(tabindex).find('a').click();
                    }
                },
                initData: function () {
                    DBUtils.find('device', {
                        uuid: uuid
                    }).success(function (result) {
                        var device = _.get(result, 'datas.result', {});
                        ctrl.updateField(_.get(device, "dynamicData", {}));
                        ctrl.initChart(_.get(device, "dynamicData", {}));
                        delete device.dynamicData;
                        $scope.entity = device;
                        ctrl.bindEvent();
                    });

                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
                        onmessage: function (data) {
                            ctrl.updateField(_.get(data, 'data', {}));

                            ctrl.initPushModel();

                            ctrl.initChart(_.get(data, 'data', {}));
                        }
                    });

                },
                initPushModel: function () {
                    if ($scope.pushModel === '一次压装') {
                        pshuModelDynamicData = _.get(dynamicData, 'pushModel0', {});
                    }
                    if ($scope.pushModel === '二次压装') {
                        pshuModelDynamicData = _.get(dynamicData, 'pushModel1', {});
                    }
                    if ($scope.pushModel === '三次压装') {
                        pshuModelDynamicData = _.get(dynamicData, 'pushModel2', {});
                    }
                    ctrl.updateNormalArray();
                    let index = 1;
                    if (_.isEqual($scope.checkModel, '质量判断1')) {
                        index = 1;
                    }
                    if (_.isEqual($scope.checkModel, '质量判断2')) {
                        index = 2;
                    }
                    if (_.isEqual($scope.checkModel, '质量判断3')) {
                        index = 3;
                    }
                    if (_.isEqual($scope.checkModel, '质量判断4')) {
                        index = 4;
                    }
                    if (_.isEqual($scope.checkModel, '质量判断5')) {
                        index = 5;
                    }
                    ctrl.updateCheckModel(index);
                    if (_.isEqual($scope.checkData, '质量检测1')) {
                        index = 1;
                    }
                    if (_.isEqual($scope.checkData, '质量检测2')) {
                        index = 2;
                    }
                    if (_.isEqual($scope.checkData, '质量检测3')) {
                        index = 3;
                    }
                    if (_.isEqual($scope.checkData, '质量检测4')) {
                        index = 4;
                    }
                    if (_.isEqual($scope.checkData, '质量检测5')) {
                        index = 5;
                    }
                    ctrl.updateCheckData(index);
                },
                updateCheckModel: function (index) {
                    let updateFields = $element.find('.static-field-value');
                    _.each(updateFields, function (fieldElement) {
                        let target = $(fieldElement);
                        let fieldKey = target.data('key');
                        if (_.indexOf(checkModelArray, fieldKey) != -1) {
                            if (fieldKey === 'iParamsCheckModeJudge') {
                                fieldKey = 'iParamsCheck' + index + 'Mode';
                            }
                            if (fieldKey === 'rAtlParamsCheckVal') {
                                fieldKey = 'rAtlParamsCheck' + index + 'Val';
                            }
                            if (fieldKey === 'rAtlParamsCheckValMax') {
                                fieldKey = 'rAtlParamsCheck' + index + 'ValMax';
                            }
                            if (fieldKey === 'rAtlParamsCheckValMin') {
                                fieldKey = 'rAtlParamsCheck' + index + 'ValMin';
                            }
                            AppConfigService.getFieldData(appDataConfig.app, fieldKey, pshuModelDynamicData).done(function (newValue) {
                                if (_.isEmpty(newValue)) {
                                    target.text(newValue);
                                } else if (newValue !== target.text()) {
                                    /* -------------- janus hardcode part --------------------- */
                                    var showValue = newValue;
                                    if (PressInitData[fieldKey]) {
                                        showValue = PressInitData[fieldKey][newValue];
                                    }
                                    newValue = showValue ? showValue : '';
                                    /* -------------- janus hardcode part --------------------- */
                                    target.text(newValue);
                                }

                            });
                        }
                    });
                },
                updateCheckData: function (index) {
                    let updateFields = $element.find('.static-field-value');
                    _.each(updateFields, function (fieldElement) {
                        let target = $(fieldElement);
                        let fieldKey = target.data('key');
                        if (_.indexOf(checkDatas, fieldKey) != -1) {
                            if (fieldKey === 'iParamsCheckModeDetect') {
                                fieldKey = 'iParamsCheckMode' + index;
                            } else if (fieldKey === 'iSetAddParam1') {
                                fieldKey = 'iSetAddParam' + index + '1';
                            } else if (fieldKey === 'rSetParamsUpVal1') {
                                fieldKey = 'rSetParamsUpVal' + index + '1';
                            } else if (fieldKey === 'rSetParamsDownVal1') {
                                fieldKey = 'rSetParamsDownVal' + index + '1';
                            } else if (fieldKey === 'rSetParamsUpVal2') {
                                fieldKey = 'rSetParamsDownVal' + index + '2';
                            } else if (fieldKey === 'rSetParamsDownVal2') {
                                fieldKey = 'rSetParamsDownVal' + index + '2';
                            } else if (fieldKey === 'iSetAddParam2') {
                                fieldKey = 'iSetAddParam' + index + '2';
                            } else {
                                fieldKey = fieldKey + index;
                            }
                            AppConfigService.getFieldData(appDataConfig.app, fieldKey, pshuModelDynamicData).done(function (newValue) {
                                if (_.isEmpty(newValue)) {
                                    target.text(newValue);
                                } else if (newValue !== target.text()) {
                                    /* -------------- janus hardcode part --------------------- */
                                    var showValue = newValue;
                                    if (PressInitData[fieldKey]) {
                                        showValue = PressInitData[fieldKey][newValue];
                                    }
                                    newValue = showValue;
                                    /* -------------- janus hardcode part --------------------- */
                                    target.text(newValue);
                                }
                            });
                        }
                    });
                },
                updateNormalArray: function () {
                    let updateFields = $element.find('.static-field-value');
                    _.each(updateFields, function (fieldElement) {
                        let target = $(fieldElement);
                        let fieldKey = target.data('key');
                        if (_.indexOf(checkNormalArray, fieldKey) != -1) {
                            AppConfigService.getFieldData(appDataConfig.app, fieldKey, pshuModelDynamicData).done(function (newValue) {
                                if (_.isEmpty(newValue)) {
                                    target.text(newValue);
                                } else if (newValue !== target.text()) {
                                    /* -------------- janus hardcode part --------------------- */
                                    var showValue = newValue;
                                    if (PressInitData[fieldKey]) {
                                        showValue = PressInitData[fieldKey][newValue];
                                    }
                                    newValue = showValue;
                                    /* -------------- janus hardcode part --------------------- */
                                    target.text(newValue);
                                }
                            });
                        }

                    });
                },
                changeBack: function (model) {
                    if (model === '位置模式回退') {
                        $element.find(`.static-field-box[field="rSetBackhaulPre"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rSetBackhaulVel"]`).removeClass('hide');
                    }
                    if (model === '反拉拉力模式回退') {
                        $element.find(`.static-field-box[field="rSetBackhaulPre"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="rSetBackhaulVel"]`).removeClass('hide');
                    }
                    if (model === '不启用') {
                        $element.find(`.static-field-box[field="rSetBackhaulPre"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rSetBackhaulPre"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rSetBackhaulVel"]`).addClass('hide');
                    }
                },
                changeControl: function (model) {
                    if (model === '位置模式') {
                        $element.find(`.static-field-box[field="rSetPushmountingPos"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingPre"]`).addClass('hide');
                        $element.find(`.static-field-box[field="bRelativePosAlarmBack"]`).addClass('hide');
                        $element.find(`.static-field-box[field="bRelativeDisAlarmBack"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingDis"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rRelativeBandPressRange"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rRelativePressCrossPos"]`).addClass('hide');
                        $element.find(`.static-field-box[field="bRelativePreMode"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingRelativePre"]`).addClass('hide');
                    }
                    if (model === '压力模式') {
                        $element.find(`.static-field-box[field="rSetPushmountingPre"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="bRelativePosAlarmBack"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="rRelativePressCrossPos"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="bRelativeDisAlarmBack"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="rRelativeBandPressRange"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingDis"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingPos"]`).addClass('hide');
                        $element.find(`.static-field-box[field="bRelativePreMode"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingRelativePre"]`).addClass('hide');
                    }
                    if (model === '位移模式') {
                        $element.find(`.static-field-box[field="rSetPushmountingDis"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="bRelativePosAlarmBack"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rRelativePressCrossPos"]`).addClass('hide');
                        $element.find(`.static-field-box[field="bRelativeDisAlarmBack"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rRelativeBandPressRange"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingDis"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingPos"]`).addClass('hide');
                        $element.find(`.static-field-box[field="bRelativePreMode"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingRelativePre"]`).addClass('hide');
                    }
                    if (model === '相对压力模式') {
                        $element.find(`.static-field-box[field="bRelativePreMode"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingRelativePre"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="rRelativePressCrossPos"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="rRelativeBandPressRange"]`).removeClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingDis"]`).addClass('hide');
                        $element.find(`.static-field-box[field="bRelativePosAlarmBack"]`).addClass('hide');
                        $element.find(`.static-field-box[field="bRelativeDisAlarmBack"]`).addClass('hide');
                        $element.find(`.static-field-box[field="rSetPushmountingPos"]`).addClass('hide');
                        $element.find(`.static-field-box[field="bRelativePreMode"]`).addClass('hide');
                    }
                },
                bindEvent: function () {
                    $scope.$watch('entity.press.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'press.image_id': newValue
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

                    $scope.$watch("pushModel", function (newvalue) {
                        if (newvalue && _.isEqual(newvalue, '一次压装')) {
                            pshuModelDynamicData = _.get(dynamicData, 'pushModel0', {});
                        }
                        if (newvalue && _.isEqual(newvalue, '二次压装')) {
                            pshuModelDynamicData = _.get(dynamicData, 'pushModel1', {});
                        }
                        if (newvalue && _.isEqual(newvalue, '三次压装')) {
                            pshuModelDynamicData = _.get(dynamicData, 'pushModel2', {});
                        }
                        ctrl.initPushModel();
                    }, true);
                    $scope.$watch("checkModel", function (newvalue) {
                        let index = 1;
                        if (newvalue && _.isEqual(newvalue, '质量判断1')) {
                            index = 1;
                        }
                        if (newvalue && _.isEqual(newvalue, '质量判断2')) {
                            index = 2;
                        }
                        if (newvalue && _.isEqual(newvalue, '质量判断3')) {
                            index = 3;
                        }
                        if (newvalue && _.isEqual(newvalue, '质量判断4')) {
                            index = 4;
                        }
                        if (newvalue && _.isEqual(newvalue, '质量判断5')) {
                            index = 5;
                        }
                        ctrl.updateCheckModel(index);

                    });
                    $scope.$watch("checkData", function (newvalue) {
                        let index = 1;
                        if (newvalue && _.isEqual(newvalue, '质量检测1')) {
                            index = 1;
                        }
                        if (newvalue && _.isEqual(newvalue, '质量检测2')) {
                            index = 2;
                        }
                        if (newvalue && _.isEqual(newvalue, '质量检测3')) {
                            index = 3;
                        }
                        if (newvalue && _.isEqual(newvalue, '质量检测4')) {
                            index = 4;
                        }
                        if (newvalue && _.isEqual(newvalue, '质量检测5')) {
                            index = 5;
                        }
                        ctrl.updateCheckData(index);
                    });
                },
                initSubNavOption: function () {
                    ctrl.subNavOptions = {
                        collection: 'device',
                        query: {'press.show': true},
                        selected: $stateParams.id
                    }
                },
                updateField: _.throttle(function (lastData) {
                    dynamicData = lastData;
                    if (!_.isEmpty(lastData)) {
                        /*改为jq操作,以增强响应*/
                        var updateFields = $element.find('.static-field-value');
                        // AppConfigService.query(AppDataConfig.app).then(function () {
                        _.each(updateFields, function (fieldElement) {
                            var target = $(fieldElement);
                            var fieldKey = target.data('key');
                            AppConfigService.getFieldData(appDataConfig.app, fieldKey, lastData).done(function (newValue) {
                                if (fieldKey === 'Alrm_iAlarmIndex') {
                                    if (newValue === '9999') {
                                        newValue = '正常';
                                    }
                                }
                                /*有unit时：如果没值隐藏unit label,否则显示*/
                                if (newValue !== '') {
                                    $(fieldElement).siblings('.static-field-unit').removeClass('hide');
                                } else {
                                    $(fieldElement).siblings('.static-field-unit').addClass('hide');
                                }

                                if (newValue !== target.text()) {
                                    /* -------------- janus hardcode part --------------------- */
                                    var showValue = newValue;
                                    if (PressInitData[fieldKey]) {
                                        showValue = PressInitData[fieldKey][newValue];
                                    }
                                    newValue = showValue;
                                    /* -------------- janus hardcode part --------------------- */
                                    target.text(newValue);
                                }
                            });
                        });

                        for (let i = 1; i < 6; i++) {
                            let key = 'bSetCheckMode' + i, field1 = 'rSetParamsCheckStartVal' + i,
                                field2 = 'rSetParamsCheckStopVal' + i;
                            AppConfigService.getFieldData(appDataConfig.app, key, lastData).done(function (powerUnit) {
                                let switchUnit = powerUnit + '';
                                if (switchUnit === '1' || switchUnit === 'true' || switchUnit === 'TRUE') {
                                    $element.find(`.static-field-box[field="${field1}"][unit="KN"]`).removeClass('hide');
                                    $element.find(`.static-field-box[field="${field1}"][unit="mm"]`).addClass('hide');
                                    $element.find(`.static-field-box[field="${field2}"][unit="KN"]`).removeClass('hide');
                                    $element.find(`.static-field-box[field="${field2}"][unit="mm"]`).addClass('hide');
                                } else {
                                    $element.find(`.static-field-box[field="${field1}"][unit="KN"]`).addClass('hide');
                                    $element.find(`.static-field-box[field="${field1}"][unit="mm"]`).removeClass('hide');
                                    $element.find(`.static-field-box[field="${field2}"][unit="KN"]`).addClass('hide');
                                    $element.find(`.static-field-box[field="${field2}"][unit="mm"]`).removeClass('hide');
                                }
                            });

                        }

                    }
                }, 200),
                pushAction: function (key, value) {
                    /* 形如：Z1_T1_H、 Z1_T2_D */
                    dialog.show({
                        template: 'app_press_cutter_template',
                        title: '补偿量配置',
                        width: 600,
                        controller: 'PressCutterController',
                        controllerAs: 'ctrl',
                        data: {
                            'uuid': uuid,
                            'key': key,
                            'value': value
                        }
                    });
                },
                initChart: _.debounce(function (data) {

                    for (let i = 1; i < 81; i++) {
                        let rCurveDataPos = _.get(data, 'rCurveDataPos' + i, '');
                        if (!_.isEmpty(rCurveDataPos)) {
                            yarrPos.push(rCurveDataPos);
                        }
                        let rCurveDataPre = _.get(data, 'rCurveDataPre' + i, '');
                        if (!_.isEmpty(rCurveDataPre)) {
                            yarrPre.push(rCurveDataPre);
                        }
                    }

                    var options = {
                        tooltip: {
                            trigger: 'axis'
                        },
                        legend: {
                            data: ['位置(mm)', '压力(KN/Kgf)']
                        },
                        xAxis: {
                            type: 'category',
                        },
                        yAxis: [{
                            type: 'value',
                            name: '位置(mm)'
                        }, {
                            type: 'value',
                            name: '压力(KN/Kgf)'
                        }],
                        series: [{
                            name: '位置(mm)',
                            type: 'line',
                            data: yarrPos
                        }, {
                            name: '压力(KN/Kgf)',
                            type: 'line',
                            data: yarrPre,
                            yAxisIndex: 1
                        }]
                    };

                    let id = document.getElementById("history-chart");
                    let chartObject = echarts.init(id);
                    chartObject.setOption(options);
                }, 300),
                goList: function () {
                    janus.goToMenuByName('机台');
                }
            });
            ctrl.initialize();
        }]);

    app.controller('PressCutterController', ['$scope', 'DBUtils', 'http', 'DeviceService',
        function ($scope, DBUtils, http, DeviceService) {
            $scope.entity = {};
            var key = $scope.key, value = $scope.value, uuid = $scope.uuid;
            var ctrl = this;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadData();
                    ctrl.bindEvent();
                },
                loadData: function () {
                    var type = 'XXX', entity = {};
                    var keyWords = key.split('_');

                    if (keyWords[2] === 'H') {
                        type = '长度';
                    } else if (keyWords[2] === 'D') {
                        type = '半径'
                    }
                    var desc = keyWords[0] + '轴' + keyWords[1] + '刀具' + type + '补偿';

                    _.extend($scope.entity, {
                        'desc': desc,
                        'key': key,
                        'value': value
                    });
                },
                bindEvent: function () {
                    $scope.$on('success', function () {
                        var values = {};
                        values[key] = $scope.entity['value'];
                        values['cmd'] = 'WriteTool';
                        DeviceService.push(uuid, 'update', values);
                    });
                }
            });
            ctrl.initialize();
        }]);
});
