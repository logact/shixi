define([], function () {
    var app = angular.module('app');

    app.controller('DeviceAddController', ['$scope', 'DBUtils', 'dialog', 'http', 'util', "I18nService",
        function ($scope, DBUtils, dialog, http, util, I18nService) {
            $scope.uuidList = [];
            var zTree;
            var ctrl = this;
            var entity = $scope.entity;
            var group_code_map = {};

            _.extend(ctrl, {
                initialize: function () {
                    var cls_code_map = {};
                    ctrl.initTree();
                    _.set($scope, "selectedGroupName", _.get(entity, "group.groupName", ""));
                    http.post("dataDefinition/getDeviceClsNoColumn", {}).success(function (result) {
                        let cls_list = _.get(result, "datas.clsList", {});
                        $scope.classificationList = cls_list;
                        $scope.classification = cls_list;
                        _.each(cls_list, function (cls) {
                            _.set(cls_code_map, cls.code, cls);
                        });
                        $scope.$watch("entity.classification.classificationCode", function (cls_code) {
                            if (!_.isEmpty(cls_code)) {
                                let cls = _.get(cls_code_map, cls_code, {});
                                _.set($scope, "entity.classification.classificationName", cls.name);
                            }
                        });
                    });
                    $scope.$on('success', function (event, checkMessage) {
                        if (entity.uuid_type === '2' && !entity.uuid) {
                            dialog.noty(I18nService.getValue('请选择设备的序列号', 'select_device_uuid'));
                            checkMessage.success = false;
                            return false;
                        }

                        if (!entity.baseInfo || !entity.baseInfo.name) {
                            dialog.noty(I18nService.getValue('请输入设备的名称', 'input.device.name'));
                            checkMessage.success = false;
                            return false;
                        }
                        if (entity.baseInfo.name.length > 25) {
                            dialog.noty('设备名称不能超过25个字符', 'device.name.max');
                            checkMessage.success = false;
                            return false;
                        }
                        ctrl.createDevice();
                    });
                },
                initTree: function () {
                    var setting = {
                        check: {
                            enable: true,
                            chkStyle: "radio",
                            radioType: "all"
                        },
                        view: {
                            dblClickExpand: false
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
                        callback: {
                            onClick: ctrl.onClick,
                            onCheck: ctrl.onTreeNodeCheck
                        }
                    };
                    DBUtils.list("areaDeviceTree", {}).success(function (result) {
                        var deviceGroup = _.get(result, "datas.result", []);
                        _.each(deviceGroup, function (node) {
                            if (node.code === "root") {
                                _.set(node, "nocheck", true);
                            }
                        });
                        zTree = $.fn.zTree.init($("#selectGroup"), setting, deviceGroup);
                        var groups = ctrl.parseDeviceGroup(deviceGroup);
                        $scope.groups = groups;
                        _.each(groups, function (group) {
                            _.set(group_code_map, group.code, group);
                        });
                        $scope.$watch("entity.group.groupCode", function (group_code) {
                            if (!_.isEmpty(group_code)) {
                                let group = _.get(group_code_map, group_code, {});
                                _.set($scope, "entity.group.groupName", group.name);
                            }
                        });
                    });
                },
                onTreeNodeCheck: function (event, treeId, treeNode) {
                    zTree.selectNode(treeNode);
                    if (treeNode.checked) {
                        _.set($scope, "entity.group.groupCode", treeNode.code);
                        $scope.selectedGroupName = treeNode.name;
                    } else {
                        _.unset($scope, "entity.group",);
                        $scope.selectedGroupName = "";
                    }
                    util.apply($scope);
                },
                onClick: function (e, treeId, treeNode) {
                    zTree.checkNode(treeNode, !treeNode.checked, null, true);
                    ctrl.onTreeNodeCheck(e, treeId, treeNode);
                    return false;
                },
                onBodyDown: function (event) {
                    var target = event.target;
                    var data_key = $(target).data("key");
                    if (!(event.target.id === "selectGroupDiv" || data_key === "group_name" || $(event.target).parents("#selectGroupDiv").length > 0)) {
                        ctrl.hideMenu();
                    }
                },
                parseDeviceGroup: function (groups) {
                    var result = [];
                    _.each(groups, function (node) {
                        if (node.code === "root") {
                            return;
                        }
                        var item = {
                            name: node.name,
                            code: node.code
                        };
                        result.push(item);
                    });
                    return result;
                },
                hideMenu: function () {
                    $("#selectGroupDiv").fadeOut("fast");
                    $("body").unbind("mousedown", ctrl.onBodyDown);
                },
                showGroupMenu: function () {
                    $("#selectGroupDiv").slideDown("fast");
                    $("body").bind("mousedown", ctrl.onBodyDown);
                },
                changeMode: function (mode, event) {
                    entity.uuid_type = mode;
                    $(event.target).addClass('active').siblings('.active').removeClass('active');

                    if (mode === '2') {
                        http.get('device/availableUUID').success(function (result) {
                            if (result.success) {
                                $scope.uuidList = _.get(result, 'datas.result', []);
                            }

                        })
                    }
                },
                createDevice: function () {
                    if (entity.id) {
                        entity.state = "";
                        http.post("device/updateDevice", {
                            uuid: entity.uuid,
                            entity: JSON.stringify(entity)
                        }).success(function (result) {
                            dialog.noty(I18nService.getValue('操作成功', 'operation_success'));
                        });
                    } else {
                        dialog.waiting(I18nService.getValue('创建设备', 'create_device') + '...');
                        var postData = util.encodeJSON(entity);
                        http.post('device/create', {
                            data: postData
                        }).success(function (result) {
                            dialog.hideWaiting();
                            if (result.success) {
                                dialog.noty(I18nService.getValue('设备创建成功', 'device.create.success'));
                                if (_.isFunction($scope.trigger.onSuccess)) {
                                    $scope.trigger.onSuccess.call(undefined, result);
                                }
                            } else {
                                if (result.message) {
                                    dialog.noty(result.message);
                                } else {
                                    dialog.noty(I18nService.getValue('设备已存在，请检查', 'device.exist.check'));
                                }
                            }
                        });
                    }
                },
                selectLocal: function () {
                    if (window.navigator.onLine == true) {
                        require(['amapui'], function () {
                            mapentity = {
                                poi: {},
                                local: ""
                            };
                            dialog.show({
                                template: 'show_add_map_dialog',
                                title: '地图',
                                width: 1200,
                                controller: ['$scope', '$element', function (dialogScope, $element) {
                                    dialogScope.entity = mapentity;

                                    function addMarker(map, poi) {
                                        var marker = new AMap.Marker();
                                        var infoWindow = new AMap.InfoWindow({
                                            offset: new AMap.Pixel(0, -20)
                                        });

                                        marker.setMap(map);
                                        marker.setPosition(poi.location);
                                        map.setCenter([poi.location.lng, poi.location.lat]);

                                        infoWindow.setMap(map);
                                        infoWindow.setPosition(poi.location);
                                        var html = [];
                                        html.push('<div>' + (poi.district || '') + '</div>');
                                        html.push('<div>' + (poi.address || '') + '</div>');
                                        html.push('<div>' + (poi.name || '') + '</div>');
                                        infoWindow.setContent(html.join(''));
                                        infoWindow.open(map, marker.getPosition());
                                    }

                                    function initMap() {
                                        var map = new AMap.Map('add_map_container', {
                                            zoom: 13
                                        });

                                        if (!_.isEmpty($scope.entity.poi)) {
                                            addMarker(map, $scope.entity.poi);
                                            _.set(dialogScope.entity, 'poi', $scope.entity.poi);
                                        }

                                        AMapUI.loadUI(['misc/PoiPicker'], function (PoiPicker) {

                                            var poiPicker = new PoiPicker({
                                                input: 'poipicker'
                                            });

                                            //初始化poiPicker
                                            poiPickerReady(poiPicker);
                                            let css = {
                                                'overflow-y': 'unset',
                                                'overflow-x': 'unset'
                                            }
                                            $(".bootbox-body").css(css);
                                            let mcss = {
                                                'overflow-y': 'scroll'
                                            };
                                            $('.modal-body').css(mcss);
                                        });

                                        function poiPickerReady(poiPicker) {

                                            //选取了某个POI
                                            poiPicker.on('poiPicked', function (poiResult) {
                                                var poi = poiResult.item;
                                                addMarker(map, poi);
                                                _.set(dialogScope.entity, 'poi', poi);
                                            });
                                        }
                                    }

                                    initMap();
                                    dialogScope.$on('success', function (event, checkMessage) {
                                        checkMessage.success = true;

                                        if (_.isEmpty(dialogScope.entity.poi)) {
                                            checkMessage.success = false;
                                            dialog.noty('请选取位置信息');
                                            return false;
                                        }
                                        dialogScope.entity.local = dialogScope.entity.poi.district + dialogScope.entity.poi.address + dialogScope.entity.poi.name;
                                        _.extend(entity, dialogScope.entity)
                                        util.apply($scope)
                                    });
                                }]
                            });
                        });
                    } else {
                        dialog.noty("未连接互联网，无法选择位置");
                    }
                }
            });
            ctrl.initialize();
        }]);
})