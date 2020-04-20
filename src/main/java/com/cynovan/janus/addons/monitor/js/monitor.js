define(['monitor/js/ps2_keyboard'], function (KeyBoard) {
    var app = angular.module('app');

    app.controller('MonitorController', ['$scope', '$rootScope', '$state', 'DBUtils', 'dialog', 'http', '$timeout', 'AppComponent', '$element', 'websocket', 'DeviceService', 'AppDataService', '$interval', function ($scope, $rootScope, $state, DBUtils, dialog, http, $timeout, AppComponent, $element, websocket, DeviceService, AppDataService, $interval) {

        var ctrl = this;
        var guac = null;
        var combineArray = [];
        var keyArray = [];
        var interval;
        $scope.vncInfo = {};
        $scope.screenResolution = 'Default';
        $scope.combineList = [];

        _.extend(ctrl, {
            initialize: function () {
                ctrl.loadDevice();
                ctrl.bindEvent();
                ctrl.autoWidth();
                ctrl.selectResolution(0);
            },
            loadDevice: function () {
                AppComponent.deviceselect($('#selectRobotBox'), {}).progress(function (bind) {
                    $scope.uuid = bind.uuid;
                    ctrl.closeMonitor();
                    $scope.vncInfo = {};
                    DBUtils.find('dataExchange', {
                        uuid: $scope.uuid
                    }).success(function (result) {
                        var connType = _.get(result, 'datas.result.conn_type', 'triton');
                        $scope.connType = connType;
                        if (connType !== 'triton') {
                            AppDataService.get('monitor', $scope.uuid).success(function (result) {
                                if (!_.isEmpty(result)) {
                                    $scope.vncInfo = result;
                                }
                                ctrl.openVncDialog();
                            });
                        }
                    });
                });
            },
            autoWidth: function () {
                /*设置widget-body高度，利于设置背景色后高度显示更协调*/
                $('.monitor-widget').css('height', window.innerHeight - 140 + 'px');
                var widget = $(".app_monitor_box");
                var height = widget.height();
                var ele = $($element);
                ele.find('.app-monitor-layer,.app-monitor-content').height(height);
                ele.find('.app-monitor-layer').css({
                    'line-height': height + 'px'
                });
            },
            selectResolution: function (index) {
                if (index === 0) {
                    $scope.screenResolution = 'Default';
                    ctrl.setResolution();
                } else if (index === 1) {
                    $scope.screenResolution = '640*480';
                    ctrl.setResolution();
                } else if (index === 2) {
                    $scope.screenResolution = '800*600';
                    ctrl.setResolution();
                }
            },
            setResolution: function () {
                /*Default*/
                var width = 650, height = 490;
                /*+10是为了适配示教器高度,650是因为有边框*/
                if ($scope.screenResolution === '640*480') {
                    width = 650;
                    height = 490;
                } else if ($scope.screenResolution === '800*600') {
                    width = 800;
                    height = 600;
                }
                var ele = $($element);
                ele.find('.app-monitor-layer,.app-monitor-content').height(height);
                ele.find('.app-monitor-content').width(width);
                ele.find('.app-monitor-layer').css({
                    'line-height': height + 'px'
                });
                ctrl.resetPadding();
            },
            resetPadding: function () {
                var ele = $($element);
                let boxWidth = ele.find('.app_monitor_box').width();
                let leftWidth = ele.find('.left-operation-area').width();
                let rightWidth = ele.find('.right-operation-area').width();
                let contentWidth = ele.find('.app-monitor-content').width();
                let lastWidth = boxWidth - leftWidth - rightWidth - contentWidth;
                let paddingWidth = lastWidth > 0 ? (lastWidth) / 2 + 'px' : '0px';
                ele.find('.left-operation-area').css('margin-left', paddingWidth);
            },
            bindEvent: function () {
                $(window).resize(_.debounce(function () {
                    ctrl.autoWidth();
                    ctrl.resetPadding();
                }, 300));

                $($element).on('click', '.app-monitor-layer', function () {
                    ctrl.openPwdDialog();
                });

                /*按键监听*/
                var leftButton = $element.find('.left-operation-area');
                var bottomButton = $element.find('.bottom-operation-area');
                var rightButton = $element.find('.right-operation-area');
                var topButton = $element.find('.top-operation-area');//快捷组合键
                ctrl.setButtonMonitor(leftButton);
                ctrl.setButtonMonitor(bottomButton);
                ctrl.setButtonMonitor(rightButton);
                ctrl.setTopButtonMonitor(topButton);
                ctrl.setCombineMonitor();//监听组合键的发送
            },
            openPwdDialog: function () {
                if (!$scope.uuid) {
                    dialog.noty('请选择设备');
                    return;
                }
                DeviceService.checkControlPassword().then(
                    function () {
                        if (_.isEmpty($scope.vncInfo)) {
                            if ($scope.connType === 'triton') {
                                $($element).find('.app-monitor-layer').addClass('hide');
                                ctrl.startMonitor();
                            } else {
                                ctrl.openVncDialog();
                            }
                        } else {
                            ctrl.connectionUsersTriton();
                        }
                    }, function () {
                        console.log('cancel input');
                    }
                );
            },
            setCombineMonitor: function () {
                var combineSendButton = $element.find('.combine-button-list');
                combineSendButton.on('touchstart mousedown', '.combine-send-button', function (event) {
                    var ele = $(event.target);
                    ctrl.sendCombineStart();
                    ctrl.sendCombineEnd();
                    interval = $interval(function () {
                        ctrl.sendCombineStart();
                    }, 200);
                    ele.addClass('long-press');
                });
                combineSendButton.on('touchmove touchend mousemove mouseup', '.combine-send-button', function (event) {
                    var ele = $(event.target);
                    ctrl.sendCombineEnd();
                    $interval.cancel(interval);
                    ele.removeClass('long-press');
                });
            },
            sendCombineStart: function () {
                combineArray = [];
                _.forEach($scope.combineList, function (combine) {
                    let code = ctrl.ps2Keyboard(combine.key);
                    if (code)
                        combineArray.push(code);
                });
                _.forEach(combineArray, function (c) {
                    guac.sendKeyEvent(1, c);
                });
            },
            sendCombineEnd: function () {
                _.forEach(combineArray, function (c) {
                    guac.sendKeyEvent(0, c);
                });
            },
            openVncDialog: function () {
                var vpnDialog = dialog.show({
                    template: 'monitor-edit-vnc-template',
                    width: 600,
                    title: false,
                    controller: 'MonitorVncAddController',
                    controllerAs: 'ctrl',
                    data: {
                        vncInfo: $scope.vncInfo,
                        uuid: $scope.uuid,
                        trigger: {
                            onSuccess: function () {
                                // 添加成功触发
                                vpnDialog.modal('hide');
                                if (!_.isEmpty($scope.vncInfo)) {
                                    ctrl.openPwdDialog();
                                }
                            },
                            onFail: function () {
                                // 添加失败触发
                                $scope.vncInfo = {};
                            }
                        }
                    }
                });
            },
            startMonitor: function () {
                $($element).find('.app-monitor-waiting').removeClass('hide');
                var receive = false;
                websocket.sub({
                    topic: 'queryconfig/' + $scope.uuid,
                    onmessage: function (message) {
                        receive = true;
                        if (message) {
                            ctrl.connectionTriton(message);
                        }
                    },
                    once: true,
                    onconnect: function () {
                        DeviceService.pushQueryConfigAction($scope.uuid);
                    }
                });

                $scope.connectTimeout = $timeout(function () {
                    if (receive === false) {
                        var ele = $($element);
                        ele.find('.app-monitor-timeout').removeClass('hide');
                        ele.find('.app-monitor-waiting').addClass('hide');
                    }
                }, 33000);
            },
            isValidIp: function (ip) {
                if (!ip || ip === '0.0.0.0') {
                    return false;
                }
                return true;
            },
            connectionTriton: function (message) {
                var address = '';
                var ip0 = _.get(message, 'data.ip_0', '');
                var ip1 = _.get(message, 'data.ip_1', '');

                var ip0Valid = ctrl.isValidIp(ip0);
                var ip1Valid = ctrl.isValidIp(ip1);
                if (ip0Valid === false && ip1Valid === false) {
                    /*两个ip都不行*/
                    dialog.noty('获取设备IP地址错误');
                    return false;
                }

                var config = {
                    connectionSetting: {
                        hostname: '',
                        port: 9100
                    },
                    authenticationSetting: {
                        password: 'Const0.0'
                    },
                    targetType: "device"
                };

                if (ip0Valid === true && ip1Valid === false) {
                    address = ip0;
                    _.set(config, 'connectionSetting.hostname', address);
                    ctrl.configParams(config);
                } else if (ip0Valid === false && ip1Valid === true) {
                    address = ip1;
                    _.set(config, 'connectionSetting.hostname', address);
                    ctrl.configParams(config);
                }

                if (ip0Valid === true && ip1Valid === true) {
                    http.get('monitor/ping', {
                        ip0: ip0,
                        ip1: ip1
                    }).success(function (result) {
                        var ip = _.get(result, 'ip', '');
                        if (ip) {
                            _.set(config, 'connectionSetting.hostname', ip);
                            ctrl.configParams(config);
                        } else {
                            dialog.noty('获取设备IP地址错误');
                        }
                    });
                }
            },
            connectionUsersTriton: function () {
                $($element).find('.app-monitor-layer').addClass('hide');
                var config = {
                    connectionSetting: {
                        hostname: $scope.vncInfo.hostName,
                        port: $scope.vncInfo.port
                    },
                    authenticationSetting: {
                        password: $scope.vncInfo.password || 'Const0.0'
                    },
                    targetType: "device"
                };
                ctrl.configParams(config);
            },
            configParams: function (config) {
                var vnc = {
                    protocol: 'vnc',
                };
                _.extend(vnc, config);
                var url = cynovan.c_path + '/guacamole?protocol=vnc&config=' + window.btoa(JSON.stringify(vnc)) + '&uuid=' + $scope.uuid;
                ctrl.showMonitorContent(url);
            },
            showMonitorContent: function (url) {
                var ele = $($element);
                var appContent = ele.find('.app-monitor-content');
                ele.find('.app-monitor-waiting,.app-monitor-timeout').addClass('hide');
                appContent.find('iframe').attr('src', url);
                appContent.removeClass('hide');
                ele.find('.combine-div,.left-operation-area,.right-operation-area').removeClass('hide');
                $scope.showKeyborad = true;
                $timeout(function () {
                    guac = document.getElementById('guacamole').contentWindow.guac;
                }, 1000);
            },
            setButtonMonitor: function (elem) {
                elem.on('click', 'button', function (event) {
                    var ele = $(event.target);
                    if ($scope.combine === '关闭') {
                        $scope.combineList.push({
                            'name': ele.text(),
                            'key': ele.data('key')
                        });
                        $scope.$apply($scope.combineList);
                    }
                });
                elem.on('touchstart mousedown', 'button', function (event) {
                    var ele = $(event.target);
                    ctrl.sendStart(ele.data('key'));
                    interval = $interval(function () {
                        ctrl.sendStart(ele.data('key'));
                    }, 200);
                    ele.addClass('long-press');
                });
                elem.on('touchmove touchend mousemove mouseup', 'button', function (event) {
                    var ele = $(event.target);
                    ctrl.sendEnd(ele.data('key'));
                    $interval.cancel(interval);
                    ele.removeClass('long-press');
                });
            },
            setTopButtonMonitor: function (elem) {
                elem.on('click', 'button', function (event) {
                    var ele = $(event.target);
                    if (ele.data('key') === 'Close') {
                        ctrl.closeMonitor();
                    }
                });
                elem.on('touchstart mousedown', 'button', function (event) {
                    var ele = $(event.target);
                    ctrl.sendFastCombineStart(ele.data('key'));
                    ctrl.sendFastCombineEnd(ele.data('key'));
                    interval = $interval(function () {
                        ctrl.sendFastCombineStart(ele.data('key'));
                    }, 200);
                    ele.addClass('long-press');
                });
                elem.on('touchmove touchend mousemove mouseup', 'button', function (event) {
                    var ele = $(event.target);
                    ctrl.sendFastCombineEnd(ele.data('key'));
                    $interval.cancel(interval);
                    ele.removeClass('long-press');
                });
            },
            sendFastCombineStart: function (keys) {
                keyArray = [];
                let keyList = _.split(keys, '+');
                _.forEach(keyList, function (combine) {
                    let code = ctrl.ps2Keyboard(combine);
                    if (code)
                        keyArray.push(code);
                });
                _.forEach(keyArray, function (c) {
                    guac.sendKeyEvent(1, c);
                });
            },
            sendFastCombineEnd: function () {
                _.forEach(keyArray, function (c) {
                    guac.sendKeyEvent(0, c);
                });
            },
            combineButtonClick: function () {
                $scope.combine === '开启' ? $scope.combine = '关闭' : $scope.combine = '开启';
                if ($scope.combine === '开启') {
                    $scope.combineList = [];
                }
            },
            hideKeyboard: function () {
                $scope.showKeyborad = !$scope.showKeyborad;
            },
            deleteCombine: function (index) {
                $scope.combineList.splice(index, 1);
                if ($scope.combineList.length === 0) {
                    dialog.noty('如需退出组合键模式，请点击关闭组合键按钮');
                }
            },

            sendStart: function (k) {
                if (!guac) {
                    guac = document.getElementById('guacamole').contentWindow.guac;
                }
                if ($scope.combine === '开启') {
                    var keyCode = ctrl.ps2Keyboard(k);
                    if (keyCode) {
                        guac.sendKeyEvent(1, keyCode);
                    } else {
                        console.log('错误的指令，请检查配置');
                    }
                }
            },
            sendEnd: function (k) {
                if (!guac) {
                    guac = document.getElementById('guacamole').contentWindow.guac;
                }
                if ($scope.combine === '开启') {
                    var keyCode = ctrl.ps2Keyboard(k);
                    if (keyCode) {
                        guac.sendKeyEvent(0, keyCode);
                    } else {
                        console.log('错误的指令，请检查配置');
                    }
                }
            },
            ps2Keyboard: function (key) {
                var keyObject = _.find(KeyBoard, function (k) {
                    return k.key == key;
                });
                if (keyObject) {
                    return keyObject.keyCode;
                } else {
                    return false;
                }
            },
            closeMonitor: function () {
                $timeout.cancel($scope.connectTimeout);
                var appMonitorBox = $('.app_monitor_box');
                appMonitorBox.find('.app-monitor-layer').removeClass('hide');
                appMonitorBox.find('.app-monitor-timeout,.app-monitor-waiting,.app-monitor-content,.left-operation-area,.right-operation-area').addClass('hide');
                appMonitorBox.find('.app-monitor-content iframe').attr('src', '');
            }
        });
        ctrl.initialize();
    }]);


    app.controller('MonitorVncAddController', ['$scope', 'DBUtils', 'dialog', 'AppDataService', function ($scope, DBUtils, dialog, AppDataService) {
        var ctrl = this;
        $scope.entity = $scope.vncInfo;
        var uuid = $scope.uuid;
        _.extend(ctrl, {
            initialize: function () {
                $scope.$on('success', function (event, checkMessage) {
                    if (!$scope.entity.hostName) {
                        dialog.noty("请输入地址");
                        checkMessage.success = false;
                        return false;
                    } else if (!$scope.entity.port) {
                        dialog.noty("请输入端口号");
                        checkMessage.success = false;
                        return false;
                    } else if (!$scope.entity.password) {
                        dialog.noty("请输入密码");
                        checkMessage.success = false;
                        return false;
                    }
                    $scope.vncInfo = $scope.entity;
                    if (!_.isEmpty($scope.vncInfo)) {
                        AppDataService.set('monitor', uuid, $scope.vncInfo);
                    }
                    $scope.trigger.onSuccess.call();
                });
            }
        });
        ctrl.initialize();
    }]);
});
