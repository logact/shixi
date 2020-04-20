define(['web/base/service'], function () {
    'use strict';
    var app = angular.module('main', ['cnv.services']);
    app.controller('APILogoController', ['$scope', 'session', 'util', 'I18nService', function ($scope, session, util, I18nService) {
        var ctrl = this;
        _.extend(ctrl, {
            initialize: function () {
                ctrl.initSystemLangList();
                ctrl.initJanusLogo();
            },
            initSystemLangList: function () {
                I18nService.setAppProperties('welcome');
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
            }
        });
        ctrl.initialize();
    }]);
    app.controller('APIMenuController', ['$scope', '$rootScope', 'http', '$state', '$location', '$timeout', 'session', 'util', 'I18nService',
        function ($scope, $rootScope, http, $state, $location, $timeout, session, util, I18nService) {

            var ctrl = this;
            $scope.headerMenu = [];
            $scope.subMenu = {};
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadMenu();
                    ctrl.autoLayout();
                },
                loadMenu: function () {
                    http.get('api/doc/menu').success(function (result) {
                        var list = _.get(result, 'list', []);
                        /*process the menu list */
                        var headerMenu = [];
                        var subMenu = {};
                        _.each(list, function (menu) {
                            if (menu.parent) {
                                var sub = _.get(subMenu, menu.parent, []);
                                sub.push(menu);
                                _.set(subMenu, menu.parent, sub);
                            } else {
                                headerMenu.push(menu);
                            }
                        });
                        $scope.headerMenu = headerMenu;
                        $scope.subMenu = subMenu;
                        $timeout(function () {
                            ctrl.openUrlKey();
                        }, 100);
                    });
                },
                menuClick: function ($event, menuKey) {
                    /*高亮Menu本身*/
                    var li = $($event.target).closest('li');
                    let oldActive = $("li.active");
                    $(".level1 li").removeClass('active');
                    $(".level2 li").removeClass('active');
                    if (!li.hasClass('active')) {
                        li.addClass('active').siblings('.active').removeClass('active');
                    }
                    let oldHtml = $('.markdown-body .crumb').html();
                    $('.markdown-body .crumb').html("");
                    let html = [];
                    html.push(`<li><span>${I18nService.getValue('帮助文档', 'support_doc')}</span></li><li><span class="divider">&gt;</span></li>`);

                    if ($scope.subMenu[menuKey]) {
                        /*有submenu*/
                        li.toggleClass('open');
                        var hasOpen = li.hasClass('open');
                        var childLi = li.next('.children').find('ul');
                        li.removeClass('active');
                        if (hasOpen) {
                            childLi.slideDown(200);
                            childLi.children().eq(0).addClass('active');
                            ctrl.showApiDocument($scope.subMenu[menuKey][0].key);
                            html.push(`<li><span>${_.trim($('.' + menuKey).text())}</span></li>`);
                            html.push(`<li><span class="divider">&gt;</span></li><li><span>${_.trim($('.' + $scope.subMenu[menuKey][0].key).text())}</span></li>`);
                        } else {
                            childLi.slideUp(200);
                            oldActive.addClass('active');//收起菜单时，保持前一个active的标签拥有active样式
                            html = [];
                            html.push(oldHtml);
                        }
                    } else {
                        ctrl.showApiDocument(menuKey);
                        let parentKey = $('.' + menuKey).data('parentkey');
                        if (parentKey) {
                            html.push(`<li><span>${_.trim($('.' + parentKey).text())}</span></li>`);
                            html.push(`<li><span class="divider">&gt;</span></li><li><span>${_.trim($('.' + menuKey).text())}</span></li>`);
                        }
                        else {
                            html.push(`<li><span>${_.trim($('.' + menuKey).text())}</span></li>`);
                        }
                    }

                    $('.markdown-body .crumb').append(html.join(''));
                },
                showApiDocument: function (menuKey) {
                    $state.go('document', {
                        key: menuKey
                    });
                    $("#app-main").scrollTop(0);
                },
                autoLayout: _.debounce(function () {
                    var height = $(window).height();
                    height = height - 60;
                    $('#side-bar,#app-main').height(height);
                }, 300),
                openUrlKey: function () {
                    let path = $location.path();
                    let key = _.last(_.split(path, '/'));
                    if (_.isEmpty(key)) {
                        return false;
                    }
                    let li = $('.' + $('.' + key).data('parentkey'));
                    if (li) {
                        li.toggleClass('open');
                        let childLi = li.next('.children').find('ul');
                        childLi.slideDown(200);
                        $('.' + key).click();
                    }
                }
            });
            ctrl.initialize();
        }]);
});