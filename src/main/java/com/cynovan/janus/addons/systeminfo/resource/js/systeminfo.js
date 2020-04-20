define([], function () {
    var app = angular.module('app');

    app.controller('JanusInfoController', ['$scope', 'DBUtils', 'http', 'util', 'session', 'dialog', 'formatter', '$timeout', 'I18nService',
        function ($scope, DBUtils, http, util, session, dialog, formatter, $timeout, I18nService) {
            var ctrl = this;

            _.extend(ctrl, {
                initialize: function () {
                    $scope.entity = $scope.entity || {};
                    DBUtils.find("janus", {}).success(function (result) {
                        $scope.entity = _.get(result, 'datas.result', {});
                        $scope.token = $scope.entity.token;
                        ctrl.bindEvent();
                        ctrl.loadHardwareInfo();
                        ctrl.loadStrategy();
                    });
                },
                bindEvent: function () {
                    $scope.$watch('entity.left_logo_image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('janus', {
                                    token: $scope.token
                                }, {
                                    $set: {
                                        'left_logo_image_id': newValue
                                    }
                                }).success(function () {
                                    // dialog.noty('操作成功');
                                });
                            }
                        }
                    });
                    $scope.$watch('entity.right_logo_image_id', function (newValue, oldValue) {
                        if (!_.isUndefined(newValue)) {
                            if (newValue !== oldValue) {
                                DBUtils.update('janus', {
                                    token: $scope.token
                                }, {
                                    $set: {
                                        'right_logo_image_id': newValue
                                    }
                                }).success(function () {
                                    // dialog.noty('操作成功');
                                });
                            }
                        }
                    });
                },
                loadHardwareInfo: function () {
                    http.get('janusInfo/hardwareInfo').success(function (result) {
                        $scope.os = result.os.name + " " + result.os.version;
                        $scope.memory = formatter.byteToSize(_.get(result, 'memory.total', 0));
                        //网卡
                        $scope.ni = result.ni;
                        if (_.size($scope.ni) > 1) {
                            $timeout(function () {
                                $("#niBox").css({"max-height": "300px", "overflow": "auto"})
                            }, 300)
                        }

                        //硬盘
                        result.disk.forEach(function (partition, index) {
                            partition.total_display = formatter.byteToSize(partition.total);
                            // partition.available_display = formatter.byteToSize(partition.available);
                            partition.used_display = formatter.byteToSize(partition.used);
                            partition.percentage = formatter.toPercentage(partition.used, partition.total);
                            var percentage = Math.round(partition.percentage);
                            $timeout(function () {
                                $("#storeBar-" + index).css("width", percentage + "%");
                                if (percentage > 20) {
                                    $("#storeBar-" + index).removeClass("progress-bar-success");
                                    $("#storeBar-" + index).addClass("progress-bar-danger");
                                }
                            }, 300);
                        });
                        $scope.disk = result.disk;

                        //存储信息
                        var storageSize = _.get(result, 'storage.storageSize', 0);
                        var fsTotalSize = _.get(result, 'storage.fsTotalSize', 0);
                        $scope.storageSize = formatter.byteToSize(storageSize);
                        $scope.storagePercentage = formatter.toPercentage(storageSize, fsTotalSize);
                        $timeout(function () {
                            $("strategyBar").css("width", Math.round($scope.storagePercentage) + "%");
                            if (Math.ceil($scope.storagePercentage) > 80) {
                                $("strategyBar").removeClass("progress-bar-success");
                                $("strategyBar").addClass("progress-bar-danger");
                            }
                        }, 300);
                    });
                },
                loadStrategy: function () {
                    DBUtils.find('autoClearStrategy', {}).success(function (result) {
                        var entity = _.get(result, 'datas.result', {});
                        $scope.entity.strategy = entity.plan;
                        $scope.entity.clearProportion = entity.clearProportion;
                        if (entity.plan === 'A') {
                            $scope.entity.peakA = entity.peak;
                        }
                        if (entity.plan === 'B') {
                            $scope.entity.peakB = entity.peak;
                        }
                    });
                },
                saveStrategy: function () {
                    var entity = $scope.entity;
                    var peak;
                    if (entity.strategy) {
                        if (entity.strategy === 'A') {
                            if (!_.isInteger(entity.peakA) || entity.peakA <= 0) {
                                dialog.noty(I18nService.getValue('janus存储峰值需为正整数', 'janus.storage.integer'));
                                return false;
                            }
                            peak = entity.peakA;//int & unitGB
                        } else {
                            peak = entity.peakB;
                        }
                        if (!peak) {
                            dialog.noty(I18nService.getValue('峰值数值不能为空', 'janus.storage.no_null'));
                            return false;
                        }
                        if (!entity.clearProportion) {
                            dialog.noty(I18nService.getValue('请选择清除比例', 'please_select_proportion'));
                            return false;
                        }
                        DBUtils.update('autoClearStrategy', {}, {
                            $set: {
                                'plan': entity.strategy,
                                'peak': peak,
                                'clearProportion': entity.clearProportion
                            },
                        }).success(function () {
                            dialog.noty(I18nService.getValue('保存成功', 'save_success'))
                        });
                    } else {
                        dialog.noty(I18nService.getValue('请选择峰值监控策略', 'please_select_max_monitor'));
                    }
                },
            });
            ctrl.initialize();
        }]);

    app.controller('BuildInfoController', ['$scope', 'DBUtils', 'http', function ($scope, DBUtils, http) {
        var ctrl = this;
        $scope.entity = {};
        $scope.hasBuildInfo = false;
        _.extend(ctrl, {
            initialize: function () {
                ctrl.bindEvent();
            },
            bindEvent: function () {
                http.get('janusInfo/buildInfo').success(function (data) {
                    $scope.entity = data;
                    if (!_.isEmpty($scope.entity)) {
                        $scope.hasBuildInfo = true;
                    }
                });
            }
        });
        ctrl.initialize();
    }]);
})
;