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
                        collection: 'user',
                        filled: true,
                        order: [[8, "desc"]],
                        columns: [{
                            name: 'userName',
                            title: I18nService.getValue('用户名', 'user_name'),
                            search: true,
                            render: function (data) {
                                if (SecurityService.hasRight('user', 'manage')) {
                                    return `<a data-key='userEditBtn' href="javascript:void(0);">${data}</a>`;
                                } else {
                                    return `<span data-key='userEditBtn' href="javascript:void(0);">${data}</span>`;
                                }

                            }
                        }, {
                            name: 'name',
                            title: I18nService.getValue('姓名', 'user_name_one'),
                            search: true,
                        }, {
                            name: 'roleName',
                            title: I18nService.getValue('角色', 'role'),
                            search: true,
                        }, {
                            name: 'team.name',
                            title: I18nService.getValue('所属团队', 'own_team'),
                            search: true,
                        }, {
                            name: 'lock',
                            title: I18nService.getValue('锁定状态', 'lock_status'),
                            search: true,
                            render: function (data) {
                                if (data === true) {
                                    return `<span>${I18nService.getValue('已锁定', 'locked')}</span>`
                                }
                            }
                        }, {
                            name: 'mail',
                            title: I18nService.getValue('邮箱', 'email'),
                            search: true,
                        }, {
                            name: 'tel',
                            title: I18nService.getValue('电话', 'phone'),
                            search: true
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
                                if (SecurityService.hasRight('user', 'manage')) {
                                    return `<button  data-key='userEditBtn' class="btn btn-primary btn-xs btn-outline" 
                                        type="button"><i class="fa fa-edit"></i> ${I18nService.getValue('修改', 'edit')}</button>
                                        <button data-key='userDelBtn'  class="btn btn-primary btn-xs btn-outline" 
                                        type="button"><i class="fa fa-trash"></i> ${I18nService.getValue('删除', 'delete')}</button>`;
                                }
                            }
                        }]
                    }
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('button,a').data('key');
                        if (buttonKey === "userEditBtn") {
                            ctrl.showUserDetail(rowdata.id);
                        }
                        if (buttonKey === "userDelBtn") {
                            ctrl.delUser(rowdata.id);
                        }
                    });
                },
                showUserDetail: function (id) {
                    id = id || 'add_user';
                    janus.goToMenuDetailByName('用户', id);
                },
                delUser: function (id) {
                    if (id) {
                        dialog.confirm(I18nService.getValue('确定删除用户？删除后不可恢复。', 'delete_user')).on('success', function () {
                            DBUtils.remove('user', {id: id}).success(function () {
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
