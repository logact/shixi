define([], function () {
    var app = angular.module('app');
    app.controller('UserInfoController', ['$scope', 'DBUtils', 'http', 'util', 'session', 'dialog', '$rootScope', 'I18nService',
        function ($scope, DBUtils, http, util, session, dialog, $rootScope, I18nService) {
            var ctrl = this;
            var loginAccount = _.get(session, 'user.userName', '');

            $scope.entity = {};

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadData();
                    ctrl.bindEvent();
                },
                loadData: function () {
                    DBUtils.find('user', {
                        userName: loginAccount,
                    }).success(function (result) {
                        delete result.datas.result.password;
                        var entity = _.get(result, 'datas.result', {});
                        $scope.entity = entity;
                    });
                },
                bindEvent: function () {
                    $scope.$watch('entity.userAvatar', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue && !_.isUndefined(oldValue)) {
                                http.post('user/updateAvatar', {
                                    userName: loginAccount,
                                    'userAvatar': newValue
                                }).success(function () {
                                    var imgObject = document.getElementById("userAvatar");
                                    if ($scope.entity.userAvatar) {
                                        imgObject.src = util.getImageUrl($scope.entity.userAvatar);
                                    } else {
                                        imgObject.src = 'resource/index/web/img/user-ico.png';
                                    }
                                });
                            }
                        }
                    });
                },
                showEditUserInfoDialog: function () {
                    var entity = _.cloneDeep($scope.entity);
                    dialog.show({
                        template: 'userinfo_edit_template',
                        title: I18nService.getValue('修改基本信息', 'edit_basic_info'),
                        width: 1200,
                        controller: 'UserInfoEditController',
                        controllerAs: 'ctrl',
                        data: {
                            entity: entity,
                            trigger: {
                                onSuccess: function (data) {
                                    _.extend($scope.entity, data);
                                    util.apply($scope);
                                }
                            }
                        }
                    });
                },
                showChangePasswordDialog: function () {
                    dialog.show({
                        template: 'password_edit_template',
                        title: I18nService.getValue('修改个人密码', 'edit_user_info'),
                        width: 800,
                        controller: 'PasswordEditController',
                        controllerAs: 'ctrl',
                        data: {
                            entity: $scope.entity
                        }
                    });
                }
            });
            ctrl.initialize();
        }]);
    app.controller('UserInfoEditController', ['$scope', 'dialog', 'http', 'util', 'I18nService',
        function ($scope, dialog, http, util, I18nService) {
            var ctrl = this;
            _.extend(ctrl, {
                initialize: function () {
                    $scope.$on('success', function (event, checkMessage) {
                        ctrl.editUserInfo();
                        $scope.trigger.onSuccess($scope.entity);
                    });
                },
                editUserInfo: function () {
                    var entity = $scope.entity;
                    var mailReg = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/;
                    if (entity.mail && !mailReg.test(entity.mail)) {
                        dialog.noty(I18nService.getValue("您的邮箱格式错误！", 'email_wrong'));
                        return false;
                    }
                    http.post('user/save', {
                        entity: util.encodeJSON(entity)
                    }).success(function () {
                        dialog.noty(I18nService.getValue('修改成功', 'edit_success'));
                    });
                },
            });
            ctrl.initialize();
        }]);
    app.controller('PasswordEditController', ['$scope', 'dialog', 'http', 'util', '$window', 'I18nService',
        function ($scope, dialog, http, util, $window, I18nService) {
            var ctrl = this;
            $scope.tips = "";
            _.extend(ctrl, {
                initialize: function () {
                    $scope.$on('success', function (event, checkMessage) {
                        var entity = $scope.entity;
                        if (!entity.oldPwd) {
                            dialog.noty(I18nService.getValue("请输入原密码", 'input.old.password'));
                            checkMessage.success = false;
                            return false;
                        }
                        if (!entity.pwd) {
                            dialog.noty(I18nService.getValue("请输入新密码", 'input.new.password'));
                            checkMessage.success = false;
                            return false;
                        }
                        if (!entity.confirmPwd) {
                            dialog.noty(I18nService.getValue("请确认新密码", 'confirm_new_password'));
                            checkMessage.success = false;
                            return false;
                        }
                        if (entity.pwd !== entity.confirmPwd) {
                            dialog.noty(I18nService.getValue("请确保两次密码输入一致", 'confirm_same_password'));
                            checkMessage.success = false;
                            return false;
                        }
                        if (entity.pwd && entity.pwd.length < 6) {
                            dialog.noty(I18nService.getValue("密码长度不少于6位", 'password.length.six'));
                            checkMessage.success = false;
                            return false;
                        }
                        if (entity.pwd && entity.pwd.length > 40) {
                            dialog.noty(I18nService.getValue("密码长度过长", 'password.long'));
                            checkMessage.success = false;
                            return false;
                        }
                        ctrl.changeUserPassword(entity);
                    });
                },
                confirmPassword: function () {
                    $scope.$watch('entity.pwd + entity.confirmPwd', _.debounce(function () {
                        var entity = $scope.entity;
                        if (entity.pwd !== entity.confirmPwd) {
                            $('.check-status-i').removeClass('right-status-i');
                            $('.check-status-i').addClass('wrong-status-i');
                            $scope.tips = '* ' + I18nService.getValue("两次密码输入不一致", 'password.defferent');
                            util.apply($scope);
                        }
                        if (entity.confirmPwd && entity.pwd === entity.confirmPwd) {
                            $('.check-status-i').removeClass('wrong-status-i');
                            $('.check-status-i').addClass('right-status-i');
                            $scope.tips = "";
                            util.apply($scope);
                        }
                    }, 300));
                },
                changeUserPassword: function (entity) {
                    http.post('user/updatePassword', {
                        entity: util.encodeJSON(entity)
                    }).success(function (result) {
                        if (result.success) {
                            alert(I18nService.getValue('修改成功，当前登录信息已失效，请重新登录', 'edit_success_login'));//login account password change
                            $window.location.href = cynovan.c_path + 'welcome/#/sync';//back to login page
                        } else {
                            dialog.noty(result.datas.reason);
                            entity.oldPwd = '';
                            entity.pwd = '';
                            entity.confirmPwd = '';
                        }
                    });
                },
            });
            ctrl.initialize();
        }]);
});
