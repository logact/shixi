define([], function () {
    var app = angular.module('app');

    app.controller('ConnectionTritonController', ['$scope', 'http', 'util','$stateParams',
        function ($scope, http, util,$stateParams) {
            var ctrl = this;
            var uuid = $scope.uuid || $stateParams.id;
            var info_key = 'conn_info_' + $scope.conn_type;
            $scope.entity = {
                uuid: uuid
            };
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadTritonConfig();
                    ctrl.bindEvent();
                },
                loadTritonConfig: function () {
                    /*load triton config*/
                    http.get('connections/triton_client').success(function (result) {
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