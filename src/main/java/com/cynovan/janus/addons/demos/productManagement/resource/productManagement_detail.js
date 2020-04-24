define([], function () {
    var app = angular.module('app');

    app.controller('AddProductController', ['$scope', 'DBUtils', 'http', 'util', 'session', 'dialog', '$stateParams', '$state', '$timeout', '$element', '$window', 'janus', 'I18nService',
        function ($scope, DBUtils, http, util, session, dialog, $stateParams, $state, $timeout, $element, $window, janus, I18nService) {
            var ctrl = this;
            $scope.entity = {};
            $scope.tips = "";
            $scope.prodectname = '新建产品';
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadData();
                    ctrl.initSubNavOption();
//                    ctrl.bindEvent();
                },
//                这里一段
                initSubNavOption: function () {
                    ctrl.subNavOptions = {
                        collection: 'product',
                        query: {},
                        label: '产品列表',
                        selected: $stateParams.id,
                        code: 'id',
                        name: 'productName'
                    }
                },
                loadData: function () {
                    if ($stateParams.id !== 'add_product') {
                        DBUtils.find('product', {
                            id: $stateParams.id,
                        }).success(function (result) {
                            var entity = _.get(result, 'datas.result', {});
                            $scope.entity = entity;
                            $scope.productName = '产品管理' + '-' + entity.productName;
//                            util.apply??
                            util.apply($scope)
                        });
                    }
                },
                saveNewProduct: function () {
                    var entity = $scope.entity;
                    var nameReg = /\w/;
//                    var mailReg = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/;
                    if (!entity.productName) {
                        dialog.noty("请输入用户名");
                        return false;
                    }
                    if (!nameReg.test(entity.productName)) {
                        dialog.noty('用户名由数字或字母组成');
                        return false;
                    }

                    http.post('product/save', {
//                    转换为json字符串
                        entity: util.encodeJSON(entity)
                    }).success(function (result) {
                        if (result.success) {
                            dialog.noty(I18nService.getValue('保存成功', 'save_success'));
                            janus.goToMenuDetailByName('产品管理', result.datas.id);
                        } else {
                            dialog.noty(result.datas.reason);
                        }
                    });
                },
                back: function () {
                    janus.goToMenuByName('产品管理');
                }
            });
            ctrl.initialize();
        }]);
});
