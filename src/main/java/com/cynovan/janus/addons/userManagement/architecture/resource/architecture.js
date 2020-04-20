define(['orgchart'], function () {
    var app = angular.module('app');
    app.controller('ArchitectureController', ['$scope', 'DBUtils', 'http', 'I18nService',
        function ($scope, DBUtils, http, I18nService) {
            var ctrl = this;
            $scope.entity = {};
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadData();
                },
                loadData: function () {
                    http.get('architecture/menu').success(function (result) {
                        var datasource = {
                            'name': I18nService.getValue('总团队', 'all.team'),
                            'children': result
                        };
                        $('#chart-container').orgchart({
                            'data': datasource,
                            'nodeTitle': 'name',
                            'nodeId': 'code',
                        });
                    });
                }
            });
            ctrl.initialize();
        }]);
});