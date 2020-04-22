//define中的路径？
define(['moment','appservice','web/base/service','web/base/directive',
    'triton/device/web/service/bind_device','triton/device/web/service/device_service',
    'web/base/janus'], function () {
    'use strict';
    var app = angular.module('main', ['cnv.services', 'cnv.directives', 'cnv.binddevice.service', 'cnv.device.service', 'cnv.janus', 'cnv.appservice']);
    app.controller('HeaderController', ['$scope', '$rootScope', 'http', '$state', 'dialog', 'template',
        '$timeout', 'database', '$transitions', 'websocket', 'session', 'DBUtils', '$window', '$location', 'util', 'I18nService', 'AppDataService',
        function ($scope, $rootScope, http, $state, dialog, template, $timeout, database, $transitions, websocket,
                  session, DBUtils, $window, $location, util, I18nService, AppDataService) {

            let ctrl = this;
            ctrl.menus = [];
            let appUserSetting = [];
            var currentMenu = null;
            $scope.userInfo = true;
            $scope.debug = (cynovan.debug == 'true' ? true : false);

            var user = _.get(session, 'user', {});
            $scope.name = _.get(session, 'user.name', user.userName);
            //这里为什么要使用_.extend
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initSystemLangList();
                    ctrl.setName();
                    ctrl.getNeptuneSyncStatus();
                    ctrl.getAppUserSetting();
                    ctrl.initMessageListener();
                    ctrl.bindEvent();
                    ctrl.autoLayout();
                    ctrl.initJanusLogo();
                    ctrl.initUserAvatar();
                    ctrl.onresize();
                    ctrl.getUserLanguage();
                    ctrl.showUpdateOpenPlatform();
                },
                initSystemLangList: function () {
                    //这个方法？
                    I18nService.setAppProperties();
                },
                setName: function () {
                    if (!user.userName) {
                        $scope.userInfo = false;
                        $scope.name = I18nService.getValue('超级管理员', 'super_admin');
                    }
                },
                bindWindowActiveEvent: function () {
                    var hidden = "hidden";

                    // Standards:
                    if (hidden in document)
                        document.addEventListener("visibilitychange", onchange);
                    else if ((hidden = "mozHidden") in document)
                        document.addEventListener("mozvisibilitychange", onchange);
                    else if ((hidden = "webkitHidden") in document)
                        document.addEventListener("webkitvisibilitychange", onchange);
                    else if ((hidden = "msHidden") in document)
                        document.addEventListener("msvisibilitychange", onchange);
                    // IE 9 and lower:
                    else if ("onfocusin" in document)
                        document.onfocusin = document.onfocusout = onchange;
                    // All others:
                    else
                        window.onpageshow = window.onpagehide
                            = window.onfocus = window.onblur = onchange;

                    function onchange(evt) {
                        var v = "visible", h = "hidden",
                            evtMap = {
                                focus: v, focusin: v, pageshow: v, blur: h, focusout: h, pagehide: h
                            };

                        evt = evt || window.event;

                        var visibleType = true;
                        if (evt.type in evtMap) {
                            visibleType = evtMap[evt.type];
                        } else {
                            visibleType = this[hidden] ? "hidden" : "visible";
                        }
                        $rootScope.documentVisible = (visibleType === 'visible');
                    }

                    // set the initial state (but only if browser supports the Page Visibility API)
                    if (document[hidden] !== undefined)
                        onchange({type: document[hidden] ? "blur" : "focus"});
                },
                initJanusLogo: function () {
                    var janus = _.get(session, 'janus', {});
                    /*两个Logo时，左边和右边单独显示*/
                    /*用户只上传了一个logo时，则使用全部区域进行显示*/
                    var leftLogoId = janus.left_logo_image_id,
                        rightLogoId = janus.right_logo_image_id;

                    /*当用户没有配置Logo的时候，显示Janus的两个Logo*/
                    if (!leftLogoId && !rightLogoId) {
                        $('.navbar-header').addClass('janus_brand');
                        $scope.leftLogo = '/resource/index/web/img/janus-logo-circle.png';
                        $scope.rightLogo = '/resource/index/web/img/janus-logo-font.png';
                    } else {
                        if (leftLogoId) {
                            $scope.leftLogo = util.getImageUrl(leftLogoId);
                        } else {
                            /*隐藏left logo*/
                            $('.brand-image-left').addClass('hide');
                        }
                        if (rightLogoId) {
                            $scope.rightLogo = util.getImageUrl(rightLogoId);
                        } else {
                            $('.brand-image-right').addClass('hide');
                        }

                        if (!leftLogoId || !rightLogoId) {
                            $('.navbar-header').addClass('single_brand');
                        }
                    }
                },
                initUserAvatar: function () {
                    var userName = user.userName;
                    var userAvatarId = user.userAvatar;

                    if (!userName) {
                        $scope.userAvatarImg = 'resource/index/web/img/manager-ico.png';
                    } else {
                        if (!userAvatarId) {
                            $scope.userAvatarImg = 'resource/index/web/img/user-ico.png';
                        } else {
                            $scope.userAvatarImg = util.getImageUrl(userAvatarId);
                        }
                    }
                },
                getAppUserSetting: function () {
                    http.get('index/loadFinallyMenu').success(function (menus) {
                        appUserSetting = _.orderBy(menus, ['sort']);
                        ctrl.loadMenus();
                    });
                },
                initUserAllApp: function () {
                    let info = ctrl.getMenuLiInfo();
                    $scope.canViewLi = info.canViewLi;
                    $scope.hideLi = _.concat(info.canShowMenus.slice(info.canViewLiLen + 1, info.ulLen), _.filter(ctrl.menus, {'show': false}));
                    util.apply($scope);
                },
                loadMenus: function () {
                    http.get('index/headerMenu').success(function (menus) {
                        for (var i = 0; i < menus.length; i++) {
                            // if (menus[i].name === '应用市场' ||menus[i].name == 'Janus信息'||menus[i].name == '个人信息'||menus[i].name == '消息中心') {
                            if (menus[i].name === '应用市场') {
                                menus.splice(i, 1);
                                i--;
                            } else {
                                let show = true;
                                let sort = i;
                                let us = _.find(appUserSetting, {'name': menus[i].name});
                                if (us) {
                                    sort = _.get(us, 'sort', sort);
                                    show = _.get(us, 'show', show);
                                }
                                menus[i].show = show;
                                menus[i].sort = sort;
                            }
                        }
                        ctrl.menus = _.orderBy(menus, ['sort']);
                        util.apply($scope);
                        setTimeout(function () {
                            //加载完菜单后再初始化全部应用
                            ctrl.initUserAllApp();
                            let activeAppName = window.localStorage.getItem("activeAppName");
                            if (null != activeAppName) {
                                $(".navbar-menu-ul").find(`li[data-key='${activeAppName}']`).addClass('active')
                            }
                        }, 100);
                    });
                },
                bindEvent: function () {
                    $(window).resize(function () {
                        ctrl.autoLayout();
                    });

                    $transitions.onStart({}, function (trans) {
                        ctrl.showLoading(true);
                    });

                    $transitions.onSuccess({}, function () {
                        ctrl.showLoading(false);
                    });
                    $scope.$on('refreshMenus', function (event, data) {
                        ctrl.getAppUserSetting();
                    });
                },
                showLoading: function (show) {
                    var loadingBox = $('#loading-dialog');
                    if (!loadingBox.length) {
                        var html = template.get('loading_dialog');
                        $('body').append(html);
                        $('#loading-dialog .loading-dialog-body .context').html(I18nService.getValue('正在读取数据，请稍候...', 'reading.data'));
                        loadingBox = $('#loading-dialog');
                    }
                    if (show) {
                        loadingBox.stop(true, true).fadeIn('fast');
                    } else {
                        $timeout(function () {
                            loadingBox.stop(true, true).fadeOut('fast');
                        }, 350);
                    }
                },
                changeActiveClass: function (event, index, menu) {
                    var ele = $(".navbar-menu-ul").find(`li[data-key='${menu.appId}']`);
                    if (!ele.hasClass('active')) {
                        ele.addClass('active').siblings('.active').removeClass('active');
                    }
                },
                goToApp: function (menu) {
                    var appId = menu.appId;
                    window.localStorage.setItem("activeAppName", appId);
                    window.localStorage.removeItem("currentAsideMenuIndex");

                    currentMenu = _.find(ctrl.menus, {'appId': appId});

                    var autoOpen = true;
                    if (menu.template || menu.page) {
                        autoOpen = false;
                        $state.go('appMenu', {
                            appId: appId,
                            menuIdx: menu.menuIndex
                        });
                    }
                    $rootScope.$broadcast('HeaderMenuChange', menu, autoOpen);
                },
                menuClick: function (index, event, menu) {
                    $scope.needShowApp = false;//标识：是否需要在头部导航展示的show:false的app
                    ctrl.changeActiveClass(event, index, menu);
                    ctrl.goToApp(menu);
                },
                allMenuClick: function (index, event, menu) {
                    var appId = menu.appId;
                    $('.more-app-div').css('display', 'none');
                    $timeout(function () {
                        $('.more-app-div').removeAttr('style');
                    }, 100);

                    let info = ctrl.getMenuLiInfo();//菜单列表的可用信息
                    index = _.findIndex(info.canViewLi, {'appId': appId});

                    if (index === -1) {
                        $scope.needShowApp = _.find(ctrl.menus, {'appId': appId});
                        $(".navbar-menu-ul li.active").removeClass('active');
                        ctrl.goToApp(menu);
                        $timeout(function () {
                            let otherLi = $('.other-app-li');//展示show:false的app区域
                            //计算other-app-li的right值，需要设置timeout才能准确获取
                            let rightPx = -otherLi.innerWidth();
                            if (info && info.canViewLiLen < info.ulLen) {
                                rightPx = info.ulWidth - (info.liWidth - $(info.cl[info.canViewLiLen + 1]).innerWidth()) - otherLi.innerWidth();
                            }
                            otherLi.css('right', rightPx + 'px');
                        }, 0);
                    } else {
                        ctrl.menuClick(index, event, menu);
                    }

                },
                getMenuLiInfo: function () {
                    let canViewLi = [];
                    let canShowMenus = [];
                    let ulWidth = $('.navbar-menu-ul').width();//头部导航的长度
                    let cl = $('.navbar-menu-ul').children();
                    let ulLen = cl.length;//所有app的数量
                    let canViewLiLen = ulLen;
                    let liWidth = 0;//ul中可见li的长度和
                    //计算得出当前最多可见的app个数 && 最后一个可见的app;
                    for (let i = 0; i < ulLen; i++) {
                        liWidth = liWidth + $(cl[i]).innerWidth();
                        if (liWidth > ulWidth) {
                            canViewLiLen = i - 1;
                            break;
                        }
                    }
                    canShowMenus = _.filter(ctrl.menus, {'show': true});
                    canViewLi = canShowMenus.slice(0, canViewLiLen + 1);

                    return {
                        canShowMenus: canShowMenus,
                        canViewLi: canViewLi,
                        cl: cl,
                        ulWidth: ulWidth,
                        liWidth: liWidth,
                        canViewLiLen: canViewLiLen,
                        ulLen: ulLen
                    };
                },
                goAppstore: function () {
                    $(".navbar-menu-ul li.active").removeClass('active');
                    $state.go('appstore');
                    $rootScope.$broadcast('HeaderMenuChange', {});
                    ctrl.removeItem();
                },
                goMessageCenter: function () {
                    $(".navbar-menu-ul li.active").removeClass('active');
                    $state.go('messageCenter');
                    $rootScope.$broadcast('HeaderMenuChange', {});
                    ctrl.removeItem();
                },
                removeItem: function () {
                    $scope.needShowApp = false;
                    window.localStorage.removeItem("activeAppName");
                    window.localStorage.removeItem("currentAsideMenuIndex");
                },
                showNeptuneSyncDialog: function () {
                    dialog.show({
                        template: 'neptune_sync_template',
                        width: 1200,
                        title: I18nService.getValue('Neptune同步', 'neptune.sync'),
                        controller: 'NeptuneSyncController',
                        controllerAs: 'ctrl',
                        cancel: false
                    });
                },
                goApiDocs: function () {
                    window.open(cynovan.c_path + 'api');
                },
                autoLayout: function () {
                    var height = $(window).height();
                    height = height - 60;
                    $('#menubar,#app-main').height(height);

                    var width = $('.other-app-li').innerWidth();
                    if (width > 0) {
                        let info = ctrl.getMenuLiInfo();
                        let rightPx = info.ulWidth - (info.liWidth - $(info.cl[info.canViewLiLen + 1]).innerWidth()) - $('.other-app-li').innerWidth();
                        $('.other-app-li').css('right', rightPx + 'px');
                    }
                },
                refreshTemplate: function () {
                    http.get('initialize/reload/template').success(function () {
                        $.jStorage.flush();
                        dialog.noty(I18nService.getValue('操作成功', 'operation_success'));
                        $window.location.reload();
                    });
                },
                logout: function () {
                    dialog.confirm(I18nService.getValue('确认登出?', 'confirm_logout')).on('success', function () {
                        window.localStorage.setItem("systemLanguage", database.get('systemLanguage'));
                        window.location.href = cynovan.c_path + '/logout';
                        ctrl.removeItem();
                        $location.url(cynovan.c_path + '/logout');
                        util.apply($scope);
                    });
                },
                janusInfo: function () {
                    $(".navbar-menu-ul li.active").removeClass('active');
                    $state.go('janusInfo');
                    $rootScope.$broadcast('HeaderMenuChange', {});
                },
                getUserInfo: function () {
                    $(".navbar-menu-ul li.active").removeClass('active');
                    $state.go('userInfo');
                    $rootScope.$broadcast('HeaderMenuChange', {});
                },
                initMessageListener: function () {
                    websocket.sub({
                        topic: '/message',
                        onmessage: function (message) {
                            console.log(message);
                            var showAlert = true;
                            if (message.title === 'Neptune远程控制通知') {
                                showAlert = false;
                            }
                            if (showAlert) {
                                if ($rootScope.documentVisible) {
                                    ctrl.showMessage(message.content);
                                }
                            }
                            if (message.type === 'deviceOnlineChange') {
                                $rootScope.$broadcast('device.onlineChange', message);
                            } else if (message.type === 'deviceStatusChange') {
                                $rootScope.$broadcast('device.statusChange', message);
                            }
                        }
                    })
                },
                showMessage: _.throttle(function (message) {
                    dialog.noty(message);
                }, 10 * 1000),
                getNeptuneSyncStatus: function () {
                    http.get('neptuneSync/getStatus').success(function (data) {
                        ctrl.status = data.status;
                    });
                },
                appShowSetting: function () { // 自定义导航栏dialog
                    dialog.show({
                        template: 'app_show_setting_template',
                        width: 800,
                        title: I18nService.getValue('应用展示设置', 'app.show.config'),
                        controller: 'AppShowSettingController',
                        controllerAs: 'ctrl',
                    });
                },
                goMenuByUrl: function () {
                    $scope.needShowApp = false;
                    window.localStorage.removeItem("activeAppName");
                    window.localStorage.removeItem("currentAsideMenuIndex");
                    $(".navbar-menu-ul li.active").removeClass('active');
                    $rootScope.$broadcast('HeaderMenuChange', {});
                },
                onresize: function () {
                    $(window).resize(_.debounce(function () {
                        ctrl.autoLayout();
                        ctrl.initUserAllApp();
                    }, 300));
                },
                showUpdateOpenPlatform: function () {
                    $scope.clicked = true;
                    AppDataService.get('open-platform', 'knowFlag').success(function (result) {
                        $scope.clicked = result.knowFlag || false;//是否显示开放平台的提示信息
                    });
                },
                knowOpenPlatform: function () {
                    $scope.clicked = true;
                    AppDataService.set('open-platform', 'knowFlag', {'knowFlag': true});
                },
                changeLanguage: function () {
                    let value = 'zh-cn';
                    if (ctrl.nowLanguage === '中文') {
                        value = 'en-us';
                    }
                    I18nService.setLang(value);
                },
                getUserLanguage: function () {
                    I18nService.getLang().then(function (result) {
                        if (result === 'zh-cn') {
                            ctrl.nowLanguage = '中文';
                            ctrl.secondLanguage = '英文';
                        } else {
                            ctrl.nowLanguage = 'English';
                            ctrl.secondLanguage = 'Chinese';
                        }
                    });
                },
                goSystemInfo: function () {
                    $(".navbar-menu-ul li.active").removeClass('active');
                    $rootScope.$broadcast('HeaderMenuChange', {"appId": "system_info", "name": "系统信息"});
                }
            });
            ctrl.initialize();
        }]);

    app.controller('AppShowSettingController', ['$scope', 'http', 'DBUtils', 'util', 'session', 'dialog', '$timeout', 'UserSettingService', 'I18nService', function ($scope, http, DBUtils, util, session, dialog, $timeout, UserSettingService, I18nService) {
        var ctrl = this;

        _.extend(ctrl, {
            initialize: function () {
                ctrl.loadMenus();
                ctrl.bindEvent();
            },
            bindEvent: function () {
                $scope.$on('success', function () {
                    $('#sortable li').each(function (index, element) {
                        _.find($scope.menus, {'appId': $(element).data('key')}).sort = index;
                    });
                    let menu = {'menu': util.removeHashKey($scope.menus)};
                    UserSettingService.set('appNavigateSetting', menu).success(function (result) {
                        if (result.success) {
                            dialog.noty(I18nService.getValue('保存成功，2秒后刷新页面自动生效', 'save_refresh'));
                            $timeout(function () {
                                window.location.reload();
                            }, 2000);
                        } else {
                            console.log('set app setting fail');
                        }
                    });
                });
            },
            loadMenus: function () {
                $scope.menus = [];
                http.get('index/loadFinallyMenu').success(function (menus) {
                    $scope.menus = _.orderBy(menus, ['sort']);
                    $("#sortable").sortable();
                    $("#sortable").disableSelection();
                });
            },
            restoreDefault: function () {
                _.each($scope.menus, function (v) {
                    if (!v.show) {
                        $('.' + v.name + ' .c-switch-input').click();
                    }
                });
            }
        });
        ctrl.initialize();
    }]);

    app.controller('AsideMenuController', ['$scope', 'http', 'util', '$state', '$location', 'DBUtils', 'session', 'UserSettingService', 'I18nService',
        function ($scope, http, util, $state, $location, DBUtils, session, UserSettingService, I18nService) {
            var ctrl = this;
            var menuMap = {};
            $scope.menus = [];
            $scope.menuTitle = '';
            $scope.username = _.get(session, 'user.userName', '');

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadAllSubMenu();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    let path = $location.$$path;
                    if (path.indexOf('app/') === -1) {
                        $('body').addClass('menuhide');
                    }
                    $scope.$on('HeaderMenuChange', function (event, menu, autoOpen) {
                        ctrl.headerMenuChange(menu, autoOpen || false);
                    });
                    $scope.$on('refreshMenus', function (event, data) {
                        ctrl.loadAllSubMenu();
                    });
                },
                headerMenuChange: function (headerMenu, autoOpen) {
                    var index = window.localStorage.getItem('currentAsideMenuIndex');
                    $scope.currentMenuIndex = index ? parseInt(index) : -1;
                    $scope.menus = _.get(menuMap, headerMenu.appId, []);
                    $scope.menuTitle = I18nService.getValue(_.get(headerMenu, 'name', ''), _.get(headerMenu, 'i18nKey', ''));

                    var menu_bar = $("#menubar");
                    var app_main = $("#app-main");
                    //menuTitle为远程监控时不应显示title
                    if ($scope.menuTitle === '远程监控') {
                        $scope.menuTitle = '';
                    }
                    if (autoOpen === true) {
                        let firstMenu = _.first($scope.menus);
                        $state.go('appMenu', {
                            appId: firstMenu.appId,
                            menuIdx: firstMenu.menuIndex
                        });
                    }
                    if (_.size($scope.menus)) {
                        menu_bar.removeClass("menubar-mini-zero");
                        app_main.removeClass("app-main-max-one");

                        $('body').removeClass('menuhide');
                    } else {
                        // 远程监控: 左侧菜单消失,右侧菜单最大化
                        menu_bar.addClass("menubar-mini-zero");
                        app_main.addClass("app-main-max-one");

                        $('body').addClass('menuhide');
                    }
                    if (window.localStorage.getItem('asideStatus') === "1") {
                        menu_bar.addClass("menubar-mini");
                        app_main.addClass("app-main-max");
                    }
                    util.apply($scope);
                },
                loadAllSubMenu: function () {
                    http.get('index/subMenu').success(function (result) {
                        menuMap = result;
                        ctrl.autoActiveMenu();
                    });
                },
                autoActiveMenu: function () {
                    var path = $location.$$path;
                    /*当为App的时候走正常的逻辑，
                    * 修复了在app详情页刷新获取不到menuKey的问题*/
                    if (path.indexOf('app/') !== -1) {
                        var appKeyIdx = path.indexOf('/app/') + 5;
                        var appIdEndIdx = path.indexOf('/', appKeyIdx);
                        var appId = path.substring(appKeyIdx, appIdEndIdx);
                        if (appId === "system_info") {
                            $(".navbar-menu-ul li.active").removeClass('active');
                            ctrl.headerMenuChange({"appId": "system_info", "name": "系统信息"}, false);
                            return;
                        }
                        http.get('index/loadAppTopMenu', {
                            appId: appId
                        }).success(function (hMenu) {
                            ctrl.headerMenuChange(hMenu, false);
                        });
                    }
                },
                subMenuClick: function (event, index) { // 左侧子菜单跳转.
                    var ele = $(event.target).closest('li');
                    if (!ele.hasClass('active')) {
                        ele.addClass('active').siblings('.active').removeClass('active');
                    }
                    //隐藏：暂定为点击无需展开左侧导航
                    window.localStorage.setItem('currentAsideMenuIndex', index);
                },
                switchAside: function () {
                    $("#menubar").toggleClass("menubar-mini");
                    $("#app-main").toggleClass("app-main-max");

                    if ($("#menubar").hasClass("menubar-mini")) {
                        window.localStorage.setItem('asideStatus', "1");
                    } else {
                        window.localStorage.setItem('asideStatus', "0");
                    }
                    //设置左边菜单的收缩状态
                    let asideStatus = {'asideStatus': window.localStorage.getItem('asideStatus')};
                    UserSettingService.set("subMenuSetting", asideStatus);
                },
                openMaxAside: function () {
                    $("#menubar").removeClass("menubar-mini");
                    $("#app-main").removeClass("app-main-max");
                    window.localStorage.setItem('asideStatus', "0");
                }
            });
            ctrl.initialize();
        }]);

    app.controller('NeptuneSyncController', ['$scope', 'DBUtils', 'http', 'util', 'session', 'dialog', '$element', '$timeout', '$interval', 'I18nService',
        function ($scope, DBUtils, http, util, session, dialog, $element, $timeout, $interval, I18nService) {
            var ctrl = this;
            ctrl.newConnection = I18nService.getValue('重新连接', 'again_connect');
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initTableOption();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    http.get('neptuneSync/getStatus').success(function (data) {
                        ctrl.status = data.status;
                    });
                },
                syncDevice: function () {
                    http.post('neptuneSync/syncDevice').success(function () {
                        dialog.noty(I18nService.getValue('设备同步已完成', 'device.sync.ok'));
                    });
                },
                initTableOption: function () {
                    ctrl.options = {
                        collection: 'neptune_sync',
                        filled: true,
                        toolbar: false,
                        columns: [{
                            name: 'create_time',
                            title: I18nService.getValue('时间', 'time'),
                            search: true,
                            orderable: false
                        }, {
                            name: '_id',
                            visible: false
                        }, {
                            name: 'status',
                            title: I18nService.getValue('状态', 'status'),
                            search: true,
                            orderable: false,
                            render: function (data, type, row) {
                                var thisStatus = "";
                                if (row.status === 1) {
                                    thisStatus = I18nService.getValue("连接成功", 'connect.success');
                                } else if (row.status === 2) {
                                    thisStatus = I18nService.getValue("连接丢失", 'connect.lost');
                                } else {
                                    thisStatus = I18nService.getValue("连接失败", 'connect.fail');
                                }
                                return `<span>${thisStatus}</span>`;
                            }
                        }, {
                            name: 'message',
                            title: I18nService.getValue('信息', 'message'),
                            search: true,
                            orderable: false,
                            render: function (data, type, row) {
                                var message = "";
                                if (row.message) {
                                    message = row.message;
                                } else {
                                    message = I18nService.getValue("连接成功", 'connect.success');
                                }
                                return `<span>${message}</span>`;
                            }
                        }]
                    }
                },
                tryConnection: function () {
                    var wait = 10;
                    ctrl.newConnection = I18nService.getValue('重新连接', 'again_connect') + "(" + wait + ")";
                    var timer = $interval(function () {
                        wait--;
                        ctrl.newConnection = I18nService.getValue('重新连接', 'again_connect') + "(" + wait + ")";
                        if (wait == 0) {
                            $interval.cancel(timer);
                            ctrl.newConnection = I18nService.getValue('重新连接', 'again_connect');
                        }
                    }, 1000);
                    http.get('neptuneSync/tryConnection').success(function (data) {
                        ctrl.status = data.status;
                        ctrl.refreshTable();
                    });
                },
                refreshTable: function () {
                    var table = $($element).find('.c-table');
                    table.DataTable().ajax.reload();
                }
            });
            ctrl.initialize();
        }]);
});
