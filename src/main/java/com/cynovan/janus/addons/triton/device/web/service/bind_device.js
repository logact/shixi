define([], function () {
    var app = angular.module('cnv.binddevice.service', ['ngResource']);

    app.service('BindDevice', ['dialog', 'I18nService', function (dialog, I18nService) {
        var service = {
            bind: function (bindKey) {
                var deferred = $.Deferred();
                var bindDialog = dialog.show({
                    title: I18nService.getValue('设备绑定', 'device.bind'),
                    template: 'bind_device_service_template',
                    width: 1200,
                    controller: 'BindDeviceToController',
                    controllerAs: 'ctrl',
                    buttons: {},
                    data: {
                        bindKey: bindKey
                    }
                });

                bindDialog.on('hidden.bs.modal', function () {
                    deferred.resolve();
                });

                return deferred;
            }
        };
        return service;
    }]);

    app.controller('BindDeviceToController', ['$scope', 'DBUtils', 'dialog', 'http', 'util', '$element', 'I18nService',
        function ($scope, DBUtils, dialog, http, util, $element, I18nService) {
            var bindKey = $scope.bindKey;

            var ctrl = this;

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initOptions();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('.btn').data('key');
                        if (buttonKey === "unbind") {
                            ctrl.updateBind(rowdata.id, false);
                        } else if (buttonKey === 'bind') {
                            ctrl.updateBind(rowdata.id, true);
                        }
                    });
                },
                updateBind: function (deviceId, updateValue) {
                    var update = {'$set': {}};
                    _.set(update, `$set.${bindKey}`, updateValue);
                    DBUtils.update('device', {
                        id: deviceId
                    }, update).success(function () {
                        ctrl.refreshTable();
                        dialog.noty(I18nService.getValue('操作成功', 'operation_success'));
                    });
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                },
                initOptions: function () {
                    ctrl.options = {
                        collection: 'device',
                        columns: [{
                            name: '_id',
                            visible: false
                        }, {
                            name: 'online',
                            title: I18nService.getValue('联网状态', 'link_status'),
                            width: '100px',
                            targets: 0,
                            orderable: true,
                            render: function (data, type, row) {
                                var cls = row.online.toString() === 'true' ? 'active' : '';
                                return `<span class="device_online_state ${cls}" id="device_online_state_${row.id}"></span>`;
                            }
                        }, {
                            name: 'uuid',
                            title: I18nService.getValue('序列号', 'device.uuid'),
                            search: true,
                            width: '25%'
                        }, {
                            name: 'baseInfo.name',
                            title: I18nService.getValue('设备名称', 'device.name'),
                            width: '20%',
                            search: true
                        }, {
                            name: 'tag',
                            title: I18nService.getValue('设备标签', 'device.tag'),
                            search: true
                        }, {
                            name: bindKey,
                            title: I18nService.getValue('绑定为机台', 'device.bind.machine'),
                            render: function (data, type, row) {
                                if (data) {
                                    return `<button class="btn btn-default btn-xs" data-key="unbind" type="button"><i class="fa fa-times"></i>${I18nService.getValue('取消绑定', 'device.bind.cancel')}</button>`;
                                } else {
                                    return `<button class="btn btn-success btn-xs" data-key="bind" type="button"><i class="fa fa-check"></i>${I18nService.getValue('绑定为机台', 'device.bind.machine')}</button>`;
                                }
                            }
                        }]
                    }
                }
            });
            ctrl.initialize();
        }]);
});