define([], function () {
    var app = angular.module('app');

    app.controller('AddUserController', ['$scope', 'DBUtils', 'http', 'util', 'session', 'dialog', '$stateParams', '$state', '$timeout', '$element', '$window', 'janus', 'I18nService',
        function ($scope, DBUtils, http, util, session, dialog, $stateParams, $state, $timeout, $element, $window, janus, I18nService) {
            var ctrl = this;
            $scope.entity = {};
            $scope.tips = "";
            $scope.username = I18nService.getValue("新建用户", 'create_user');
            ctrl.roleQuery = {
                projection: {
                    _id: 1,
                    name: 1
                }
            };
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadData();
                    ctrl.initSubNavOption();
                    ctrl.bindEvent();
                },
                initSubNavOption: function () {
                    ctrl.subNavOptions = {
                        collection: 'user',
                        query: {},
                        label: I18nService.getValue('用户列表', 'user_list'),
                        selected: $stateParams.id,
                        code: 'id',
                        name: 'userName'
                    }
                },
                bindEvent: function () {
                    $scope.$on("Many2OneSelect", function (event, collectionName, roles) {
                        $scope.entity.roles = roles;
                    });
                },
                loadData: function () {
                    if ($stateParams.id !== 'add_user') {
                        DBUtils.find('user', {
                            id: $stateParams.id,
                        }).success(function (result) {
                            var entity = _.get(result, 'datas.result', {});
                            $scope.entity = entity;
                            $scope.username = I18nService.getValue("用户", 'user') + '-' + entity.userName;
                            util.apply($scope)
                        });
                    }
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
                saveNewUser: function () {
                    var entity = $scope.entity;
                    var roleName = [];
                    _.each(entity.roles, function (item) {
                        var name = _.get(item, 'name');
                        roleName.push(name)
                    });
                    $scope.entity.roleName = roleName;
                    var userNameReg = /\w/;
                    var mailReg = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/;
                    if (!entity.userName) {
                        dialog.noty(I18nService.getValue("请输入用户名", 'input.username'));
                        return false;
                    }
                    if (!userNameReg.test(entity.userName)) {
                        dialog.noty(I18nService.getValue("用户名由字母或数字组成", 'user_part'));
                        return false;
                    }
                    if ($stateParams.id === 'add_user') {
                        if (!entity.pwd || !entity.confirmPwd) {
                            dialog.noty(I18nService.getValue("请输入密码", 'please_input_password'));
                            return false;
                        }
                    }
                    if (entity.pwd !== entity.confirmPwd) {
                        dialog.noty(I18nService.getValue("请确保两次密码输入一致", 'confirm_same_password'));
                        return false;
                    }
                    if (entity.pwd && entity.pwd.length < 6) {
                        dialog.noty(I18nService.getValue("密码长度不少于6位", 'password.length.six'));
                        return false;
                    }
                    if (entity.pwd && entity.pwd.length > 40) {
                        dialog.noty(I18nService.getValue("密码长度过长", 'password.long'));
                        return false;
                    }
                    if (entity.mail && !mailReg.test(entity.mail)) {
                        dialog.noty(I18nService.getValue("您的邮箱格式错误！", 'email_wrong'));
                        return false;
                    }
                    if ((entity.tel && isNaN(entity.tel)) || (entity.tel && entity.tel.length > 20)) {
                        dialog.noty(I18nService.getValue("电话请填写数字,且长度不超过20", 'phone_format'));
                        return false;
                    }
                    http.post('user/save', {
                        entity: util.encodeJSON(entity)
                    }).success(function (result) {
                        if (result.success) {
                            var loginAccount = _.get(session, 'user.userName', '');
                            if (entity.userName === loginAccount && entity.pwd) {
                                alert(I18nService.getValue('修改成功，当前登录信息已失效，请重新登录', 'edit_success_login'));//login account password change
                                $window.location.href = cynovan.c_path + 'welcome/#/sync';//back to login page
                            } else {
                                dialog.noty(I18nService.getValue('保存成功', 'save_success'));
                                janus.goToMenuDetailByName('用户', result.datas.id);
                            }
                        } else {
                            dialog.noty(result.datas.reason);
                        }
                    });
                },
                back: function () {
                    janus.goToMenuByName('用户');
                }
            });
            ctrl.initialize();
        }]);
});
