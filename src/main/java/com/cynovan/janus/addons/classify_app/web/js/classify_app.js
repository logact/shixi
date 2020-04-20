define([], function () {
    var app = angular.module('app');
    app.controller('classifyAppController', ['$scope', 'I18nService', 'DBUtils', 'dialog', '$element', 'util', 'http', function ($scope, I18nService, DBUtils, dialog, $element, util, http) {
        var ctrl = this;
        _.extend(ctrl, {
            initialize: function () {
                ctrl.bindEvent();
                ctrl.initdata();
                ctrl.initViewHeight();
                $scope.isdetail = false;
            },
            bindEvent: function () {
                $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                    var buttonKey = element.closest('button,a').data('key');
                    if (buttonKey === 'preview') {
                        if (ctrl.viewcode == '0') {
                            dialog.noty('设备尚未绑定视图');
                            return;
                        }
                        ctrl.preview(ctrl.viewcode, rowdata);
                    }
                });
                $(window).resize(function () {
                    ctrl.initViewHeight();
                });
                $scope.$on('device.statusChange', function () {
                    ctrl.refreshTable();
                });
            },
            initdata: function () {
                ctrl.options = {
                    collection: 'device',
                    filled: true,
                    query: {},
                    columns: [{
                        name: 'online',
                        title: I18nService.getValue('在线', 'active_status'),
                        targets: 0,
                        orderable: true,
                        render: function (data, type, row) {
                            var html = '';
                            if (row.online.toString() === 'true') {
                                html = '<span class="device_online_state active" id="device_online_state_${row.id}"></span>';
                            } else {
                                html = '<span class="device_online_state" id="device_online_state_${row.id}"></span>';
                            }
                            return html;
                        }
                    }, {
                        name: "state",
                        title: I18nService.getValue('设备状态', 'device.state'),
                        search: false,
                        render: function (data, type, row) {
                            let stateStr = "";
                            let cls = '';
                            if (row.online) {
                                if (row.state === "normal") {
                                    stateStr = "正常";
                                    cls = 'normal';
                                } else if (row.state === "warning") {
                                    stateStr = "警告";
                                    cls = 'warning';
                                } else if (row.state === "alarm") {
                                    stateStr = "报警";
                                    cls = 'error';
                                } else {
                                    stateStr = "未知";
                                    cls = 'unknown';
                                }
                            } else {
                                stateStr = "未知";
                                cls = 'unknown';
                            }
                            return `<span class="device_run_state ${cls}" title="${stateStr}">${stateStr}</span>`;
                        }
                    }, {
                        name: 'uuid',
                        title: I18nService.getValue('序列号', 'device.uuid'),
                        search: true,
                        width: '20%'
                    }, {
                        name: 'baseInfo.name',
                        title: I18nService.getValue('设备名称', 'device.name'),
                        width: '13%',
                        search: true,
                        render: function (data, type, row) {
                            return `<span data-key='detailKey' class="list_btn">${data}</span>`;
                        }
                    }, {
                        name: "group.groupName",
                        title: I18nService.getValue('分组', 'device.groupName'),
                        search: false
                    }, {
                        name: '_id',
                        title: I18nService.getValue('操作', 'do'),
                        orderable: false,
                        render: function (data, type, row) {
                            return `<button type="button" data-key="preview" class="btn btn-primary btn-xs list_btn btn-outline">
                                    <i class="fa fa-edit"></i>查看 </button>`;

                        }
                    }]
                };
                setTimeout(function () {
                    var regex = /app\/(\S*)\/menu/;
                    var code = window.location.href.match(regex)[1];
                    _.extend(ctrl.options.query, {'classification.classificationCode': code});
                    http.post('clsApp/getViewcode', {
                        code: code
                    }).success(function (result) {
                        ctrl.viewcode = _.get(result, "datas.viewid", "0");
                        $scope.typename = _.get(result, "datas.name", "0");
                        if (ctrl.viewcode == '0') {
                            $(".errortip").html("(当前设备类型未绑定视图)");
                        }
                        ctrl.showBindDeviceNoty();
                    });
                    ctrl.refreshTable();
                }, 200);
            },
            preview: function (viewcode, rowdata) {
                $("#iframeview").attr("src", 'monitor_developer/preview?id=' + viewcode);
                $scope.currentDeviceName = _.get(rowdata, 'baseInfo.name', '');
                $scope.currentDeviceuuid = _.get(rowdata, 'uuid', '');
                $scope.isdetail = true;
                util.apply($scope);
            },
            goback: function () {
                $("#iframeview").attr("src", '');
                $scope.isdetail = false;
                util.apply($scope);
            },
            initViewHeight: function () {
                var viewHeight = $("#viewcode");
                viewHeight.height($(".app-main").height() - 15);
            },
            refreshTable: function () {
                var table = $($element).find('.c-table');
                table.DataTable().ajax.reload();
            },
            showBindDeviceNoty: function () {
                let emptyEle = $('.dataTable_empty_content');
                if (emptyEle.length === 1) {
                    dialog.noty("请在设备接入处绑定指定设备类型为" + $scope.typename);
                }
            }
        });
        ctrl.initialize();
    }])
});