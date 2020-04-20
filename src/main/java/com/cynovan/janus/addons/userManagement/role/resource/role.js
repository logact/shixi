define([], function () {
    var app = angular.module('app');
    app.controller('RoleController', ['$scope', '$state', 'DBUtils', 'dialog', '$element', 'SecurityService', 'http', 'janus', 'I18nService',
        function ($scope, $state, DBUtils, dialog, $element, SecurityService, http, janus, I18nService) {
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
                        collection: 'role',
                        filled: true,
                        columns: [{
                            name: 'name',
                            title: I18nService.getValue('名称', 'name'),
                            search: true,
                            render: function (data) {
                                return `<a data-key='roleEditBtn' href="javascript:void(0);">${data}</a>`;
                            }
                        }, {
                            name: 'remarks',
                            title: I18nService.getValue('备注', 'remark'),
                            search: true
                        }, {
                            name: 'time',
                            title: I18nService.getValue('最后编辑时间', 'last_edit_time'),
                            search: true
                        }, {
                            name: 'do',
                            title: I18nService.getValue('操作', 'do'),
                            orderable: false,
                            render: function () {
                                if (SecurityService.hasRight('role', 'manage')) {
                                    return `<button  data-key='roleEditBtn' class="btn btn-primary btn-xs btn-outline" 
                                        type="button"><i class="fa fa-edit"></i> ${I18nService.getValue('修改', 'edit')}</button>
                                        <button data-key='roleDelBtn'  class="btn btn-primary btn-xs btn-outline" 
                                        type="button"><i class="fa fa-trash"></i> ${I18nService.getValue('删除', 'delete')}</button>`;
                                }
                            }
                        }]
                    };
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('button,a').data('key');
                        if (buttonKey === "roleEditBtn") {
                            ctrl.showRoleDetail(rowdata.id);
                        }
                        if (buttonKey === "roleDelBtn") {
                            ctrl.delRole(rowdata.id);
                        }
                    });
                },
                showRoleDetail: function (id) {
                    id = id || 'add_role';
                    janus.goToMenuDetailByName('角色', id);
                },
                delRole: function (id) {
                    if (id) {
                        dialog.confirm(I18nService.getValue('确定删除角色？删除后不可恢复。', 'confirm_delete')).on('success', function () {
                            http.post('role/delete', {
                                id: id
                            }).success(function () {
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
