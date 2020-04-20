define([], function () {
    var app = angular.module('app');

    var cmdMap = {
        '1': '{"action":"submit_info","uuid":""}',
        '2': '{"action":"submit_vpn","uuid":""}',
        '3': '{"action":"start_data","uuid":""}',
        '4': '{"action":"stop_data","uuid":""}',
        '5': '{"action":"modbus","type":"ports","uuid":""}',
        '6': '{"action":"modbus","type":"settings","nodes":[{"identifier":"node1","protocol":"tcp","address":"192.168.1.1","slave_id":1,"dataset":[{"key":"switches 1","region":"DI","address":0,"length":8},{"key":"switches 2","region":"DO","address":0,"length":16},{"key":"analog 1","region":"AI","address":0,"length":32},{"key":"analog 2","region":"AO","address":0,"length":12},{"key":"data key can be anything","region":"AO","address":0,"length":3}]},{"identifier":"node2","protocol":"rtu","serial_port":"/dev/ttyS0","baudrate":9600,"databits":8,"parity":"none","stopbits":1,"slave_id":2,"dataset":[{"key":"switches 1","region":"DI","address":0,"length":8},{"key":"switches 2","region":"DO","address":0,"length":16},{"key":"analog 1","region":"AI","address":0,"length":32},{"key":"analog 2","region":"AO","address":0,"length":12},{"key":"data key can be anything","region":"AO","address":0,"length":3}]}],"uuid":""}',
        '7': '{"action":"modbus","type":"read","nodes":[{"identifier":"node1","loop":false,"interval":1000},{"identifier":"node2","loop":true,"interval":2000},{"identifier":"*","loop":false,"interval":2000}],"uuid":""}',
    };

    app.controller('DeviceDebugDialogController', ['$scope', '$element', '$timeout', 'dialog', 'DevicePushService', 'websocket', 'DBUtils', 'MonacoEditor', 'util', 'I18nService',
        function ($scope, $element, $timeout, dialog, DevicePushService, websocket, DBUtils, MonacoEditor, util, I18nService) {
            var ctrl = this;
            $scope.rateinfo=-1;
            var uuid = $scope.uuid;
            var logLock = false, logStart = true, onlyDiffer = false, filterValue = '';
            var tritonLogLock = false, tritonLogStart = true, tritonFilterValue = '';
            var maxLogCount = 150, currentLogCount = 0;
            var tritonMaxLogCount = 150, tritonCurrentLogCount = 0;
            $scope.hideCmd = false;
            $scope.oldData = {};
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.rate = I18nService.getValue('计算中', 'calculating');
                    ctrl.initVariable();
                    ctrl.subscribeData();
                    ctrl.subscribeSamplingData();
                },
                initVariable: function () {
                    $element.addClass('triton_debug_dialog');
                    $timeout(function () {
                        ctrl.layout();
                        ctrl.initCmdEditor();
                        ctrl.initMessageEditor();
                        ctrl.bindEvent();
                    }, 500);
                },
                bindEvent: function () {
                    $('.log_box').on('click', '.copy_log_btn', function (event) {
                        var target = $(event.target).closest('.log_row').find('.log_text')[0];
                        ctrl.copyToClip(target);
                    });

                    $('.log_box').on('click', '.edit_log_btn', function (event) {
                        var target = $(event.target).closest('.log_row').find('.log_text')[0];
                        ctrl.showMessage(target.innerText);
                    });

                    $element.on('hidden.bs.modal', function () {
                        websocket.unsub('deviceData/' + uuid);
                        // websocket.unsub('tritonlog/' + uuid);
                        $scope.$destroy();
                    });

                    $(window).resize(function () {
                        ctrl.layout();
                    });
                },
                copy: function ($event) {
                    var target = $($event.target).closest('.debug_data_panel').find('.log_box')[0];
                    ctrl.copyToClip(target);
                },
                copyToClip: function (target) {
                    var range, select;
                    if (document.createRange) {
                        range = document.createRange();
                        range.selectNode(target);
                        select = window.getSelection();
                        select.removeAllRanges();
                        select.addRange(range);
                        document.execCommand('copy');
                        select.removeAllRanges();
                    } else {
                        range = document.body.createTextRange();
                        range.moveToElementText(target);
                        range.select();
                        document.execCommand('copy');
                    }
                    dialog.noty(I18nService.getValue('数据已复制到剪切板', 'data.copy.success'));
                },
                layout: _.debounce(function () {
                    let height = $(window).height();
                    $('.debug_data_panel_warp').height(height - 110);
                    $('.debug_cmd_editor,.debug_message_editor').height(height - 158);
                }, 300),
                onTritonData: function (text) {
                    if (tritonFilterValue) {
                        if (text.indexOf(tritonFilterValue) === -1) {
                            return false;
                        }
                    }
                    var container = $('.triton_data_container');
                    if (tritonCurrentLogCount >= tritonMaxLogCount) {
                        container.find('.log_row:first').remove();
                    }
                    container.append(`<div class="log_row"><div class="log_text">${text}</div><i class="fa fa-copy copy_log_btn" title="复制"></i></div>`);
                    tritonCurrentLogCount++;
                    if (tritonLogLock === false) {
                        var ele = container[0];
                        ele.scrollTop = ele.scrollHeight;
                    }
                },
                onData: function (message) {
                    let flag = false;   // 标识筛选栏中是否含有上发数据不存在的栏位
                    let newData = {};   // 暂存最新一条上发数据
                    if (filterValue) {
                        filterValue = _.replace(filterValue, "，", ",");
                        let data = message["data"];
                        if (!data) {
                            return false;
                        }
                        let filterArray = _.split(filterValue, ',');
                        _.pull(filterArray, "");
                        filterArray = _.map(filterArray, _.trim);
                        _.forEach(filterArray, function (value) {
                            if (value in data) {
                                newData[value] = data[value];
                            } else {
                                flag = true;
                            }
                        });
                    }
                    if (flag) {
                        dialog.noty(I18nService.getValue('筛选栏中含有上发数据不存在的栏位', 'field.not.exist'));
                        return false;
                    }
                    if (_.isEmpty(newData)) {
                        $scope.oldData = message["data"];
                    } else {
                        message["data"] = newData;
                        delete message.uuid;

                        if (onlyDiffer) {
                            let oldData = $scope.oldData;
                            let differFlag = true;
                            _.forEach(newData, function (value, key) {
                                if (!(key in oldData && value === oldData[key])) {
                                    return differFlag = false;
                                }
                            });
                            if (differFlag) {
                                return false;
                            }
                            $scope.oldData = newData;

                        }
                    }
                    var text = JSON.stringify(message);
                    var container = $('.debug_data_container');
                    if (currentLogCount >= maxLogCount) {
                        container.find('.log_row:first').remove();
                    }
                    container.append(`<div class="log_row"> <i class="fa fa-copy copy_log_btn" title="${I18nService.getValue('复制', 'copy')}"></i> <i class="fa fa-edit edit_log_btn" title="${I18nService.getValue('编辑', 'compile')}"></i> <div class="log_text"> ${text}</div> </div>`);
                    currentLogCount++;
                    if (logLock === false) {
                        var ele = container[0];
                        ele.scrollTop = ele.scrollHeight;
                    }
                },
                subscribeData: function () {
                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        onmessage: function (message,rate) {
                            $scope.rateinfo=rate;
                            if(rate!=-1){
                                ctrl.rate=rate+'ms';
                            }
                            util.apply($scope);
                            if (message && logStart === true) {
                                ctrl.onData(message);
                            }
                        },
                        rate: true
                    });
                },
                subscribeSamplingData: function () {
                    websocket.sub({
                        topic: 'sampling/' + uuid,
                        onmessage: function (message) {
                            if (message && logStart === true) {
                                ctrl.onData(message);
                            }
                        }
                    });
                },
                initCmdEditor: function () {
                    var defaultValue = {'uuid': uuid};

                    MonacoEditor.initEditor('debug_cmd_editor', {
                        language: 'json'
                    });
                    MonacoEditor.setValue('debug_cmd_editor', JSON.stringify(defaultValue));
                    ctrl.setCmd();
                },
                clearLog: function () {
                    $('.debug_data_container').html('');
                    currentLogCount = 0;
                },
                clearTritonLog: function () {
                    tritonCurrentLogCount = 0;
                    $('.triton_data_container').html('');
                },
                lockLog: function () {
                    logLock = !logLock;
                    if (logLock === true) {
                        $('.debug_warp .lock_icon').addClass('active');
                    } else {
                        $('.debug_warp .lock_icon').removeClass('active');
                    }
                },
                showDiffer: function () {
                    if (_.isEmpty(filterValue) && !onlyDiffer) {
                        dialog.noty(I18nService.getValue('请先输入栏位', 'field.input'));
                        return false;
                    }
                    onlyDiffer = !onlyDiffer;
                    if (onlyDiffer) {
                        $('.debug_warp .only-differ-icon').addClass('active');
                    } else {
                        $('.debug_warp .only-differ-icon').removeClass('active');
                    }
                },
                lockTritonLog: function () {
                    tritonLogLock = !tritonLogLock;
                    if (tritonLogLock === true) {
                        $('.triton_warp .lock_icon').addClass('active');
                    } else {
                        $('.triton_warp .lock_icon').removeClass('active');
                    }
                },
                stopLog: function () {
                    logStart = !logStart;
                    if (logStart === true) {
                        $('.debug_warp .stop_icon').removeClass('active');
                    } else {
                        $('.debug_warp .stop_icon').addClass('active');
                    }
                },
                stopTritonLog: function () {
                    tritonLogStart = !tritonLogStart;
                    if (tritonLogStart === true) {
                        $('.triton_warp .stop_icon').removeClass('active');
                    } else {
                        $('.triton_warp .stop_icon').addClass('active');
                    }
                },
                filterValueChange: function () {
                    filterValue = $('.debug_warp .log_filter_input').val();
                    filterValue = _.trim(filterValue);
                },
                tritonFilterValueChange: function () {
                    tritonFilterValue = $('.triton_warp .log_filter_input').val();
                    tritonFilterValue = _.trim(tritonFilterValue);
                },
                initMessageEditor: function () {
                    MonacoEditor.initEditor('debug_message_editor', {
                        language: 'json'
                    });
                },
                showLatestData: function () {
                    DBUtils.find('deviceData', {
                        uuid: uuid
                    }, {}, {
                        time: -1
                    }).success(function (result) {
                        var data = _.get(result, 'datas.result', {});
                        if (!_.isEmpty(data)) {
                            ctrl.showMessage(JSON.stringify(data));
                        }
                    });
                },
                setMessage: function (message) {
                    MonacoEditor.setValue('debug_message_editor', message);
                    MonacoEditor.format('debug_message_editor');
                },
                showMessage: function (message) {
                    let cmdBox = $element.find('.debug_cmd_box');
                    var cmdIcon = $element.find('.cmd_icon');
                    if (cmdBox.is(':visible')) {
                        cmdBox.stop(true, true).slideUp('fast');
                        cmdIcon.removeClass('active');
                    }

                    let messageBox = $element.find('.debug_message_box');
                    messageBox.stop(true, true).slideDown('fast');

                    $timeout(function () {
                        ctrl.setMessage(message);
                    }, 300)
                },
                closeMessage: function () {
                    let messageBox = $element.find('.debug_message_box');
                    messageBox.stop(true, true).slideUp('fast');
                },
                showCmd: function () {
                    ctrl.closeMessage();

                    $scope.hideCmd = !$scope.hideCmd;
                    let cmdBox = $element.find('.debug_cmd_box');
                    let shown = cmdBox.is(':visible');

                    var cmdIcon = $element.find('.cmd_icon');
                    if (shown) {
                        cmdBox.stop(true, true).slideUp('fast');
                        cmdIcon.removeClass('active');
                    } else {
                        cmdBox.stop(true, true).slideDown('fast');
                        cmdIcon.addClass('active');
                    }
                },
                sendCmd: function () {
                    var cmdValue = MonacoEditor.getValue('debug_cmd_editor');
                    try {
                        cmdValue = $.parseJSON(cmdValue);
                    } catch (e) {
                        dialog.noty(I18nService.getValue('格式错误，请修正', 'format.wrong.edit'));
                        return false;
                    }
                    DevicePushService.pushAction(uuid, cmdValue);
                    dialog.noty(I18nService.getValue('数据下发成功', 'data.issue.success'));
                },
                setCmd: function (type) {
                    var cmdValue = cmdMap[type];
                    if (!cmdValue) {
                        cmdValue = MonacoEditor.getValue('debug_cmd_editor');
                    }
                    if (cmdValue) {
                        cmdValue = $.parseJSON(cmdValue);
                        _.set(cmdValue, 'uuid', uuid);
                        cmdValue = JSON.stringify(cmdValue);
                        MonacoEditor.setValue('debug_cmd_editor', cmdValue);
                        MonacoEditor.format('debug_cmd_editor');
                    }
                },
                closeDialog: function () {
                    $element.modal('hide');
                },
                toggleDialog: function () {
                    var content = $element.find('.full-modal-body');
                    var btn = $element.find('.toggle-btn');
                    var dialog = $element.find('.modal-dialog');
                    let shown = content.is(':visible');
                    if (shown) {
                        btn.text('展开');
                        dialog.animate({'height': '70px'}, 500);
                        content.stop(true, true).slideUp('fast');
                    } else {
                        btn.text('收起');
                        dialog.animate({'height': '100%'}, 500);
                        content.stop(true, true).slideDown('fast');
                    }

                }
            });
            ctrl.initialize();
        }]);
});