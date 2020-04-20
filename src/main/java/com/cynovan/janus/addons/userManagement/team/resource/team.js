define([], function () {
    var app = angular.module('app');
    app.controller('TeamController', ['$scope', '$state', 'DBUtils', 'dialog', '$element', 'http', 'SecurityService', 'janus', 'I18nService',
        function ($scope, $state, DBUtils, dialog, $element, http, SecurityService, janus, I18nService) {
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
                        collection: 'team',
                        filled: true,
                        columns: [{
                            name: 'name',
                            title: I18nService.getValue('名称', 'name'),
                            search: true,
                            render: function (data) {
                                return `<a data-key='teamEditBtn' href="javascript:void(0);">${data}</a>`;
                            }
                        }, {
                            name: 'team.name',
                            title: I18nService.getValue('所属团队', 'own_team'),
                            search: true,
                        }, {
                            name: 'fixedTel',
                            title: I18nService.getValue('固定电话', 'telephone'),
                            search: true,
                        }, {
                            name: 'fax',
                            title: I18nService.getValue('传真', 'fax'),
                            search: true
                        }, {
                            name: 'departmentHeads',
                            title: I18nService.getValue('部门主管', 'department_boss'),
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
                                if (SecurityService.hasRight('team', 'manage')) {
                                    return `<button  data-key='teamEditBtn' class="btn btn-primary btn-xs btn-outline" 
                                        type="button"><i class="fa fa-edit"></i> ${I18nService.getValue('修改', 'edit')}</button>
                                        <button data-key='teamDelBtn'  class="btn btn-primary btn-xs btn-outline" 
                                        type="button"><i class="fa fa-trash"></i> ${I18nService.getValue('删除', 'delete')}</button>`;
                                }
                            }
                        }]
                    }
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('button,a').data('key');
                        if (buttonKey === "teamEditBtn") {
                            ctrl.showTeamDetail(rowdata.id);
                        }
                        if (buttonKey === "teamDelBtn") {
                            ctrl.delTeam(rowdata.id);
                        }
                    });
                },
                showTeamDetail: function (id) {
                    id = id || 'add_team';
                    janus.goToMenuDetailByName('团队', id);
                },
                delTeam: function (id) {
                    if (id) {
                        dialog.confirm(I18nService.getValue('确定删除团队？删除后不可恢复。', 'delete_team')).on('success', function () {
                            http.post('team/delete', {
                                id: id
                            }).success(function (result) {
                                if (result.success) {
                                    dialog.noty(I18nService.getValue('删除成功', 'delete_success'));
                                    ctrl.refreshTable();
                                } else {
                                    dialog.noty(I18nService.getValue("无法删除,该团队存在下级团队", 'delete_fail'));
                                }
                            });
                        });
                    }
                },
            });
            ctrl.initialize();
        }]);
});
