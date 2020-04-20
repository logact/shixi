define([], function () {
    var app = angular.module('app');

    app.controller('RearMaintenanceController', ['$scope', '$state', 'DBUtils', 'dialog', 'http', '$element', 'SecurityService',
        function ($scope, $state, DBUtils, dialog, http, $element, SecurityService) {
            var ctrl = this;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initListOption();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('.btn,a').data('key');
                        if (buttonKey === "detailKey") {
                            ctrl.showMaintenanceDetail(rowdata.id);
                        } else if (buttonKey === "maintenanceEditBtn") {
                            ctrl.showMaintenanceDetail(rowdata.id);
                        } else if (buttonKey === "maintenanceDelBtn") {
                            ctrl.showMaintenanceDel(rowdata.id);
                        }
                    });
                    $scope.$watch('entity.image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('maintenance', {
                                    uuid: $scope.entity.id
                                }, {
                                    $set: {
                                        'image_id': newValue
                                    }
                                }).success(function () {
                                    dialog.noty('操作成功');
                                });
                            }
                        }
                    });
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                },
                initListOption: function () {
                    ctrl.options = {
                        collection: 'maintenance',
                        filled: true,
                        columns: [{
                            name: 'device',
                            title: '设备名称',
                            width: '20%',
                            search: true,
                            render: function (data, type, row) {
                                if (SecurityService.hasRight('cnc_maintenance', 'manage')) {
                                    return `<a data-key='detailKey' href="javascript:void(0);">${data}</a>`;
                                } else {
                                    return `<span data-key='detailKey'>${data}</span>`;
                                }
                            }
                        }, {
                            name: '_id',
                            visible: false
                        }, {
                            name: 'status',
                            title: '维保状态',
                            search: true,
                            width: '10%',
                            render: function (data, type, row) {
                                var statusIcon = '';
                                if (row.status === '维保开始') {
                                    statusIcon = 'fa fa-play maintenance-start';
                                } else if (row.status === '维保暂停') {
                                    statusIcon = 'fa fa-pause maintenance-pause';
                                } else {
                                    statusIcon = 'fa fa-stop maintenance-stop'
                                }
                                return `<i class="${statusIcon}"></i>`;
                            }
                        }, {
                            name: 'result',
                            title: '维保结果',
                            width: '10%',
                            search: true
                        }, {
                            name: 'user_name',
                            title: '维保人员',
                            width: '20%',
                            search: true
                        }, {
                            name: 'datetime',
                            title: '维保日期',
                            search: true
                        }, {
                            name: 'next_datetime',
                            title: '下次维保日期',
                            search: true
                        }, {
                            name: 'do',
                            title: '操作',
                            orderable: false,
                            render: function () {
                                if (SecurityService.hasRight('cnc_maintenance', 'manage')) {
                                    return `<button  data-key='maintenanceEditBtn' class="btn btn-primary btn-xs btn-outline"
                                            type="button"><i class="fa fa-edit"></i> 编辑</button>
                                            <button data-key='maintenanceDelBtn'  class="btn btn-primary btn-xs btn-outline"
                                            type="button"><i class="fa fa-trash"></i> 删除</button>`;
                                }
                            }
                        }]
                    }
                },
                showMaintenanceDetail: function (id) {
                    if (id) {
                        DBUtils.find('maintenance', {
                            id: id
                        }).success(function (result) {
                            var entity = _.get(result, 'datas.result', {});
                            var editMaintenance = dialog.show({
                                template: 'rear_setting_add_maintenance_template',
                                width: 1200,
                                title: false,
                                controller: 'RearMaintenanceAddController',
                                controllerAs: 'ctrl',
                                data: {
                                    entity: entity,
                                    trigger: {
                                        onSuccess: function (result) {
                                            // 添加成功触发
                                            ctrl.refreshTable();
                                            editMaintenance.modal('hide');
                                        },
                                        onFail: function () {
                                            // 添加失败触发
                                        }
                                    }
                                }
                            });
                        });
                    } else {
                        /**
                         * 获取下一个月
                         *
                         * @date 格式为yyyy-mm-dd的日期，如：2014-01-25
                         */
                        dialog.show({
                            template: 'rear_setting_add_maintenance_template',
                            width: 1200,
                            title: false,
                            controller: 'RearMaintenanceAddController',
                            controllerAs: 'ctrl',
                            data: {
                                entity: {
                                    status: '维保开始',
                                    datetime: Date.today().toString("yyyy-MM-dd"),
                                    next_datetime: Date.today().month(1).toString("yyyy-MM-dd")
                                },
                                trigger: {
                                    onSuccess: function (result) {
                                        // 添加成功触发
                                        ctrl.refreshTable();
                                    },
                                    onFail: function () {
                                        // 添加失败触发
                                    }
                                }
                            }
                        });
                    }

                },
                showMaintenanceDel: function (id) {
                    if (id) {
                        dialog.confirm('确定删除维保？删除后不可恢复。').on('success', function () {
                            DBUtils.remove('maintenance', {id: id}).success(function () {
                                dialog.hideWaiting();
                                dialog.noty('删除成功');
                                ctrl.refreshTable();
                            });
                        });
                    }
                }
            });
            ctrl.initialize();
        }]);


    app.controller('RearMaintenanceAddController', ['$scope', 'DBUtils', 'dialog', 'http', 'util', '$timeout', 'AppComponent', function ($scope, DBUtils, dialog, http, util, $timeout, AppComponent) {
        var ctrl = this;
        var entity = $scope.entity;

        _.extend(ctrl, {
            initialize: function () {
                ctrl.maintenance_status = [{
                    id: '维保开始',
                    name: '维保开始'
                }, {
                    id: '维保暂停',
                    name: '维保暂停'
                }, {
                    id: '维保完成',
                    name: '维保完成'
                }];
                ctrl.result = [{
                    id: '',
                    name: ''
                }, {
                    id: '良好',
                    name: '良好'
                }, {
                    id: '损坏',
                    name: '损坏'
                }, {
                    id: '报废',
                    name: '报废'
                }];
                $timeout(function () {
                        AppComponent.deviceselect($('#selectRobotBox'), {'cnc.show': true}).progress(function (bind) {
                            entity.device = bind.deviceName;
                        });
                    }
                    , 300);

                $scope.$on('success', function (event, checkMessage) {
                    if (!entity.device) {
                        dialog.noty("请选择一个设备");
                        checkMessage.success = false;
                        return false;
                    } else if (!entity.user_name) {
                        dialog.noty("请输入维保人员");
                        checkMessage.success = false;
                        return false;
                    }
                    ctrl.createMaintenance();
                });
            },
            createMaintenance: function () {
                dialog.waiting('创建维保...');
                DBUtils.save('maintenance', entity).success(function () {
                    dialog.hideWaiting();
                    dialog.noty('操作成功');
                    if (_.isFunction($scope.trigger.onSuccess)) {
                        $scope.trigger.onSuccess.call();
                    }
                });
            },
            refreshTable: function () {
                var table = $($element).find('.c-table');
                table.DataTable().ajax.reload();
            },
            changeStatus: function (name) {
                if (name === '维保完成' && !entity.result) {
                    dialog.noty('请选择维保结果');
                } else {
                    DBUtils.update('maintenance', {
                        id: entity.id
                    }, {
                        $set: {
                            'status': name,
                        }
                    }).success(function () {
                        dialog.noty('操作成功');
                        if (_.isFunction($scope.trigger.onSuccess)) {
                            $scope.trigger.onSuccess.call();
                            ctrl.refreshTable();
                        }
                    });
                }
            }
        });
        ctrl.initialize();
    }]);
});