define([], function () {
    var app = angular.module('app');

    app.controller('DataMonitorListController', ['$scope', '$state', 'http', 'dialog', '$element', 'SecurityService', 'janus',
        function ($scope, $state, http, dialog, $element, SecurityService, janus) {
            var ctrl = this;

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initTableOption();
                    ctrl.bindEvent();
                },
                initTableOption: function () {
                    ctrl.options = {
                        collection: 'dataMonitor',
                        filled: true,
                        columns: [{
                            name: 'name',
                            title: '名称',
                            search: true,
                            orderable: true,
                            render: function (data, type, row) {
                                return `<a class="list_btn" data-key="edit" href="javascript:void(0);">${row.name}</a>`
                            }
                        }, {
                            name: 'tag',
                            title: '标签',
                            search: true,
                        }, {
                            name: '_id',
                            title: '操作',
                            orderable: false,
                            width: '200px',
                            render: function (data, type, row) {
                                if (SecurityService.hasRight('data_monitor_list', 'manage')) {
                                    var html = `<button data-key='edit' class="btn btn-primary btn-xs btn-outline list_btn" type="button">
                                        <i class="fa fa-edit"></i> 编辑</button>
                                        <button type="button" data-key="delete" class="btn btn-primary btn-xs list_btn btn-outline" style="margin-left: 5px">
                                        <i class="fa fa-trash"></i> 删除</button>`;
                                    return html;
                                }
                            }
                        }]
                    };
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('.list_btn').data('key');
                        if (buttonKey === "edit") {
                            ctrl.toDetailPage(rowdata.id);
                        }
                        if (buttonKey === 'delete') {
                            ctrl.removeControl(rowdata);
                        }
                    });
                },
                toDetailPage: function (id) {
                    janus.goToMenuDetailByName('监控规则', id);
                },
                removeControl: function (row) {
                    dialog.confirm('确定删除' + row.name + "？").on('success', function () {
                        http.post('dataMonitor/remove', {id: row.id}).success(function () {
                            dialog.noty('删除成功');
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
