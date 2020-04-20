define([], function () {
    var app = angular.module('app');

    app.controller('DeviceClassifyController', ['$scope', 'DBUtils', 'dialog', 'http', 'util', "I18nService", "$element", 'janus',
        function ($scope, DBUtils, dialog, http, util, I18nService, $element, janus) {
            var ctrl = this;
            var viewCode_view_map = {};
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initListOption();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('button,a').data('key');
                        if (buttonKey === "delete") {
                            ctrl.deleteClassification(rowdata);
                        }
                        if (buttonKey === "alter") {
                            ctrl.alterClassification(rowdata.id);
                        }
                    });
                },
                alterClassification: function (id) {
                    janus.goToMenuDetailByName('设备类型', id);
                },
                deleteClassification: function (rowdata) {
                    dialog.confirm("确定删除此设备类型吗?删除后不可恢复").on("success", function () {
                        http.post("dataDefinition/deleteCls", {
                            clsCode: _.get(rowdata, "code", "")
                        }).success(function (result) {
                            if (result.success) {
                                dialog.noty("删除成功!");
                                ctrl.refreshTable();
                            }
                        });
                    });
                },
                addClassification: function (rowdata) {
                    var addDialog = dialog.show({
                        template: 'app_triton_device_classify_add',
                        width: 670,
                        data: {
                            entity: {
                                name: _.get(rowdata, "name", ""),
                                remark: _.get(rowdata, "remark", "")
                            },
                            rowdata: rowdata
                        },
                        title: I18nService.getValue(rowdata === undefined ? "添加" : "编辑", 'edit_device_classification'),
                        controller: "DeviceClassifyAddController",
                        controllerAs: "ctrl"
                    });
                    addDialog.on('hidden.bs.modal', function () {
                        ctrl.refreshTable();
                    });
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                },
                initListOption: function () {
                    ctrl.options = {
                        collection: 'deviceClassification',
                        filled: true,
                        columns: [{
                            name: '_id',
                            visible: false
                        }, {
                            name: "code",
                            visible: false
                        }, {
                            name: "appId",
                            visible: false
                        }, {
                            name: 'name',
                            title: '名称',
                            search: true,
                        }, {
                            name: 'view.viewName',
                            title: '关联设备可视化',
                            search: true
                        }, {
                            name: 'view.viewCode',
                            visible: false
                        }, {
                            name: 'remark',
                            title: '备注',
                            search: true
                        }, {
                            name: 'isapp',
                            title: '启动为应用',
                            render: function (data, type, row) {
                                if (!data) {
                                    return "否";
                                }
                                return "是";
                            }
                        }, {
                            name: 'do',
                            title: '操作',
                            orderable: false,
                            width: "280px",
                            render: function (data, type, row) {
                                let buttonHtml = `<button data-key='alter' class="btn btn-primary btn-xs btn-outline" type="button">
                                                    <i class="fa fa-edit"></i> 编辑
                                                  </button>
                                                  <button type="button" data-key="delete" class="btn btn-primary btn-xs btn-outline">
                                                    <i class="fa fa-trash"></i> 删除
                                                  </button>`;
                                if (row.appId) {
                                    buttonHtml = '';
                                }
                                return buttonHtml;
                            }
                        }]
                    }
                }
            });
            ctrl.initialize();
        }]);
});
