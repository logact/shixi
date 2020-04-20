define([], function () {

    var app = angular.module('cnv.janus', ['ngResource']);

    /**
     * Aric.Chen 提示::: 动这个文件一定要谨慎，这是开放给开放平台的API
     */
    app.service('janus', ['$q', 'websocket', 'http', '$state', '$stateParams', '$http', 'util', 'dialog', '$compile', '$window', '$rootScope',
        function ($q, websocket, http, $state, $stateParams, $http, util, dialog, $compile, $window, $rootScope) {
            var janus = {
                request: function (object) {
                    return $http(object);
                },
                getAppId: function () {
                    var appId = $stateParams.appId;
                    if (!appId) {
                        var url = window.location.href;
                        var appKeyIdx = url.indexOf('/app/') + 5;
                        var appIdEndIdx = url.indexOf('/', appKeyIdx);
                        appId = url.substring(appKeyIdx, appIdEndIdx);
                    }
                    return appId;
                },
                getRecordId() {
                    var rId = $stateParams.id;
                    if (!rId) {
                        var url = window.location.href;
                        var rSIdx = url.indexOf('/r/') + 3;
                        var rEIdx = url.indexOf('/', rSIdx);
                        rId = url.substring(rSIdx, rEIdx);
                    }
                    return rId;
                },
                apply: function ($scope) {
                    util.apply($scope);
                },
                getAppJson: function () {
                    var appId = janus.getAppId();
                    return http.get('openApp/appjson', {
                        appId: appId
                    });
                },
                getDeviceList: function (params) {
                    var appId = janus.getAppId();
                    var data = {
                        method: 'get',
                        api: 'api/device/list',
                        appId: appId,
                        params: params
                    };
                    data = util.encodeJSON(data);
                    return http.get('openApp/callJanusApi', {
                        data: data
                    });
                },
                getDeviceInfo: function (params) {
                    var appId = janus.getAppId();
                    var data = {
                        method: 'get',
                        api: 'api/device/query',
                        appId: appId,
                        params: params
                    };
                    data = util.encodeJSON(data);
                    return http.get('openApp/callJanusApi', {
                        data: data
                    });
                },
                createDevice: function (params) {
                    var appId = janus.getAppId();
                    var data = {
                        method: 'post',
                        api: 'api/device/create',
                        appId: appId,
                        params: params
                    };
                    data = util.encodeJSON(data);
                    return http.get('openApp/callJanusApi', {
                        data: data
                    });
                },
                getDeviceHistoryData: function (params) {
                    var appId = janus.getAppId();
                    var data = {
                        method: 'get',
                        api: 'api/device/data',
                        appId: appId,
                        params: params
                    };
                    data = util.encodeJSON(data);
                    return http.get('openApp/callJanusApi', {
                        data: data
                    });
                },
                pushDataToDevice: function (params) {
                    var appId = janus.getAppId();
                    var data = {
                        post: 'post',
                        api: 'api/device/pushdata',
                        appId: appId,
                        params: params
                    };
                    data = util.encodeJSON(data);
                    return http.get('openApp/callJanusApi', {
                        data: data
                    });
                },
                subscribeDeviceLiveData: function (params) {
                    var deferred = $.Deferred();
                    try {
                        websocket.sub({
                            topic: 'deviceData/' + params.uuid,
                            onmessage: function (data) {
                                deferred.notify(data);
                            }
                        });
                    } catch (e) {
                        deferred.reject(e);
                    }
                    return deferred;
                },
                updateLiveDataField: function (data) {
                    $('#app-main').find('.janus-live-data-field').each(function () {
                        var valueField = $(this).find('.janus-directive-field-value');
                        var dataKey = valueField.data('key');
                        if (dataKey) {
                            var value = _.get(data, dataKey, '');
                            valueField.html(value);
                        }
                    });
                },
                unSubscribeDeviceLiveData: function (params) {
                    websocket.unsub('deviceData/' + params.uuid);
                },
                getData: function (key) {
                    var appId = janus.getAppId();
                    key = `${appId}_${key}`;
                    return http.get('openApp/getData', {
                        key: key
                    });
                },
                setData: function (key, value) {
                    var appId = janus.getAppId();
                    key = `${appId}_${key}`;
                    value = util.encodeJSON(value);
                    return http.post('openApp/setData', {
                        key: key,
                        value: value
                    });
                },
                getFilePath: function (filePath) {
                    var appId = janus.getAppId();
                    return `${cynovan.c_path}/openApp/file/${appId}?f=${filePath}&v=${cynovan.version}`;
                },
                getImagePath: function (imagePath) {
                    return janus.getFilePath(imagePath);
                },
                showNotify: function (message) {
                    dialog.noty(message);
                },
                showDialog: function (params) {
                    if (!params.page) {
                        console.log('showDialog未设置page参数');
                        return;
                    }
                    var appId = janus.getAppId();

                    function show(html) {
                        params.message = params.message || html;

                        var dialogElement = bootbox.dialog(params);
                        /*检查是否有传入的默认数据，有则初始化scope数据*/
                        if (params.data && _.isObject(params.data)) {
                            var scope = $rootScope.$new(true);
                            _.extend(scope, params.data);

                            $compile(dialogElement)(scope);

                            dialogElement.on('hidden.bs.modal', function () {
                                if (scope) {
                                    scope.$destroy();
                                }
                            });
                        }
                        /*检查是否设置了宽度*/
                        if (_.isNumber(params.width)) {
                            dialogElement.find('.modal-dialog').width(params.width);
                        }
                        if (params.fullscreen === true) {
                            dialogElement.addClass('dialog_fullscreen');
                        } else {
                            let navbarHeight = $('#app-navbar').innerHeight() || 0;
                            let mheaderHeight = params.title ? 60 : 0;
                            let footerHeight = _.isEmpty(params.buttons) ? 0 : 70;
                            let modalMarginBootom = 60;
                            let maxHeight = window.innerHeight - navbarHeight - mheaderHeight - footerHeight - modalMarginBootom;
                            let css = {
                                'max-height': maxHeight + 'px',
                            };
                            dialogElement.find('.bootbox-body').css(css);
                        }

                        return dialogElement;
                    }

                    var depend = params.depend || [];
                    http.post('openApp/getDialogInfo', {
                        appId: appId,
                        depend: util.encodeJSON(depend),
                        page: params.page
                    }).success(function (result) {
                        var depend = _.get(result, 'depend', []);
                        var html = _.get(result, 'html', '');
                        if (_.size(depend)) {
                            require(depend, function () {
                                show(html);
                            });
                        } else {
                            show(html);
                        }
                    });
                },
                showDomWaiting: function (dom) {
                    dialog.elemWaiting(dom);
                },
                goToMenuByIndex: function (menuIndex) {
                    var appId = janus.getAppId();
                    $state.go('appMenu', {
                        appId: appId,
                        menuIdx: menuIndex || 0
                    });
                },
                goToMenuByName: function (menuName) {
                    var appId = janus.getAppId();
                    http.get('initialize/getMenuIdxByName', {
                        appId: appId,
                        menuName: menuName
                    }).success(function (result) {
                        var index = result.index || 0;
                        janus.goToMenuByIndex(index);
                    });
                },
                goToMenuDetailByIndex: function (menuIndex, recordId) {
                    var appId = janus.getAppId();
                    if (_.isUndefined(recordId)) {
                        recordId = "";
                    }
                    $state.go('detail', {
                        appId: appId,
                        menuIdx: menuIndex || 0,
                        id: recordId
                    });
                },
                goToMenuDetailByName: function (menuName, recordId) {
                    var appId = janus.getAppId();
                    http.get('initialize/getMenuIdxByName', {
                        appId: appId,
                        menuName: menuName
                    }).success(function (result) {
                        var index = result.index || 0;
                        janus.goToMenuDetailByIndex(index, recordId);
                    });
                },
                refreshPage: function () {
                    $window.location.reload();
                }
            };
            return janus;
        }]);

    app.directive('janusDatatable', ['template', function (template) {
        return {
            'restrict': 'EA',
            transclude: true,
            replace: true,
            scope: {
                options: '='
            },
            template: template.get('janus_directive_data-table'),
            controller: 'JanusDirectiveDataTableController',
            controllerAs: 'ctrl',
            link: function ($scope, element, attrs) {
            }
        }
    }]);

    app.controller('JanusDirectiveDataTableController', ['$scope', '$element', '$timeout',
        function ($scope, $element, $timeout) {
            var ctrl = this;

            var _opts = {
                searching: true,
                "bFilter": false,
                orderMulti: false,
                "iDisplayLength": 15,
                paging: true,
                pagingType: 'simple_numbers',
                "serverSide": false,
                "columnDefs": [
                    {
                        "defaultContent": "",
                        targets: '_all'
                    }
                ],
                "language": {
                    "sProcessing": "处理中...",
                    "sLengthMenu": "<div ng-transclude></div>",
                    "sZeroRecords": "没有匹配结果",
                    "sInfo": "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
                    "sInfoEmpty": "显示第 0 至 0 项结果，共 0 项",
                    "sInfoFiltered": "",
                    "sInfoPostFix": "",
                    "sSearch": "<span class='janus-datatable-search-label'><i class='fa fa-search'></i></span>",
                    "sUrl": "",
                    "sLoadingRecords": "载入中...",
                    "sInfoThousands": ",",
                    sEmptyTable: '<div class="dataTable_empty_content"><div class="d_e_img"></div><div class="d_e_text">暂无数据记录</div></div>',
                    "oPaginate": {
                        "sFirst": "首页",
                        "sPrevious": "<",
                        "sNext": ">",
                        "sLast": "末页"
                    },
                    "oAria": {
                        "sSortAscending": ": 以升序排列此列",
                        "sSortDescending": ": 以降序排列此列"
                    }
                }
            }
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.addEventToOptions();
                    ctrl.initTable();
                },
                addEventToOptions: function () {
                    if ($scope.options) {
                        _.extend($scope.options, {
                            resetData: function (data) {
                                var dataTable = $element.find('.c-table').DataTable();
                                dataTable.clear().draw();
                                dataTable.rows.add(data || []).draw();
                            }
                        });

                        $element.on('click', 'button,a', function (event) {
                            var button = $(event.target).closest('a,button');
                            if (_.isFunction($scope.options.buttonClick)) {
                                var dataTable = $element.find('.c-table').DataTable();
                                var data = dataTable.row(button.closest('tr')).data();
                                if (data) {
                                    $scope.options.buttonClick.call(null, button, data);
                                }
                            }
                        });
                    }
                },
                initTable: function () {
                    var options = _.extend(_.cloneDeep(_opts), $scope.options);
                    $element.find('.c-table').DataTable(options);
                }
            });
            ctrl.initialize();
        }]);

    app.directive('janusField', ['template', '$timeout',
        function (template, $timeout) {
            return {
                'restrict': 'EA',
                transclude: true,
                replace: true,
                scope: {
                    label: '@',
                    ngModel: '=',
                    info: '@',
                    labelWidth: '@'
                },
                templateUrl: template.getUrl('janus_directive_field'),
                link: function ($scope, element, attrs) {
                    if (attrs.info) {
                        $timeout(function () {
                            var tipElement = element.find('.fa-info-circle');
                            var myOpentip = new Opentip(tipElement, {
                                myOpentip: 'right'
                            });
                            myOpentip.setContent(attrs.info);
                        });
                    }

                    if (attrs.labelWidth) {
                        var width = _.parseInt(attrs.labelWidth);
                        if (_.isNumber(width)) {
                            element.find('.janus-directive-field-label').width(width);
                        }
                    }
                }
            }
        }]);

    app.directive('janusLiveDataField', ['template',
        function (template) {
            return {
                'restrict': 'EA',
                transclude: true,
                replace: true,
                scope: {
                    label: '@',
                    field: '@',
                    unit: '@',
                    labelWidth: '@'
                },
                templateUrl: template.getUrl('janus_directive_live_data_field'),
                link: function ($scope, element, attrs) {
                    if (attrs.labelWidth) {
                        var width = _.parseInt(attrs.labelWidth);
                        if (_.isNumber(width)) {
                            element.find('.janus-directive-field-label').width(width);
                        }
                    }
                }
            }
        }]);

    app.directive('janusInputText', ['template', '$timeout', function (template, $timeout) {
        return {
            'restrict': 'EA',
            transclude: true,
            replace: true,
            scope: {
                label: '@',
                ngModel: '=',
                info: '@',
                labelWidth: '@',
                placeholder: '@'
            },
            templateUrl: template.getUrl('janus_directive_inputtext'),
            link: function ($scope, element, attrs) {

                if (attrs.info) {
                    $timeout(function () {
                        var tipElement = element.find('.fa-info-circle');
                        var myOpentip = new Opentip(tipElement, {
                            myOpentip: 'right'
                        });
                        myOpentip.setContent(attrs.info);
                    });
                }

                if (attrs.labelWidth) {
                    var width = _.parseInt(attrs.labelWidth);
                    if (_.isNumber(width)) {
                        element.find('.janus-directive-field-label').width(width);
                    }
                }
            }
        }
    }]);

    app.directive('janusWidget', ['template', function (template) {
        return {
            'restrict': 'EA',
            transclude: true,
            replace: true,
            scope: {
                title: "@"
            },
            templateUrl: template.getUrl('janus-directive-widget'),
            link: function ($scope, element, attrs) {
            }
        }
    }]);

});
