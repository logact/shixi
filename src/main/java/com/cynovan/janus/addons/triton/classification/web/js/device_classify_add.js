define([], function () {
    var app = angular.module('app');

    app.controller('DeviceClassifyAddController', ['$scope', 'DBUtils', 'dialog', 'http', 'util', "I18nService", "$element", 'janus',
        function (dialogScope, DBUtils, dialog, http, util, I18nService, $element, janus) {
            var ctrl = this;
            dialogScope.deviceView = {
                value: {},
                projection: {
                    _id: 1,
                    name: 1,
                    code: 1
                }
            };
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    dialogScope.$watch("deviceView.value", function (checked_view) {
                        let entity_view = {};
                        let view_code = _.get(checked_view, "id", "");
                        if (!_.isEmpty(view_code)) {
                            entity_view.viewCode = view_code;
                            entity_view.viewName = _.get(checked_view, "name");
                        }
                        _.set(dialogScope.entity, "view", entity_view);
                    });
                    dialogScope.$on('success', function (event, checkMessage) {
                        var name = _.get(dialogScope, "entity.name", "");
                        if (_.isEmpty(name)) {
                            checkMessage.success = false;
                            dialog.noty("请输入名称")
                        }
                        if (checkMessage.success) {
                            http.post("dataDefinition/addCls", {
                                name: name,
                                remark: _.get(dialogScope, "entity.remark", ""),
                                viewCode: _.get(dialogScope, "entity.view.viewCode", "")
                            }).success(function (result) {
                                if (result.success) {
                                    dialog.noty("添加成功!");
                                    ctrl.refreshTable();
                                } else {
                                    dialog.noty(result.messages[0]);
                                }
                            });
                        }
                    });
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                }
            });
            ctrl.initialize();
        }]);
});
