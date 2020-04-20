define([], function () {
    var app = angular.module('app');

    app.controller('ConfigListController', ['$scope', 'dialog', 'DBUtils', '$element', function ($scope, dialog, DBUtils, $element) {
        var ctrl = this;

        _.extend(ctrl, {
            initialize: function () {
                ctrl.initListOption();
                ctrl.bindEvent();
            },
            initListOption: function () {
                ctrl.options = {
                    collection: 'wrench_craftsConfig',
                    filled: true,
                    columns: [{
                        name: '_id',
                        visible: false
                    }, {
                        name: 'code',
                        title: '配置ID',
                        search: true
                    }, {
                        name: 'name',
                        title: '配置名称',
                        search: true,
                    }, {
                        name: 'stress',
                        title: '应力',
                        search: true
                    }, {
                        name: 'step',
                        title: '拧紧次数',
                        orderable: false,
                    }, {
                        name: 'step_moment',
                        title: '拧紧力矩'
                    }, {
                        name: 'do',
                        title: '操作',
                        width: '120px',
                        orderable: false,
                        render: function () {
                            return `<button data-key="editConfig" class="btn btn-primary btn-xs btn-outline" type="button"><i class="fa fa-edit"></i> 编辑</button><button type="button" data-key="deleteConfig" class="btn btn-primary btn-xs btn-outline" style="margin-left: 10px;"><i class="fa fa-trash"></i> 删除</button>`;
                        }
                    }]
                }
            },
            bindEvent: function () {
                $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                    var buttonKey = element.closest('.btn').data('key');
                    if (buttonKey === "deleteConfig") {
                        ctrl.deleteConfig(rowdata.id);
                    }
                    if (buttonKey === "editConfig") {
                        ctrl.editConfig(rowdata.id);
                    }
                });
            },
            deleteConfig: function (id) {
                dialog.confirm('确定删除配置？删除后不可恢复。').on('success', function () {
                    DBUtils.remove('wrench_craftsConfig', {id: id}).success(function () {
                        dialog.hideWaiting();
                        dialog.noty('删除成功');
                        ctrl.refreshTable();
                    });
                });
            },
            editConfig: function (id) {
                DBUtils.find('wrench_craftsConfig', {
                    id: id
                }).success(function (result) {
                    var entity = _.get(result, 'datas.result', {});
                    ctrl.addNewConfig(entity);
                });
            },
            addNewConfig: function (entity) {
                entity = entity || {};
                var addConfigDialog = dialog.show({
                    template: 'app_wrench_add_config_template',
                    width: 1200,
                    title: '新增配置',
                    controller: 'AddConfigController',
                    controllerAs: 'ctrl',
                    data: {
                        entity: entity
                    }
                });
                addConfigDialog.on('hidden.bs.modal', function () {
                    ctrl.refreshTable();
                });
            },
            refreshTable: function () {
                var table = $($element).find('.c-table');
                table.DataTable().ajax.reload();
            }
        });
        ctrl.initialize();
    }]);

    app.controller('AddConfigController', ['$scope', 'dialog', 'DBUtils', 'util',
        function ($scope, dialog, DBUtils, util) {
            var ctrl = this;
            var entity = $scope.entity;

            if (!entity.code) {
                entity.code = 'C-' + util.uuid(8)
            }
            _.extend(ctrl, {
                initialize: function () {
                    $scope.$on('success', function (event, checkMessage) {
                        if (!entity.name) {
                            dialog.noty('请输入配置名称');
                            checkMessage.success = false;
                            return false;
                        }
                        if (!entity.step) {
                            dialog.noty('请输入拧紧次数');
                            checkMessage.success = false;
                            return false;
                        }
                        if (!entity.stress) {
                            dialog.noty('请输入应力');
                            checkMessage.success = false;
                            return false;
                        }
                        ctrl.addConfig();
                    });
                },
                addConfig: function () {
                    DBUtils.save('wrench_craftsConfig', entity).success(function () {
                        dialog.hideWaiting();
                        dialog.noty('操作成功');
                    });
                }
            });
            ctrl.initialize();
        }]);

});