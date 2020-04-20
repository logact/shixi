define([], function () {
    var app = angular.module('app');

    app.controller('ControllingLogListController', ['$scope', '$state', 'janus', 'I18nService',
        function ($scope, $state, janus, I18nService) {
            var ctrl = this;

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initTableOption();
                    ctrl.bindEvent();
                },
                initTableOption: function () {
                    ctrl.options = {
                        collection: 'controlling_log',
                        filled: true,
                        columns: [{
                            name: 'create_date',
                            title: I18nService.getValue('触发时间', 'trigger_time'),
                            search: true,
                        }, {
                            name: 'controlling.name',
                            title: I18nService.getValue('自动化规则', 'production.line.rule'),
                            search: true,
                        }, {
                            name: 'rule_id',
                            title: I18nService.getValue('触发规则名称', 'trigger_rule_name'),
                            search: true,
                            render: function (data, type, row) {
                                if (row.controlling) {
                                    let rule = _.find(row.controlling.rules, ['rule_id', row.rule_id]);
                                    if (rule) {
                                        return `<span>${rule.name ? rule.name : I18nService.getValue('未知规则', 'unknown_rule')}</span>`;
                                    } else {
                                        return `<span>${I18nService.getValue('未知规则', 'unknown_rule')}</span>`;
                                    }
                                } else {
                                    return `<span>${I18nService.getValue('未知规则', 'unknown_rule')}</span>`;
                                }
                            }
                        }, {
                            name: 'conditionResult',
                            title: I18nService.getValue('触发规则类型', 'trigger_rule_type'),
                            orderable: false,
                            render: function (data, type, row) {
                                if (row.controlling) {
                                    let rule = _.find(row.controlling.rules, ['rule_id', row.rule_id]);
                                    if (rule) {
                                        return `<span>${rule.triggerRule ? rule.triggerRule : I18nService.getValue('未知类型', 'unknown_rule_type')}</span>`;
                                    } else {
                                        return `<span>${I18nService.getValue('未知类型', 'unknown_rule_type')}</span>`;
                                    }
                                } else {
                                    return `<span>${I18nService.getValue('未知类型', 'unknown_rule_type')}</span>`;
                                }
                            }
                        }, {
                            name: 'times',
                            title: I18nService.getValue('触发次数', 'trigger_count'),
                            orderable: false
                        }, {
                            name: 'controlling.rules',
                            visible: false
                        }, {
                            name: '_id',
                            title: I18nService.getValue('操作', 'do'),
                            orderable: false,
                            width: '100px',
                            render: function (data, type, row) {
                                var html = `<button data-key='info' class="btn btn-primary btn-xs btn-outline" type="button"><i class="fa fa-info"></i> ${I18nService.getValue('查看详情', 'view_detail')}</button>`;
                                return html;
                            }
                        }]
                    };
                },
                bindEvent: function () {
                    $scope.$on('buttonClicked.list', function (event, element, options, rowdata) {
                        var buttonKey = element.closest('.btn').data('key');
                        if (buttonKey === "info") {
                            ctrl.toDetailPage(rowdata.id);
                        }
                    });
                },
                toDetailPage: function (id) {
                    janus.goToMenuDetailByName('运行日志', id);
                }
            });
            ctrl.initialize();
        }]);
});
