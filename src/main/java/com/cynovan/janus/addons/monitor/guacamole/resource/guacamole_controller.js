define(['web/base/service'], function () {
    var app = angular.module('guacamole', ['ngRoute', 'ui.router', 'cnv.services']);
    app.controller('GuacamoleController', ['$scope', '$sce', 'dialog', function GuacamoleController($scope, $sce, dialog) {
        var ctrl = this;

        _.extend(ctrl, {
            connect: function () {
                var element = document.getElementById('display');
                guac = new Guacamole.Client(
                    new Guacamole.HTTPTunnel("tunnel")
                );

                element.appendChild(guac.getDisplay().getElement());

                // Error handler
                guac.onerror = function (error) {
                    var error = errorMap[error.code] || '连接失败,请重新尝试!';
                    dialog.noty(error);
                };

                var params = getJsonFromUrl();
                var config = getAtobJson(params['config']);
                $scope.isHmi = config.targetType === "device";
                $scope.uuid = params['uuid'];
                guac.connect('protocol=' + params['protocol'] + '&config=' + window.atob(params['config']));
                // Disconnect on close
                window.onunload = function () {
                    guac.disconnect();
                };

                var mouse = new Guacamole.Mouse(guac.getDisplay().getElement());
                mouse.onmousedown =
                    mouse.onmouseup =
                        mouse.onmousemove = function (mouseState) {
                            guac.sendMouseState(mouseState);
                        };

                // Keyboard
                var keyboard = new Guacamole.Keyboard(document);
                keyboard.onkeydown = function (keysym) {
                    guac.sendKeyEvent(1, keysym);
                };

                keyboard.onkeyup = function (keysym) {
                    guac.sendKeyEvent(0, keysym);
                };

                var touch = new Guacamole.Mouse.Touchscreen(guac.getDisplay().getElement());
                touch.onmouseup = touch.onmousedown = touch.onmousemove = mouse.onmouseup;
            },
            sendKeyBoard: function (type) {
                if (guac) {
                    if (type === '1') {
                        guac.sendKeyEvent(1, 65515);
                        guac.sendKeyEvent(0, 65515);
                    } else if (type === '2') {
                        guac.sendKeyEvent(1, 65474);
                        guac.sendKeyEvent(0, 65474);
                    } else if (type === '3') {
                        var KEYSYM_CTRL = 65508;
                        var KEYSYM_ALT = 65513;
                        var KEYSYM_DELETE = 0xFFFF;
                        guac.sendKeyEvent(1, KEYSYM_CTRL);
                        guac.sendKeyEvent(1, KEYSYM_ALT);
                        guac.sendKeyEvent(1, KEYSYM_DELETE);
                        guac.sendKeyEvent(0, KEYSYM_DELETE);
                        guac.sendKeyEvent(0, KEYSYM_ALT);
                        guac.sendKeyEvent(0, KEYSYM_CTRL);
                    }
                }
            },
            closeMonitor: function () {
                var appMonitorBox = $('.app_monitor_box', window.parent.document);
                appMonitorBox.find('.app-monitor-layer').removeClass('hide');
                appMonitorBox.find('.app-monitor-content').addClass('hide');
                appMonitorBox.find('.app-monitor-content iframe').attr('src', '');
                appMonitorBox.find('.left-operation-area').addClass('hide');
                appMonitorBox.find('.right-operation-area').addClass('hide');
            }
        });

        ctrl.connect();

        var errorMap = {
            256: '不支持请求的操作',
            512: '内部错误，操作无法进行',
            513: '由于服务器忙碌，操作无法进行',
            514: '远程桌面服务器未响应',
            515: '远程桌面服务器连接时发生错误',
            516: '未找到关联的资源（如文件或流），操作失败',
            517: '资源已被占用，请求的操作已被阻止',
            768: '请求中的参数错误或无效',
            769: '请求未被授权，用户未登录',
            771: '用户没有权限进行操作',
            776: '用户端（Guacamole前端或浏览器）超时',
            781: '用户端发送的数据大小超出服务端允许的上限',
            783: '用户端发送了未知或无效的数据类型',
            797: '用户端已占用过多的资源，必须对已占用的资源进行释放后才能继续操作',
        }

        function getAtobJson(value) {
            if (value) {
                return $.parseJSON(window.atob(value));
            }
            return {};
        }

        function getJsonFromUrl(hashBased) {
            var query;
            if (hashBased) {
                var pos = location.href.indexOf("?");
                if (pos == -1) return [];
                query = location.href.substr(pos + 1);
            } else {
                query = location.search.substr(1);
            }
            var result = {};
            query.split("&").forEach(function (part) {
                if (!part) return;
                part = part.split("+").join(" "); // replace every + with space, regexp-free version
                var eq = part.indexOf("=");
                var key = eq > -1 ? part.substr(0, eq) : part;
                var val = eq > -1 ? decodeURIComponent(part.substr(eq + 1)) : "";
                var from = key.indexOf("[");
                if (from == -1) result[decodeURIComponent(key)] = val;
                else {
                    var to = key.indexOf("]");
                    var index = decodeURIComponent(key.substring(from + 1, to));
                    key = decodeURIComponent(key.substring(0, from));
                    if (!result[key]) result[key] = [];
                    if (!index) result[key].push(val);
                    else result[key][index] = val;
                }
            });
            return result;
        }
    }]);

    return app;
});