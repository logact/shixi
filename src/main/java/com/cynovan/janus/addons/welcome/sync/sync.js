define([], function () {
    var app = angular.module('welcome');

    app.controller('SyncController', ['$scope', 'dialog', 'http', '$element', '$state', 'util', '$window', 'I18nService', 'database',
        function ($scope, dialog, http, $element, $state, util, $window, I18nService, database) {
            var ctrl = this;
            var idx = 0;
            let systemLanguage = window.localStorage.getItem("systemLanguage") || 'zh-cn';
            $scope.nowLanguage = systemLanguage === 'zh-cn' ? 'English' : '中文';
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.startFlow();
                },
                startFlow: function () {
                    dialog.elemWaiting($element.find('.sync_checking_loading'));
                    ctrl.addMessage(I18nService.getValue('检查Janus状态', 'check.janus.status') + '...');
                    ctrl.checkJanus();
                },
                checkJanus: function () {
                    http.get('neptune/checkJanus').success(function (result) {
                        if (result.success == false) {
                            /*Janus客户端未注册，连网注册*/
                            ctrl.addMessage(I18nService.getValue('Janus未注册，准备连接Neptune注册', 'plan.register.janus') + '...');
                            ctrl.checkConnNeptune();
                        } else {
                            ctrl.addMessage(I18nService.getValue('Janus已注册，准备登陆', 'plan.login.janus') + '...');
                            /*Janus已注册，转到登录页面*/
                            $state.go('login');
                        }
                    });
                },
                checkConnNeptune: function () {
                    ctrl.addMessage(I18nService.getValue('正在连接Neptune', 'connect.neptune.ing') + '...');
                    http.get('neptune/conn').success(function (result) {
                        if (result.success) {
                            ctrl.addMessage(I18nService.getValue('连接Neptune成功', 'connect.neptune.success'));
                            ctrl.showBindNeptune();
                        } else {
                            ctrl.addMessage(I18nService.getValue('连接Neptune失败，请检查网络', 'connect.neptune.fail'));
                            dialog.elemWaiting($element.find('.sync_checking_loading'));
                        }
                    });
                },
                showBindNeptune: function () {
                    $scope.waitSync = true;
                    $('.sync_checking').css("display", "none");
                },
                addMessage: function (message) {
                    message = message || I18nService.getValue('错误', 'wrong');
                    idx++;
                    $element.find('.sync_checking_message').append(`<div class="message-item"><span class="idx">${idx}</span>${message}</div>`);
                },
                changeLanguage: function () {
                    if ($scope.nowLanguage === 'English') {
                        $scope.nowLanguage = '中文';
                        database.set('systemLanguage', 'en-us');
                    } else {
                        $scope.nowLanguage = 'English';
                        database.set('systemLanguage', 'zh-cn');
                    }
                    window.localStorage.setItem("systemLanguage", database.get('systemLanguage'));
                    $window.location.reload();
                }
            });
            ctrl.initialize();
        }]);

    app.controller('BindNeptuneController', ['$scope', 'dialog', '$element', 'http', 'util', '$window', 'I18nService',
        function ($scope, dialog, $element, http, util, $window, I18nService) {
            var ctrl = this;

            $scope.user = {};
            $scope.checkResult = false;
            $scope.checkMessage = '';
            $scope.tokenChecked = false;

            $scope.wrongTokenTips = '';
            $scope.wrongPasswordTips = '';
            $scope.wrongControlTips = '';

            $scope.marginTop = {
                'margin-top': 0
            };

            _.extend(ctrl, {
                initialize: function () {
                    $scope.$watch('user.token', function () {
                        $scope.tokenChecked = false;
                    })
                },
                checkFields: function () {
                    if (!$scope.user.token) {
                        // dialog.noty('请输入注册码');
                        $scope.wrongTokenTips = I18nService.getValue('请输入注册码', 'input.register.code');
                        return false;
                    }
                    if (!$scope.user.password) {
                        $scope.wrongPasswordTips = I18nService.getValue('请输入密码', 'please_input_password');
                        $scope.wrongControlTips = '';
                        return false;
                    }
                    if (!$scope.user.control_password) {
                        $scope.wrongControlTips = I18nService.getValue('请输入管理密码', 'input.manage.password');
                        $scope.wrongPasswordTips = '';
                        return false;
                    }
                    return true;
                },
                checkNull: function () {
                    if (!$scope.user.password) {
                        $scope.wrongPasswordTips = I18nService.getValue('请输入密码', 'please_input_password');
                        $scope.wrongControlTips = '';
                        return false;
                    } else {
                        $scope.wrongPasswordTips = '';
                    }
                },
                checkToken: function () {
                    if (!$scope.user.token) {
                        $scope.wrongTokenTips = I18nService.getValue('请输入注册码', 'input.register.code');
                        return false;
                    }

                    http.post('neptune/checkToken', {
                        token: $scope.user.token
                    }).success(function (result) {
                        if (result.success) {
                            $scope.rightTokenTips = true;
                            $scope.tokenChecked = true;
                            $scope.wrongTokenTips = '';
                            $scope.janusInfo = result.datas.janusInfo;
                        } else {
                            $scope.wrongTokenTips = I18nService.getValue('注册码错误', 'register.wrong.code');
                        }
                    })
                },
                bindNeptune: function () {
                    if (!ctrl.checkFields()) {
                        return false;
                    }

                    var resultElement = $element.find('.bind_neptune_result');
                    dialog.elemWaiting(resultElement);
                    http.post('neptune/bind', {
                        token: $scope.user.token,
                        password: $scope.user.password,
                        control_password: $scope.user.control_password
                    }).success(function (result) {
                        dialog.elemWaiting(resultElement);
                        $scope.checkResult = result.success;
                        if (result.success === false) {
                            var info = _.first(result.messages);
                            $scope.checkMessage = info;
                            if (info.indexOf('注册码') >= 0) {
                                $scope.wrongTokenTips = info;
                            } else {
                                $scope.wrongPasswordTips = info;
                            }
                            $scope.user.password = '';
                            $scope.user.control_password = '';
                        } else {
                            // Janus注册成功，转到登录页面
                            dialog.noty(I18nService.getValue('注册成功,3秒后自动转到登录页面！', 'register.success.login'));
                            $scope.rightTokenTips = true;
                            $scope.rightPasswordTips = true;
                            $scope.rightControlTips = true;
                            $scope.wrongTokenTips = '';
                            $scope.wrongPasswordTips = '';
                            $scope.wrongControlTips = '';
                            setTimeout(function () {
                                util.apply($scope);
                                $window.location.reload();
                            }, 2500);
                        }
                        util.apply($scope);
                    });
                },
                keyDown: function ($event) {
                    if ($event.keyCode === 13) {
                        ctrl.checkToken();
                    }
                }
            });
            ctrl.initialize();
        }]);
});