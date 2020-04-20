define([], function () {
    var app = angular.module('app');
    app.controller('WeldingDataParamtController', ['$scope', 'http', 'util', '$timeout', 'dialog', 'DBUtils', '$filter', 'AppDataService',
        function ($scope, http, util, $timeout, dialog, DBUtils, $filter, AppDataService) {
            var ctrl = this;
            var entity = $scope.entity;
            var datamap = $scope.datamap;

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadData();
                    $scope.$on('success', function (event, checkMessage) {
                        ctrl.saveShowData();
                    });
                },
                loadData: function () {
                    // 数据定义的栏位
                    AppDataService.get('weld_robot_history', 'config').success(function (result) {
                        var fieldList = _.get(result, 'fields', []);

                        _.each(fieldList, function (field) {
                            if (field.b_select) {
                                field.b_select = _.split(field.b_select, ',');
                            }
                        });
                        $scope.selfFieldList = fieldList;
                        util.apply($scope);
                    });
                },
                saveShowData: function () {
                    DBUtils.update('appData', {
                        key: datamap.parentId,
                        'data.arr.weldingId': entity.weldingId
                    }, {
                        $set: {
                            'data.arr.$.show_data': entity.show_data
                        }
                    }).success(function () {
                        dialog.noty('操作成功！');
                    });
                }
            });
            ctrl.initialize();
        }]);
})