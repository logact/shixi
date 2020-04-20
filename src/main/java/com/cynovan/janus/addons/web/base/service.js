define(['web/lib/md5/spark-md5', 'vs/editor/editor.main'], function (SparkMD5) {
    bootbox.setDefaults({
        'locale': 'zh_CN'
    });

    var app = angular.module('cnv.services', ['ngResource']);

    app.config(['$httpProvider', '$httpParamSerializerJQLikeProvider',
        function ($httpProvider, $httpParamSerializerJQLikeProvider) {
            $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
            $httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
            // Override $http service's default transformRequest
            $httpProvider.defaults.transformRequest.unshift($httpParamSerializerJQLikeProvider.$get());
        }]);

    app.config(['$qProvider', function ($qProvider) {
        $qProvider.errorOnUnhandledRejections(false);
    }]);

    app.service('http', ['$http', function ($http) {
        return {
            ajax: function () {
                var arr = _.toArray(arguments);
                var cfg = {
                    method: 'get',
                    cache: false,
                    responseType: 'json'
                };
                _.extend(cfg, arr[0]);
                arr.shift();

                var flag = true;
                if (arr && arr.length) {
                    flag = _.last(arr);
                    if (flag === false) {
                        arr.pop();
                    }
                    var data = _.last(arr);
                    if (_.isObject(data)) {
                        var method = _.lowerCase(cfg.method);
                        if (cfg.method === 'post') {
                            cfg.data = arr.pop();
                        } else {
                            cfg.params = arr.pop();
                        }
                    }
                }
                cfg.url = arr.join('/');
                var promise = $http(cfg);
                promise.success = function (func) {
                    if (_.isFunction(func)) {
                        promise.then(function () {
                            var response = _.first(_.toArray(arguments));
                            func.call(null, _.get(response, 'data'));
                        });
                    }
                }
                return promise;
            },
            get: function () {
                var arr = _.toArray(arguments);
                arr.unshift({
                    method: 'get'
                });
                return this.ajax.apply(null, arr);
            },
            post: function () {
                var arr = _.toArray(arguments);
                arr.unshift({
                    method: 'post'
                });
                return this.ajax.apply(null, arr);
            }
        }
    }]);

    app.service('database', [function () {
        var _v_ = '@' + cynovan.version + '_janus_';
        return {
            set: function (key, value) {
                if (key) {
                    if (key.indexOf(_v_) === -1) {
                        key = key + _v_;
                    }
                    $.jStorage.set(key, value);
                }
            },
            get: function (key, fn) {
                if (key) {
                    if (key.indexOf(_v_) === -1) {
                        key = key + _v_;
                    }
                    var value = $.jStorage.get(key);
                    if (!value && !_.isUndefined(fn)) {
                        if (_.isFunction(fn)) {
                            value = fn.call();
                        } else {
                            value = fn;
                        }
                        if (value) {
                            this.set(key, value);
                        }
                    }
                    return value;
                }
            }
        }
    }]);

    app.service('template', ['database', function (database) {
        return {
            getUrl: function (name) {
                return 'initialize/template/' + name + '?v=' + cynovan.version;
            },
            get: function (templateName) {
                if (!templateName) {
                    return "";
                }
                var key = 'tplt-' + templateName;
                var value = database.get(key, function () {
                    var tplt;
                    $.ajax({
                        type: 'get',
                        url: 'initialize/template/' + templateName + '?v=' + cynovan.version,
                        dataType: 'html',
                        async: false,
                        cache: false
                    }).done(function (html) {
                        tplt = html;
                    });
                    return tplt;
                });
                return value;
            }
        }
    }]);

    var session = {};

    app.service('session', ['http', function (http) {
        if (_.isEmpty(session)) {
            $.ajax({
                type: 'get',
                url: 'session',
                dataType: 'json',
                async: false
            }).done(function (result) {
                session = result;
            });
        }
        return session;
    }]);

    app.service('util', ['$q', 'template', 'dialog', function ($q, template, dialog) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        return {
            getAppImage: function (image) {
                if (image) {
                    var arr = [];
                    arr.push(cynovan.r_path);
                    arr.push(image);
                    let url = arr.join('/');
                    url = _.replace(url, '//', '/');
                    return url;
                }
                return '';
            },
            apply: function ($scope) {
                if ($scope) {
                    if ($scope.$$phase || $scope.$root.$$phase) {
                        return;
                    } else {
                        $scope.$apply()
                    }
                }
            },
            getImageUrl: function (fileId, dft, thumb) {
                fileId = fileId || '';
                if (_.isUndefined(thumb)) {
                    thumb = true;
                }
                if (fileId) {
                    var arr = [];
                    arr.push(cynovan.c_path);
                    arr.push('gridfs');
                    arr.push(fileId);
                    var url = arr.join('/');
                    var params = [];
                    if (thumb === false) {
                        params.push('thumb=false');
                    }
                    if (params.length) {
                        url += '?';
                        url += params.join('&');
                    }
                    return url;
                } else {
                    if (dft) {
                        return cynovan.c_path + '/resource/' + dft;
                    }
                }
                return cynovan.c_path + '/resource/index/web/img/default.png';
            },
            uuid: function (len, radix) {
                len = len || 8;
                radix = radix || 16;
                var uuid = [], i;
                radix = radix || chars.length;

                if (len) {
                    // Compact form
                    for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
                } else {
                    // rfc4122, version 4 form
                    var r;

                    // rfc4122 requires these characters
                    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                    uuid[14] = '4';

                    // Fill in random data. At i==19 set the high bits of clock sequence as
                    // per rfc4122, sec. 4.1.5
                    for (i = 0; i < 36; i++) {
                        if (!uuid[i]) {
                            r = 0 | Math.random() * 16;
                            uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                        }
                    }
                }
                return uuid.join('');
            },
            encodeJSON: function (value) {
                if (value) {
                    if (_.isObject(value)) {
                        if (_.has(value, "$$hashKey")) {
                            value = _.omit(value, ['$$hashKey']);
                        }
                    }

                    if (_.isObject(value) || _.isArray(value)) {
                        value = JSON.stringify(value);
                    }
                    value = encodeURIComponent(value);
                    return value;
                }
                return "";
            },
            removeHashKey: function (object) {
                if (object) {
                    if (_.isArray(object)) {
                        object = _.map(object, function (item) {
                            return _.omit(item, ['$$hashKey']);
                        });
                        return object;
                    } else if (_.isObject(object)) {
                        return _.omit(object, ['$$hashKey']);
                    }
                    return object;
                }
                return '';
            },
            validator: function (object, validator) {
                var checker = true;
                _.each(validator, function (message, key) {
                    var value = _.get(object, key, '');
                    if (!value) {
                        dialog.noty(message);
                        checker = false;
                        return false;
                    }
                });
                if (checker === false) {
                    return false;
                }
                return true;
            },
            viewHelpDoc: function (docKey) {
                if (docKey) {
                    let url = 'http://' + window.location.host + '/api#/doc/' + docKey;
                    window.open(url);
                }
            }
        }
    }]);

    Noty.overrideDefaults({
        layout: 'topCenter',
        theme: 'relax',
        closeWith: ['click'],
        animation: {
            open: 'animated fadeInDown',
            close: 'animated fadeOutUp'
        },
        type: 'alert',
        progressBar: false,
        timeout: 4000
    });

    function buildNoty(message) {
        var options = {};
        if (_.isArray(message)) {
            options.message = message;
        } else if (_.isPlainObject(message)) {
            options = message;
        } else {
            options.text = message;
        }
        if (_.isString(options.message) && options.text) {
            options.text = options.message;
        }

        var html = [];
        var cls = 'noty-box ';
        if (options.title) {
            html.push(`<div class="noty-title">${options.title}</div>`);
            cls += ' noty-box-with-title'
        }
        html.unshift(`<div class="${cls}">`);
        if (_.isArray(options.message)) {
            html.push('<ul class="noty-ul">');
            _.each(options.message, function (msg) {
                html.push(`<li>${msg}</li>`);
            });
            html.push('</ul>');
        } else {
            html.push(`<div class="noty-text">${options.text}</div>`);
        }
        html.push('</div>');
        options.text = _.join(html, '');
        return options;
    }

    app.service('dialog', ['template', '$compile', '$rootScope', '$controller', '$window', 'I18nService',
        function (template, $compile, $rootScope, $controller, $window, I18nService) {
            function processMessage(options, _options) {
                if (_.isString(_options)) {
                    options.message = _options;
                }

                if (_.isArray(_options)) {
                    var html = [];
                    html.push('<ul class="message_ul">');
                    _.each(_options, function (m) {
                        html.push('<li>');
                        html.push(m);
                        html.push('</li>');
                    });
                    html.push('</ul>');
                    options.message = html.join('');
                }

                if (_.isObject(_options)) {
                    options = _.extend(options, _options);
                }

                if (options.template) {
                    options.message = template.get(options.template) || options.template;
                }

                return options;
            }

            var service = {
                noty: function (messages) {
                    if (messages) {
                        new Noty(buildNoty(messages)).show();
                    }
                },
                notyWithRefresh: function (message, $scope) {
                    service.noty(message);
                    setTimeout(function () {
                        $window.location.reload();
                        if ($scope) {
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    }, 1500);
                },
                elemWaiting: function (ele, message) {
                    if (ele && ele.length) {
                        let loadingElement = ele.find('.loading-dialog-body');
                        if (!loadingElement.length) {
                            message = message || I18nService.getValue('处理中,请稍候', 'processing.wait') + '...';
                            loadingElement = `<div class="loading-dialog-body"><div class="waittimer"></div><div class="context">${message}</div></div>`;
                            var eleHeight = ele.height();
                            var marginTop = (eleHeight - 60) / 2;
                            ele.children().addClass('hide');
                            ele.append(loadingElement);
                            ele.find('.loading-dialog-body').css({
                                marginTop: marginTop + 'px'
                            });
                        } else {
                            ele.find('.loading-dialog-body').remove();
                            ele.contents().removeClass('hide');
                        }
                    }
                },
                waiting: function (message) {
                    message = message || I18nService.getValue('处理中', 'processing') + '...';
                    var html = template.get('waiting_service_dialog');
                    html = _.replace(html, '@MESSAGE@', message);
                    var opts = {
                        message: html,
                        title: message,
                        buttons: {},
                        width: 650
                    };
                    return this.show(opts);
                },
                hideWaiting: function () {
                    var bootbox = $('.loading-dialog-body').closest('.bootbox');
                    bootbox.modal('hide');
                },
                show: function (_options) {
                    var options = {
                        title: I18nService.getValue('提示', 'tip'),
                        buttons: {
                            'success': {
                                label: I18nService.getValue("确认", 'confirm'),
                                className: "btn btn-success",
                                callback: function (event) {
                                    var element = $(event.target).closest('.bootbox');
                                    var scope = element.scope();
                                    var checkMessage = {success: true, messages: [], datas: {}};
                                    scope.$emit('success', checkMessage);
                                    if (checkMessage.success === false) {
                                        return false;
                                    }

                                    return true;
                                }
                            },
                            'cancel': {
                                label: I18nService.getValue('取消', 'cancel'),
                                className: 'btn btn-default',
                                callback: function (event) {
                                    var element = $(event.target).closest('.bootbox');
                                    var scope = element.scope();
                                    var checkMessage = {success: true};
                                    scope.$emit('cancel', checkMessage);
                                    if (checkMessage.success === false) {
                                        return false;
                                    }
                                    return true;
                                }
                            }
                        },
                        onEscape: true
                    };
                    options = processMessage(options, _options);
                    var scope;
                    if (options.$scope) {
                        scope = options.$scope.$new();
                    } else {
                        scope = $rootScope.$new(true);
                    }
                    var data = {};
                    if (options.data) {
                        data = _.extend(data, options.data);
                    }

                    if (!_.isEmpty(data)) {
                        _.extend(scope, data);
                    }
                    scope.options = options;

                    if (options.cancel === false) {
                        delete options.buttons.cancel;
                    }

                    if (_.isFunction(options.beforeShow)) {
                        options.beforeShow.call(null, options);
                    }

                    if (options.fullscreen === true) {
                        delete options.buttons;
                        delete options.title;
                    }

                    var dialog = bootbox.dialog(options);
                    if (_.isNumber(options.width)) {
                        dialog.find('.modal-dialog').width(options.width);
                    }

                    if (options.fullscreen === true) {
                        dialog.addClass('dialog_fullscreen');
                    } else {
                        let navbarHeight = $('#app-navbar').innerHeight() || 0;
                        let mheaderHeight = options.title ? 60 : 0;
                        let footerHeight = _.isEmpty(options.buttons) ? 0 : 70;
                        let modalMarginBootom = 60;
                        let maxHeight = window.innerHeight - navbarHeight - mheaderHeight - footerHeight - modalMarginBootom;
                        let css = {
                            'max-height': maxHeight + 'px',
                        };
                        dialog.find('.bootbox-body').css(css);
                    }

                    if (options.title === false) {
                        dialog.addClass('dialog_notitle');
                    }

                    if (options.controller && (angular.isString(options.controller) || angular.isArray(options.controller) || angular.isFunction(options.controller))) {
                        var label;
                        if (options.controllerAs && angular.isString(options.controllerAs)) {
                            label = options.controllerAs;
                        }
                        var controllerInstance = $controller(options.controller, {
                                $scope: scope,
                                $element: dialog
                            },
                            true,
                            label
                        );

                        if (typeof controllerInstance === 'function') {
                            controllerInstance();
                        }
                    }

                    $compile(dialog)(scope);

                    if (options.id) {
                        dialog.attr('id', options.id);
                    }

                    dialog.on('hidden.bs.modal', function () {
                        scope.$emit('hide');
                        if (scope) {
                            scope.$destroy();
                        }
                    });

                    if (_.isFunction(options.afterShow)) {
                        options.afterShow.call(null, dialog, options);
                    }
                    scope.$emit('afterShow');

                    return dialog;
                },
                confirm: function (_options) {
                    var options = {
                        title: I18nService.getValue('提示', 'tip'),
                        buttons: {
                            'success': {
                                label: I18nService.getValue("确认", 'confirm'),
                                className: "btn btn-success",
                                callback: function (event) {
                                    var element = $(event.target).closest('.bootbox');
                                    var checkMessage = {success: true};
                                    element.trigger('success', [checkMessage, options]);
                                    if (checkMessage.success === false) {
                                        return false;
                                    }
                                    return true;
                                }
                            },
                            'cancel': {
                                label: I18nService.getValue('取消', 'cancel'),
                                className: 'btn btn-default',
                                callback: function (event) {
                                    var element = $(event.target).closest('.bootbox');
                                    var checkMessage = {success: true};
                                    element.trigger('cancel', [checkMessage]);
                                    if (checkMessage.success === false) {
                                        return false;
                                    }
                                    return true;
                                }
                            }
                        },
                        onEscape: true
                    };
                    options = processMessage(options, _options);
                    return bootbox.dialog(options);
                },
                alert: function (_options) {
                    var options = {
                        title: I18nService.getValue('提示', 'tip'),
                        buttons: {
                            'success': {
                                label: I18nService.getValue("确认", 'confirm'),
                                className: "btn btn-success",
                                callback: function (event) {
                                    var element = $(event.target).closest('.bootbox');
                                    var checkMessage = {success: true};
                                    element.trigger('success', [checkMessage]);
                                    if (checkMessage.success === false) {
                                        return false;
                                    }
                                    return true;
                                }
                            }
                        },
                        onEscape: true
                    };
                    options = processMessage(options, _options);
                    return bootbox.dialog(options);
                }
            };
            return service;
        }]);

    app.service('DBUtils', ['http', 'template', 'dialog', '$timeout',
        function (http, template, dialog, $timeout) {
            function processArr(str) {
                if (_.isArray(str)) {
                    return JSON.stringify(str);
                } else {
                    return str || '';
                }
            }

            return {
                exec: function () {
                    var arr = _.toArray(arguments);
                    var exec = arr.shift();
                    var collection = arr.shift();
                    arr = JSON.stringify(arr);
                    arr = encodeURIComponent(arr);
                    return http.post('dbs/exec', {
                        exec: exec,
                        collection: collection,
                        params: arr
                    });
                },
                list: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('list');
                    return this.exec.apply(null, arr);
                },
                find: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('find');
                    return this.exec.apply(null, arr);
                },
                remove: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('remove');
                    return this.exec.apply(null, arr);
                },
                delete: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('delete');
                    return this.exec.apply(null, arr);
                },
                deleteMany: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('deleteMany');
                    return this.exec.apply(null, arr);
                },
                save: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('save');
                    return this.exec.apply(null, arr);
                },
                update: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('update');
                    return this.exec.apply(null, arr);
                },
                updateMany: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('update');
                    return this.exec.apply(null, arr);
                },
                page: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('update');
                    return this.exec.apply(null, arr);
                },
                count: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('count');
                    return this.exec.apply(null, arr);
                },
                aggregator: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('aggregator');
                    return this.exec.apply(null, arr);
                },
                aggregate: function () {
                    var arr = _.toArray(arguments);
                    arr.unshift('aggregate');
                    return this.exec.apply(null, arr);
                }
            }
        }]);

    app.service('websocket', ['session', 'util', function (session, util) {
        var socketMap = {}, stompClientMap = {};
        var expiredUnit = 1 * 60 * 1000;
        var DEFAULT_THROTTLE = 180;
        var service = {
            sub: function (options) {
                if (options.throttle !== false) {
                    // 默认限流 180ms
                    options.throttle = _.toNumber(options.throttle || DEFAULT_THROTTLE);
                } else {
                    options.throttle = 0;
                }
                var topic = options.topic;
                if (topic && topic.indexOf('ws/') === -1) {
                    topic = '/ws/' + topic;
                }
                options.topic = topic;

                var rateList = [];
                var socket = new SockJS(cynovan.c_path + '/ws', null, {});
                var stompClient = Stomp.over(socket);
                if (!cynovan.debug) {
                    stompClient.debug = null;
                }
                socketMap[topic] = socket;
                stompClientMap[topic] = stompClient;

                var heartBeatFunc = _.throttle(function () {
                    if (stompClient) {
                        stompClient.send('/ws/heartbeat/' + options.heartbeat, {}, topic);
                    }
                }, expiredUnit);

                var onData = _.throttle(function (result, rate) {
                    if (_.isFunction(options.onmessage)) {
                        if (result.body) {
                            var data = {};
                            try {
                                data = JSON.parse(result.body);
                            } catch (e) {
                                data = JSON.parse(_.replace(result.body, /NaN/g, "0"));
                            }
                            options.onmessage.call(null, data, rate);
                        }
                    }
                }, options.throttle);

                stompClient.connect({user_id: session.user.id}, function (frame) {
                    stompClient.subscribe(topic, function (result) {
                        if (options.once) {
                            service.unsub(topic);
                        } else {
                            if (options.heartbeat) {
                                heartBeatFunc.call(null, result);
                            }
                        }
                        /*计算大概的数据速率*/
                        var rate = -1;
                        if (options.rate === true) {
                            if (rateList.length > 8) {
                                rateList.shift();
                            }
                            rateList.push(new Date().getTime());
                            var rateLength = rateList.length;
                            if (rateLength >= 8) {
                                var last = _.last(rateList);
                                var first = _.first(rateList);
                                var diff = last - first;
                                rate = Math.floor(diff / (rateLength - 1));
                            }
                        }
                        onData.call(null, result, rate);
                    });

                    if (options.scope) {
                        options.scope.$on('$destroy', function () {
                            service.unsub(topic);
                        })
                    }

                    if (_.isFunction(options.onconnect)) {
                        options.onconnect.call();
                    }
                });

                return stompClient;
            },
            unsub: function (topic) {
                if (topic && topic.indexOf('ws/') === -1) {
                    topic = '/ws/' + topic;
                }

                var client = stompClientMap[topic];
                if (client) {
                    client.disconnect();
                    delete stompClientMap[topic];
                }

                var sock = socketMap[topic];
                if (sock) {
                    sock.close();
                    delete socketMap[topic];
                }
            }
        }
        return service;
    }]);

    app.service('validator', function () {

        var emailRegex = /^[_\.0-9a-z-]+@([0-9a-z][0-9a-z-]+\.){1,4}[a-z]{2,3}$/;
        var mobileRegex = /(^0{0,1}1[3|4|5|6|7|8|9][0-9]{9}$)/; //
        var fieldNameRegex = /^\w+$/; //匹配由数字、26个英文字母或者下划线组成的字符串
        var integerRegex = /^\d+$/;


        var validateEmail = function (email) {
            return emailRegex.test(email);
        }

        var validateMobile = function (mobile) {
            return mobileRegex.test(mobile);
        }

        var validateFieldName = function (field) {
            return fieldNameRegex.test(field);
        }

        var validateInteger = function (integer) {
            return integerRegex.test(integer);
        }

        return {
            email: validateEmail,
            mobile: validateMobile,
            field: validateFieldName,
            integer: validateInteger
        }
    });

    app.service('formatter', function () {
        var _bytesToSize = function (bytes) {
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes == 0) return '0 Byte';
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
            return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
        };

        var _toPercentage = function (portion, total) {
            if (total == '0') return '0';
            return (portion / total * 100).toFixed(2);
        };

        return {
            byteToSize: _bytesToSize,
            toPercentage: _toPercentage
        }
    });

    app.service('FileUploadService', ['dialog', 'I18nService', function (dialog, I18nService) {
        var service = {
            initialize: function (_options) {
                var options = {
                    buttonElement: '',
                    fileElement: '',
                    fileType: /^image\//,
                    width: 600,
                    height: 600
                };
                _.extend(options, _options);

                var url = _.get(options, 'url', '/gridfs/upload');

                var subject = $.Deferred();
                if (options.buttonElement && options.fileElement) {
                    function uploadFile(fileInput) {
                        var formData = new FormData();
                        var files = fileInput[0].files;
                        var flag = true;
                        _.each(files, function (file) {
                            if (options.fileType) {
                                if (!options.fileType.test(file.type)) {
                                    if (options.fileType.toString() === "/zip/") {
                                        //如果是zip文件必须以.zip结尾
                                        if (!_.endsWith(file.name, ".zip")) {
                                            dialog.noty(I18nService.getValue('格式不匹配', 'format.not.match'));
                                            flag = false;
                                            return false;
                                        }
                                    } else {
                                        dialog.noty(I18nService.getValue('格式不匹配', 'format.not.match'));
                                        flag = false;
                                        return false;
                                    }
                                }
                            }
                            formData.append('FILE', file);
                        })

                        var file = formData.get('FILE');
                        if (options.beforeUpload && typeof options.beforeUpload === 'function') {
                            flag = options.beforeUpload.call(null, file) && flag;
                        }
                        fileInput.val('');
                        if (flag === false) {
                            return;
                        }
                        $.ajax({
                            type: 'post',
                            url: cynovan.c_path + url,
                            data: formData,
                            contentType: false,
                            processData: false,
                            dataType: 'json',
                            success: function (result) {
                                dialog.noty(I18nService.getValue('上传成功', 'upload.success'));
                                // dialog.noty('上传成功');
                                fileInput.val('');
                                subject.notify(result);
                            }
                        });
                    }

                    options.buttonElement.click(function (event) {
                        options.fileElement.click();
                    });

                    options.fileElement.change(function (event) {
                        var fileInput = $(event.target);
                        uploadFile(fileInput);
                    });
                }
                return subject;
            }
        };
        return service;
    }]);

    app.service('UserSettingService', ['http', function (http) {
        var service = {
            get: function (key) {
                return http.get('userSetting/get', {
                    key: key
                });
            },
            set: function (key, value) {
                if (_.isObject(value)) {
                    value = JSON.stringify(value);
                }
                return http.get('userSetting/set', {
                    key: key,
                    value: value
                });
            }
        };
        return service;
    }]);

    app.service('SecurityService', ['session', '$stateParams', function (session, $stateParams) {
        var service = {
            isSuperUser: function () {
                let username = _.get(session, 'user.userName', '');
                let admin = _.get(session, 'user.admin', false);
                if (_.isEmpty(username) || admin == true) {
                    return true;
                }
                return false;
            },
            hasRight: function (moduleName, rightName) {
                let appId = _.get($stateParams, 'appId', '');
                let menuIdx = _.get($stateParams, 'menuIdx', 0);
                if (moduleName === '应用市场') {
                    appId = 'appstore';
                    menuIdx = 0;
                }
                let isSuperUser = service.isSuperUser();
                if (isSuperUser) {
                    return true;
                }
                let key = appId + '@' + menuIdx + '@' + rightName;
                var permission = _.get(session, 'user.userFunctionRightPermission', '');
                return _.indexOf(permission, key) >= 0;
            }
        };
        return service;
    }]);

    app.filter('SecurityFilter', ['SecurityService', function (SecurityService) {
        return function (input, moduleName, rightName) {
            return SecurityService.hasRight(moduleName, rightName);
        }
    }]);

    app.factory('Route', ['template', '$compile', '$rootScope', 'util', function (template, $compile, $rootScope, util) {
        var route = {
            routes: {},
            $element: '',
            current: '',
            state: function (state, config) {
                route.routes[state] = config;
                return route;
            },
            go: function (state, data) {
                route.current = state;
                var config = route.routes[state];
                var html = config.html || '';
                if (!html) {
                    html = template.get(config.template);
                }

                if (route.$element.length) {
                    route.$element.html(html);
                    var parentScope = route.$element.scope();
                    if (parentScope == null) {
                        parentScope = $rootScope;
                    }
                    var newScope = parentScope.$new();
                    if (_.isObject(data)) {
                        _.extend(newScope, data);
                    }
                    $compile(route.$element.contents().eq(0))(newScope);
                    util.apply(newScope);
                }
            },
            element: function (ele) {
                route.$element = ele;
                return route;
            }
        };
        return route;
    }]);

    app.service('MD5Service', ['$q', 'http', function ($q, http) {
        var service = {
            md5: function (input) {
                if (input) {
                    return SparkMD5.hash(input);
                }
            },
            fileMd5: function (file) {
                return $q(function (resolve, reject) {
                    var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
                        chunkSize = 2097152,                             // Read in chunks of 2MB
                        chunks = Math.ceil(file.size / chunkSize),
                        currentChunk = 0,
                        spark = new SparkMD5.ArrayBuffer(),
                        fileReader = new FileReader();

                    fileReader.onload = function (e) {
                        spark.append(e.target.result);                   // Append array buffer
                        currentChunk++;

                        if (currentChunk < chunks) {
                            loadNext();
                        } else {
                            var md5 = spark.end();
                            resolve(md5);
                        }
                    };

                    fileReader.onerror = function () {
                        reject('error');
                    };

                    function loadNext() {
                        var start = currentChunk * chunkSize,
                            end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

                        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
                    }

                    loadNext();
                });
            }
        };
        return service;
    }]);

    app.service('MonacoEditor', [function () {
        var dft = {
            language: 'javascript',
            automaticLayout: true,
            height: '100%',
            width: '100%',
            "autoIndent": true,
            "formatOnPaste": true,
            "formatOnType": true
        };

        var editorInstances = {};
        var service = {
            initEditor: function (ele, options) {
                options = options || {};
                options = _.extend(_.cloneDeep(dft), options);
                if (_.isString(ele)) {
                    ele = document.getElementById(ele);
                }
                var oldEditor = editorInstances[ele.id];
                if (oldEditor) {
                    delete editorInstances[ele.id];
                    oldEditor.dispose();
                }
                var editor = monaco.editor.create(ele, options);
                editorInstances[ele.id] = editor;
                $(ele).data('monaco', editor);
                return editor;
            },
            setValue: function (ele, value) {
                var editor = service.getEditor(ele);
                if (editor) {
                    editor.setValue(value);
                }
            },
            insertValue: function (ele, value) {
                var editor = service.getEditor(ele);
                value = ' ' + _.trim(value);
                editor.trigger('keyboard', 'type', {text: value});
            },
            getEditor: function (ele, opts) {
                if (_.isString(ele)) {
                    ele = document.getElementById(ele);
                }

                return $(ele).data('monaco');
            },
            getValue: function (ele) {
                var editor = service.getEditor(ele);
                return editor.getValue();
            },
            format: function (ele) {
                var editor = service.getEditor(ele);
                if (editor) {
                    editor.getAction('editor.action.formatDocument').run();
                }
            },
            dispose: function (ele) {
                var editor = service.getEditor(ele);
                if (editor) {
                    delete editorInstances[ele.id];
                    editor.dispose();
                }
            },
            disposeAll: function () {
                _.each(editorInstances, function (editor) {
                    if (editor) {
                        editor.dispose();
                    }
                });

                editorInstances = {};
            }
        };
        return service;
    }]);

    app.service('I18nService', ['http', 'UserSettingService', 'database', '$q', '$timeout', '$stateParams', function (http, UserSettingService, database, $q, $timeout, $stateParams) {
        let service = {
            setAppProperties: function (id) {
                let appId = id || $stateParams.appId;
                if (!appId) {
                    appId = 'system';
                } else if (appId && (appId === 'userManagement' || appId === 'triton')) {
                    appId = 'system';
                }
                let url = 'i18n/load?appId=' + appId;
                if (appId === 'welcome') {
                    //为了解决登录页获取不到用户信息，直接从本地读取，并传参给后台
                    let sysL = window.localStorage.getItem("systemLanguage");
                    appId = 'system';
                    if (sysL) {
                        url = 'i18n/load?appId=' + appId + '&lang=' + sysL;
                    }
                }

                let appPro = database.get(database.get('systemLanguage') + '@' + appId);
                if (!appPro) {
                    $.ajax({
                        type: 'get',
                        url: url,
                        dataType: 'json',
                        async: false
                    }).done(function (result) {
                        let lang = _.get(result, 'lang', 'zh-cn');
                        database.set('systemLanguage', lang);
                        database.set(lang + '@' + appId, result);
                    });
                }
            },
            getValue: function (input, key, appId) {
                //获取当前语言对应的key的value
                let lang = database.get('systemLanguage') || window.localStorage.getItem("systemLanguage") || 'zh-cn';
                if (_.isEmpty(appId) || (appId === 'userManagement' || appId === 'triton')) {
                    appId = 'system';
                }
                let appI18nList = database.get(lang + '@' + appId);
                return _.get(appI18nList, key, _.get(database.get(lang + '@system'), key, input));
            },
            getLang: function () {
                let defer = $q.defer();
                let language = database.get('systemLanguage');
                if (language) {
                    defer.resolve(language);
                } else {
                    $.ajax({
                        type: 'get',
                        url: 'i18n/get-lang',
                        dataType: 'json',
                        async: false
                    }).done(function (result) {
                        database.set('systemLanguage', result);
                        window.localStorage.setItem("systemLanguage", result);//方便api文档中直接取值显示
                        defer.resolve(result);
                    });
                }
                return defer.promise;
            },
            setLang: function (value) {
                http.post('i18n/change', {'lang': value}).success(function (result) {
                    if (result.success) {
                        database.set('systemLanguage', value);
                        window.localStorage.setItem("systemLanguage", value);
                        $timeout(function () {
                            $.jStorage.flush();
                            window.location.reload();
                        }, 1000);
                    }
                });
            }
        };
        return service;
    }]);

    app.filter('I18nFilter', ['I18nService', '$stateParams', function (I18nService, $stateParams) {
        return function (input, languageKey, appId) {
            if (_.isEmpty(appId)) {
                appId = $stateParams.appId ? $stateParams.appId : 'system';
            }
            return I18nService.getValue(input, languageKey, appId);
        };
    }]);
});