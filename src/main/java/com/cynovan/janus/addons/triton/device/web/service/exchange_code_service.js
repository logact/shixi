define([], function () {
    var app = angular.module('app');
    app.service('ExchangeCodeService', ['dialog', function (dialog) {
        var service = {
            editExchangeCode: function (exchange) {
                var deferred = $.Deferred();
                dialog.show({
                    template: 'exchange_code_service_template',
                    width: 1200,
                    title: false,
                    controller: 'ExchangeCodeController',
                    controllerAs: 'ctrl',
                    data: {
                        entity: exchange,
                        deferred: deferred
                    }
                });
                return deferred;
            }
        };
        return service;
    }]);

    app.controller('ExchangeCodeController', ['$scope', '$timeout', 'dialog',
        'I18nService', 'MonacoEditor', '$element',
        function ($scope, $timeout, dialog, I18nService, MonacoEditor, $element) {
            var ctrl = this;
            var editor1, editor2, editor3;
            var deferred = $scope.deferred;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.initLayout();
                    ctrl.initEditor();
                    ctrl.setEditorValue();
                },
                bindEvent: function () {
                    $scope.$on('success', function (event, checkMessage) {
                        var data = $scope.entity;
                        var code = MonacoEditor.getValue('code_editor');
                        $scope.entity.code = _.trim(code);
                        ctrl.confirmSaveData();
                    });
                },
                initLayout: function () {
                    var height = $(window).height();
                    var width = $('.process-code-dialog').width();

                    var editorHeight = height - 350;
                    $element.find('.edit_box_warp').height(editorHeight).width(width);
                    $element.find('.test-box-wrap').height(editorHeight);

                    // $element.find('.test-box-wrap').width((width - 40) / 2);

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
                        template: 'exchange_code_help_template',
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
                confirmSaveData: function () {
                    var flag = ctrl.execCode();
                    dialog.waiting();
                    if (flag === false) {
                        dialog.hideWaiting();
                        dialog.confirm(I18nService.getValue('代码测试未通过！处理器未生效，请确定是否保存？', 'no_pass_confirm')).on('success', function () {
                            $scope.entity.open = false;
                            ctrl.saveProcessingCode();
                        });
                    } else {
                        dialog.hideWaiting();
                        ctrl.saveProcessingCode();
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
                        func(data);
                    } catch (e) {
                        if (showMsg === true) {
                            dialog.noty(I18nService.getValue('测试错误', 'test.wrong'));
                        }
                        return false;
                    }
                    $scope.entity.output = JSON.stringify(data);
                    MonacoEditor.setValue('outputdata_editor', $scope.entity.output);
                    ctrl.formatCode('outputdata_editor');
                    return true;
                },
                getEditorValue: function () {
                    var code = MonacoEditor.getValue('code_editor');
                    $scope.entity.code = _.trim(code);

                    $scope.entity.testdata = MonacoEditor.getValue('testdata_editor');

                    $scope.entity.output = MonacoEditor.getValue('outputdata_editor');
                },
                setEditorValue: function () {
                    MonacoEditor.setValue('code_editor', $scope.entity.code || '');
                    ctrl.formatCode('code_editor');
                    MonacoEditor.setValue('testdata_editor', $scope.entity.testdata || '{"speed": "30", "temperature": "50"}');
                    ctrl.formatCode('testdata_editor');
                    MonacoEditor.setValue('outputdata_editor', $scope.entity.output || '{"speed": "30", "temperature": "50"}');
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
                saveProcessingCode: function () {
                    var data = _.pick($scope.entity, ['open', 'code', 'testdata', 'output']);
                    deferred.resolve(data);
                }
            });
            $timeout(function () {
                ctrl.initialize();
            }, 150);
        }]);
});