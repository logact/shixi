define(['ztree'], function () {
    var app = angular.module('app');

    app.controller('DeviceListController', ['$scope', '$state', 'DBUtils', 'dialog', 'http', '$element', 'session', 'SecurityService', '' +
    'janus', 'I18nService', 'util', "$timeout", 'websocket',
        function ($scope, $state, DBUtils, dialog, http, $element, session, SecurityService,
                  janus, I18nService, util, $timeout, websocket) {

            var ctrl = this;
            var selectedDevice = [];
            var cls_id_map = {};
            $scope.model = 'list';

            $scope.deviceClassificationQeury = {
                value: {},
                projection: {
                    _id: 1,
                    name: 1,
                    code: 1
                }
            };
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.initDeviceTree();
                    ctrl.initListOption();
                    ctrl.bindEvent();
                    ctrl.initHeight();
                },
                initReload: function () {
                    $element.find('.search-input').val('');
                    var table = $element.find('.c-table');
                    table.DataTable().ajax.reload();
                },
                initData: function () {
                    http.post("dataDefinition/getDeviceClsNoColumn", {}).success(function (result) {
                        let cls_list = _.get(result, "datas.clsList", {});
                        _.each(cls_list, function (cls) {
                            _.set(cls_id_map, cls.id, cls);
                        });
                        $scope.classificationList = cls_list;
                        $scope.classificationList.unshift({
                            name: "全部",
                            id: "all"
                        });
                    });
                },
                changeModel: function (model) {
                    if (model === 'map') {
                        if (window.navigator.onLine == true) {
                            require(['amap'], function () {
                                $scope.model = model;
                                ctrl.refreshTable();
                                util.apply($scope);
                            });
                        } else {
                            dialog.noty("未连接互联网，无法开启地图模式")
                        }
                    } else {
                        $scope.model = model;
                        ctrl.refreshTable();
                        util.apply($scope);
                    }

                },
                togglePoiList: function () {
                    $('.device-poi-list-container').slideToggle();
                },
                checkLicences: function () {
                    var deferred = $.Deferred();
                    http.post("device/checkLicences").success(function (result) {
                        deferred.notify(result);
                    });
                    return deferred;
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('.list_btn').data('key');
                        if (buttonKey === "detailKey") {
                            ctrl.showDeviceDetail(rowdata.uuid);
                        } else if (buttonKey === 'delete_device') {
                            ctrl.showDeviceDelete(rowdata.id);
                        } else if (buttonKey === "toggle_select") {
                            ctrl.toggleSelect(event, element, options, rowdata);
                        }
                    });
                    $scope.$on('device.onlineChange', function (event, message) {
                        let content = message.content;
                        if (content) {
                            dialog.noty(content);
                        }
                        ctrl.refreshTable();
                    });
                    $(window).resize(function () {
                        ctrl.initHeight();
                    });
                    $scope.$watch("model", function (newval, oldval) {
                        if (newval === 'list') {
                            ctrl.initDeviceTree();
                        }
                    });
                    $scope.$on("Many2OneSelect", function (event, collection, cls) {
                        let code = _.get($scope, "group.groupCode", "");
                        let cls_id = _.get(cls, "id", "");
                        let cls_of_id = _.get(cls_id_map, cls_id, {});
                        let cls_code = cls_of_id.code;
                        if (_.isEmpty(cls_id)) {
                            _.unset(ctrl.options.query, "classification.classificationCode");
                        } else {
                            _.extend(ctrl.options.query, {"classification.classificationCode": cls_code});
                            if (code !== "" && code !== "root") {
                                _.extend(ctrl.options.query, {"group.groupCode": code});
                            }
                        }
                        ctrl.refreshTable();
                    });
                },
                showDeviceDetail: function (uuid) {
                    janus.goToMenuDetailByIndex(2, uuid);
                },
                showDeviceDelete: function (deviceId) {
                    if (deviceId) {
                        dialog.confirm(I18nService.getValue('确认删除设备？删除后不可恢复。', 'confirm_delete')).on('success', function () {
                            http.post('device/remove', {
                                id: deviceId
                            }).success(function () {
                                dialog.noty(I18nService.getValue('删除成功', 'delete_success'));
                                ctrl.refreshTable();
                            });
                        });
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
                addDevice: function (entity) {
                    ctrl.checkLicences().progress(function (canAdd) {
                        if (!entity && !canAdd) {
                            dialog.noty(I18nService.getValue('设备接入数量已超过上限，创建失败', 'create_device_fail'));
                            return false;
                        }
                        dialog.show({
                            template: 'app_triton_add_device_template',
                            width: 1200,
                            title: I18nService.getValue('创建设备', 'create_device'),
                            controller: 'DeviceAddController',
                            controllerAs: 'ctrl',
                            data: {
                                entity: entity || {
                                    uuid_type: '1',
                                    tag: [],
                                },
                                trigger: {
                                    onSuccess: function (result) {
                                        ctrl.refreshTable();
                                    },
                                    onFail: function () {
                                    }
                                }
                            }
                        });
                    });
                },
                toggleSelect: function (event, element, options, rowdata) {
                    if (element[0].checked) {
                        selectedDevice.push(rowdata.uuid)
                    } else {
                        _.each(selectedDevice, function (d) {
                            if (d === rowdata.uuid) {
                                _.pull(selectedDevice, rowdata.uuid);
                            }
                        });
                    }
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                    selectedDevice = [];
                },
                initListOption: function () {
                    ctrl.options = {
                        collection: 'device',
                        filled: true,
                        query: {},
                        columns: [{
                            name: '_id',
                            title: I18nService.getValue('选择', 'choose'),
                            width: "40px",
                            canMove: true,
                            orderable: false,
                            render: function (data, type, row) {
                                if (SecurityService.hasRight('triton_device', 'manage')) {
                                    return `<div class="pretty p-default p-curve p-thick">
                                                <input type="checkbox" data-key="toggle_select" class="list_btn selectCheckbox"/>
                                                <div class="state p-primary">
                                                    <label style="width: 40px"></label>
                                                </div>
                                            </div>`
                                }
                            }
                        }, {
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
                                    stateStr = "离线";
                                    cls = 'unknown';
                                }
                                return `<span class="device_run_state ${cls}" title="${stateStr}">${stateStr}</span>`;
                            }
                        }, {
                            name: 'online_exception',
                            visible: false
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
                            name: "classification.classificationName",
                            title: I18nService.getValue('设备类型', 'device.list.classification'),
                            search: true
                        }, {
                            name: "group.groupName",
                            title: I18nService.getValue('分组', 'device.groupName'),
                            search: false
                        }, {
                            name: 'tag',
                            title: I18nService.getValue('设备标签', 'device.tag'),
                            search: true
                        }, {
                            name: 'team.name',
                            title: I18nService.getValue('所属团队', 'own_team'),
                            search: true,
                        }, {
                            name: '_id',
                            title: I18nService.getValue('操作', 'do'),
                            orderable: false,
                            render: function (data, type, row) {
                                if (SecurityService.hasRight('triton_device', 'manage')) {
                                    return `<button type="button" data-key="detailKey" class="btn btn-primary btn-xs list_btn btn-outline">
                                            <i class="fa fa-edit"></i>${I18nService.getValue('设备详情', 'device.detail')} </button>
                                            <button type="button" data-key="delete_device" class="btn btn-primary btn-xs list_btn btn-outline">
                                            <i class="fa fa-trash"></i> ${I18nService.getValue('删除', 'delete')}</button>`;
                                }
                            }
                        }]
                    };
                },
                showSelectDialog: function () {
                    if (selectedDevice.length < 1) {
                        dialog.noty("请选择需要分组的设备!");
                        return;
                    }
                    var selected = selectedDevice;
                    dialog.show({
                        title: '对设备进行分组',
                        template: 'app_triton_device_group_dialog',
                        data: {
                            selected: selected
                        },
                        width: 800,
                        controller: ['$scope', '$element', function (scope, element) {
                            var ctrl = this;
                            _.extend(ctrl, {
                                init: function () {
                                    ctrl.initTree();
                                    ctrl.bindEvent();
                                },
                                resetCheckbox: function () {
                                    _.each($(".selectCheckbox"), function (checkbox) {
                                        checkbox.checked = false;
                                    });
                                },
                                refreshTable: function () {
                                    var table = $($element).find('.c-table');
                                    table.DataTable().ajax.reload();
                                    selectedDevice = [];
                                },
                                bindEvent: function () {
                                    scope.$on("success", function (event, checkMessage) {
                                        var nodes = ctrl.getSelectedNode();
                                        if (nodes.length === 0) {
                                            dialog.noty("请选择分组");
                                            checkMessage.success = false;
                                        } else {
                                            checkMessage.success = true;
                                            var data = {
                                                uuidArray: scope.selected,
                                                code: _.replace(nodes[0].code, "device_group_dialog_tree", "device-tree-container"),
                                                name: nodes[0].name
                                            };
                                            data = JSON.stringify(data);
                                            http.post("areaAndDevice/updateGroup", {
                                                data: data
                                            }).success(function (result) {
                                                if (result.success) {
                                                    dialog.noty("设置成功! ");
                                                    selectedDevice = [];
                                                    ctrl.resetCheckbox();
                                                    ctrl.refreshTable();
                                                }
                                            });

                                        }
                                    });
                                },
                                onClick: function (e, treeId, treeNode) {
                                    var zTree = $.fn.zTree.getZTreeObj("device_group_dialog_tree");
                                    zTree.checkNode(treeNode, !treeNode.checked, null, true);
                                    return false;
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
                                            beforeCheck: ctrl.beforeCheck
                                        }
                                    };
                                    DBUtils.list("areaDeviceTree", {}).success(function (result) {
                                        var data = _.get(result, "datas.result", []);
                                        _.each(data, function (node) {
                                            if (node.code === "root") {
                                                _.set(node, "nocheck", true);
                                            }
                                        });
                                        $.fn.zTree.init($("#device_group_dialog_tree"), setting, data);
                                    });
                                },
                                getSelectedNode: function () {
                                    var treeObj = $.fn.zTree.getZTreeObj("device_group_dialog_tree");
                                    return treeObj.getCheckedNodes(true);
                                },
                                canCheck: function (nodes) {
                                    _.each(nodes, function (node) {
                                        var childrenList = _.get(node, "children", []);
                                        if (!_.isEmpty(childrenList)) {
                                            _.set(node, "nocheck", true);
                                            ctrl.canCheck(childrenList);
                                        } else {

                                        }
                                    });
                                }
                            });
                            ctrl.init();
                        }]
                    });
                },
                nodeMouseInEvent: function (treeId, treeNode) {
                    let childrenList = _.get(treeNode, "children", []);
                    // 有设备的节点不显示
                    if (!_.isEmpty(childrenList)) {
                        let first = _.head(childrenList);
                        let type = _.get(first, "type", "");
                        if (!_.isEmpty(type)) return;
                    }
                    let type = _.get(treeNode, "type", "");
                    // 设备节点不显示
                    if (!_.isEmpty(type)) return;
                    // 已经有添加按钮的不继续添加
                    var sObj = $("#" + treeNode.tId + "_span");
                    if (treeNode.editNameFlag || $("#addBtn_" + treeNode.tId).length > 0) return;

                    var addStr = "<span class='button add' id='addBtn_" + treeNode.tId + "' title='添加节点' onfocus='this.blur();'></span>";
                    sObj.after(addStr);
                    var btn = $("#addBtn_" + treeNode.tId);
                    if (btn) btn.bind("click", function () {
                        var zTree = $.fn.zTree.getZTreeObj("device-tree-container");
                        http.post("areaAndDevice/addTreeNode", {
                            pCode: treeNode.code
                        }).success(function (result) {
                            if (result.success) {
                                var zTree = $.fn.zTree.getZTreeObj("device-tree-container");
                                zTree.addNodes(treeNode, {
                                    id: result.datas.id,
                                    code: result.datas.code,
                                    pCode: treeNode.code,
                                    name: "NEW NODE",
                                    isParent: true
                                });
                                var newNode;
                                _.each(treeNode.children, function (node) {
                                    if (node.isLastNode) {
                                        newNode = node;
                                    }
                                });
                                zTree.editName(newNode);
                            }
                        });
                    });
                },
                nodeMouseOutEvent: function (treeId, treeNode) {
                    $("#addBtn_" + treeNode.tId).unbind().remove();
                },
                beforeDrag: function (treeId, treeNodes) {
                    var isDevice = _.get(treeNodes, "[0].type", "");
                    return _.isEmpty(isDevice)
                },
                onDrag: function (event, treeId, treeNodes) {
                },
                beforeDrop: function (treeId, treeNodes, targetNode, moveType) {
                    if (targetNode === null) {
                        dialog.noty("无法移动到此处!");
                        return false;
                    }
                    let canMove = ctrl.canDragGroup(targetNode);
                    if (!canMove) {
                        dialog.noty("目标节点非叶子节点");
                    }
                    return canMove;
                },
                canDragGroup: function (targetNode) {
                    var childrenList = _.get(targetNode, "children", []);
                    if (!_.isEmpty(childrenList)) {
                        let first = childrenList[0];
                        var type = _.get(first, "type", "");
                        return _.isEmpty(type);
                    } else {
                        let type = _.get(targetNode, "type", "");
                        return _.isEmpty(type);
                    }
                },
                onDrop: function (event, treeId, treeNodes, targetNode, moveType) {
                    if (targetNode) {
                        var array = [];
                        _.each(treeNodes, function (node) {
                            array.push(node.code);
                        });
                        var data = {
                            treeNodes: array,
                            target: targetNode.code,
                            moveType: moveType
                        };
                        data = JSON.stringify(data);
                        http.post("areaAndDevice/dropNode", {
                            data: data
                        });
                    }
                },
                getParsedTreeNodes: function () {
                    var zTreeNode = $.fn.zTree.getZTreeObj("device-tree-container");
                    var nodes = zTreeNode.getNodes();
                    return ctrl.parseTree(nodes);
                },
                parseTree: function (nodes) {
                    var result = [];
                    _.each(nodes, function (node) {
                        var nodeChildrenList = _.get(node, "children", []);
                        if (!_.isEmpty(nodeChildrenList)) {
                            var childrenResult = ctrl.parseTree(nodeChildrenList);
                            let item = _.extend({}, _.pick(node, ["name", "parentTId", "tId", "isParent"]));
                            item.isParent = true;
                            item.open = true;
                            item.children = childrenResult;
                            result.push(item)
                        } else {
                            let item = _.extend({}, _.pick(node, ["name", "parentTId", "tId", "isParent"]));
                            item.isParent = true;
                            item.open = true;
                            result.push(item);
                        }
                    });
                    return result;
                },
                onRename: function (event, treeId, treeNode, isCancel) {
                    var name = _.get(treeNode, "name", "");
                    if (_.isEmpty(name)) {
                        dialog.noty("请输入节点名称");
                        var zTree = $.fn.zTree.getZTreeObj("device-tree-container");
                        var node = zTree.getNodeByParam("tId", treeNode.tId);
                        zTree.editName(node);
                        return;
                    }
                    let isDevice = _.get(treeNode, "type", "");
                    if (!_.isEmpty(isDevice)) {
                        DBUtils.update("device", {uuid: treeNode.uuid}, {
                            $set: {
                                "baseInfo.name": name
                            }
                        }).success(function (result) {
                            if (result.success) {
                                dialog.noty("修改成功!");
                                ctrl.refreshTable();
                            }
                        });
                        return;
                    }
                    http.post("areaAndDevice/alterNodeName", {
                        code: treeNode.code,
                        name: name
                    }).success(function (result) {
                        ctrl.refreshTable()
                    })
                },
                beforeRemove: function (treeId, treeNode) {
                    let pCode = _.get(treeNode, "pCode", "");
                    if (_.isEmpty(pCode)) {
                        dialog.noty("此节点不能删除");
                        return false;
                    } else {
                        return confirm("确定移除此节点?");
                    }
                },
                onRemove: function (event, treeId, treeNode) {
                    http.post("areaAndDevice/removeTreeNode", {
                        code: treeNode.code
                    }).success(function (result) {
                        var zTree = $.fn.zTree.getZTreeObj("device-tree-container");
                        var root_node = zTree.getNodesByFilter(function (node) {
                            return node.level === 0;
                        }, true);
                        zTree.selectNode(root_node);
                        zTree.setting.callback.onClick(null, zTree.setting.treeId, root_node);
                    })
                },
                treeNodeOnClick: function (event, treeId, treeNode) {
                    _.set($scope, "group.groupCode", treeNode.code);
                    $scope.deviceClassificationQeury.value = {
                        id: ""
                    };
                    util.apply($scope);
                    if (treeNode.parentTId === null) {
                        _.unset(ctrl.options.query, "classification.classificationCode");
                        _.unset(ctrl.options.query, "group.groupCode");
                        ctrl.refreshTable();
                    } else {
                        _.extend(ctrl.options.query, {"group.groupCode": treeNode.code});
                        ctrl.refreshTable();
                    }
                },
                initDeviceTree: function () {
                    var zTreeObj;
                    var setting = {
                        edit: {
                            enable: true,
                            removeTitle: "移除",
                            renameTitle: "重命名",
                            editNameSelectAll: true
                        },
                        view: {
                            addHoverDom: ctrl.nodeMouseInEvent,
                            removeHoverDom: ctrl.nodeMouseOutEvent
                        },
                        callback: {
                            beforeDrag: ctrl.beforeDrag,
                            onDrag: ctrl.onDrag,
                            beforeDrop: ctrl.beforeDrop,
                            onDrop: ctrl.onDrop,
                            onRename: ctrl.onRename,
                            beforeRemove: ctrl.beforeRemove,
                            onRemove: ctrl.onRemove,
                            onClick: ctrl.treeNodeOnClick
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
                    http.post("areaAndDevice/getAreaDeviceTreeData").success(function (result) {
                        var treeNodes = _.get(result, "datas.result");
                        console.log("treeNodes。。。。")
                        console.log(treeNodes)
                        zTreeObj = $.fn.zTree.init($("#device-tree-container"), setting, treeNodes);
                    });
                },
                initHeight: function () {
                    _.delay(function () {
                        var bodyNode = $(".widget-body-filled");
                        var app_navbar_height = $("#app-navbar").height();
                        var head_height = $("#device_list_head").outerHeight();
                        var margin_height = parseInt($(".device-list-div").css("margin-bottom"));
                        var height = $(window).height()
                            - app_navbar_height
                            - head_height
                            - margin_height
                            - 15;
                        bodyNode.css("height", height);
                    }, 800);
                }
            });
            ctrl.initialize();
        }]);

    app.controller('DeviceMapKanbanController', ['$scope', 'DBUtils', 'util', function ($scope, DBUtils, util) {
        var ctrl = this;
        _.extend(ctrl, {
            initialize: function () {
                ctrl.initMap();
                ctrl.bindEvent();
            },
            bindEvent: function () {
                $scope.$watch('keyword', _.debounce(function () {
                    ctrl.searchPoi();
                }, 1000));
                $scope.$on('$destroy', function () {
                    if ($scope.map) {
                        $scope.map.destroy();
                    }
                });
                $scope.$on('device.onlineChange', function () {
                    ctrl.loadMapData();
                });
            },
            initMap: function () {
                setTimeout(function () {
                    $('#device_map').height($(window).height() - 180);
                    $scope.map = new AMap.Map('device_map', {
                        resizeEnable: true,
                        zoom: 5,
                        center: [105.177903, 36.321201]
                    });
                    $scope.map.on('complete', function () {
                        ctrl.loadMapData();
                    })
                }, 500);
            },
            loadMapData: function () {
                $scope.hasPoiList = [];         // 已分配地址列表
                $scope.hasNoPoiList = [];       // 未分配地址列表
                $scope.markers = [];
                DBUtils.list('device', {}).success(function (result) {
                    var deviceList = _.get(result, 'datas.result', {});
                    _.forEach(deviceList, function (device) {
                        if (_.isEmpty(device.poi)) {
                            $scope.hasNoPoiList.push(device);
                        } else {
                            ctrl.createMarker(device);
                            $scope.hasPoiList.push(device);
                        }
                    });
                    $scope.totalPoiList = _.concat($scope.hasPoiList, $scope.hasNoPoiList);
                    $scope.map.add($scope.markers);
                    ctrl.showHasPoiList();
                })
            },
            showHasPoiList: function () {
                $('.hasPoiList').addClass('active');
                $('.hasNoPoiList').removeClass('active');
                $scope.currentPoiList = $scope.hasPoiList;
                ctrl.searchPoi();
            },
            showHasNoPoiList: function () {
                $('.hasPoiList').removeClass('active');
                $('.hasNoPoiList').addClass('active');
                $scope.currentPoiList = $scope.hasNoPoiList;
                ctrl.searchPoi();
            },
            selectPoi: function (index) {
                var device = $scope.poiList[index];
                if (device && device.marker) {
                    // has poi, show marker
                    ctrl.showMarkerInfo(device, true);
                }
            },
            initPoiPager: function (totalPoiList) {
                $scope.chunkList = _.chunk(totalPoiList, 4);
                $scope.totalPage = $scope.chunkList.length;
                $scope.currentPage = Math.min(1, $scope.totalPage);
                ctrl.refreshPoiList();
            },
            createMarker: function (device) {
                var title = _.get(device, 'baseInfo.name', 'poi.name');
                var poi = _.get(device, 'poi');
                var marker = new AMap.Marker({
                    position: poi.location,
                    title: title,
                    clickable: true,
                    icon: ctrl.getMarkerIcon(device),
                    id: poi.id
                });
                marker.on('click', function () {
                    ctrl.showMarkerInfo(device);
                });
                device.marker = marker;
                $scope.markers.push(marker);
            },
            showMarkerInfo: function (device, zoom) {
                if (device.marker) {
                    device.marker.setTop(true);
                }
                var poi = device.poi;
                var html = [];
                var deviceName = _.join([_.get(device, 'baseInfo.name', ''), ' (', device.uuid, ')'], '');
                var address = (poi.district || '') + (poi.address || '') + (poi.name || '');

                // <div class="map-info-title"><a href="#/device/${device.id}">${deviceName || ''}</a></div>
                html.push(
                    `<div class="map-info-window-container">
                        <div class="map-info-title">${deviceName || ''}</div>
                        <div class="map-info-detail">
                            <div>${address}</div>
                            <a href="#/app/triton/menu/2/r/${device.uuid}" class="btn btn-sm btn-primary">查看设备</a>
                        </div>
                    </div>`);


                var infoWindow = new AMap.InfoWindow({
                    offset: new AMap.Pixel(0, -20),
                    content: html.join('')
                });
                infoWindow.open($scope.map, poi.location);

                if (zoom) {
                    $scope.map.setZoomAndCenter(12, [poi.location.lng, poi.location.lat]);
                } else {
                    $scope.map.setCenter([poi.location.lng, poi.location.lat]);
                }
            },
            searchPoi: function () {
                if ($scope.keyword) {
                    var keywordRegex = new RegExp($scope.keyword);
                    var filteredPoiList = _.filter($scope.currentPoiList, function (device) {
                        return keywordRegex.test(device.uuid) ||
                            keywordRegex.test(_.get(device, 'baseInfo.name', '')) ||
                            keywordRegex.test(_.get(device, 'poi.name', '')) ||
                            keywordRegex.test(_.get(device, 'poi.district', '')) ||
                            keywordRegex.test(_.get(device, 'poi.address', ''))
                    });
                    ctrl.initPoiPager(filteredPoiList);
                } else {
                    ctrl.initPoiPager($scope.currentPoiList);
                }
            },
            getMarkerIcon: function (device) {
                var imageUri = 'triton/device/web/img/pin-status-unknown.png';
                if (device.online) {
                    let devicestate = _.get(device, 'state', "normal");
                    imageUri = 'triton/device/web/img/pin-status-' + devicestate + '.png';
                }
                return new AMap.Icon({
                    size: new AMap.Size(19, 30),  //图标大小
                    imageSize: new AMap.Size(19, 30),
                    image: util.getAppImage(imageUri)
                });
            },
            previousPage: function () {
                $scope.currentPage = Math.max($scope.currentPage - 1, 1);
                ctrl.refreshPoiList();
            },
            nextPage: function () {
                $scope.currentPage = Math.min($scope.currentPage + 1, $scope.totalPage);
                ctrl.refreshPoiList();
            },
            refreshPoiList: function () {
                $scope.poiList = $scope.chunkList[$scope.currentPage - 1];
                if (!$scope.$$phase) {
                    util.apply($scope);
                }
            }
        });
        ctrl.initialize();
    }])
});
