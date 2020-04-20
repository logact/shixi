define([], function () {
    var app = angular.module('app');

    app.controller('MaterialListController', ['$scope', 'dialog', 'DBUtils', '$element', 'SecurityService',
        function ($scope, dialog, DBUtils, $element,SecurityService) {
        var ctrl = this;

        _.extend(ctrl, {
            initialize: function () {
                ctrl.initListOption();
                ctrl.bindEvent();
            },
            initListOption: function () {
                ctrl.options = {
                    collection: 'wrench_material',
                    filled: true,
                    columns: [{
                        name: '_id',
                        visible: false
                    }, {
                        name: 'code',
                        title: '材料编号',
                        search: true
                    }, {
                        name: 'name',
                        title: '材料名称',
                        search: true,
                    }, {
                        name: 'PoissonRatio',
                        title: '泊松比',
                        search: true
                    }, {
                        name: 'ShearModulus',
                        title: '抗剪模量'
                    }, {
                        name: 'do',
                        title: '操作',
                        width: '150px',
                        orderable: false,
                        render: function () {
                            if (SecurityService.hasRight('material_list', 'manage')) {
                                return `<button data-key="editMaterial" class="btn btn-primary btn-xs btn-outline" 
                                    type="button"><i class="fa fa-edit"></i> 编辑</button>
                                    <button type="button" data-key="deleteMaterial" class="btn btn-primary btn-xs btn-outline" 
                                    ><i class="fa fa-trash"></i> 删除</button>`;
                            }
                        }
                    }]
                }
            },
            bindEvent: function () {
                $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                    var buttonKey = element.closest('.btn').data('key');
                    if (buttonKey === "deleteMaterial") {
                        ctrl.deleteMaterial(rowdata.id);
                    }
                    if (buttonKey === "editMaterial") {
                        ctrl.editMaterial(rowdata.id);
                    }
                });
            },
            deleteMaterial: function (id) {
                dialog.confirm('确定删除材料？删除后不可恢复。').on('success', function () {
                    DBUtils.remove('material', {id: id}).success(function () {
                        dialog.hideWaiting();
                        dialog.noty('删除成功');
                        ctrl.refreshTable();
                    });
                });
            },
            editMaterial: function (id) {
                DBUtils.find('wrench_material', {
                    id: id
                }).success(function (result) {
                    var entity = _.get(result, 'datas.result', {});
                    ctrl.addNewMaterial(entity);
                });
            },
            addNewMaterial: function (entity) {
                entity = entity || {}
                var addMaterialDialog = dialog.show({
                    template: 'app_wrench_add_material_template',
                    width: 1200,
                    title: '新增材料',
                    controller: 'AddMaterialController',
                    controllerAs: 'ctrl',
                    data: {
                        entity: entity
                    }
                });

                addMaterialDialog.on('hidden.bs.modal', function () {
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

    app.controller('AddMaterialController', ['$scope', 'dialog', 'DBUtils', 'util',
        function ($scope, dialog, DBUtils, util) {
            var ctrl = this;
            var entity = $scope.entity;

            _.extend(ctrl, {
                initialize: function () {
                    var checkedMap = {
                        'code': '编号',
                        'name': '名称',
                        'PoissonRatio': '泊松比',
                        'ShearModulus': '抗剪模量',
                        'YieldStrength': '屈服强度',
                        'SpecificHeat': '比热',
                        'ElasticModulus': '弹性模量',
                        'MassDensity': '质量密度',
                        'TensionStrength': '张力强度',
                        'ThermalExpansionCoefficient': '热扩张系数',
                        'ThermalConductivity': '热导率'
                    };
                    $scope.$on('success', function (event, checkMessage) {
                        var error = false;
                        _.each(checkedMap, function (value, key) {
                            if (error === false) {
                                var fieldValue = _.get($scope.entity, key, '');
                                if (!fieldValue) {
                                    error = true;
                                    dialog.noty(`请输入材料${value}`);
                                    return false;
                                }
                            }
                        });
                        if (error === true) {
                            checkMessage.success = false;
                            return false;
                        }
                        ctrl.addMaterial();
                    });
                },
                addMaterial: function () {
                    DBUtils.save('wrench_material', entity).success(function () {
                        dialog.hideWaiting();
                        dialog.noty('操作成功');
                    });
                }
            });
            ctrl.initialize();
        }]);

});