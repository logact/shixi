define([], function () {
    var app = angular.module('app');

    app.controller('DataMonitorHistoryController', ['$scope', '$state', 'http', 'dialog', '$element',
        function ($scope, $state, http, dialog, $element) {
            var ctrl = this;

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initTableOption();
                },
                initTableOption: function () {
                    ctrl.options = {
                        collection: 'messages',
                        filled: true,
                        query: {
                            type: 'DataMonitor'
                        },
                        columns: [{
                            name: 'create_date',
                            title: '触发时间',
                            search: true,
                            orderable: true
                        }, {
                            name: 'title',
                            title: '名称',
                            search: true,
                            orderable: true
                        }, {
                            name: 'content',
                            title: '内容',
                            search: true,
                            width: '40%'
                        }]
                    };
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                }
            });
            ctrl.initialize();
        }]);
});