define(['web/base/service', 'chosen'], function () {
    var app = angular.module('cnv.many2one', ['cnv.services']);

    app.directive('cnvmany2one', ['template', '$timeout', 'util', 'DBUtils',
        function (template, $timeout, util, DBUtils) {
            return {
                'restrict': 'E',
                transclude: true,
                replace: true,
                scope: {
                    collection: '@',
                    ngModel: '=',
                    filter: '=',
                    projection: '=',
                    sort: '=',
                    limit: '@',
                    label: '@',
                    idField: '@',
                    nameField: '@',
                    placeholder: '@',
                    multiple: "@"
                },
                templateUrl: template.getUrl('directive_cnvmany2one'),
                controller: ['$scope', '$element', function ($scope, $element) {
                    var ctrl = this;
                    _.extend(ctrl, {
                        initialize: function () {
                            ctrl.loadData();
                        },
                        renderSelect: function (dataList) {
                            var html = [];
                            html.push(`<option value="">${$scope.placeholder}</option>`);
                            if (_.size(dataList)) {
                                _.each(dataList, function (row) {
                                    var idValue = _.get(row, $scope.idField, '');
                                    var nameValue = _.get(row, $scope.nameField, '');
                                    html.push(`<option value="${idValue}">${nameValue}</option>`);
                                });
                            }
                            var select = $element.find('.chosen-select');

                            // 多选
                            if ($scope.multiple === 'true') {
                                select.attr("multiple", true);
                            }
                            select.html(html.join(''));

                            ctrl.setSelectOption();

                            select.chosen({
                                search_contains: true,
                                allow_single_deselect: true
                            }).change(function (event, item) {
                                var valueObj = null;
                                if ($scope.multiple === 'true') {
                                    valueObj = [];
                                    var option_selected = $(this).find("option:selected");
                                    _.each(option_selected, function (option) {
                                        var text = $(option).text();
                                        var val = $(option).val();
                                        if (val) {
                                            var item = {};
                                            _.set(item, $scope.nameField, text);
                                            _.set(item, $scope.idField, val);
                                            valueObj.push(item);
                                        }
                                    });
                                } else {
                                    if (item) {
                                        valueObj = {};
                                        _.set(valueObj, $scope.idField, _.get(item, 'selected', ''));
                                        _.set(valueObj, $scope.nameField, $(this).find("option:selected").text());
                                    }
                                }
                                $scope.ngModel = valueObj;
                                util.apply($scope);
                            });
                            $scope.$watch("ngModel", function (newValue, value) {
                                if (!newValue) {
                                    return;
                                }
                                if ($scope.multiple === 'true') {
                                    $scope.$emit('Many2OneSelect', $scope.collection, $scope.ngModel);
                                } else {
                                    if (_.isEmpty(_.get(newValue, $scope.idField, ""))) {
                                        $(select).val('').trigger('chosen:updated');
                                    }
                                    let id = _.get(newValue, $scope.idField, "");
                                    $(select).val(id).trigger("chosen:updated");
                                    $scope.$emit('Many2OneSelect', $scope.collection, $scope.ngModel);
                                }
                            }, true);
                        },
                        loadData: function () {
                            function getParamValue(value, param) {
                                if (_.isObject(param)) {
                                    _.extend(value, param);
                                }
                                if (_.isFunction(param)) {
                                    _.extend(value, param.call());
                                }
                            }

                            var filter = {};
                            getParamValue(filter, $scope.filter);

                            var projection = {};
                            getParamValue(projection, $scope.projection);

                            var sort = {};
                            getParamValue(sort, $scope.sort);

                            /*load data*/
                            DBUtils.list($scope.collection, filter, projection, sort, $scope.limit).success(function (result) {
                                ctrl.renderSelect(_.get(result, "datas.result", []));
                            });
                        },
                        setSelectOption: function () {
                            var select = $element.find('.chosen-select');
                            if ($scope.multiple === 'true') {
                                var array = [];
                                _.each($scope.ngModel, function (item) {
                                    var idField_value = _.get(item, $scope.idField);
                                    array.push(idField_value);
                                });
                                $(select).val(array);
                            } else {
                                var valueId = _.get($scope.ngModel, $scope.idField, '');
                                if (valueId) {
                                    select.val(valueId);
                                }
                            }
                        }
                    });

                    ctrl.initialize();
                }],
                controllerAs: 'ctrl',
                link: function ($scope, element, attrs) {
                    var idField = attrs.idField || 'id';
                    var nameField = attrs.nameField || 'name';

                    $scope.idField = idField;
                    $scope.nameField = nameField;

                    var placeholder = attrs.placeholder || '请选择...';
                    $scope.placeholder = placeholder;


                    var limit = 0;
                    if (attrs.limit) {
                        limit = _.parseInt(attrs.limit);
                        if (_.isNaN(limit) || limit < 0) {
                            limit = 0;
                        }
                    }
                    $scope.limit = limit;

                    $scope.collection = attrs.collection;

                    if (!attrs.label) {
                        element.addClass('nolabel');
                    }
                }
            }
        }]);
})
