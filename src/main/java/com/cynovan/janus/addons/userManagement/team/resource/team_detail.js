define([], function () {
    var app = angular.module('app');
    app.controller('AddTeamController', ['$scope', 'DBUtils', 'http', 'util', 'session', 'dialog', '$stateParams', '$state', '$window', 'janus', 'I18nService',
        function ($scope, DBUtils, http, util, session, dialog, $stateParams, $state, $window, janus, I18nService) {
            var ctrl = this;
            $scope.entity = {};
            $scope.teamname = I18nService.getValue("新建团队", 'create_team');
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadData();
                    ctrl.initSubNavOption();
                },
                loadData: function () {
                    if ($stateParams.id !== 'add_team') {
                        DBUtils.find('team', {
                            id: $stateParams.id,
                        }).success(function (result) {
                            var entity = _.get(result, 'datas.result', {});
                            $scope.entity = entity;
                            $scope.teamname = I18nService.getValue("团队", 'team') + '-' + entity.name;
                        });
                    }
                },
                initSubNavOption: function () {
                    ctrl.subNavOptions = {
                        collection: 'team',
                        query: {},
                        label: I18nService.getValue('团队列表', 'team_list'),
                        selected: $stateParams.id,
                        code: 'id',
                        name: 'name'
                    }
                },
                saveNewTeam: function () {
                    var entity = $scope.entity;
                    if (!entity.name) {
                        dialog.noty(I18nService.getValue("请输入团队名称", 'input.team.name'));
                        return false;
                    }
                    var parentTeamCode = _.get(entity, 'team.code', '');
                    if (parentTeamCode === entity.code) {
                        dialog.noty(I18nService.getValue("上级团队不能选择团队本身", 'no_select_own'));
                        return false;
                    }
                    http.post('team/save', {
                        entity: util.encodeJSON(entity)
                    }).success(function (result) {
                        if (result.success) {
                            dialog.noty(I18nService.getValue('保存成功', 'save_success'));
                            janus.goToMenuDetailByName('团队', result.datas.id);
                        } else {
                            dialog.noty(result.datas.reason);
                        }
                    });
                },
                back: function () {
                    janus.goToMenuByName('团队');
                }
            });
            ctrl.initialize();
        }]);
});
