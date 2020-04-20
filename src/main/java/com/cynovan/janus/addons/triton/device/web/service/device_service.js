define([], function () {
    var app = angular.module('cnv.device.service', ['ngResource']);

    app.service('DeviceService', ['http', '$q', 'dialog', 'DBUtils', 'websocket', '$timeout',
        function (http, $q, dialog, DBUtils, websocket, $timeout) {
            var service = {
                push: function (uuid, action, params) {
                    if (!uuid) {
                        console.error('no uuid provided');
                        return;
                    }
                    if (_.isString(action)) {
                        action = {
                            'action': action,
                        };
                    }
                    if (_.isObject(params)) {
                        action = _.extend(action, {data: params});
                    }

                    action.uuid = uuid;
                    action = JSON.stringify(action);

                    service.checkControlPassword().then(function (success) {
                        dialog.noty('下发成功！');
                        http.post('device/pushToDevice', uuid, {
                            'action': action,
                        });
                    }, function (reason) {
                        console.log(reason);
                    })
                },
                checkControlPassword: function () {
                    var promise = $q(function (resolve, reject) {
                        var pwdDialog = dialog.show({
                            title: '请输入控制密码',
                            template: 'triton_device_push_template',
                            data: {
                                entity: {
                                    control_pw: ''
                                },
                            },
                            width: 800,
                            controller: ['$scope', '$element', function (dScope, dElement) {
                                $timeout(function () {
                                    dElement.find('input[type="password"]').focus();
                                }, 1500);

                                var submit = function () {
                                    if (dScope.entity.control_pw <= 0) {
                                        dialog.noty('控制密码不能为空');
                                        return false;
                                    }

                                    var pwdPromise = $q(function (pwdResolve, pwdReject) {
                                        http.post('device/checkControlPwd', {
                                            password: dScope.entity.control_pw
                                        }).success(function (result) {
                                            if (result.success) {
                                                pwdResolve('password validate success!')
                                            } else {
                                                pwdReject('控制密码错误');
                                            }
                                        })
                                    });

                                    pwdPromise.then(function (success) {
                                        resolve(success);
                                        pwdDialog.modal('hide');
                                    }, function (reason) {
                                        dialog.noty(reason);
                                    });
                                };
                                dScope.keyDown = function ($event) {
                                    if ($event.keyCode === 13) {
                                        submit();
                                    }
                                };
                                dScope.$on('success', function (event, checkMessage) {
                                    checkMessage.success = false;
                                    submit();
                                });
                                dScope.$on('cancel', function () {
                                    reject('password input canceled!');
                                });
                            }]
                        });
                    });
                    return promise;
                },
                pushWithoutPassword: function (uuid, action, params) {
                    if (!uuid) {
                        console.error('no uuid provided');
                        return;
                    }
                    if (_.isString(action)) {
                        action = {
                            'action': action,
                        };
                    }
                    if (_.isObject(params)) {
                        action = _.extend(action, {data: params});
                    }

                    action.uuid = uuid;
                    action = JSON.stringify(action);

                    http.post('device/pushToDevice', uuid, {
                        'action': action,
                    })
                },
                pushQueryConfigAction: function (uuid) {
                    return http.get('device/pushQueryConfig', uuid);
                }
            }
            return service;
        }]);

    app.service('DevicePushService', ['http', function (http) {
        return {
            pushAction: function (uuid, action, params, transform) {
                if (!uuid) {
                    return;
                }
                if (_.isString(action)) {
                    action = {
                        'action': action,
                    };
                }
                if (_.isObject(params)) {
                    action = _.extend(action, {data: params});
                }

                if (transform === true) {
                    action = _.extend(action, {transform: true});
                }
                action.uuid = uuid;
                action = JSON.stringify(action);
                return http.post('device/pushToDevice', uuid, {
                    'action': action,
                })
            }
        }
    }]);

});