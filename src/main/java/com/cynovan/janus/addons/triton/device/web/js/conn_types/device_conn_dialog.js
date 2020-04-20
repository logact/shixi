define(['triton/device/web/js/conn_types/conn_types'], function (ConnTypes) {
    var app = angular.module('app');

    app.controller('TritonConnTypeController', ['$scope', 'template', '$element', '$compile', 'util', '$timeout', 'dialog', 'DBUtils', 'http', 'I18nService',
        function ($scope, template, $element, $compile, util, $timeout, dialog, DBUtils, http, I18nService) {
            var uuid = $scope.uuid;
            var oldScope = null;

            $scope.showExampleButton = false;
            var ctrl = this;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                initData: function () {
                    $scope.connections = _.cloneDeep(ConnTypes);
                    $scope.type=[];
                    _.each($scope.connections, function (value) {
                        if (value.i18nKey) {
                            value.name = I18nService.getValue(value.name, value.i18nKey);
                        }
                        $scope.type.push(value.type);
                    })
                    $scope.type=_.uniq($scope.type);
                    var type=_.find($scope.connections,{'id':$scope.entity.conn_type}).type;
                    ctrl.changetype(type);
                },
                bindEvent: function () {
                    $scope.$watch('entity.conn_type', function (newValue) {
                        if (newValue) {
                            var info_key = 'conn_info_' + newValue;
                            var setting = _.get($scope.entity, info_key, {});
                            ctrl.changeConnection(newValue, setting);
                        }
                    });

                    /*保存设备连接方式*/
                    $scope.$on('success', function (event, checkMessage) {
                        var data = $scope.entity;
                        $scope.$broadcast('onSave', data, checkMessage);
                        if (checkMessage.success === false) {
                            var messages = checkMessage.messages;
                            dialog.noty(messages);
                            return false;
                        }

                        var conKey = 'conn_info_' + data.conn_type;
                        var updateInfo = {'conn_type': data.conn_type};
                        _.set(updateInfo, conKey, _.get(data, conKey, {}));
                        DBUtils.update('dataExchange', {
                            uuid: uuid
                        }, {
                            $set: updateInfo
                        }).success(function () {
                            dialog.noty('操作成功');
                            if (_.isFunction($scope.trigger.onSuccess)) {
                                $scope.trigger.onSuccess.call(null, data);
                            }
                            http.post('connections/restart', {
                                uuid: uuid
                            })
                        });
                    });
                },
                changeconn_type:function(val){
                    $scope.entity.conn_type=val;
                },
                changetype:function(type){
                    $scope.protocoltype=type;
                    $scope.nowcollect=_.filter($scope.connections,{'type':type});
                },
                /* 打开帮助文档 */
                showExampleCode: function () {
                    let conn_type = $scope.entity.conn_type;
                    var conn = _.find($scope.connections, {id: conn_type});
                    if (conn.help_doc) {
                        util.viewHelpDoc(conn.help_doc);
                    }
                },
                changeConnection: function (conn_type, data) {
                    if (oldScope) {
                        oldScope.$destroy();
                    }
                    var conn = _.find($scope.connections, {id: conn_type});

                    if (conn.example_template) {
                        $scope.showExampleButton = true;
                    } else {
                        $scope.showExampleButton = false;
                    }

                    var html = template.get(conn.template);

                    var connectionWarp = $element.find('.connection_warp');
                    if (connectionWarp.length) {
                        connectionWarp.html(html);
                        var newScope = $scope.$new();
                        newScope.uuid = uuid;
                        newScope.conn_type = conn_type;
                        newScope.entity = data;
                        $compile(connectionWarp)(newScope);
                        util.apply($scope);
                        oldScope = newScope;
                    } else {
                        $timeout(function () {
                            ctrl.changeConnection(conn_type, data);
                        }, 150);
                    }
                }
            });
            ctrl.initialize();
        }]);
});