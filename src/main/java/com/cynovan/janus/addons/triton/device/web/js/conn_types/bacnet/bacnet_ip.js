define(['triton/device/web/js/conn_types/bacnet/BacnetObjectType'],
    function (bacnetObjectType) {
        var app = angular.module('app');
        app.controller('ConnectionBacnetIpController', ['$scope', 'http', 'util', '$stateParams', 'dialog', '$timeout', 'I18nService',
            function ($scope, http, util, $stateParams, dialog, $timeout, I18nService) {
                var ctrl = this;
                var info_key = 'conn_info_' + $scope.conn_type;
                _.extend(ctrl, {
                    initialize: function () {
                        ctrl.initData();
                        ctrl.bindEvent();
                    },
                    initData: function () {
                        //初始化entity对象
                        $scope.entity = $scope.entity || {};
                        if (_.isEmpty($scope.entity)) {
                            _.extend($scope.entity, {
                                timer: '2s',
                                rows: []
                            });
                        }
                        if ($scope.entity.timer) {
                            $scope.timeUnit = $scope.entity.timer.replace(/[^a-z]+/ig, "");
                            $scope.time = _.trimEnd($scope.entity.timer, $scope.timeUnit);
                        }
                        //时间单位
                        ctrl.timeUnit = [{
                            id: 'ms',
                            name: I18nService.getValue('毫秒', 'millisecond')
                        }, {
                            id: 's',
                            name: I18nService.getValue('秒', 'second')
                        }, {
                            id: 'm',
                            name: I18nService.getValue('分', 'minute')
                        }];
                    },
                    bindEvent: function () {
                        $scope.$on('onSave', function (event, data, checkMessage) {
                            var checkData = ctrl.checkSave(checkMessage);
                            if (checkData === false) {
                                checkMessage.success = false;
                                return false;
                            }
                            _.set(data, info_key, checkData);
                        });
                    },
                    checkSave: function (checkMessage) {
                        $scope.entity.timer = $scope.time + $scope.timeUnit;
                        var data = _.cloneDeep($scope.entity);
                        if (!/^[1-9]\d{0,9}$/g.test(data.portNum)) {
                            checkMessage.messages.push(I18nService.getValue('端口号请输入有效整数', 'port_need_integer'));
                            return false;
                        }
                        if (!/^[1-9]\d{0,9}$/g.test($scope.time)) {
                            checkMessage.messages.push(I18nService.getValue('定时读取请输入有效整数', 'need_integer_time'));
                            return false;
                        }
                        if (!/^[1-9]\d{0,9}$/g.test(data.deviceNumber)) {
                            checkMessage.messages.push(I18nService.getValue('设备号请输入有效整数', 'need_integer_device'));
                            return false;
                        }
                        if ($scope.timeUnit === 'ms') {
                            if ($scope.time < 50) {
                                checkMessage.messages.push(I18nService.getValue('定时读取不少于50毫秒', 'time.min.count'));
                                return false;
                            }
                        }
                        data.rows = _.uniqBy(data.rows, 'id');
                        data.rows = util.removeHashKey(data.rows);
                        return data;
                    },
                    removeRow: function (index) {
                        $scope.entity.rows.splice(index, 1);
                        util.apply($scope);
                    },
                    loadAllObject: _.debounce(function () {
                        if (_.isEmpty($scope.entity.portNum)) {
                            dialog.noty(I18nService.getValue("请输入端口号", 'input.port'));
                            return;
                        }
                        if (_.isEmpty($scope.entity.deviceNumber)) {
                            dialog.noty(I18nService.getValue("请输入设备号", 'input.device.count'));
                            return;
                        }
                        let data = {
                            port: $scope.entity.portNum,
                            deviceInstance: $scope.entity.deviceNumber,
                            broadcastAddress: $scope.entity.broadcastAddress,
                            uuid: $scope.entity.uuid ? $scope.entity.uuid : $scope.$parent.uuid
                        };
                        dialog.waiting(I18nService.getValue('节点加载中', 'loading') + " ....");
                        http.post('connections/loadAllObject', data)
                            .success(
                                function (result) {
                                    console.log(result);
                                    dialog.hideWaiting();
                                    let nodeList = _.get(result, 'datas.nodeList', []);
                                    if (nodeList.length) {
                                        var loadNodeDialog = dialog.show({
                                            template: 'bacnet_ip_load_object_template',
                                            width: 1200,
                                            title: I18nService.getValue('节点列表', 'node_list'),
                                            controller: 'BacnetLoadObjectController',
                                            controllerAs: 'ctrl',
                                            data: {
                                                nodeList: nodeList,
                                                selectNodes: _.isEmpty($scope.entity.rows) ? [] : $scope.entity.rows,
                                                trigger: {
                                                    onSuccess: function (nodes) {
                                                        $scope.entity.rows =  nodes;
                                                        $scope.entity.rows = _.uniqBy($scope.entity.rows, 'id');
                                                        util.apply($scope);
                                                        loadNodeDialog.modal('hide');
                                                    },
                                                    onFail: function () {
                                                        // 添加失败触发
                                                        $scope.vncInfo = {};
                                                    }
                                                }
                                            }
                                        });
                                    } else {
                                        dialog.noty(I18nService.getValue('暂时没有获取到任何属性,请检查端口号和本地设备号是否正确', 'no_attribute_check'));
                                    }
                                },
                                function (err) {
                                    dialog.noty(I18nService.getValue('读取失败', 'read_fail'));
                                }
                            )

                    }, 300)

                });
                ctrl.initialize();
            }]);

        app.controller('BacnetLoadObjectController', ['$scope', function ($scope) {
            var ctrl = this;
            var nodeList = $scope.nodeList;
            var selectNodes = $scope.selectNodes;
            let zTree, searchNodeList;

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.setHeight();
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                setHeight: function () {
                    $('.show-node-div').css({
                        'overflow': 'auto',
                        'height': window.innerHeight - 280 + 'px'
                    });
                },
                initData: function () {
                    let setting = {
                        check: {
                            enable: true,
                            chkboxType: {"Y": "ps", "N": "ps"}
                        },
                        data: {
                            simpleData: {
                                enable: true
                            },
                        },
                        view: {
                            selectedMulti: true,
                            fontCss: ctrl.getFontCss
                        },
                        callback: {}
                    };
                    //ztree节点数据
                    let nodes = nodeList;
                    //初始化ztree
                    $.fn.zTree.init($("#nodeTree"), setting, nodes);
                    //获取ztree对象
                    zTree = $.fn.zTree.getZTreeObj("nodeTree");
                    //之前选中的要监听的栏位 打勾
                    if (selectNodes.length) {
                        _.each(selectNodes, function (n) {
                            if (!_.isEmpty(n.id)) {
                                let node = zTree.getNodeByParam("id", n.id);
                                if (node) {
                                    zTree.checkNode(node, true, true)
                                }
                            }
                        })
                    }
                },
                bindEvent: function () {
                    $scope.$on('success', function (event, data, checkMessage) {
                        //获取打勾的node
                        let checkedNodes = zTree.getCheckedNodes(true);
                        //移除 isParent为true
                        _.remove(checkedNodes, ['isParent', true]);
                        let rows = [];
                        _.each(checkedNodes, function (n) {
                            let row = {};
                            row.id = n.id;
                            row.name = n.name;
                            row.objectTypeName = n.objectTypeName;
                            row.objectInstanceNum = n.objectInstanceNum;
                            row.objectTypeId = n.objectTypeId;
                            row.propertyTypeId = n.propertyTypeId;
                            if (n.pId) {
                                row.pId = n.pId;
                            }
                            rows.push(row);
                        });
                        $scope.trigger.onSuccess.call(undefined, rows);
                    });
                },
                check: function (event, treeId, treeNode) {
                },
                search: _.debounce(function () {
                    ctrl.cleanHighLight();
                    let treeObj = zTree;
                    if (_.isEmpty($scope.searchKey)) {
                        return false;
                    }
                    searchNodeList = treeObj.getNodesByParamFuzzy("name", $scope.searchKey);
                    _.each(searchNodeList, function (n) {
                        if (n.isParent) {
                            treeObj.expandNode(n, true, false, true, false);
                        } else {
                            treeObj.expandNode(n.getParentNode(), true, false, false, false);
                            n.highlight = true;
                            treeObj.updateNode(n);
                        }
                    });
                }, 300),
                cleanHighLight: function () {
                    _.each(searchNodeList, function (a) {
                        delete a.highlight;
                        zTree.updateNode(a);
                    });
                },
                getFontCss: function (treeId, treeNode) {
                    return (treeNode.highlight) ? {color: "#A60000"} : {color: "#333"};
                },
                expandAll: _.debounce(function (flag) {
                    zTree.expandAll(flag);
                }, 300),
                chooseAll:function () {
                    zTree.checkAllNodes(true);
                },
                chooseAllNo:function () {
                    zTree.checkAllNodes(false);
                }
            });
            ctrl.initialize();
        }]);

    });