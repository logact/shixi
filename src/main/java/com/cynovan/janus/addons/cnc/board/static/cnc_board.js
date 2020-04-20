define(['cnc/board/static/cnc_board_init_data_config'], function (appDataConfig) {
    var app = angular.module('app');

    app.controller('CNCBoardController', ['$scope', '$state', 'DBUtils', 'dialog', 'http', '$element', 'util', 'database', 'AppConfigService',
        'session', 'BindDevice', '$timeout', 'janus',
        function ($scope, $state, DBUtils, dialog, http, $element, util, database, AppConfigService, session, BindDevice, $timeout, janus) {

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
                        query: {'cnc.show': true},
                        projector: {},
                        sort: {},
                        itemRender: function (data) {
                            var imageUrl = ctrl.getCncImageUrl(data);
                            var cls = data.online.toString() === 'true' ? 'active' : '';
                            var alarmData = _.get(data, 'dynamicData.Alarm_0', '0');
                            var alarmInfo;

                            var status = _.get(data, 'dynamicData.STATUS', '0');
                            var progress = _.get(data, 'dynamicData.Progress', '0') == 0 ? '0%&nbsp;&nbsp;' : _.get(data, 'dynamicData.Progress', '0') + '%';
                            var totalTime = _.get(data, 'dynamicData.TotalTime', '0');
                            var fileName = _.get(data, 'dynamicData.FileName', '0') == 0 ? '暂无' : _.get(data, 'dynamicData.FileName', '0');
                            if (data.online.toString() !== 'true') {
                                alarmInfo = '<span class="fa fa-question"></span>';
                            } else {
                                if (alarmData === '0' || !alarmData) {
                                    alarmInfo = '<span class="fa fa-circle-o-notch fa-spin icnc-normal "></span>';
                                } else {
                                    alarmInfo = '<span class="fa fa-exclamation-triangle icnc_warning animated flash infinite"></span>';
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
                                            ${imageUrl}
                                            <div class="cnc-kanban-list-info">
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
                getCncImageUrl: function (itemData) {
                    var imageId = _.get(itemData, 'cnc.image_id', '');
                    if (imageId) {
                        var imageUrl = util.getImageUrl(imageId, 'cnc/board/static/image/jichuang.png', true);
                        return `<a class="imgWrap fancy-img" data-type="image" href="${imageUrl + '?thumb=false'}"><img src="${imageUrl}"/></a>`;
                    } else {
                        return `<a class="imgWrap"><img src="resource/cnc/board/static/image/jichuang.png"/></a>`;
                    }
                },
                showDeviceDetail: function (uuid) {
                    janus.goToMenuDetailByIndex(1, uuid);
                },
                bindDeviceToCNC: function () {
                    BindDevice.bind('cnc.show').done(function () {
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
                        query: {'cnc.show': true},
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

    app.factory('CNCDynamicDataConfigFactory', ['http', function (http) {
        var AXIS_NUM_KEY = 'TotalAxisNum';

        // 配置信息
        var config = {};

        // 配置初始化
        function init() {
            initAxisConfig();
            initCoordinateConfig();
            initDiagnosisSetting();
        };

        // 轴信息配置 初始化
        function initAxisConfig() {
            config['Axis'] = {
                'header': {
                    'key': 'AxisName_',
                    'desc': '轴名称'
                },
                'body': [
                    {
                        'key': 'AxisMinPos_',
                        'desc': '轴最小行程',
                    }, {
                        'key': 'AxisMaxPos_',
                        'desc': '轴最大行程',
                    }
                ]
            };
        };

        // 坐标系配置 初始化
        function initCoordinateConfig() {
            config['Coordinate'] = {
                'header': {
                    'key': 'AxisName_',
                    'desc': '轴名称'
                },
                'body': [
                    {
                        'key': 'Offset_',
                        'desc': '外部坐标偏移'
                    }, {
                        'key': 'G54_',
                        'desc': 'G54'
                    }, {
                        'key': 'G55_',
                        'desc': 'G55'
                    }, {
                        'key': 'G56_',
                        'desc': 'G56'
                    }, {
                        'key': 'G57_',
                        'desc': 'G57'
                    }, {
                        'key': 'G58_',
                        'desc': 'G58'
                    }, {
                        'key': 'G59_',
                        'desc': 'G59'
                    }
                ]
            }
        };

        // 诊断数据配置 初始化
        function initDiagnosisSetting() {
            config['Diagnosis'] = {
                'header': {
                    'key': 'AxisName_',
                    'desc': '轴名称'
                },
                'body': [
                    {
                        'key': 'Status_Axis',
                        'desc': '轴状态',
                        'type': 'binary',
                        'mapping': [
                            {
                                'pos': 9,
                                'desc': '电机使能'
                            }, {
                                'pos': 10,
                                'desc': '规划运动',
                            }, {
                                'pos': 11,
                                'desc': '电机到位',
                            }, {
                                'pos': 1,
                                'desc': '驱动器报警',
                            }, {
                                'pos': 4,
                                'desc': '跟随误差越限',
                            }, {
                                'pos': 5,
                                'desc': '正限位触发',
                            }, {
                                'pos': 6,
                                'desc': '负限位触发',
                            }, {
                                'pos': 7,
                                'desc': '平滑停止IO触发',
                            }, {
                                'pos': 8,
                                'desc': '急停IO触发',
                            }, {
                                'pos': 12,
                                'desc': '保留',
                            }, {
                                'pos': 13,
                                'desc': '保留',
                            }
                        ]
                    }
                ]
            }
        };

        init();

        var _getConfig = function (key) {
            if (config.hasOwnProperty(key)) {
                return config[key];
            }
            return {};
        };

        return {
            getConfig: _getConfig
        }
    }

    ]);

    app.controller('CNCDynamicController', ['$scope', '$stateParams', 'DBUtils', 'util', 'websocket', 'dialog', '$element',
        'DeviceService', 'session', 'AppConfigService', 'CNCDynamicDataConfigFactory', 'http', '$state', 'janus', '$location', '$timeout',
        function ($scope, $stateParams, DBUtils, util, websocket, dialog, $element, DeviceService, session,
                  AppConfigService, CNCDynamicDataConfigFactory, http, $state, janus, $location, $timeout) {
            var ctrl = this;
            var uuid = $stateParams.id;
            var file_name = '';
            var file_id = '';
            var file_path_to = '';
            var defaultFilePath = '';

            $scope.entity = {};
            var tempSpindleNum;
            var tempAxisNum;
            var tempCoordinateNum;
            var tempDiagnosisNum;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
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
                        delete device.dynamicData;
                        $scope.entity = device;
                        ctrl.bindEvent();
                        ctrl.initNcFileSelect();
                    });

                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
                        onmessage: function (data) {
                            let newData = _.get(data, 'data', {});
                            ctrl.updateField(newData);
                            let result = _.get(newData, 'result', '');
                            if (result === 'OK') {
                                dialog.noty('更新完成')
                            } else if (result === 'NG') {
                                dialog.noty('更新失败')
                            }
                        }
                    });

                    websocket.sub({
                        topic: 'cloud/' + uuid,
                        onmessage: _.debounce(function (message) {
                            let action = _.get(message, 'action', '');
                            var uploadData = _.get(message, 'data', {});
                            if (uploadData.status === 'fail') {
                                dialog.noty('发生错误: ' + uploadData.msg);
                            } else {
                                if (action === 'cloud_download') {
                                    dialog.noty('更新成功');
                                    // triton 下载文件完成
                                    let lastChart = _.last(defaultFilePath);
                                    let path = '';
                                    if (lastChart === '/' || lastChart === '\\') {
                                        path = defaultFilePath + file_name;
                                    } else {
                                        path = defaultFilePath + '/' + file_name;
                                    }
                                    DeviceService.pushWithoutPassword(uuid, 'update', {
                                        cmd: 'CNC_FileUpdate',
                                        nc_file: path
                                    });
                                }
                            }
                        }, 300)
                    });
                },
                initSubNavOption: function () {
                    ctrl.subNavOptions = {
                        collection: 'device',
                        query: {'cnc.show': true},
                        label: '机台列表',
                        selected: $stateParams.id
                    }
                },
                tabShow: function (cmd) {
                    ctrl.pushCmd(cmd);
                },
                pushCmd: _.debounce(function (cmd) {
                    _.each(cmd, function (value) {
                        DeviceService.pushWithoutPassword(uuid, 'update', {
                            cmd: value
                        })
                    })
                }, 300),
                createToolTable: function (lastData) {
                    var total = _.get(lastData, 'TotalTool', 48);
                    total = parseInt(total);

                    var SpindleNum = _.get(lastData, 'SpindleNum', 2);
                    SpindleNum = parseInt(SpindleNum);

                    /*构造header*/
                    var tHead = $element.find('.toolHeader');
                    if (tHead.find('tr').length === 0 || tempSpindleNum !== SpindleNum) {
                        var header = [];
                        header.push('<tr>');
                        header.push(`<th>序号</th>`);
                        _.times(SpindleNum, function (numIdx) {
                            header.push(`<th>Z${numIdx + 1}刀具长度</th>`);
                            header.push(`<th>Z${numIdx + 1}刀具半径</th>`);
                            header.push(`<th>Z${numIdx + 1}刀具长度补偿量</th>`);
                            header.push(`<th>Z${numIdx + 1}刀具半径补偿量</th>`);
                        });
                        header.push('</tr>');
                        tHead.html(header.join(''))
                    }

                    /*构造body*/
                    var tBody = $element.find('.toolTable');
                    if (tBody.find('tr').length === 0 || tempSpindleNum !== SpindleNum) {

                        var html = [];
                        _.times(total, function (idx) {
                            html.push('<tr>');
                            html.push(`<td>T${idx + 1}</td>`);
                            _.times(SpindleNum, function (numIdx) {
                                var baseKey = `Z${numIdx + 1}_T${idx + 1}_`;
                                let lKey = baseKey + 'L';
                                html.push(`<td><div class="static-field-box"><div class="static-field-value" data-key="${lKey}"></div></div></td>`);

                                let rKey = baseKey + 'R';
                                html.push(`<td><div class="static-field-box"><div class="static-field-value" data-key="${rKey}"></div></div></td>`);

                                let hKey = baseKey + 'H';
                                html.push(`<td><div class="static-field-box">
                                            <div class="static-field-value" data-key="${hKey}"></div>
                                            <i class="fa fa-edit static-field-push" data-pushkey="${hKey}"></i></div>
                                            </td>`);

                                let dKey = baseKey + 'D';
                                html.push(`<td><div class="static-field-box">
                                            <div class="static-field-value" data-key="${dKey}"></div>
                                            <i class="fa fa-edit static-field-push" data-pushkey="${dKey}"></i></div>
                                            </td>`);
                            });
                            html.push('</tr>');
                        });
                        tBody.html(html.join(''));
                    }
                    tempSpindleNum = SpindleNum;
                },
                createPosiTable: function (lastData) {
                    let tableMap = [{
                        element: '.absPosiTable',
                        label: '轴',
                        field: 'AbsPos',
                    }, {
                        element: '.encPosTable',
                        label: '轴',
                        field: 'EncPos',
                    }, {
                        element: '.prfPosTable',
                        label: '轴',
                        field: 'PrfPos',
                    }, {
                        element: '.prefVerTable',
                        label: '轴',
                        field: 'PrfVel',
                    }, {
                        element: '.errPosTable',
                        label: '轴',
                        field: 'ErrPos',
                    }];

                    _.each(tableMap, function (table) {
                        let tableElement = $element.find(table.element);
                        if (tableElement.find('.posi-item').length === 0) {
                            var html = [];
                            _.times(9, function (idx) {
                                html.push(`<div class="posi-item">
                                           <div class="static-field-box">
                                           <label class="static-field-label" style="width: 50px;">${table.label}${idx + 1}</label>
                                            <div class="static-field-value" data-key="${table.field}${idx + 1}"></div>
                                            </div>
                                        </div>`);
                            });
                            tableElement.html(html.join(''));
                        }
                    });
                },
                createAxisTable: function (lastData) {
                    var axisNum = _.get(lastData, 'TotalAxisNum', 6);
                    axisNum = parseInt(axisNum);
                    var config = CNCDynamicDataConfigFactory.getConfig('Axis');

                    /*构造header*/
                    var aHead = $element.find('.axisHeader');
                    if (aHead.find('tr').length === 0 || tempAxisNum !== axisNum) {
                        var header = [];
                        header.push('<tr>');
                        header.push(`<th>序号</th>`)
                        header.push(`<th style="width: 138px">参数说明</th>`)
                        _.times(axisNum, function (idx) {
                            header.push(`<th><div class="static-field-value" data-key="${config.header.key + (idx + 1)}"></div></th>`);
                        });
                        header.push('</tr>');
                        aHead.html(header.join(''));
                    }

                    /*构造body*/
                    var aBody = $element.find('.axisTable');
                    if (aBody.find('tr').length === 0 || tempAxisNum !== axisNum) {
                        var html = [];
                        _.each(config.body, function (setting, index) {
                            html.push('<tr>');
                            html.push(`<td class="idx">${index + 1}</td>`); // 序号
                            html.push(`<td>${setting.desc}</td>`);         // 参数说明
                            _.times(axisNum, function (idx) {
                                html.push(`<td><div class="static-field-value" data-key="${setting.key + (idx + 1)}"></div></td>`)  // 轴对应的值
                            });
                            html.push('</tr>');
                        });

                        aBody.html(html.join(''));
                    }
                    tempAxisNum = axisNum;
                },
                createCoordinateTable: function (lastData) {
                    var axisNum = _.get(lastData, 'TotalAxisNum', 6);
                    axisNum = parseInt(axisNum);
                    var config = CNCDynamicDataConfigFactory.getConfig('Coordinate');

                    /*构造header*/
                    var cHead = $element.find('.coordinateHeader');
                    if (cHead.find('tr').length === 0 || tempCoordinateNum !== axisNum) {
                        var header = [];
                        header.push('<tr>');
                        header.push(`<th>序号</th>`);
                        header.push(`<th>${config.header.desc}</th>`);
                        _.times(axisNum, function (idx) {
                            header.push(`<th><div class="static-field-value" data-key="${config.header.key + (idx + 1)}"></div></th>`);
                        });
                        header.push('</tr>');
                        cHead.html(header.join(''));
                    }

                    /*构造body*/
                    var cBody = $element.find('.coordinateTable');
                    if (cBody.find('tr').length === 0 || tempCoordinateNum !== axisNum) {
                        var html = [];
                        _.each(config.body, function (setting, index) {
                            html.push('<tr>');
                            html.push(`<td class="idx">${index + 1}</td>`);
                            html.push(`<td>${setting.desc}</td>`);
                            _.times(axisNum, function (idx) {
                                html.push(`<td><div class="static-field-value" data-key="${setting.key + (idx + 1)}"></div></td>`);
                            });
                            html.push('</tr>');
                        });
                        cBody.html(html.join(''));
                    }
                    tempCoordinateNum = axisNum;
                },
                createDiagnosisTable: function (lastData) {
                    var axisNum = _.get(lastData, 'TotalAxisNum', 6);
                    axisNum = parseInt(axisNum);
                    var statusArray = [];
                    var config = CNCDynamicDataConfigFactory.getConfig('Diagnosis');

                    /*构造header*/
                    var dHead = $element.find('.diagnosisHeader');
                    if (dHead.find('tr').length === 0 || tempDiagnosisNum !== axisNum) {
                        var header = [];
                        header.push('<tr>');
                        header.push(`<th style="width: 138px">${config.header.desc}</th>`)
                        _.times(axisNum, function (idx) {
                            header.push(`<th><div class="static-field-value" data-key="${config.header.key + (idx + 1)}"></div></th>`);

                            _.times(axisNum, function (idx) {
                                var binary = parseInt(_.get(lastData, `Status_Axis${idx + 1}`)).toString(2);
                                if (binary == "NaN") {
                                    var empty = [];
                                    statusArray.push(empty);
                                } else {
                                    var arr = _.split(binary, '');
                                    var diff = 32 - arr.length;
                                    if (diff > 0) {
                                        _.times(diff, function () {
                                            arr.unshift(0);
                                        })
                                    }
                                    arr = arr.reverse();
                                    statusArray.push(arr);
                                }
                            })

                        });
                        header.push('</tr>');
                        dHead.html(header.join(''));
                    }

                    /*构造body*/
                    var dBody = $element.find('.diagnosisTable');
                    if (dBody.find('tr').length === 0 || tempDiagnosisNum !== axisNum) {
                        var html = [];
                        _.each(config.body, function (setting) {
                            _.each(setting.mapping, function (mapping) {
                                html.push('<tr>');
                                html.push(`<td>${mapping.desc}</td>`);
                                _.times(axisNum, function (idx) {
                                    if (statusArray[idx] == "") {
                                        html.push(`<td><div class="axis-static-field-value static-field-box" data-key="${setting.key + '_' + (idx + 1)}" data-pos="${mapping.pos}" data-axis="${idx}"></div></td>`);
                                    }
                                    var statusAxis = statusArray[idx][mapping.pos];
                                    if (statusAxis == 0) {
                                        html.push(`<td><div class="axis-static-field-value static-field-box" data-key="${setting.key + (idx + 1)}" data-pos="${mapping.pos}" data-axis="${idx}">
                                                   <i class="fa fa-circle" style="color:#2AE88C;font-size: 18px;"></i></div></td>`);
                                    }
                                    if (statusAxis == 1) {
                                        html.push(`<td><div class="axis-static-field-value static-field-box" data-key="${setting.key + (idx + 1)}" data-pos="${mapping.pos}" data-axis="${idx}">
                                                   <i class="fa fa-exclamation-triangle" style="color:red;font-size: 18px;"></i></div></td>`);
                                    }
                                });
                                html.push('</tr>');
                            })
                        });
                        dBody.html(html.join(''));
                    }
                    tempDiagnosisNum = axisNum;
                },

                updateField: _.throttle(function (lastData) {
                    ctrl.createToolTable(lastData);
                    ctrl.createPosiTable();
                    ctrl.createAxisTable(lastData);
                    ctrl.createCoordinateTable(lastData);
                    ctrl.createDiagnosisTable(lastData);
                    /*改为jq操作,以增强响应*/
                    var updateFields = $element.find('.static-field-value');
                    // AppConfigService.query(AppDataConfig.app).then(function () {
                    _.each(updateFields, function (fieldElement) {
                        var target = $(fieldElement);

                        var fieldKey = target.data('key');
                        AppConfigService.getFieldData(appDataConfig.app, fieldKey, lastData).done(function (newValue) {
                            if (newValue !== target.text()) {
                                /* -------------- janus hardcode part --------------------- */
                                var showValue = newValue;

                                if (fieldKey === 'WorkMode') {
                                    switch (newValue) {
                                        case '0':
                                            showValue = '其它';
                                            break;
                                        case '1':
                                            showValue = '自动';
                                            break;
                                        case '2':
                                            showValue = '手动';
                                            break;
                                        case '3':
                                            showValue = 'MDI';
                                            break;
                                        case '4':
                                            showValue = '宏模式';
                                            break;
                                        case '5':
                                            showValue = '手轮';
                                            break;
                                        case '6':
                                            showValue = '回零模式';
                                            break;
                                    }
                                } else if (fieldKey === 'STATUS') {
                                    switch (newValue) {
                                        case '0':
                                            showValue = '空闲';
                                            break;
                                        case '1':
                                            showValue = '加工';
                                            break;
                                        case '2':
                                            showValue = '暂停';
                                            break;
                                    }
                                } else if (_.indexOf(['FeedSpeed', 'SpindleSpeed'], fieldKey) !== -1) {
                                    showValue = newValue + ' mm/min';
                                } else if (_.indexOf(['Progress', 'FeedRate', 'SpindleRate'], fieldKey) !== -1) {
                                    showValue = newValue + ' %';
                                } else if (fieldKey === 'NcFilePath') {
                                    file_path_to = showValue;
                                    defaultFilePath = showValue;
                                }
                                newValue = showValue;
                                /* -------------- janus hardcode part --------------------- */
                                target.text(newValue);
                            }
                        });
                    });
                    // });

                    var statusArray = [];
                    _.times(tempAxisNum, function (idx) {
                        var binary = parseInt(_.get(lastData, `Status_Axis${idx + 1}`)).toString(2);
                        if (binary == "NaN") {
                            var empty = [];
                            statusArray.push(empty);
                        } else {
                            var arr = _.split(binary, '');
                            var diff = 32 - arr.length;
                            if (diff > 0) {
                                _.times(diff, function () {
                                    arr.unshift(0);
                                })
                            }
                            arr = arr.reverse();
                            statusArray.push(arr);
                        }
                    });
                    var updateBoxes = $element.find('.axis-static-field-value');
                    _.each(updateBoxes, function (box) {
                        var target = $(box);
                        var idx = target.data('axis');
                        var pos = target.data('pos');
                        var statusAxis = statusArray[idx][pos];
                        if (statusAxis == 0) {
                            target.html(`<i class="fa fa-circle" style="color:#2AE88C;font-size: 18px;"></i>`);
                        }
                        if (statusAxis == 1) {
                            target.html(`<i class="fa fa-exclamation-triangle" style="color:red;font-size: 18px;">`);
                        }
                    })
                }, 200),
                bindEvent: function () {

                    $scope.$watch('entity.cnc.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('device', {
                                    uuid: $scope.entity.uuid
                                }, {
                                    $set: {
                                        'cnc.image_id': newValue
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

                },
                pushAction: function (key, value) {
                    /* 形如：Z1_T1_H、 Z1_T2_D */
                    dialog.show({
                        template: 'app_cnc_cutter_template',
                        title: '补偿量配置',
                        width: 600,
                        controller: 'CNCCutterController',
                        controllerAs: 'ctrl',
                        data: {
                            'uuid': uuid,
                            'key': key,
                            'value': value
                        }
                    });
                },
                initNcFileSelect: function () {
                    var element = $element.find('#ncFile_select');

                    DBUtils.list('ncfile', {}).success(function (result) {
                        createFileListHtml(_.get(result, 'datas.result', []));
                    });

                    function createFileListHtml(result) {
                        var html = [];
                        html.push('<option value=""></option>');
                        _.each(result, function (value) {
                            let history = _.find(_.get(value, 'history_info', []), ['version', value.latest_version]);
                            let fileId = _.get(history, 'fileId', '');
                            html.push('<option value="' + value.filename + ',' + fileId + '">' + value.filename + '（v' + value.latest_version + '）' + '</option>');
                        });
                        html = html.join('');
                        element.html(html);
                        element.chosen({
                            search_contains: true,
                            allow_single_deselect: true
                        }).change(function (event, item) {
                            let v = _.get(item, 'selected', '');
                            let a = _.split(v, ',', 2);
                            file_name = a[0];
                            file_id = a[1];
                        });
                    }
                },
                changeNcFile: _.debounce(function () {
                    if (_.isEmpty(file_id)) {
                        dialog.noty('请选择NC文件');
                        return;
                    }
                    // if (_.isEmpty(file_path_to)) {
                    //     dialog.noty('请完善加工文件路径');
                    //     return;
                    // }
                    else {
                        file_path_to = defaultFilePath;
                        let lastChart = _.last(file_path_to);
                        if (lastChart === '/' || lastChart === '\\') {
                            file_path_to = file_path_to + file_name;
                        } else {
                            file_path_to = file_path_to + '/' + file_name;
                        }
                    }

                    http.post('cnc/change-ncFile', {
                        'uuid': uuid,
                        'file_name': file_name,
                        'file_id': file_id,
                        'file_path_to': file_path_to
                    }).success(function (result) {
                        dialog.noty('下发成功');
                    });
                }),
                goList: function () {
                    janus.goToMenuByName('机台')
                }
            });
            ctrl.initialize();
        }]);

    app.controller('CNCCutterController', ['$scope', 'DBUtils', 'http', 'DeviceService',
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
