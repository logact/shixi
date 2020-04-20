define([], function () {

    var app = angular.module('app');

    app.controller('AppstoreController', ['http', 'DBUtils', 'dialog', '$scope', '$timeout', 'FileUploadService', '$element', '$state', 'util', 'I18nService', 'janus', function (http, DBUtils, dialog, $scope, $timeout, FileUploadService, element, $state, util, I18nService, janus) {
        var ctrl = this;
        $('body').addClass('menuhide');
        $scope.filterObject = {};
        $scope.selectCategory = I18nService.getValue('全部', 'all');
        _.extend(ctrl, {
            init: function () {
                ctrl.loadApps();
                ctrl.categorys = [I18nService.getValue('全部', 'all'), I18nService.getValue('未安装', 'no_install'), I18nService.getValue('已安装', 'installed')];
                ctrl.initApsMainHeight();
                $timeout(function () {
                    ctrl.initImportApp()
                }, 300);
            },
            loadApps: function () {
                http.get('app/loadAll').success(function (result) {
                    if (result.success) {
                        ctrl.apps = _.get(result, 'datas.apps', []);
                        _.forEach(ctrl.apps, function (app) {
                            if (app.category) {
                                ctrl.categorys.push(app.category);
                            }
                        });
                        ctrl.categorys = Array.from(new Set(ctrl.categorys));
                    } else {
                        console.log('load fail');
                    }
                });
            },
            getApp: function (name) {
                return _.find(ctrl.apps, {'name': name});
            },
            setApp: function (name, field, value) {
                _.set(ctrl.getApp(name), field, value);
            },
            addProgress: function (event) {
                let span = `<span class="progress-data-span fa fa-spinner"></span>`;
                $(event.target).append(span);
            },
            deleteProgress: function (event) {
                $(event.target).removeClass("progress-data-span fa-spinner");
            },
            install: function (name, event) {
                ctrl.addProgress(event);
                http.post('app/install', {
                    name: name
                }).success(function (result) {
                    if (result.success) {
                        ctrl.refreshPage();
                        $timeout(function () {
                            ctrl.setApp(name, 'installed', true);
                            ctrl.deleteProgress(event);
                        }, 1000);
                    } else {
                        console.log('load fail');
                    }
                });
            },
            refreshPage: _.debounce(function () {
                dialog.notyWithRefresh(I18nService.getValue('操作成功，2秒后刷新页面', 'refresh.page'));
            }, 900),
            uninstall: function (name, event) {
                ctrl.addProgress(event);
                http.post('app/uninstall', {
                    name: name
                }).success(function (result) {
                    if (result.success) {
                        ctrl.refreshPage();
                        $timeout(function () {
                            ctrl.setApp(name, 'installed', false);
                            ctrl.deleteProgress(event);
                        }, 1000);
                    } else {
                        console.log('load fail');
                    }
                });
            },
            initApsMainHeight: function () {
                $timeout(function () {
                    $(".aps-main").css("min-height", window.innerHeight - $("#app-navbar").height() - 30 + 'px');
                }, 100)
            },
            searchApp: function () {
                let search = $scope.searchContent;
                if (_.isEmpty(search)) {
                    delete $scope.filterObject.name;
                } else {
                    $scope.filterObject['name'] = search;
                }
                //清除分类筛选
                $scope.selectCategory = I18nService.getValue('全部', 'all');
                delete $scope.filterObject.category;
                delete $scope.filterObject.installed;
            },
            clearInput: function () {
                $scope.searchContent = '';
                ctrl.searchApp();
            },
            categoryClick: function (name) {
                if ($scope.selectCategory !== name) {
                    $(".category-div li").removeClass("selectedColor");
                    $scope.selectCategory = name;
                }
                if (name === I18nService.getValue('全部', 'all')) {
                    delete $scope.filterObject.category;
                    delete $scope.filterObject.installed;
                } else if (name === I18nService.getValue("已安装", 'installed')) {
                    delete $scope.filterObject.category;
                    $scope.filterObject['installed'] = true;
                } else if (name === I18nService.getValue("未安装", 'no_install')) {
                    delete $scope.filterObject.category;
                    $scope.filterObject['installed'] = false;
                } else {
                    delete $scope.filterObject.installed;
                    $scope.filterObject['category'] = name;
                }
            },
            initImportApp: function () {
                FileUploadService.initialize({
                    buttonElement: element.find('.import-app-button'),
                    fileElement: element.find('#upload-appzip-input'),
                    width: 300,
                    height: 300,
                    fileType: /^application\/x-zip-compressed/
                }).progress(function (result) {
                    let fileId = _.get(result, 'datas.id', '');

                    http.get('app/importApp', {
                        fileId: fileId
                    }).success(function (result) {
                        //TODO LiuBin 根据不同的情况，显示不同的信息
                        if (result.success) {
                            let info = _.get(result, 'datas', {});
                            info.icon = 'resource/robot/base/assets/app-icon.png';
                            let i = _.findIndex(ctrl.apps, function (a) {
                                return a.name === _.get(info, 'name', '');
                            });
                            if (i === -1) {
                                ctrl.apps.push(info);
                            } else {
                                ctrl.apps[i] = info;
                            }
                            dialog.noty(I18nService.getValue("导入成功", 'import_success'));
                        } else {
                            dialog.noty(result.messages[0]);
                        }
                    })
                });
            },
            goImport: function () {
                janus.goToMenuDetailByName('应用市场');
                // $state.go('importApp');
            }
        });

        ctrl.init();
    }]);
});
