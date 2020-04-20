define(['fanuc_cnc/board/static/fanuc_cnc_board_init_data_config'], function (AppDataConfig) {
    var app = angular.module('app');

    app.controller('FanucCNCBoardController', ['$scope', '$state', 'DBUtils', 'dialog', 'http', '$element', 'util', 'database',
        'AppConfigService', '$timeout', 'BindDevice', 'janus',
        function ($scope, $state, DBUtils, dialog, http, $element, util, database, AppConfigService, $timeout, BindDevice, janus) {

            var ctrl = this;
            $scope.model = database.get('janus-cnc-board-model') || 'kanban';
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
                        database.set('janus-cnc-board-model', newVal);
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
                            'fanuc_cnc.show': true
                        },
                        projector: {},
                        sort: {},
                        itemRender: function (data) {
                            var imageUrl = ctrl.getCncImageUrl(data);
                            var imageInfo;
                            if (_.includes(imageUrl, 'cnc/board/static/image/jichuang.png')) {
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
                getCncImageUrl: function (itemData) {
                    var imageId = _.get(itemData, 'cnc.image_id', '');
                    return util.getImageUrl(imageId, 'cnc/board/static/image/jichuang.png', true);
                },
                showDeviceDetail: function (uuid) {
                    janus.goToMenuDetailByName('机台', uuid);
                },
                bindDeviceToCNC: function () {
                    BindDevice.bind('fanuc_cnc.show').done(function () {
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
                            'cnc.show': true
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
                            name: 'dynamicData.Alarm_0',
                            title: '报警状态',
                            width: '100px',
                            targets: 0,
                            orderable: true,
                            render: function (data, type, row) {
                                if (row.online.toString() !== 'true') {
                                    return `<span class="fa fa-question"></span>`;
                                }
                                if (!data || data === '0') {
                                    return `<span class="fa fa-circle-o-notch fa-spin icnc-normal "></span>`;
                                } else {
                                    return `<span class="fa fa-exclamation-triangle icnc_warning animated flash infinite"></span>`;
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

    app.controller('FanucCNCDynamicController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element', 'DeviceService', 'session', 'AppConfigService', '$timeout', 'janus',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session, AppConfigService, $timeout, janus) {
            var ctrl = this;
            var uuid = $stateParams.id;

            var autMap = {
                "0": "NONE",
                "1": "MDI",
                "2": "TAPE",
                "3": "MEMORY",
                "4": "EDIT",
                "5": "TEACH IN"
            }

            var manualMap = {
                "0": "NONE",
                "1": "REFERENCE",
                "2": "INC FEED",
                "3": "HANDLE",
                "4": "JOG",
                "5": "ANGULAR JOG",
                "6": "INC+HANDLE",
                "7": "JOG+HANDLE"
            }

            var runMap = {
                "0": "STOP",
                "1": "HOLD",
                "2": "STaRT",
                "3": "JOG MDI",
                "4": "RESTART",
                "5": "PRG RESTART",
                "6": "SEQ NUM SEARCH",
                "7": "RESTART (blinking)",
                "8": "RESET",
                "9": "(Not used)",
                "10": "(Not used)",
                "11": "(Not used)",
                "12": "(Not used)",
                "13:": "HPCC (RISC op)"
            }

            var editMap = {
                "0": "NONE",
                "1": "EDIT",
                "2": "SEARCH",
                "3": "VERIFY",
                "4": "CONDENSE",
                "5": "READ",
                "6": "PUNCH"
            }

            var motionMap = {
                "0": "NONE",
                "1": "MOTION",
                "2": "DWELL",
                "3": "WAIT"
            }

            var mstbMap = {
                "0": "NONE",
                "1": "FIN"

            }

            var emergencyMap = {
                "0": "NONE",
                "1": "EMERGENCY"
            }

            var alarmMap = {
                "0": "NONE",
                "1": "ALARM"
            }

            var warningMap = {
                "0": "NONE",
                "1": "WARNING"
            }

            var batteryMap = {
                "0": "NORMAL",
                "1": "LOW (BACKUP)",
                "2": "LOW (ABS POS DETECTOR)"
            }

            var alarmTypeMap = {
                "0": "SW",
                "1": "PW",
                "2": "IO",
                "3": "PS",
                "4": "OT",
                "5": "OH",
                "6": "SV",
                "7": "SR",
                "8": "MC",
                "9": "SP",
                "10": "DS",
                "11": "IE",
                "12": "BG",
                "13": "SN",
                "14": "(reserved)",
                "15": "EX",
                "16": "(reserved)",
                "17": "(reserved)",
                "18": "(reserved)",
                "19": "PC",
                "20": " (not used)",
                "21": " (not used)",
                "22": " (not used)",
                "23": " (not used)",
                "24": " (not used)",
                "25": " (not used)",
                "26": " (not used)",
                "27": " (not used)",
                "28": " (not used)",
                "29": " (not used)",
                "30": " (not used)",
                "31": " (not used)",
                "-1": "ALL"
            }

            var hisMap = {
                '0': 'u_rec_mdi_',
                '1': 'u_rec_sgn_',
                '2': 'u_rec_alm_',
                '3': 'u_rec_date_',
                '4': 'u_rec_mac_',
                '5': 'u_rec_prm_',
                '6': 'u_rec_opm_',
                '7': 'u_rec_ofs_',
                '8': 'u_rec_wof_',
                '9': 'u_rec_ial_',
                '10': 'u_rec_mal_',
                '11': 'u_rec_mac2_',
                '12': 'u_rec_mac2_'
            };

            let hisTypeNames = {
                'his_op_date': '日期',
                'his_op_time': '时间',
                'his_op_key_code': '按键编码',
                'his_op_pw_flag': '开机',
                'his_op_ex_flag': '外部MDI按键',
                'his_op_sig_name': '信号名称',
                'his_op_sig_no': '信号编号',
                'his_op_sig_old': '信号变换前',
                'his_op_sig_new': '信号变换后',
                'his_op_alm_grp': '报警类型',
                'his_op_alm_no': '报警编号',
                'his_op_axis_no': '轴号',
                'his_op_evnt_type': '事件类型',
                'his_op_pth_no': '路径号',
                'his_op_pmc_no': 'PMC号',
                'his_op_axis_num': '轴总数',
                'his_op_g_modal': 'G代码',
                'his_op_g_dp': 'G代码小数位',
                'his_op_a_modal': 'A代码',
                'his_op_a_dp': 'A代码小数位',
                'his_op_abs_pos': '报警绝对位置',
                'his_op_abs_dp': '报警绝对位置小数位',
                'his_op_mcn_pos': '报警机器位置',
                'his_op_mcn_dp': '报警机器位置小数位',
                'his_op_alm_msg': '报警内容',
                'his_op_om_no': '消息编号',
                'his_op_ope_msg': '消息',
                'his_op_ofs_grp': '工具补偿数据类型',
                'his_op_ofs_no': '补偿编号',
                'his_op_ofs_old': '补偿变换前',
                'his_op_ofs_new': '补偿变换后',
                'his_op_old_dp': '变换前小数位',
                'his_op_new_dp': '变换后小数位',
                'his_op_mac_old': '变换前自定义宏通用变量',
                'his_op_mac_new': '变换后自定义宏通用变量',
                'his_op_prm_grp': '参数类型',
                'his_op_prm_num': '参数数量',
                'his_op_prm_len': '参数长度',
                'his_op_prm_no': '参数编号',
                'his_op_prm_old': '变换前参数',
                'his_op_prm_new': '变换后参数'
            }

            var fieldStateMap = {
                'aut': autMap,
                'manual': manualMap,
                'run': runMap,
                'edit': editMap,
                'motion': motionMap,
                'mstb': mstbMap,
                'emergency': emergencyMap,
                'alarm': alarmMap,
                'warning': warningMap,
                'battery': batteryMap
            }

            ctrl.subNavOptions = {
                collection: 'device',
                query: {'fanuc_cnc.show': true},
            }

            $scope.entity = {};
            var tempSpindleNum;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initFanucDataOptions();
                    ctrl.bindEvent();
                    $timeout(function () {
                        ctrl.initData();
                    }, 300);
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
                            ctrl.updateField(_.get(data, 'data', {}));
                        }
                    });
                },
                bindEvent: function () {
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
                        if (buttonKey === "viewFanuc") {
                            ctrl.showFanuc(rowdata.id);
                        }
                    });
                },
                showFanuc: function (rowId) {
                    DBUtils.find('fanuc_cnc', {
                        id: rowId
                    }).success(function (result) {
                        var data = _.get(result, 'datas.result', {});
                        dialog.show({
                            title: '数据详情',
                            width: 1200,
                            template: "show_fanuc_submit_data_detail",
                            data: {
                                jsonData: data
                            },
                            cancel: false
                        })
                    });
                },
                initFanucDataOptions: function () {
                    ctrl.fanucDataOptions = {
                        collection: 'fanuc_cnc',
                        query: {
                            uuid: uuid
                        },
                        columns: [{
                            name: '_id',
                            visible: false
                        }, {
                            name: 'create_date',
                            title: '数据时间',
                            width: '140px'
                        }, {
                            name: 'data.function_name',
                            title: '方法名称',
                            width: '140px'
                        }, {
                            name: 'data.function_param',
                            title: '参数列表',
                            width: '140px'
                        }, {
                            name: 'operation',
                            width: '100px',
                            title: '操作',
                            orderable: false,
                            render: function (data, type, row) {
                                return '<button class="btn btn-primary btn-xs btn-outline" data-key="viewFanuc" type="button">查看数据</button>';
                            }
                        }],
                    };
                },
                updateGTable: function (lastData) {
                    var tdArray = [];
                    var valueCount = 0;
                    _.times(36, function (idx) {
                        var value = _.get(lastData, `rg_code_${idx}`, '');
                        if (value) {
                            valueCount++;
                        }
                        tdArray.push(`<td>${value}</td>`);
                    });
                    if (valueCount < 10) {
                        return;
                    }
                    var chunkArray = _.chunk(tdArray, 6);
                    var html = [];
                    _.each(chunkArray, function (subarr) {
                        html.push('<tr>');
                        html.push(_.join(subarr, ''));
                        html.push('</tr>');
                    });
                    html = _.join(html, '');
                    $('.gtable').html(html);
                },
                updateState: function (lastData) {
                    var alarm = _.get(lastData, 'alarm', '0');
                    _.each(fieldStateMap, function (stateMap, key) {
                        var fieldValue = _.get(lastData, key, '0');

                        var stateValue = _.get(stateMap, fieldValue, '');
                        _.set(lastData, key, stateValue);
                    });

                    if (alarm === '0') {
                        _.set(lastData, 'alarm_type', 'NONE');
                    } else {
                        var alarm_type = _.get(lastData, 'alarm_type', '0');
                        alarm_type = alarmTypeMap[alarm_type] || '';
                        _.set(lastData, 'alarm_type', alarm_type);
                    }
                },
                updateHistory: function (lastData) {
                    var html = [];
                    _.each(hisTypeNames, function (label, key) {
                        let fieldValue = _.get(lastData, key);
                        if (!_.isUndefined(fieldValue)) {
                            html.push('<div class="static-field-box">');
                            html.push(`<label class="static-field-label" style="width: 160px;">${label}</label>`);
                            html.push(`<div class="static-field-value">${fieldValue}</div>`);
                            html.push('</div>');
                        }
                    });
                    html = _.join(html, '');
                    $('.his_panel').html(html);
                },
                updateField: _.throttle(function (lastData) {
                    if (!_.isEmpty(lastData)) {
                        /*改为jq操作,以增强响应*/
                        ctrl.updateGTable(lastData);
                        ctrl.updateState(lastData);
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
                        ctrl.updateHistory(lastData);
                    }
                }, 200),
                goList: function () {
                    janus.goToMenuByName('机台');
                }
            })
            ctrl.initialize();
        }
    ]);
});
