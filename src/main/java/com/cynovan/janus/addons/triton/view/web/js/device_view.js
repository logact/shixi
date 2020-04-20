define([], function () {
    var app = angular.module('app');

    app.controller('DeviceViewController', ['$scope', 'DBUtils', 'dialog', 'http', 'util', "I18nService", "$element",
        function ($scope, DBUtils, dialog, http, util, I18nService, $element) {
            var ctrl = this;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initListOption();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('button,a').data('key');
                        if (buttonKey === "delete") {
                            ctrl.deleteView(rowdata);
                        } else if (buttonKey === "alter") {
                            ctrl.alterDeviceView(rowdata);
                        } else if (buttonKey === 'design') {
                            ctrl.design(rowdata);
                        } else if (buttonKey === 'preview') {
                            ctrl.preview(rowdata);
                        }else if(buttonKey === 'copy'){
                            ctrl.copyView(rowdata);
                        }
                    });
                },
                design: function (row) {
                    window.open('monitor_developer/?id=' + row.id, "_blank");
                },
                preview: function (row) {
                    window.open('monitor_developer/preview?id=' + row.id, "_blank");
                },
                deleteView: function (rowdata) {
                    dialog.confirm("确定删除此设备可视化吗?删除后不可恢复").on("success", function () {
                        http.post("deviceView/deleteView", {
                            viewCode: rowdata.code,
                            clsCode: _.get(rowdata, "classification.classificationCode", "")
                        }).success(function (result) {
                            if (result.success) {
                                dialog.noty("删除成功!");
                                ctrl.refreshTable();
                            }
                        });
                    });
                },
                alterDeviceView: function (rowdata) {
                    var dialogElement = dialog.show({
                        template: 'app_triton_device_view_add',
                        width: 700,
                        data: {
                            entity: {
                                name: _.get(rowdata, "name", ""),
                                remark: _.get(rowdata, "remark", ""),
                                classification: _.get(rowdata, "classification", {}),
                                code: _.get(rowdata, "code", "")
                            }
                        },
                        title: I18nService.getValue(rowdata === undefined ? "创建设备可视化" : '编辑设备可视化', 'edit_device_view'),
                        controller: ["$scope", function (dialogScope) {
                            /*filter 为了不显示设备视图app添加的设备分类*/
                            dialogScope.deviceClsQuery = {
                                value: {},
                                filter: {
                                    appId: null
                                },
                                projection: {
                                    _id: 1,
                                    name: 1,
                                    code: 1
                                }
                            };
                            dialogScope.deviceClsQuery.value = {
                                code: _.get(dialogScope, "entity.classification.classificationCode"),
                                name: _.get(dialogScope, "entity.classification.classificationName")
                            };
                            dialogScope.$watch("deviceClsQuery.value", function (checked_cls) {
                                let entity_cls = {};
                                let cls_code = _.get(checked_cls, "code", "");
                                if (!_.isEmpty(cls_code)) {
                                    entity_cls.classificationCode = cls_code;
                                    entity_cls.classificationName = _.get(checked_cls, "name");
                                }
                                _.set(dialogScope.entity, "classification", entity_cls);
                            });
                            dialogScope.$on('success', function (event, checkMessage) {
                                let name = _.get(dialogScope, "entity.name", "");
                                if (_.isEmpty(name)) {
                                    checkMessage.success = false;
                                    dialog.noty("请输入名称");
                                    return;
                                }
                                http.post("deviceView/saveView", {
                                    entity: JSON.stringify(dialogScope.entity),
                                    id: _.get(rowdata, "id", "")
                                }).success(function (result) {
                                    if (result.success) {
                                        dialog.noty("操作成功!");
                                    } else {
                                        dialog.noty(result.messages[0]);
                                    }
                                    ctrl.refreshTable();
                                });
                            });
                        }]
                    });
                    dialogElement.on('hidden.bs.modal', function () {
                        ctrl.refreshTable();
                    });
                },
                copyView:function(rowdata){
                    http.post("deviceView/copyView",{
                        id:rowdata.id
                    }).success(function (result) {
                        dialog.noty("复制成功");
                        ctrl.refreshTable();
                    });
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                },
                initListOption: function () {
                    ctrl.options = {
                        collection: 'deviceView',
                        filled: true,
                        columns: [{
                            name: '_id',
                            visible: false
                        }, {
                            name: 'code',
                            visible: false
                        }, {
                            name: 'appId',
                            visible: false
                        }, {
                            name: 'name',
                            title: '名称',
                            search: true,
                        }, {
                            name: "classification.classificationName",
                            title: "关联设备类型",
                            search: true
                        }, {
                            name: "classification.classificationCode",
                            visible: false
                        }, {
                            name: 'create_time',
                            title: '创建时间',
                            search: true,
                            width: "300px"
                        }, {
                            name: 'remark',
                            title: '备注',
                            search: true
                        }, {
                            name: 'do',
                            title: '操作',
                            width: "320px",
                            orderable: false,
                            render: function (data, type, row) {
                                let buttonHtml = `<button data-key='alter' class="btn btn-primary btn-xs btn-outline" type="button"><i class="fa fa-edit"></i> 编辑</button>
                                        <button type="button" data-key="design" class="btn btn-primary btn-xs btn-outline"><i class="fa fa-magic"></i> 设计</button>
                                        <button type="button" data-key="preview" class="btn btn-primary btn-xs btn-outline"><i class="fa fa-bolt"></i> 预览</button>
                                        <button type="button" data-key="delete" class="btn btn-primary btn-xs btn-outline"><i class="fa fa-trash"></i> 删除</button>
                                        <button type="button" data-key="copy" class="btn btn-primary btn-xs btn-outline"><i class="fa fa-copy"></i> 复制</button>`;
                                if (row.appId) {
                                    buttonHtml = `<button type="button" data-key="preview" class="btn btn-primary btn-xs btn-outline"><i class="fa fa-bolt"></i> 预览</button>`;
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

