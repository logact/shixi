define(['welcome/login/canvas'], function () {
    var app = angular.module('welcome');

    app.controller('LoginController', ['$scope', 'dialog', 'http', '$window', 'util', '$q', 'DBUtils', 'UserSettingService', 'I18nService', 'database',
        function ($scope, dialog, http, $window, util, $q, DBUtils, UserSettingService, I18nService, database) {
            var ctrl = this;
            let form_url = cynovan.c_path + '/authenticate';
            $scope.user = {};
            $scope.account = "";
            $scope.tips = "";
            $scope.wrongName = false;
            let systemLanguage = window.localStorage.getItem("systemLanguage") || 'zh-cn';
            $scope.nowLanguage = systemLanguage === 'zh-cn' ? 'English' : '中文';

            $scope.loginModel = 'user';
            _.extend(ctrl, {
                initialize: function () {
                    var promise = $q(function (resolve, reject) {
                        http.get('neptune/checkJanus').success(function (result) {
                            if (result.success == false) {
                                /*Janus客户端未注册，连网注册*/
                                $window.location.href = cynovan.c_path + 'welcome/#/sync';
                                reject('janus not activated');
                            } else {
                                resolve('janus activated');
                            }
                        });
                    })

                    promise.then(function (success) {
                        _.extend(ctrl, {
                            login: function () {
                                var flag = ctrl.checkLogin();
                                if (flag === false) {
                                    return false;
                                }
                                http.post(form_url, {
                                    username: $scope.user.name,
                                    password: $scope.user.password
                                }).success(function (result) {
                                    if (result.success) {
                                        $scope.rightName = true;
                                        $scope.rightTips = true;
                                        $scope.tips = '';
                                        //获取左边菜单的收缩状态
                                        UserSettingService.get('subMenuSetting').success(function (result) {
                                            let asideStatus = _.get(result, 'asideStatus', "0");
                                            window.localStorage.setItem('asideStatus', asideStatus);
                                        });
                                        I18nService.setLang(systemLanguage);

                                        $window.location.href = cynovan.c_path + '#/app';
                                        util.apply($scope);
                                    } else {
                                        if ($scope.loginModel === 'user') {
                                            $(".account").addClass("input-red-border");
                                            $scope.wrongName = true;
                                            $scope.tips = '*' + I18nService.getValue("用户名或密码错误", 'login_wrong_tip');
                                            $scope.user.name = '';
                                            $scope.user.password = '';
                                        } else {
                                            $scope.tips = '*' + I18nService.getValue("密码错误", 'password.wrong');
                                            $scope.user.password = '';
                                        }
                                    }
                                })
                            },
                        })
                    }, function (failed) {
                        console.log(failed);
                    })
                },
                checkName: function () {
                    if (!$scope.user.name) {
                        $scope.account = '*' + I18nService.getValue("请输入账号", 'input.account');
                        return false;
                    } else {
                        $scope.account = '';
                        $scope.wrongName = false;
                        $(".account").removeClass("input-red-border");
                    }
                },
                checkLogin: function () {
                    if ($scope.loginModel === 'user') {
                        if (!$scope.user.name) {
                            $scope.account = '*' + I18nService.getValue("请输入账号", 'input.account');
                            $scope.wrongName = true;
                            $scope.tips = '';
                            return false;
                        } else {
                            $scope.account = '';
                            $scope.wrongName = false;
                            $(".account").removeClass("input-red-border");
                        }
                    } else if ($scope.loginModel === 'admin') {
                        if (!$scope.user.password) {
                            $scope.tips = '*' + I18nService.getValue("请输入密码", 'please_input_password');
                            return false;
                        }
                    }
                    return true;
                },
                keyDown: function ($event) {
                    if ($event.keyCode === 13) {
                        ctrl.login();
                    }
                },
                changeLoginModel: function (model) {
                    $scope.loginModel = model;
                    $scope.user.password = '';
                    $scope.account = '';
                    $scope.user.name = '';
                    $scope.tips = '';
                    $scope.wrongName = false;
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
});