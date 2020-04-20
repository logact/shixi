define([], function () {
    var app = angular.module('app');

    app.controller('ScrewListController', ['$scope', 'dialog', 'DBUtils', '$element', 'SecurityService',
        function ($scope, dialog, DBUtils, $element, SecurityService) {
        var ctrl = this;

        _.extend(ctrl, {
            initialize: function () {
                ctrl.initListOption();
                ctrl.bindEvent();
            },
            initListOption: function () {
                ctrl.options = {
                    collection: 'wrench_screw',
                    filled: true,
                    columns: [{
                        name: '_id',
                        visible: false
                    }, {
                        name: 'code',
                        title: '螺丝编号',
                        search: true
                    }, {
                        name: 'name',
                        title: '名称',
                        search: true,
                    }, {
                        name: 'standard',
                        title: '螺丝标准',
                        search: true,
                    }, {
                        name: 'length',
                        title: '螺丝长度',
                        search: true,
                        width: '100px'
                    }, {
                        name: 'size',
                        title: '大小',
                        search: true,
                        width: '100px'
                    }, {
                        name: 'pitch',
                        title: '螺距',
                        width: '100px'
                    }, {
                        name: 'material',
                        title: '材料'
                    }, {
                        name: 'do',
                        title: '操作',
                        orderable: false,
                        width: '150px',
                        render: function () {
                            if (SecurityService.hasRight('screw_list', 'manage')) {
                                return `<button data-key="editScrew" class="btn btn-primary btn-xs btn-outline" 
                                    type="button"><i class="fa fa-edit"></i> 编辑</button>
                                    <button type="button" data-key="deleteScrew" class="btn btn-primary btn-xs btn-outline" 
                                    ><i class="fa fa-trash"></i> 删除</button>`;
                            }
                        }
                    }]
                }
            },
            bindEvent: function () {
                $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                    var buttonKey = element.closest('.btn').data('key');
                    if (buttonKey === "deleteScrew") {
                        ctrl.deleteScrew(rowdata.id);
                    }
                    if (buttonKey === "editScrew") {
                        ctrl.editScrew(rowdata.id);
                    }
                });
            },
            deleteScrew: function (id) {
                dialog.confirm('确定删除螺丝？删除后不可恢复。').on('success', function () {
                    DBUtils.remove('wrench_screw', {id: id}).success(function () {
                        dialog.hideWaiting();
                        dialog.noty('删除成功');
                        ctrl.refreshTable();
                    });
                });
            },
            editScrew: function (id) {
                DBUtils.find('wrench_screw', {
                    id: id
                }).success(function (result) {
                    var entity = _.get(result, 'datas.result', {});
                    ctrl.addNewScrew(entity);
                });
            },
            addNewScrew: function (entity) {
                entity = entity || {};
                var addScrewDialog = dialog.show({
                    template: 'app_wrench_add_screw_template',
                    width: 1200,
                    title: '新增螺丝',
                    controller: 'AddScrewController',
                    controllerAs: 'ctrl',
                    data: {
                        entity: entity
                    }
                });

                addScrewDialog.on('hidden.bs.modal', function () {
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

    app.controller('AddScrewController', ['$scope', 'dialog', 'DBUtils', 'util',
        function ($scope, dialog, DBUtils, util) {
            var ctrl = this;
            var entity = $scope.entity;
            _.extend(ctrl, {
                initialize: function () {
                    var checkedMap = {
                        'code': '编号',
                        'name': '名称',
                        'length': '长度',
                        'size': '大小',
                        'pitch': '螺距',
                        'standard': '标准',
                        'material': '材料',
                        'torque': '用户扭矩'
                    };
                    $scope.$on('success', function (event, checkMessage) {
                        var error = false;
                        _.each(checkedMap, function (value, key) {
                            if (error === false) {
                                var fieldValue = _.get($scope.entity, key, '');
                                if (!fieldValue) {
                                    error = true;
                                    dialog.noty(`请输入螺丝${value}`);
                                    return false;
                                }
                            }
                        });
                        if (error === true) {
                            checkMessage.success = false;
                            return false;
                        }
                        ctrl.addConfig();
                    });
                },
                addConfig: function () {
                    DBUtils.save('wrench_screw', entity).success(function () {
                        dialog.hideWaiting();
                        dialog.noty('操作成功');
                    });
                }
            });
            ctrl.initialize();
        }]);

});