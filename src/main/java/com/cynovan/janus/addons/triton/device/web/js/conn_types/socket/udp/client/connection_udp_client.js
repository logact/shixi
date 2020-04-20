define([], function () {
    var app = angular.module('app');

    app.controller('ConnectionUDPClientController', ['$scope', 'http', 'util',
        function ($scope, http, util) {
            var ctrl = this;
            $scope.entity = $scope.entity || {};
            var info_key = 'conn_info_' + $scope.conn_type;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.loadUDPClientInfo();
                },
                loadUDPClientInfo: function () {
                    http.get('connections/udp_client').success(function (result) {
                        _.extend($scope.entity, result);
                        util.apply($scope);
                    });
                },
                bindEvent: function () {
                    $scope.$on('onSave', function (event, data, message) {
                        // Todo: check conn_info
                        _.set(data, info_key, $scope.entity);
                    });
                }
            });
            ctrl.initialize();
        }]);
});