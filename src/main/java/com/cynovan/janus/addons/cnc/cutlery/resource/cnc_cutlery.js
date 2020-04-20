define([], function () {
    var app = angular.module('app');

    app.controller('CutleryController', ['$scope', '$state', 'DBUtils', 'dialog', 'http', '$element', 'SecurityService', 'janus',
        function ($scope, $state, DBUtils, dialog, http, $element, SecurityService, janus) {
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
                initListOption: function () {
                    ctrl.options = {
                        collection: 'cutlery',
                        filled: true,
                        columns: [{
                            name: 'code',
                            title: '编号',
                            search: true,
                            render: function (data) {
                                return `<a data-key='detailKey' href="javascript:void(0);">${data}</a>`;
                            }
                        }, {
                            name: 'type',
                            title: '类型',
                            search: true
                        }, {
                            name: 'property',
                            title: '属性',
                            search: true
                        }, {
                            name: 'processing_times',
                            title: '标准加工次数',
                            search: true
                        }, {
                            name: 'num',
                            title: '数量',
                            search: true
                        }, {
                            name: 'total_processing_times',
                            title: '总可加工次数',
                            search: true
                        }, {
                            name: 'used_processing_times',
                            title: '已使用次数',
                            search: true
                        }, {
                            name: 'percentage',
                            title: '剩余百分比',
                            search: true
                        }, {
                            name: 'do',
                            title: '操作',
                            orderable: false,
                            render: function () {
                                if (SecurityService.hasRight('cnc_cutlery', 'manage')) {
                                    return `<button  data-key='cutleryEditBtn' class="btn btn-primary btn-xs btn-outline"
                                            type="button"><i class="fa fa-edit"></i> 编辑</button>
                                            <button data-key='cutleryDelBtn'  class="btn btn-primary btn-xs btn-outline"
                                            type="button"><i class="fa fa-trash"></i> 删除</button>`;
                                }
                            }
                        }]
                    }
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('button,a').data('key');
                        if (buttonKey === "detailKey") {
                            ctrl.addCutlery(rowdata.id);
                        }
                        if (buttonKey === "cutleryEditBtn") {
                            ctrl.addCutlery(rowdata.id);
                        }
                        if (buttonKey === "cutleryDelBtn") {
                            ctrl.showCutleryDel(rowdata.id);
                        }
                    });
                },
                addCutlery: function (id) {
                    id = id || 'add_cutlery';
                    janus.goToMenuDetailByName('刀具', id);
                },
                showCutleryDel: function (id) {
                    if (id) {
                        dialog.confirm('确定删除刀具？删除后不可恢复。').on('success', function () {
                            DBUtils.remove('cutlery', {id: id}).success(function () {
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

    app.controller('AddCutleryController', ['$scope', '$stateParams', 'DBUtils', 'dialog', '$state', 'util', 'janus',
        function ($scope, $stateParams, DBUtils, dialog, $state, util, janus) {
            var ctrl = this;
            $scope.entity = {};
            $scope.cutlery_title = '新增刀具';
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadData();
                    ctrl.autoCountPercentage();
                },
                processChange: function () {
                    $scope.$watch('entity.processing_times', _.debounce(function () {
                        var entity = $scope.entity;
                        var process = _.parseInt(entity.processing_times);
                        if (!entity.total_processing_times) {
                            entity.total_processing_times = process;
                            util.apply($scope);
                        }
                    }, 1000));
                },
                loadData: function () {
                    if ($stateParams.id !== 'add_cutlery') {
                        DBUtils.find('cutlery', {
                            '_id': $stateParams.id,
                        }).success(function (result) {
                            var entity = _.get(result, 'datas.result', {});
                            $scope.entity = entity;
                            $scope.cutlery_title = '刀具-' + entity.code;
                        });
                    }
                },
                autoCountPercentage: function () {
                    $scope.$watch('entity.used_processing_times + entity.total_processing_times', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                var entity = $scope.entity;
                                var used = entity.used_processing_times || 0;
                                var total = entity.total_processing_times || 0;
                                var percentage = (total - used) / total * 100;
                                if (_.isNaN(percentage) || percentage == Infinity) {
                                    percentage = '';
                                } else {
                                    percentage = percentage.toFixed(2) + '%';
                                }
                                $scope.entity.percentage = percentage;
                            }
                        }
                    });
                },
                createCutlery: function () {
                    var entity = $scope.entity;
                    var num = entity.num;
                    var total = entity.total_processing_times;
                    var used = entity.used_processing_times;
                    var process = entity.processing_times;
                    if (!entity.code) {
                        dialog.noty("请输入刀具编号");
                        return false;
                    }
                    if (!num || isNaN(num) || num < 0) {
                        dialog.noty("数量栏请输入正确的数字");
                        return false;
                    }
                    if (process && isNaN(process)) {
                        dialog.noty("标准加工次数请输入正确的数字");
                        return false;
                    }
                    if (total && isNaN(total)) {
                        dialog.noty("总可加工次数请输入正确的数字");
                        return false;
                    }
                    if (used && isNaN(used)) {
                        dialog.noty("已使用次数请输入正确的数字");
                        return false;
                    }
                    if (_.parseInt(used) > _.parseInt(total)) {
                        dialog.noty("已使用次数不能大于总可加工次数");
                        return false;
                    }

                    dialog.waiting('新建刀具...');
                    DBUtils.save('cutlery', entity).success(function (result) {
                        dialog.hideWaiting();
                        dialog.noty('操作成功');
                        if (result.datas.entity.id) {
                            janus.goToMenuDetailByName('刀具', result.datas.entity.id);

                        }
                    });
                },
                back: function () {
                    janus.goToMenuByName('刀具');
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                }
            });

            ctrl.initialize();
        }])
    ;
})
;
