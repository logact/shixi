define(['ztree'], function (ztree) {
    var app = angular.module('app');

    app.controller('DeviceTreePreviewController', ['$scope', '$state', 'DBUtils', 'dialog', 'util', 'http', 'I18nService', '$timeout',
        function ($scope, $state, DBUtils, dialog, util, http, I18nService, $timeout) {

            var ctrl = this;
            var zTreeObj;
            var saved_node_code = '';
            $scope.selectedDeviceInfo = I18nService.getValue('设备视图预览', 'device_preview.device_preview', 'system');

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initTree();
                    ctrl.adjustHeight();
                    $timeout(function () {
                        var treeNode = $(".device-tree");
                        var content = $(".device-tree-content");
                        content.height(treeNode.height() - 80);
                    }, 300);
                },
                initTree: function () {
                    var setting = {
                        callback: {
                            onClick: ctrl.onNodeClick
                        },
                        data: {
                            simpleData: {
                                enable: true,
                                idKey: "code",
                                pIdKey: "pCode",
                                rootPId: null
                            },
                            keep: {
                                parent: true
                            }
                        },
                    };

                    http.get("deviceTreePreview/getTreeNodes").success(function (treeNodes) {
                        zTreeObj = $.fn.zTree.init($("#device-preview-tree"), setting, treeNodes);
                        fuzzySearch("device-preview-tree", "#search_key", null, true);
                        ctrl.reloadLastCheckedView();
                    })
                },
                onNodeClick: function (event, treeId, treeNode) {
                    if (!treeNode.isParent) {
                        // get preview id
                        var previewId = _.get(treeNode, 'previewId', '');
                        if (!previewId) {
                            dialog.noty('设备尚未绑定视图');
                            return;
                        }
                        let checked_node_code = _.get(treeNode, "code");
                        if (checked_node_code === saved_node_code) {
                            return;
                        }
                        if (checked_node_code) {
                            saved_node_code = checked_node_code;
                            localStorage.setItem("previous_select_node_code", checked_node_code);
                        }
                        $scope.selectedDeviceInfo = treeNode.name + ' (' + treeNode.code + ')';
                        util.apply($scope);
                        ctrl.loadView(previewId, treeNode.code)
                    }
                },
                reloadLastCheckedView: function () {
                    let previous_select_node_code = localStorage.getItem("previous_select_node_code");
                    if (previous_select_node_code) {
                        var node = zTreeObj.getNodeByParam("code", previous_select_node_code, null);
                        if (node) {
                            zTreeObj.selectNode(node);
                            var previewId = _.get(node, "previewId");
                            if (!previewId) {
                                return;
                            }
                            saved_node_code = previous_select_node_code;
                            ctrl.loadView(previewId, previous_select_node_code);
                        }
                    }
                },
                loadView: function (previewId, uuid1) {
                    dialog.elemWaiting($('.preview-container'));
                    _.delay(function () {
                        dialog.elemWaiting($('.preview-container'));
                        $("#device-tree-preview-iframe").attr('src', 'monitor_developer/preview?id=' + previewId + '&uuid1=' + uuid1);
                    }, 500);
                },
                adjustHeight: function () {
                    var bodyNode = $(".device-tree-preview-container");
                    var app_navbar_height = $("#app-navbar").height() || 0;
                    var head_height = $(".widget-header").outerHeight() || 0;
                    var margin_height = 30;
                    var height = $(window).height()
                        - app_navbar_height
                        - head_height
                        - margin_height
                        - 15;
                    bodyNode.height(height);
                }
            });
            $timeout(function () {
                ctrl.initialize();
            }, 300);
        }]);
});
