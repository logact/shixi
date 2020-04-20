define([], function () {

    var app = angular.module('app');

    app.controller('MessageCenterController', ['$scope', '$rootScope', '$element', 'database', 'dialog', '$state', 'I18nService', 'janus', function ($scope, $rootScope, $element, database, dialog, $state, I18nService, janus) {
        var ctrl = this;
        $scope.list = [];

        _.extend(ctrl, {
            init: function () {
                ctrl.bindEvent();
                ctrl.initListOptions();
            },
            refreshTable: function () {
                var table = $($element).find('.c-table');
                table.DataTable().ajax.reload();
            },
            bindEvent: function () {
                $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                    var key = element.closest('a').data('key');
                    if (key === 'show-message') {
                        janus.goToMenuDetailByName('消息中心', rowdata.id);
                    }
                });
            },
            initListOptions: function () {
                $scope.options = {
                    stateSave: false,
                    stateSaveCallback: function (settings, data) {
                        database.set('dtSettings-messageCenter', data);
                    },
                    stateLoadCallback: function () {
                        var dtSettings = database.get('dtSettings-messageCenter');
                        if (dtSettings) {
                            return dtSettings;
                        } else {
                            return null;
                        }
                    },
                    collection: 'messages',
                    filled: true,
                    aaSorting: [[0, "asc"]],
                    columns: [{
                        name: '_id',
                        visible: false
                    }, {
                        name: 'title',
                        title: I18nService.getValue('标题', 'title'),
                        width: '70%',
                        render: function (data, type, row) {
                            return `<a class="message_item" data-key="show-message"><span class="info-circle"></span><div class="text-overflow-ellipsis" ><span style="margin-right: 16px;font-weight: bold;">${row.title ? '[' + row.title + ']' : '[未定类型]'}</span><span>${row.content}</span></div></a>`;
                        }
                    }, {
                        name: 'content',
                        visible: false,
                        search: true
                    }, {
                        name: 'create_date',
                        title: I18nService.getValue('时间', 'time'),
                        search: true,
                        width: '20%',
                        render: function (data, type, row) {
                            return `<a data-key="show-message"><div style="color: #333333;cursor:pointer">${row.create_date ? row.create_date.substring(0, 19) : ''}<i class="fa fa-chevron-right" style="float: right;margin:3px 12px;color: #488eff;"></i></div></a>`
                        }
                    }, {
                        name: 'read',
                        visible: false
                    }, {
                        name: 'source',
                        visible: false
                    }]
                };
            }
        });
        ctrl.init();
    }]);
});