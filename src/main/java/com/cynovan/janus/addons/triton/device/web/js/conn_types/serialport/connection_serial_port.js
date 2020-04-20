define([], function () {
    var app = angular.module('app');

    app.controller('ConnectionSerialPortController', ['$scope', 'http', 'util', 'dialog', 'I18nService',
        function ($scope, http, util, dialog, I18nService) {
            var ctrl = this;
            $scope.receiveoption = [{
                id: 'active',
                name: '主动接收（自动接收来自串口的数据）'
            }, {
                id: 'passive',
                name: '被动接收（定时发送密令至串口）'
            }];
            var info_key = 'conn_info_' + $scope.conn_type;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                initData: function () {
                    $scope.entity = $scope.entity || {};
                    if (_.isEmpty($scope.entity)) {
                        $scope.entity = {
                            receive_type: 'ascii',
                            send_type: 'ascii',
                            timer: '2s'
                        };
                    }
                    if($scope.entity.receiveMethod){
                        $scope.entity.receiveMethod=_.find($scope.receiveoption,{'id':$scope.entity.receiveMethod.id});
                    }else{
                        $scope.entity.receiveMethod=$scope.receiveoption[1];
                    }

                    if ($scope.entity.timer) {
                        $scope.entity.time = _.parseInt($scope.entity.timer) || 2;
                        $scope.entity.timeUnit = $scope.entity.timer.replace(/[0-9]+/ig, "");
                    }

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

                    ctrl.dataTypes = [{
                        id: 'ascii',
                        name: 'ASCII'
                    }, {
                        id: 'hex',
                        name: 'Hex'
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
                            return;
                        }
                        _.set(data, info_key, $scope.entity);
                    });
                    $scope.$watch("entity.receiveMethod",function () {
                        setTimeout(function () {
                            $('#scroll').scrollTop($('#scroll')[0].scrollHeight);
                        },300)
                    })
                },
                checkSave: function (checkMessage) {
                    $scope.entity.timer = $scope.entity.time + $scope.entity.timeUnit;
                    var data = _.cloneDeep($scope.entity);
                    let timeValue = _.toString($scope.entity.time);
                    $scope.entity.receiveMethod=angular.copy($scope.entity.receiveMethod);
                    if($scope.entity.receiveMethod.id==="active"){
                        var regex = /^[0-9]+$/;
                        if(!regex.test($scope.entity.datalength)){
                            checkMessage.messages.push(I18nService.getValue('请输入正确的数据长度'));
                            return false;
                        }
                    }
                    if($scope.entity.receiveMethod.id==="passive"){
                        if (!/[0-9]{1,3}/g.test(timeValue)) {
                            checkMessage.messages.push(I18nService.getValue('请输入正确的定时读取间隔', 'input.right.timer'));
                            return false;
                        }
                        if ($scope.entity.timeUnit === 'ms') {
                            if ($scope.entity.time < 50) {
                                checkMessage.messages.push(I18nService.getValue('定时读取间隔不能小于50毫秒', 'time.minmix'));
                                return false;
                            }
                        }
                    }
                    return data;
                }
            });
            ctrl.initialize();
        }]);
});