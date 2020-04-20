define([], function () {
    var app = angular.module('app');

    app.controller('DataMonitorDetailController', ['$scope', '$state', 'http', 'dialog', '$element', '$stateParams', 'DBUtils', 'util', '$timeout', 'MonacoEditor', 'janus',
        function ($scope, $state, http, dialog, $element, $stateParams, DBUtils, util, $timeout, MonacoEditor, janus) {
            var ctrl = this;
            $scope.title = '';
            $scope.entity = {};
            let code = '';
            $scope.relatedDevice = [];
            $scope.relatedTeam = [];
            $scope.adaptOption = [{
                id: '1',
                name: '指定设备'
            }, {
                id: '2',
                name: '指定团队'
            }, {
                id: '3',
                name: '所有设备'
            }];
            $scope.triggerTypes = [{
                id: '1',
                name: '通知'
            }, {
                id: '2',
                name: '报警',
            }, {
                id: '3',
                name: '故障'
            }];

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initEntity();
                    ctrl.bindEvent();
                    $timeout(function () {
                        ctrl.initEditor();
                    }, 300);
                    ctrl.initLayout();
                    $scope.showCode = true;
                },
                bindEvent: function () {
                    $scope.$on('$destroy', function () {
                        MonacoEditor.disposeAll();
                    });
                },
                initEntity: function () {
                    let monitorId = $stateParams.id;
                    if (monitorId === 'new') {
                        $scope.title = '监控规则-新建';
                        $scope.entity.adapt = '1';
                    } else {
                        DBUtils.find('dataMonitor', {
                            id: monitorId
                        }).success(function (result) {
                            let entity = _.get(result, 'datas.result', {});
                            $scope.entity = entity;
                            $scope.title = _.join(['监控规则', entity.name], '-');
                            if ($scope.entity.express) {
                                code = $scope.entity.express;
                                ctrl.setEditorValue()
                            }
                            util.apply($scope);
                            util.apply($scope.entity.relatedDevice);
                        });
                    }
                },
                back: function () {
                    janus.goToMenuByName('监控规则');
                },
                saveDataMonitor: function () {
                    $scope.entity.express = $("#expression_textarea").val();
                    if (!$scope.entity.name) {
                        dialog.noty('请设置监控规则名称');
                        return;
                    }
                    if ($scope.entity.adapt === '1') {
                        delete $scope.entity.relatedTeam;
                        if (_.isEmpty($scope.entity.relatedDevice)) {
                            dialog.noty('请选择相关设备');
                            return;
                        }
                    } else if ($scope.entity.adapt === '2') {
                        delete $scope.entity.relatedDevice;
                        if (_.isEmpty($scope.entity.relatedTeam)) {
                            dialog.noty('请选择相关团队的设备');
                            return;
                        }
                    } else {
                        delete $scope.entity.relatedDevice;
                        delete $scope.entity.relatedTeam;
                    }

                    if (ctrl.checkCode()) {
                        ctrl.getEditorValue();
                    } else {
                        return;
                    }

                    var data = _.cloneDeep($scope.entity);
                    data = util.encodeJSON(data);
                    http.post('dataMonitor/save', {
                        data: data
                    }).success(function (result) {
                        let id = _.get(result, 'datas.id', "");
                        if (id) {
                            janus.goToMenuDetailByName('监控规则', id);
                        }
                        dialog.noty('操作成功');
                    });
                },
                addExpress: function (express) {
                    var editor = MonacoEditor.getEditor('code_expression_editor');
                    express = ' ' + express;
                    editor.trigger('keyboard', 'type', {text: express});
                },
                initLayout: function () {
                    var height = $(window).height();
                    $('.editor_box').height(300);
                    $('.edit_box_warp').css({
                        'display': 'inline-block',
                        'width': '100%',
                        'overflow-y': 'auto',
                        'max-height': height - 300
                    });
                    $('.edit_box_header').css({
                        'display': 'flex',
                        'height': '28px',
                        'line-height': '28px',
                        'align-items': 'center',
                        'padding-left': '15px'
                    });
                    $('.edit_box_header .fa').css({
                        'display': 'inline-block',
                        'cursor': 'pointer',
                        'font-size': '18px',
                        'margin-right': '8px'
                    });

                },
                initEditor: function () {
                    MonacoEditor.initEditor('code_expression_editor', {
                        height: 250
                    });
                    ctrl.setEditorValue();
                },
                formatJSON: function () {
                    MonacoEditor.format('code_expression_editor');
                },
                setEditorValue: function () {
                    if (code) {
                        MonacoEditor.setValue('code_expression_editor', code);
                    }
                },
                getEditorValue: function () {
                    $scope.entity.express = MonacoEditor.getValue('code_expression_editor');
                },
                checkCode: function () {
                    code = MonacoEditor.getValue('code_expression_editor');
                    if (code.indexOf('return') === -1) {
                        dialog.noty('表达式中需要包含明确的return语句');
                        return false;
                    }
                    try {
                        let re = /\$(.*?)\$/g;
                        let m = re.exec(code);
                        while (m) {
                            let name = m[1];
                            if (name !== 'data') {
                                dialog.noty(`表达式中 ${name} 不合法，只能用$data$`);
                                return false;
                            }
                            m = re.exec(code);
                        }
                    } catch (e) {
                        return false;
                    }
                    return true;
                },
                goList: function () {
                    janus.goToMenuByName('监控规则')
                }
            });
            $timeout(function () {
                ctrl.initialize();
            }, 100);
        }]);
});
