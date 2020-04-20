define([], function () {
    var app = angular.module('app');

    app.controller('AddRoleController', ['$scope', 'DBUtils', 'http', 'util', 'session', 'dialog', '$stateParams', '$state', '$timeout', '$element', '$window', 'janus', 'I18nService',
        function ($scope, DBUtils, http, util, session, dialog, $stateParams, $state, $timeout, $element, $window, janus, I18nService) {
            var ctrl = this;
            $scope.entity = {};
            $scope.rolename = I18nService.getValue("新建角色", 'create_role');
            $scope.menuList = [];
            ctrl.dataPermission = [{
                id: 'allData',
                name: I18nService.getValue('所有数据', 'all.data')
            }, {
                id: 'teamData',
                name: I18nService.getValue('所在团队数据', 'all.team.data')
            }, {
                id: 'teamAndSubTeam',
                name: I18nService.getValue('所在团队以及子团队数据', 'own_team_data')
            }];
            var tags = [];
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.loadData();
                    ctrl.initSubNavOption();
                    $timeout(function () {
                        ctrl.initAttachTeamSelect();
                    }, 300);
                },
                initSubNavOption: function () {
                    ctrl.subNavOptions = {
                        collection: 'role',
                        query: {},
                        label: I18nService.getValue('角色列表', 'role_list'),
                        selected: $stateParams.id,
                        code: 'id',
                        name: 'name'
                    }
                },
                initAttachTeamSelect: function () {
                    DBUtils.list('team', {}).success(function (result) {
                        var entity = _.get(result, 'datas.result', []);
                        _.each(entity, function (team) {
                            tags.push({
                                id: team.code,
                                name: team.name
                            });
                        });
                        var html = [];
                        _.each(tags, function (tag) {
                            html.push(`<option value="${tag.id}">${tag.name}</option>`);
                        });
                        var selectElement = $element.find('#attachTeamSelect');
                        selectElement.html(html.join(''));
                        if (_.isArray($scope.entity.attachTeam)) {
                            selectElement.val($scope.entity.attachTeam);
                        }
                        selectElement.chosen({
                            search_contains: true,
                            allow_single_deselect: true
                        }).change(function () {
                            entity.attachTeam = selectElement.val();
                            $scope.entity.attachTeam = entity.attachTeam;
                        });
                    });
                },
                loadData: function () {
                    http.post('role/menu', {
                        id: $stateParams.id
                    }).success(function (result) {
                        ctrl.calcMenuReuslt(result);
                    });
                },
                calcMenuReuslt: function (result) {
                    var menuList = _.get(result, 'menu', []);
                    var entity = _.get(result, 'role', {});
                    var permission = _.get(entity, 'permission', []);
                    if (_.size(permission)) {
                        _.each(menuList, function (module) {
                            _.each(module.submodule, function (submodule) {
                                var checkedAll = true;
                                _.each(submodule.security, function (security) {
                                    var key = submodule.appId + '@' + submodule.menuIndex + '@' + security.code;
                                    if (permission.indexOf(key) !== -1) {
                                        security.checked = true;
                                    } else {
                                        checkedAll = false;
                                    }
                                });
                                submodule.checked = checkedAll;
                            });
                        });
                    }
                    $scope.menuList = menuList;
                    $scope.entity = entity;
                    util.apply($scope);
                },
                selectAll: function (item) {
                    item.checked = !item.checked;
                    _.each(item.security, function (security) {
                        security.checked = item.checked;
                    });
                    util.apply($scope);
                },
                itemChange: function (i, item) {
                    if (i.description === '查看') {
                        if (i.checked === false) {
                            item.checked = false;
                            _.each(item.security, function (security) {
                                security.checked = false;
                            });
                        } else {
                            // 判断是否只有查看的功能,是的话就全选
                            var checkedAll = true;
                            _.each(item.security, function (security) {
                                if (security.checked === false) {
                                    checkedAll = false; // 若只有查看功能security.checked一定为true
                                }

                            });
                            item.checked = checkedAll;
                        }
                    } else if (i.description === '管理') {
                        if (i.checked === false) {
                            item.checked = false;
                        } else {
                            ctrl.selectAll(item);
                        }
                    }
                    util.apply($scope);
                },
                getPermeission: function () {
                    var permission = [];
                    _.each($scope.menuList, function (module) {
                        _.each(module.submodule, function (submodule) {
                            _.each(submodule.security, function (security) {
                                if (security.checked) {
                                    var key = submodule.appId + '@' + submodule.menuIndex + '@' + security.code;
                                    permission.push(key);
                                }

                            });
                        });
                    });
                    return permission;
                },
                saveRole: function () {
                    var entity = $scope.entity;
                    entity.permission = ctrl.getPermeission();
                    if (!entity.name) {
                        dialog.noty(I18nService.getValue("请输入角色名称", 'input.role.name'));
                        return false;
                    }
                    http.post('role/save', {
                        entity: util.encodeJSON(entity)
                    }).success(function (result) {
                        if (result.success) {
                            dialog.noty(I18nService.getValue('保存成功', 'save_success'));
                            janus.goToMenuDetailByName('角色', result.datas.id);
                        } else {
                            dialog.noty(result.datas.reason);
                        }
                    });
                },
                back: function () {
                    janus.goToMenuByName('角色');
                }
            });
            ctrl.initialize();
        }]);
});
