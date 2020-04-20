define([], function () {
    var app = angular.module('app');

    app.controller('ControllingListController', ['$scope', '$state', 'http', 'dialog', '$element', 'SecurityService', 'janus', 'I18nService',
        function ($scope, $state, http, dialog, $element, SecurityService, janus, I18nService) {
            var ctrl = this;

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initTableOption();
                    ctrl.bindEvent();
                },
                initTableOption: function () {
                    ctrl.options = {
                        collection: 'controlling',
                        filled: true,
                        columns: [{
                            name: 'open',
                            title: I18nService.getValue('生效状态', 'effect_status'),
                            search: false,
                            width: '100px',
                            render: function (data, type, row) {
                                var cls = row.open ? 'green-color' : '';
                                if (cls === 'green-color') {
                                    return `<span class="controlling-effective-state ${cls}" id="${row.id}"><i class="fa fa-check-circle"></i></span>`;
                                } else {
                                    return `<span class="controlling-effective-state" id="${row.id}"><i class="fa fa-times-circle"></i></span>`;
                                }
                            }
                        }, {
                            name: 'name',
                            title: I18nService.getValue('名称', 'name'),
                            search: true,
                            orderable: true
                        }, {
                            name: 'remarks',
                            title: I18nService.getValue('备注', 'remark'),
                            search: true,
                            width: '40%'
                        }, {
                            name: '_id',
                            title: I18nService.getValue('操作', 'do'),
                            orderable: false,
                            width: '200px',
                            render: function (data, type, row) {
                                if (SecurityService.hasRight('controlling', 'manage')) {
                                    var html = `<button data-key='edit' class="btn btn-primary btn-xs btn-outline" type="button">
                                        <i class="fa fa-edit"></i> ${I18nService.getValue('编辑', 'compile')}</button>
                                        <button type="button" data-key="delete" class="btn btn-primary btn-xs list_btn btn-outline" style="margin-left: 5px">
                                        <i class="fa fa-trash"></i> ${I18nService.getValue('删除', 'delete')}</button>`;
                                    return html;
                                }
                            }
                        }]
                    };
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('.btn').data('key');
                        if (buttonKey === "edit") {
                            ctrl.toDetailPage(rowdata.id);
                        }
                        if (buttonKey === 'delete') {
                            ctrl.removeControl(rowdata);
                        }
                    });
                },
                toDetailPage: function (id) {
                    janus.goToMenuDetailByName('自动化规则', id);
                },
                removeControl: function (row) {
                    dialog.confirm(I18nService.getValue('确定删除', 'confirm_delete_controlling') + row.name + "？").on('success', function () {
                        http.post('controlling/remove', {
                            "controllingId": row.id
                        }).success(function () {
                            dialog.noty(I18nService.getValue('操作成功', 'operation_success'));
                            ctrl.refreshTable();
                        });
                    });
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                }
            });
            ctrl.initialize();
        }]);
});
