define([], function () {
    var app = angular.module('app');

    app.controller('UdpServerPushExchangeDialogController', ['$scope', '$timeout', 'dialog', 'DBUtils', 'session', 'MonacoEditor', '$element', 'http', 'util', 'I18nService',
        function ($scope, $timeout, dialog, DBUtils, session, MonacoEditor, $element, http, util, I18nService) {
            var ctrl = this;
            var uuid = $scope.uuid;
            $scope.entity = $scope.entity || {};

            var editor1, editor2, editor3;

            _.extend(ctrl, {
                initialize: function () {
                    $timeout(function () {
                        ctrl.bindEvent();
                        ctrl.initLayout();
                        ctrl.initEditor();
                        ctrl.loadEntity();
                    }, 300);
                },
                bindEvent: function () {
                    $scope.$on('success', function (event, checkMessage) {
                        var data = $scope.entity;
                        $scope.$broadcast('onSave', data, checkMessage);
                        if (checkMessage.success === false) {
                            var messages = checkMessage.messages;
                            dialog.noty(messages);
                            return false;
                        }
                        $scope.entity = data;

                        var code = MonacoEditor.getValue('code_editor');
                        $scope.entity.code = _.trim(code);
                        ctrl.confirmSaveData();

                        var flag = ctrl.execCode();
                        if (flag === false) {
                            $scope.trigger.onSuccess(data.code, false, data.testdata, data.output);
                        } else {
                            $scope.trigger.onSuccess(data.code, data.open, data.testdata, data.output);
                        }
                    });
                },
                loadEntity: function () {
                    var entity = {
                        open: false,
                        code: '',
                        testdata: '{"speed": "30", "temperature": "50"}',
                        output: '{"speed": "30", "temperature": "50"}'
                    };
                    $scope.entity = _.extend(entity, $scope.entity);

                    ctrl.setEditorValue();
                },
                initLayout: function () {
                    var height = $(window).height();
                    var width = $('.process-code-dialog').width();

                    var editorHeight = height - 350;
                    $element.find('.edit_box_warp').height(editorHeight).width(width);
                    $element.find('.test-box-wrap').height(editorHeight);

                    $element.find('.edit_box_warp .editor_box').height(editorHeight - 40).width(width);
                    $element.find('.test-box-wrap .editor_box').height(editorHeight - 40).width((width - 60) / 2);
                },
                formatCode: function (editorKey) {
                    MonacoEditor.format(editorKey);
                },
                initEditor: function () {
                    editor1 = MonacoEditor.initEditor('code_editor', {
                        language: 'javascript',
                        height: '100%'
                    });

                    editor2 = MonacoEditor.initEditor('testdata_editor', {
                        language: 'json',
                        height: '100%',
                        automaticLayout: true
                    });

                    editor3 = MonacoEditor.initEditor('outputdata_editor', {
                        language: 'json',
                        height: '100%',
                        automaticLayout: true
                    });
                },
                showHelp: function () {
                    dialog.show({
                        template: 'datapush_help_template',
                        title: I18nService.getValue('代码示例', 'example.code'),
                        width: 1000,
                        buttons: {
                            'success': {
                                label: I18nService.getValue("确认", 'confirm'),
                                className: "btn btn-info"
                            }
                        }
                    });
                },
                getEditorValue: function () {
                    var code = MonacoEditor.getValue('code_editor');
                    $scope.entity.code = _.trim(code);

                    $scope.entity.testdata = MonacoEditor.getValue('testdata_editor');

                    $scope.entity.output = MonacoEditor.getValue('outputdata_editor');
                },
                setEditorValue: function () {
                    MonacoEditor.setValue('code_editor', $scope.entity.code);
                    ctrl.formatCode('code_editor');
                    MonacoEditor.setValue('testdata_editor', $scope.entity.testdata);
                    ctrl.formatCode('testdata_editor');
                    MonacoEditor.setValue('outputdata_editor', $scope.entity.output);
                    ctrl.formatCode('outputdata_editor');
                },
                testRun: function () {
                    var flag = ctrl.execCode(true);
                    if (flag === false) {
                        $scope.entity.open = false;
                    } else {
                        dialog.noty(I18nService.getValue('执行通过，请点击[处理后数据]查看结果', 'look_result_data'));
                    }
                },
                execCode: function (showMsg) {
                    ctrl.getEditorValue();
                    if (!$scope.entity.code && $scope.entity.code.length > 0) {
                        if (showMsg === true) {
                            dialog.noty(I18nService.getValue('代码错误，请检查', 'wrong_check'));
                        }
                        return false;
                    }
                    var data = {};
                    var result = {};
                    try {
                        data = $.parseJSON($scope.entity.testdata);
                    } catch (e) {
                        if (showMsg === true) {
                            dialog.noty(I18nService.getValue('请输入正确的测试数据', 'input.right.test'));
                        }
                        return false;
                    }
                    try {
                        var func = new Function("data", $scope.entity.code);
                        result = func(data);
                    } catch (e) {
                        if (showMsg === true) {
                            dialog.noty(I18nService.getValue('测试错误', 'test.wrong'));
                        }
                        return false;
                    }
                    $scope.entity.output = JSON.stringify(result);
                    MonacoEditor.setValue('outputdata_editor', $scope.entity.output);
                    ctrl.formatCode('outputdata_editor');
                    return true;
                },
                confirmSaveData: function () {
                    var flag = ctrl.execCode();
                    dialog.waiting();
                    if (flag === false) {
                        dialog.hideWaiting();
                        dialog.confirm(I18nService.getValue('代码测试未通过！处理器未生效，请确定是否保存？', 'no_pass_confirm')).on('success', function () {
                            $scope.entity.open = false;
                            // ctrl.saveProcessingCode();
                        });
                    } else {
                        dialog.hideWaiting();
                        // ctrl.saveProcessingCode();
                    }
                }

            });
            ctrl.initialize();
        }]);
});
