define([], function () {
    var app = angular.module('app');

    app.controller('ComponentController', ['$scope', '$state', 'DBUtils', 'dialog', '$element', 'SecurityService', 'janus',
        function ($scope, $state, DBUtils, dialog, $element, SecurityService, janus) {
            var ctrl = this;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initListOption();
                    ctrl.bindEvent();
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('button,a').data('key');
                        if (buttonKey === "componentEditBtn") {
                            ctrl.showComponentDetail(rowdata.id);
                        }
                        if (buttonKey === "componentDelBtn") {
                            ctrl.showComponentDel(rowdata.id);
                        }
                        if (buttonKey === "componentProcedure") {
                            ctrl.checkComponentProcedure(rowdata.id);
                        }
                    });
                },
                checkComponentProcedure: function (id) {
                    janus.goToMenuDetailByName('零件', id);
                },
                initListOption: function () {
                    ctrl.options = {
                        collection: 'component',
                        filled: true,
                        columns: [{
                            name: 'component_name',
                            title: '零件名称',
                            search: true,
                            render: function (data) {
                                return `<a data-key='componentProcedure' href="javascript:void(0);" title="查看该零件的工序">${data}</a>`;
                            }
                        }, {
                            name: 'code',
                            title: '编号',
                            search: true,
                        }, {
                            name: 'description',
                            title: '规格说明',
                            search: true
                        }, {
                            name: 'client',
                            title: '客户信息',
                            search: true
                        }, {
                            name: 'do',
                            title: '操作',
                            orderable: false,
                            render: function () {
                                if (SecurityService.hasRight('cnc_component', 'manage')) {
                                    return `<button  data-key='componentEditBtn' class="btn btn-primary btn-xs btn-outline"
                                            type="button"><i class="fa fa-edit"></i> 编辑</button>
                                            <button data-key='componentDelBtn'  class="btn btn-primary btn-xs btn-outline"
                                            type="button"><i class="fa fa-trash"></i> 删除</button>`;
                                }
                            }
                        }]
                    }
                },
                showComponentDetail: function (id) {
                    if (id) {
                        DBUtils.find('component', {
                            id: id
                        }).success(function (result) {
                            var entity = _.get(result, 'datas.result', {});
                            var editComponent = dialog.show({
                                template: 'cns_add_component_template',
                                width: 1200,
                                title: false,
                                controller: 'ComponentAddController',
                                controllerAs: 'ctrl',
                                data: {
                                    entity: entity,
                                    trigger: {
                                        onSuccess: function () {
                                            ctrl.refreshTable();
                                            editComponent.modal('hide');
                                        },
                                        onFail: function () {
                                        }
                                    }
                                }
                            });
                        });
                    } else {
                        dialog.show({
                            template: 'cns_add_component_template',
                            width: 1200,
                            title: false,
                            controller: 'ComponentAddController',
                            controllerAs: 'ctrl',
                            data: {
                                entity: {},
                                trigger: {
                                    onSuccess: function () {
                                        ctrl.refreshTable();
                                    },
                                    onFail: function () {
                                    }
                                }
                            }
                        });
                    }

                },
                showComponentDel: function (id) {
                    if (id) {
                        dialog.confirm('确定删除该零件？删除后不可恢复。').on('success', function () {
                            DBUtils.remove('component', {id: id}).success(function () {
                                dialog.hideWaiting();
                                dialog.noty('删除成功');
                                ctrl.refreshTable();
                            });
                        });
                    }
                }
            });
            ctrl.initialize();
        }
    ]);
    app.controller('ComponentAddController', ['$scope', 'DBUtils', 'dialog', function ($scope, DBUtils, dialog) {
        var ctrl = this;
        var entity = $scope.entity;
        _.extend(ctrl, {
            initialize: function () {
                $scope.$on('success', function (event, checkMessage) {
                    if (!entity.component_name) {
                        dialog.noty("请输入零件名称");
                        checkMessage.success = false;
                        return false;
                    } else if (!entity.code) {
                        dialog.noty("请输入编号");
                        checkMessage.success = false;
                        return false;
                    }
                    ctrl.createComponent();
                });
            },
            createComponent: function () {
                dialog.waiting('创建零件...');
                DBUtils.save('component', entity).success(function () {
                    dialog.hideWaiting();
                    dialog.noty('操作成功');
                    if (_.isFunction($scope.trigger.onSuccess)) {
                        $scope.trigger.onSuccess.call();
                    }
                });
            },
        });
        ctrl.initialize();
    }]);
    app.controller('ComponentProcedureController', ['$scope', '$stateParams', 'DBUtils', 'dialog', '$state', 'util', 'AppComponent', 'janus',
        function ($scope, $stateParams, DBUtils, dialog, $state, util, AppComponent, janus) {
            var ctrl = this;
            $scope.procedure = [];
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadData();
                },
                loadData: function () {
                    if ($stateParams.id) {
                        DBUtils.find('component', {
                            id: $stateParams.id,
                        }).success(function (result) {
                            $scope.entity = _.get(result, 'datas.result', {});
                            var entity = $scope.entity;
                            $scope.component_name = '零件-' + entity.component_name;
                            if (entity.procedure) {
                                $scope.procedure = entity.procedure;
                                _.each($scope.procedure, function (item, index) {
                                    setTimeout(function () {
                                        AppComponent.ncfileselect($('#ncfile_' + index), item.fileId).progress(function (bind) {
                                            item.fileId = bind.id;
                                        })
                                    }, 100);
                                })
                            } else {
                                dialog.noty('该零件下暂无工序')
                            }
                        });
                    }
                },
                back: function () {
                    janus.goToMenuByName('零件');
                },
                addProcedure: function () {
                    $scope.procedure.push({});
                    util.apply($scope);
                    setTimeout(function () {
                        ctrl.initNcfileSelect($scope.procedure.length);
                    }, 100);

                },
                initNcfileSelect: function (index) {
                    var item = $scope.procedure[index - 1];
                    AppComponent.ncfileselect($('#ncfile_' + (index - 1)), item.fileId).progress(function (bind) {
                        item.fileId = bind.id;
                    });
                },
                saveProcedure: function () {
                    var flag = true;
                    _.each($scope.procedure, function (item) {
                        if (!item.fileId) {
                            flag = false;
                        }
                    });
                    if (!flag) {
                        dialog.noty('请选择nc文件');
                        return;
                    }
                    var entity = $scope.entity;
                    if (!entity.component_name) {
                        dialog.noty('零件名称不能为空');
                        return false;
                    }
                    if (!entity.code) {
                        dialog.noty('零件名称不能为空');
                        return false;
                    }
                    DBUtils.update('component', {
                        _id: $stateParams.id
                    }, {
                        $set: {
                            component_name: entity.component_name,
                            code: entity.code,
                            client: entity.client,
                            description: entity.description,
                            procedure: $scope.procedure
                        }
                    }).success(function () {
                        dialog.noty('保存成功')
                    });

                },
                delThisProcedure: function (index) {
                    $scope.procedure.splice(index, 1);
                },

                rowUp: function (index) {
                    if (index !== 0) {
                        var temp = $scope.procedure[index];
                        var temp1 = $scope.procedure[index - 1];
                        $scope.procedure[index] = temp1;
                        $scope.procedure[index - 1] = temp;

                        var originEle = $('#ncfile_' + index).find('.ncfileselect');
                        var destEle = $('#ncfile_' + (index - 1)).find('.ncfileselect');

                        originEle.val(temp1.fileId);
                        destEle.val(temp.fileId);

                        originEle.trigger("chosen:updated");
                        destEle.trigger("chosen:updated");


                    } else {
                        dialog.noty('无法上移，当前工序为第一道工序');
                    }
                },
                rowDown: function (index) {
                    if (index !== $scope.procedure.length - 1) {
                        var temp = $scope.procedure[index];
                        var temp1 = $scope.procedure[index + 1]
                        $scope.procedure[index] = temp1;
                        $scope.procedure[index + 1] = temp;

                        var originEle = $('#ncfile_' + index).find('.ncfileselect');
                        var destEle = $('#ncfile_' + (index + 1)).find('.ncfileselect');

                        originEle.val(temp1.fileId);
                        destEle.val(temp.fileId);

                        originEle.trigger("chosen:updated");
                        destEle.trigger("chosen:updated");

                    } else {
                        dialog.noty('无法下移，当前工序为最后一道工序');
                    }
                }
            });
            ctrl.initialize();
        }]);
});
