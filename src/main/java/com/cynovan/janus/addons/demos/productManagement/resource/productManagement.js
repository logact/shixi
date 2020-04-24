define([], function () {
    var app = angular.module('app');//并没有在html文件发现有这个ng-app但是为什么这里可以被angular.js所托管
    app.controller('ProductController', ['$scope', '$state', 'DBUtils', 'dialog', '$element', 'session', 'SecurityService', 'janus', 'I18nService',
        function ($scope, $state, DBUtils, dialog, $element, session, SecurityService, janus, I18nService) {
            var ctrl = this;
            $scope.entity = {};
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initListOption();
                    ctrl.bindEvent();
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                },
                initListOption: function () {
                    ctrl.options = {
                        collection: 'product',
                        filled: true,
                        // order: [[8, "desc"]],
                        columns: [{
                            name: 'productName',
//                            title: I18nService.getValue('产品名', 'user_name'),
                            title: '产品名',
                            search: true,
                            render: function (data) {
//                                if (SecurityService.hasRight('user', 'manage')) {
//                                    return `<a data-key='userEditBtn' href="javascript:void(0);">${data}</a>`;
//                                } else {
//                                    return `<span data-key='userEditBtn' href="javascript:void(0);">${data}</span>`;
//                                }
                             return `<a data-key='productEditBtn' href="javascript:void(0);">${data}</a>`;

                            }
                        }, {
                            name: 'model',
                            title: I18nService.getValue('型号', 'product_model'),
                            search: true,
                        }, {
                            name: 'type',
                            title: I18nService.getValue('类型', 'type'),
                            search: true,
                        }, {
                            name: 'price',
                            title:'价格',
//                            title: I18nService.getValue('价格', 'own_team'),
                            search: true,
                        }, {
                            name: 'unit',
                            title: '计量单位',
                            search: true,
                        }, {
                            name: 'remarks',
                            title: '备注',
                            search: true
                        }, {
                            name: 'time',
                            title: '最后编辑时间',
                            search: true
                        }, {
                            name: 'do',
                            title: I18nService.getValue('操作', 'do'),
                            orderable: false,
                            render: function () {
                                // if (SecurityService.hasRight('user', 'manage')) {
                                    return `<button  data-key='productEditBtn' class="btn btn-primary btn-xs btn-outline" 
                                        type="button"><i class="fa fa-edit"></i> ${I18nService.getValue('修改', 'edit')}</button>
                                        <button data-key='productDelBtn'  class="btn btn-primary btn-xs btn-outline" 
                                        type="button"><i class="fa fa-trash"></i> ${I18nService.getValue('删除', 'delete')}</button>`;
                                // }
                            }
                        }]
                    }
                },
                bindEvent: function () {
                    //$scope.$on??用于监听事件
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        //？
                        var buttonKey = element.closest('button,a').data('key');
                        if (buttonKey === "productEditBtn") {
                            ctrl.showProductDetail(rowdata.id);
                        }
                        if (buttonKey === "productDelBtn") {
                            ctrl.delProduct(rowdata.id);
                        }
                    });
                },
                showProductDetail: function (id) {
                    id = id || 'add_product';
                    janus.goToMenuDetailByName('产品管理', id);
                },
                delProduct: function (id) {
                    if (id) {
                        dialog.confirm(I18nService.getValue('确定删除产品？删除后不可恢复。', 'delete_product')).on('success', function () {
//                        这里这个id
                            DBUtils.remove('product', {id: id}).success(function () {
                                dialog.noty(I18nService.getValue('删除成功', 'delete_success'));
                                ctrl.refreshTable();
                            });
                        });
                    }
                },
            });
            ctrl.initialize();
        }]);
});
