define([], function () {
    var app = angular.module('app');

    app.controller('ConnectionTCPServerController', ['$scope', 'http', 'util', 'I18nService',
        function ($scope, http, util, I18nService) {
            var ctrl = this;
            var info_key = 'conn_info_' + $scope.conn_type;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.initData();
                },
                initData: function () {
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
                },
                bindEvent: function () {
                    $scope.$on('onSave', function (event, data, checkMessage) {
                        var checkdata = ctrl.checkSave(checkMessage);
                        if (checkdata === false) {
                            checkMessage.success = false;
                            return false;
                        }
                        _.set(data, info_key, $scope.entity);
                    });
                },
                checkSave: function (checkMessage) {
                    $scope.entity.timer = $scope.entity.time + $scope.entity.timeUnit;
                    var data = _.cloneDeep($scope.entity);
                    if (!data.ip) {
                        checkMessage.messages.push(I18nService.getValue('请输入TCP Server的IP', 'input.tcp.ip'));
                        return false;
                    }
                    if (!data.port) {
                        checkMessage.messages.push(I18nService.getValue('请输入TCP Server的Port', 'input.tcp.port'));
                        return false;
                    }
                    if ($scope.entity.timer_switch) {
                        let timeValue = _.toString($scope.entity.time);
                        if (!/[0-9]{1,3}/g.test(timeValue)) {
                            checkMessage.messages.push(I18nService.getValue('请输入正确的定时读取间隔', 'input.right.timer'));
                            return false;
                        }
                        if ($scope.entity.timeUnit === 'ms') {
                            if ($scope.entity.time < 30) {
                                checkMessage.messages.push(I18nService.getValue('定时读取间隔不能小于30毫秒', 'time.minmix1'));
                                return false;
                            }
                        }
                    } else {
                        $scope.entity.timer = "";
                    }

                    if ($scope.entity.push_use_other_port) {
                        if (!$scope.entity.push_port) {
                            checkMessage.messages.push(I18nService.getValue('请输入下发端口', 'input.issue.port'));
                            return false;
                        }
                    }
                    return data;
                }
            });
            ctrl.initialize();
        }]);
});