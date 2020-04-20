define([], function () {
    var app = angular.module('app');

    app.controller('HttpServerController', ['$scope', 'util', 'I18nService', function ($scope, util, I18nService) {
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
                        timer: '2s',
                        rows: []
                    });
                }
                if ($scope.entity.timer) {
                    $scope.timeUnit = $scope.entity.timer.replace(/[^a-z]+/ig, "");
                    $scope.time = _.trimEnd($scope.entity.timer, $scope.timeUnit);
                }

                ctrl.request_type = [{
                    id: 'get',
                    name: 'GET'
                }, {
                    id: 'post',
                    name: 'POST'
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
            checkSave: function (checkMessage) {
                $scope.entity.timer = $scope.time + $scope.timeUnit;
                var data = _.cloneDeep($scope.entity);
                if (!data.address) {
                    checkMessage.messages.push(I18nService.getValue('请输入有效的Http Server地址', 'input.server.address'));
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
                data.rows = util.removeHashKey(data.rows);
                var submessages = [];
                _.each(data.rows, function (row) {
                    if (!row.paramkey) {
                        submessages.push(I18nService.getValue('请输入参数ID', 'input.param.id'));
                        return false;
                    }
                    if (!row.paramvalue) {
                        submessages.push(I18nService.getValue('请输入参数值', 'input.param.value'));
                        return false;
                    }
                });
                submessages = _.uniq(submessages);
                if (submessages.length) {
                    checkMessage.messages = _.concat(checkMessage.messages, submessages);
                    return false;
                }
                return data;
            },
            addRow: function () {
                $scope.entity.rows.push({});
                util.apply($scope);
            },
            removeRow: function (index) {
                $scope.entity.rows.splice(index, 1);
                util.apply($scope);
            },
        });
        ctrl.initialize();
    }]);
});