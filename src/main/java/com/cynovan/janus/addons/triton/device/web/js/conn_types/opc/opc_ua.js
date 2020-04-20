define(['ztree'], function () {
    var app = angular.module('app');

    app.controller('ConnectionOpcUaController', ['$scope', 'http', 'util', 'dialog', '$timeout', 'I18nService',
        function ($scope, http, util, dialog, $timeout, I18nService) {
            var ctrl = this;
            var info_key = 'conn_info_' + $scope.conn_type;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                initData: function () {
                    $scope.entity = $scope.entity || {};
                    if (_.isEmpty($scope.entity)) {
                        _.extend($scope.entity, {
                            timer: '2s',
                            rows: [{}]
                        });
                    }
                    if ($scope.entity.timer) {
                        $scope.timeUnit = $scope.entity.timer.replace(/[^a-z]+/ig, "");
                        $scope.time = _.trimEnd($scope.entity.timer, $scope.timeUnit);
                    }

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

                    ctrl.securityMode = [{
                        id: 'None',
                        name: 'None'
                    }, {
                        id: 'Sign',
                        name: 'Sign'
                    }, {
                        id: 'SignAndEncrypt',
                        name: 'SignAndEncrypt'
                    }];
                    ctrl.securityPolicy = [{
                        id: 'None',
                        name: 'None'
                    }, {
                        id: 'Basic128Rsa15',
                        name: 'Basic128Rsa15'
                    }, {
                        id: 'Basic256',
                        name: 'Basic256'
                    }, {
                        id: 'Basic256Sha256',
                        name: 'Basic256Sha256'
                    }];
                    ctrl.message_encoding = [{
                        id: 'Binary',
                        name: 'Binary'
                    }, {
                        id: 'Xml',
                        name: 'Xml'
                    }];
                    ctrl.auth_type = [{
                        id: 'Anonymous',
                        name: 'Anonymous'
                    }, {
                        id: 'UserName',
                        name: 'UserName'
                    }];
                },
                bindEvent: function () {
                    $scope.$on('onSave', function (event, data, checkMessage) {
                        var checkData = ctrl.checkSave(checkMessage);
                        if (checkData === false) {
                            checkMessage.success = false;
                            return false;
                        }
                        // Todo: check conn_info
                        _.set(data, info_key, checkData);
                    });
                    $scope.$on('$destroy', function () {
                        $scope.entity.rows = util.removeHashKey($scope.entity.rows);
                    });
                },
                checkSave: function (checkMessage) {
                    $scope.entity.timer = $scope.time + $scope.timeUnit;
                    var data = _.cloneDeep($scope.entity);
                    if (_.isEmpty(data.endpoint_url)) {
                        checkMessage.messages.push(I18nService.getValue('请输入Url', 'input.url'));
                        return false;
                    }
                    if (!/^[1-9]\d{0,9}$/g.test($scope.time)) {
                        checkMessage.messages.push(I18nService.getValue('定时读取请输入有效整数', 'need_integer_time'));
                        return false;
                    }
                    if ($scope.timeUnit === 'ms') {
                        if ($scope.time < 50) {
                            checkMessage.messages.push(I18nService.getValue('定时读取不少于50毫秒', 'time.min.count'));
                            return false;
                        }
                    }
                    if (data.auth_type === 'UserName') {
                        if (_.isEmpty(data.username)) {
                            checkMessage.messages.push(I18nService.getValue('请输入用户名', 'input.username'));
                            return false;
                        }
                    }
                    var submessages = [];
                    _.each(data.rows, function (row) {

                        if (_.isEmpty(row.namespace) || _.isEmpty(row.name)) {
                            submessages.push(I18nService.getValue('请输入正确的命名空间或节点', 'input.node'));
                            return false;
                        }
                        if (_.isEmpty(row.id)) {
                            row.id = row.namespace + '_' + row.name;
                        }
                    });
                    submessages = _.uniq(submessages);
                    if (submessages.length) {
                        checkMessage.messages = _.concat(checkMessage.messages, submessages);
                        return false;
                    }
                    data.rows = _.uniqBy(data.rows, 'id');
                    data.rows = util.removeHashKey(data.rows);
                    return data;
                },
                removeRow: function (index) {
                    $scope.entity.rows.splice(index, 1);
                    util.apply($scope);
                },
                addRow: function () {
                    $scope.entity.rows.push({});
                    util.apply($scope);
                    $timeout(function () {
                        $('.table-container-div .edittable tbody tr:last-child')[0].scrollIntoView();//获取最后一行,并显示在页面上
                    }, 10);
                },
                loadAllNode: _.debounce(function () {
                    if ($scope.entity.auth_type === 'UserName') {
                        if (_.isEmpty($scope.entity.username)) {
                            dialog.noty(I18nService.getValue('请输入用户名', 'input.username'));
                            return;
                        }
                    }

                    let data = {
                        uuid: $scope.entity.uuid ? $scope.entity.uuid : $scope.$parent.uuid,
                        endpoint_url: $scope.entity.endpoint_url,
                        securityPolicy: $scope.entity.securityPolicy,
                        auth_type: $scope.entity.auth_type,
                        username: $scope.entity.username,
                        password: $scope.entity.password,
                    };

                    dialog.waiting(I18nService.getValue('节点加载中', 'loading') + '...');
                    http.post('connections/opc_pid', data).success(function (result) {
                        dialog.hideWaiting();
                        if (result.success) {
                            let nodeList = _.get(result, 'datas.nodeList', []);
                            if (nodeList.length) {
                                var loadNodeDialog = dialog.show({
                                    template: 'opc_load_node_template',
                                    width: 1200,
                                    title: I18nService.getValue('节点列表', 'node_list'),
                                    controller: 'OpcLoadNodeController',
                                    controllerAs: 'ctrl',
                                    data: {
                                        nodeList: nodeList,
                                        selectNodes: _.isEmpty($scope.entity.rows) ? [] : $scope.entity.rows,
                                        trigger: {
                                            onSuccess: function (nodes) {
                                                $scope.entity.rows = _.concat($scope.entity.rows, nodes);
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
                                dialog.noty(I18nService.getValue('暂时没有获取到任何节点', 'null_node'));
                            }
                        }
                    }, function (err) {
                        dialog.noty(I18nService.getValue('读取失败', 'read_fail'));
                        console.log(err);
                    });
                }, 300)
            });
            ctrl.initialize();
        }]);

    app.controller('OpcLoadNodeController', ['$scope', function ($scope) {
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
                    'height': window.innerHeight - 250 + 'px'
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
                    callback: {
                        // onCheck: ctrl.check
                    }
                };
                let nodes = nodeList;
                $.fn.zTree.init($("#node_tree"), setting, nodes);
                zTree = $.fn.zTree.getZTreeObj("node_tree");
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
                    let checkedNodes = zTree.getCheckedNodes(true);
                    _.remove(checkedNodes, ['isParent', true]);
                    let rows = [];
                    _.each(checkedNodes, function (n) {
                        let row = {};
                        row.id = n.id;
                        row.name = n.name;
                        row.namespace = n.namespace;
                        row.node_class = n.node_class;
                        if (n.dataType) {
                            row.dataType = n.dataType;
                        }
                        if (n.pId) {
                            row.pId = n.pId;
                        }
                        rows.push(row);
                    });

                    $scope.trigger.onSuccess.call(undefined, rows);
                });
            },
            check: function (event, treeId, treeNode) {
                // console.log(treeNode);
            },
            searchNode: _.debounce(function () {
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
            getFontCss: function (treeId, treeNode) {
                return (treeNode.highlight) ? {color: "#A60000"} : {color: "#333"};
            },
            expandAll: _.debounce(function (flag) {
                zTree.expandAll(flag);
            }, 300),
            cleanHighLight: function () {
                _.each(searchNodeList, function (a) {
                    delete a.highlight;
                    zTree.updateNode(a);
                });
            }
        });
        ctrl.initialize();
    }]);
});