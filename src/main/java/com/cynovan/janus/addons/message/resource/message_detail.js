define([], function () {
    var app = angular.module('app');

    app.controller('MessageDetailController', ['$scope', '$element', 'database', 'dialog', '$stateParams', 'DBUtils', 'I18nService', function ($scope, $element, database, dialog, $stateParams, DBUtils, I18nService) {
        var ctrl = this;
        var messageId = $stateParams.id;

        _.extend(ctrl, {
            init: function () {
                ctrl.getMessageDetail();
            },
            getMessageDetail: function () {
                DBUtils.find('messages', {
                    id: messageId
                }).success(function (result) {
                    $scope.message = _.get(result, 'datas.result', {});
                });
            },
            markRead: function () {
                DBUtils.update('messages', {
                    id: messageId
                }, {
                    $set: {
                        read: true
                    }
                }).success(function () {
                    dialog.noty(I18nService.getValue('操作成功', 'operation_success'));
                    ctrl.back();
                });
            },
            back: function () {
                history.back();
            }
        });
        ctrl.init();
        $scope.markRead = function () {
            ctrl.markRead();
        };
    }]);
});