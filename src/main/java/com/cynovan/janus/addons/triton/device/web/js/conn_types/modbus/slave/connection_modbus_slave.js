define([], function () {
    var app = angular.module('app');

    app.controller('ConnectionModbusSlaveController', ['$scope', 'http', 'util', 'dialog', 'I18nService',
        function ($scope, http, util, dialog, I18nService) {
            var ctrl = this;
            var info_key = 'conn_info_' + $scope.conn_type;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                initData: function () {
                    $scope.entity = $scope.entity || {};
                    if (_.isEmpty($scope.entity)) {
                        _.extend($scope.entity, {
                            modbus: 'tcp',
                            timer: '2s',
                            port: '502',
                            rows: [{
                                area: '01'
                            }]
                        });

                        http.get('connections/modbus_local_ip')
                            .success(function (result) {
                                _.set($scope.entity, 'ip', result.ip || '');
                                util.apply($scope);
                            });
                    }
                    if ($scope.entity.timer) {
                        $scope.timeUnit = $scope.entity.timer.replace(/[^a-z]+/ig, "");
                        $scope.time = _.trimEnd($scope.entity.timer, $scope.timeUnit);
                    }


                    ctrl.modbus_types = [{
                        id: 'tcp',
                        name: 'Modbus TCP'
                    }, {
                        id: 'rtu',
                        name: 'Modbus RTU'
                    }];

                    ctrl.modbus_areas = [{
                        id: '1',
                        'name': 'Read Coils(1)'
                    }, {
                        id: '2',
                        'name': 'Read Discrete Inputs(2)'
                    }, {
                        id: '3',
                        'name': 'Read Holding Registers(3)'
                    }, {
                        id: '4',
                        'name': 'Read Input Registers(4)'
                    }];

                    ctrl.encodingModeOptions = [{
                        id: 'rtu',
                        name: 'RTU'
                    }, {
                        id: 'ascii',
                        name: 'ASCII'
                    }];

                    ctrl.timeUnit = [{
                        id: 'ms',
                        name: I18nService.getValue('毫秒', 'millisecond')
                    }, {
                        id: 's',
                        name: I18nService.getValue('秒', 'second')
                    }, {
                        id: 'm',
                        name: I18nService.getValue('分', 'minute')
                    }];

                    ctrl.fix_times = [{
                        id: '300ms',
                        name: I18nService.getValue('每300毫秒', 'three_millisecond')
                    }, {
                        id: '2s',
                        name: I18nService.getValue('每2秒', 'two_second')
                    }, {
                        id: '5s',
                        name: I18nService.getValue('每5秒', 'five_second')
                    }, {
                        id: '3m',
                        name: I18nService.getValue('每3分钟', 'three_minute')
                    }];

                    ctrl.portOpts = $scope.entity.commPortId ? [{
                        id: $scope.entity.commPortId,
                        name: $scope.entity.commPortId
                    }] : [];

                    ctrl.parityOpts = [{
                        id: '0',
                        name: 'NONE'
                    }, {
                        id: '1',
                        name: 'ODD'
                    }, {
                        id: '2',
                        name: 'EVEN'
                    }];

                    ctrl.dataBitOpts = [{
                        id: '8',
                        name: '8'
                    }, {
                        id: '7',
                        name: '7'
                    }, {
                        id: '6',
                        name: '6'
                    }];

                    ctrl.stopBitOpts = [{
                        id: '1',
                        name: '1'
                    }, {
                        id: '2',
                        name: '2'
                    }];

                    http.get('connections/modbus_comm_port_scan').success(function (result) {
                        var resultPorts = result.ports;
                        var availablePorts = [];
                        if (resultPorts.length > 0) {
                            ctrl.defaultPort = resultPorts[0];
                            resultPorts.forEach(function (value) {
                                availablePorts.push({
                                    id: value,
                                    name: value + '(' + I18nService.getValue('在线', 'online') + ')'
                                });
                            });
                        }
                        ctrl.portOpts = _.unionBy(availablePorts.concat(ctrl.portOpts), 'id');
                    });
                },
                bindEvent: function () {
                    $scope.$on('onSave', function (event, data, checkMessage) {
                        var checkdata = ctrl.checkSave(checkMessage);
                        if (checkdata === false) {
                            checkMessage.success = false;
                            return false;
                        }
                        _.set(data, info_key, checkdata);
                    });

                    $scope.$on('$destroy', function () {
                        $scope.entity.rows = util.removeHashKey($scope.entity.rows);
                    });
                },
                addRow: function () {
                    $scope.entity.rows.push({
                        area: '01'
                    });
                    util.apply($scope);
                },
                removeRow: function (index) {
                    $scope.entity.rows.splice(index, 1);
                    util.apply($scope);
                },
                checkSave: function (checkMessage) {
                    $scope.entity.timer = $scope.time + $scope.timeUnit;
                    var data = _.cloneDeep($scope.entity);
                    if (!data.slave) {
                        checkMessage.messages.push(I18nService.getValue('请输入Modbus Slave ID', 'input.slave.id'));
                        return false;
                    }
                    if (!/^[1-9]\d{0,9}$/g.test($scope.time)) {
                        checkMessage.messages.push(I18nService.getValue('定时读取请输入有效整数', 'need_integer_time'));
                        return false;
                    }
                    if ($scope.timeUnit === 'ms') {
                        if ($scope.time < 50) {
                            checkMessage.messages.push(I18nService.getValue('定时读取不少于50毫秒', 'time.min.count'));
                            return false;
                        }
                    }
                    if (!data.port) {
                        checkMessage.messages.push(I18nService.getValue('请输入Modbus的端口号', 'input.modbus.port'));
                        return false;
                    }
                    if (data.modbus === 'rtu') {
                        if (!data.commPortId) {
                            checkMessage.messages.push(I18nService.getValue('请输入通信端口', 'input.com.port'));
                            return false;
                        }
                        if (!data.baudRate) {
                            checkMessage.messages.push(I18nService.getValue('请输入波特率', 'input.baud.rate'));
                            return false;
                        }
                    }
                    else {
                        if (!data.ip || !data.port) {
                            checkMessage.messages.push(I18nService.getValue('请输入正确的IP地址和端口号', 'input.right.address'));
                            return false;
                        }
                    }
                    data.rows = util.removeHashKey(data.rows);
                    var submessages = [];
                    _.each(data.rows, function (row) {
                        var start = parseInt(row.start);
                        var end = parseInt(row.end);
                        if (_.isNaN(start) || _.isNaN(end)) {
                            submessages.push(I18nService.getValue('请输入正确的读取位置', 'input.right.location'));
                            return false;
                        }
                    });
                    submessages = _.uniq(submessages);
                    if (submessages.length) {
                        checkMessage.messages = _.concat(checkMessage.messages, submessages);
                        return false;
                    }
                    return data;
                }
            });
            ctrl.initialize();
        }]);
});