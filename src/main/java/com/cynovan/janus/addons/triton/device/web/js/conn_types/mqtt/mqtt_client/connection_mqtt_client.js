define([], function () {
    var app = angular.module('app');

    app.controller('ConnectionMqttClientController', ['$scope', 'http', 'util',
        function ($scope, http, util) {
            var ctrl = this;
            $scope.entity = $scope.entity || {};
            var info_key = 'conn_info_' + $scope.conn_type;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.loadMqttClientInfo();
                },
                loadMqttClientInfo: function () {
                    http.get('connections/mqtt_client').success(function (result) {
                        $scope.entity = result;
                        $scope.entity.uuid = $scope.$parent.uuid;
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