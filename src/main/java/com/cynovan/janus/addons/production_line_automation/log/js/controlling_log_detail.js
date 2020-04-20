define([], function () {
    var app = angular.module('app');

    app.controller('ControllingLogDetailController', ['$scope', '$stateParams', 'DBUtils', 'util', 'janus', 'I18nService', function ($scope, $stateParams, DBUtils, util, janus, I18nService) {
        var ctrl = this;
        $scope.entity = {};
        $scope.devices = [];
        $scope.title = '';
        $scope.time_push = I18nService.getValue('定时下发', 'time.issue');
        $scope.data_drive = I18nService.getValue('数据驱动', 'data.drive');

        _.extend(ctrl, {
            initialize: function () {
                ctrl.getDetail();
            },
            getDetail: function () {
                let logId = $stateParams.id;
                DBUtils.find('controlling_log', {
                    id: logId
                }).success(function (result) {
                    var entity = _.get(result, 'datas.result', {});
                    let ruleId = _.get(entity, 'rule_id', "");
                    $scope.entity = entity;
                    $scope.title = _.join([I18nService.getValue('运行日志', 'production.line.log'), entity.controlling.name], '-');
                    let allDevices = _.get(entity, 'controlling.devices', []);
                    let allRules = _.get(entity, 'controlling.rules', []);
                    $scope.rule = _.find(allRules, ['rule_id', ruleId]);
                    let pushDevices = _.get($scope.rule, 'pushDevice', []);

                    $scope.controlling = _.get(entity, 'controlling', {});
                    $scope.controllingRoules = allRules;
                    $scope.controllingDevices = allDevices;
                    $scope.openFlag = _.get($scope.controlling, 'open', false) ? I18nService.getValue('已启用', 'activated') : I18nService.getValue('未启用', 'no_activated');
                    _.each(pushDevices, function (value) {
                        $scope.devices = _.concat($scope.devices, _.filter(allDevices, ['alias', value.name]));
                    });
                    util.apply($scope);
                });
            },
            isThisLogDevice: function (device) {
                if (_.findIndex($scope.devices, ['uuid', device.uuid]) > -1) {
                    return true;
                }
                return false;
            },
            goList: function () {
                janus.goToMenuByName('运行日志');
            }
        });
        ctrl.initialize();
    }]);
});