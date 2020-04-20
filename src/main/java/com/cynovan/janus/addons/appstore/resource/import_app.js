define([], function () {
    let app = angular.module('app');
    app.controller('ImportAppController', ['$scope', 'http', 'FileUploadService', '$element', 'dialog', '$timeout', '$state', 'DBUtils', 'I18nService', function ($scope, http, FileUploadService, element, dialog, $timeout, $state, DBUtils, I18nService) {
        var ctrl = this;
        $scope.appInfo = {};
        _.extend(ctrl, {
            initialize: function () {
                $timeout(function () {
                    ctrl.initImportApp();
                    ctrl.bindEvent();
                }, 300);
            },
            bindEvent: function () {
                element.find('.import-app-button').click();
            },
            initImportApp: function () {
                FileUploadService.initialize({
                    buttonElement: element.find('.import-app-button'),
                    fileElement: element.find('#upload-appzip-input'),
                    width: 300,
                    height: 300,
                    fileType: /zip/
                }).progress(function (result) {
                    let fileId = _.get(result, 'datas.id', '');
                    dialog.waiting();
                    http.get('app/importApp', {
                        fileId: fileId
                    }).success(function (result) {
                        dialog.hideWaiting();
                        $scope.importFlag = result.success;
                        let info = _.get(result, 'datas', {});
                        if (result.success) {
                            $scope.appInfo = _.get(info, 'app', {});
                            if ($scope.appInfo.type === 'deviceview') {
                                let message = I18nService.getValue("为保证正常使用，该应用会先生成满足其正常运行的数据，且该数据不可修改；卸载应用时删除", "device.view.tip");
                                _.set($scope.appInfo, "message", message);
                            }
                        } else {
                            if (info.currentVersion) {
                                //如果用户上传的是旧版，对比当前版本，显示详细信息
                                $scope.appInfo = _.get(info, 'app', {});
                                $scope.appInfo.currentVersion = info.currentVersion;
                                DBUtils.find('open_apps', {
                                    appId: $scope.appInfo.appId,
                                    version: $scope.appInfo.currentVersion
                                }).success(function (result) {
                                    $scope.nowAPPInfo = _.get(result, 'datas.result', {});
                                })
                            }
                            $scope.appInfo.message = result.messages[0];
                            dialog.noty($scope.appInfo.message);
                        }
                    })
                });
            },
            install: function () {
                if ($scope.appInfo.appId) {
                    http.post('app/install', {
                        name: $scope.appInfo.appId
                    }).success(function (result) {
                        if (result.success) {
                            $state.go('appstore');
                            dialog.notyWithRefresh(I18nService.getValue("导入成功", 'import_success'));
                        } else {
                            console.log('load fail');
                        }
                    });
                }
            },
            goStore: function () {
                $state.go('appstore');
            }
        });
        ctrl.initialize();
    }])
});