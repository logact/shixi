define([], function () {
    var app = angular.module('app');

    app.controller('HttpRestController', ['$scope', 'http', 'util', 'dialog', 'I18nService',
        function ($scope, http, util, dialog, I18nService) {
            var ctrl = this;
            var info_key = 'conn_info_' + $scope.conn_type;
            $scope.entity = $scope.entity || {};
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadHttpConfig();
                    ctrl.bindEvent();
                },
                loadHttpConfig: function () {
                    http.get('connections/http_rest').success(function (result) {
                        _.extend($scope.entity, result);
                        util.apply($scope);
                    });
                },
                bindEvent: function () {
                    $scope.$on('onSave', function (event, data, checkMessage) {
                        if (_.isEmpty($scope.entity.url)) {
                            checkMessage.messages.push(I18nService.getValue('请输入下发地址', 'input.issue.address'));
                            checkMessage.success = false;
                            return false;
                        }
                        else {
                            var reg = /^([hH][tT]{2}[pP]:\/\/|[hH][tT]{2}[pP][sS]:\/\/)(([A-Za-z0-9-~]+)\.)+([A-Za-z0-9-~\/])+$/;
                            if (!reg.test($scope.entity.url)) {
                                checkMessage.messages.push(I18nService.getValue('请输入有效的下发地址', 'input.right.issue.address'));
                                checkMessage.success = false;
                                return false;
                            }
                        }
                        _.set(data, info_key, $scope.entity);
                    });
                }
            });
            ctrl.initialize();
        }]);
});