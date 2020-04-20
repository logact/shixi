define(['web/base/service'], function () {
    var app = angular.module('cnv.one2many', ['cnv.services']);

    /**
     options = {
            collection: 'device',
            filter: {'age': {$gte: 25}},
            desc: 'name',	// 显示栏位
            noteam: true,   // 是否根据 team_id 过滤
            order: [['id': 'asc'],['age': 'desc']],    // 排序栏位, 默认为 create_date desc
            data: [
                {id: '1', name: 'aa'},  // 注意 id 为 字符串
                {id: '2', name: 'bb'},
                {id: '3', name: 'cc'}
            ]
        }
     */
    app.directive('cnvone2many', ['template', '$timeout', 'util', 'DBUtils', function (template, $timeout, util, DBUtils) {

        return {
            'restrict': 'E',
            transclude: true,
            replace: true,
            scope: {
                collection: '@',
                ngModel: '=',
                noTeam: '@',
                label: '@',
                options: '=',
                required: '@',
                ngDisabled: '=',
                updateOption: '@'
            },
            templateUrl: template.getUrl('directive_cnvone2many'),
            controller: ['$scope', function ($scope) {
                // Default field
                $scope.options.desc = $scope.options.desc || 'name';
                // $scope.options.value = $scope.options.value || 'id';
            }],

            link: function ($scope, element, attrs) {
                // 最终 传入 Select2 的参数
                attrs.noTeam = attrs.noTeam === 'true';

                var options = {
                    'collection': attrs.collection,
                    'noteam': attrs.noTeam
                };
                options = _.extend(options, $scope.options);

                if (!options.data) {
                    /* ajax for data */
                    _.extend(options, {
                        "ajax": {
                            url: 'dbs/exec',
                            dataType: 'json',
                            data: function (params) {
                                // 是否更新 filter
                                if (attrs.updateOption === 'true') {
                                    _.extend(options, $scope.options)
                                }

                                var parameters = {
                                    exec: 'list',
                                    collection: options.collection
                                };
                                // 查询 filter
                                var filterObject = {};
                                if (_.isObject(options.filter)) {
                                    filterObject = util.removeHashKey(options.filter);
                                }
                                // 关键字 filter
                                if (params.term && options.desc) {
                                    let keyword = _.trim(params.term);
                                    // Done: keyword => 正则操作
                                    var regVal = {$regex: keyword, $options: 'i'};
                                    filterObject[options.desc] = regVal;
                                }

                                // 排序 sort
                                var orderObject = {};
                                if (_.size(options.order)) {
                                    _.each(options.order, function (o) {
                                        orderObject[_.first(o)] = _.last(o) === 'asc' ? 1 : -1;
                                    })
                                }
                                if (_.isEmpty(orderObject)) {
                                    orderObject['create_date'] = -1;
                                }

                                // limit 默认显示5条
                                let limit = 5;
                                // 参数 Array
                                var argsArr = [filterObject, {}, orderObject, limit, 0, options.noteam];
                                argsArr = JSON.stringify(argsArr);
                                _.extend(parameters, {
                                    params: encodeURIComponent(argsArr),
                                });

                                return parameters;
                            },
                            processResults: function (result) {
                                // 构造 [{id: 1, text: 'abc'}, {...}] 格式的数据
                                var data = _.get(result, 'datas.result', []);
                                let results = _.map(data, function (item) {
                                    return {
                                        id: item.id,
                                        text: item[options.desc]
                                    }
                                });
                                return {
                                    'results': results
                                };
                            },
                            cache: true
                        }

                    })
                } else {
                    _.each(options.data, function (item) {
                        item.text = item.text || item.name;
                    })
                }

                var formControl = element.find('.multiple-select').select2(options);
                /*选中*/
                formControl.on('select2:select', function (e) {
                    var data = e.params.data;
                    setItem(data);
                });
                /*移除选项*/
                formControl.on('select2:unselect', function (e) {
                    var data = e.params.data;
                    setItem(data);
                });

                function setItem(data) {
                    $scope.ngModel = $scope.ngModel || [];
                    if (data) {
                        if (data.selected === true) {
                            $scope.ngModel.push({
                                id: data.id,
                                name: data.text
                            });
                        } else if (data.selected === false) {
                            _.remove($scope.ngModel, function (item) {
                                return item.id == data.id;
                            });
                        }
                        util.apply($scope);
                    }
                }

                /* Set default value */
                function initialize() {
                    if ($scope.ngModel && _.isArray($scope.ngModel)) {

                        var selectedIds = _.map($scope.ngModel, 'id');
                        if (!options.data) {
                            var selectedOpts = _.map($scope.ngModel, function (item) {
                                return new Option(item.name, item.id, true, true);
                            });
                            // 设置已选项
                            formControl.empty();
                            formControl.append(selectedOpts).trigger('change');
                        } else {
                            // 固定选项 选中
                            formControl.val(selectedIds).trigger('change');
                        }
                    }
                }

                // Watch ngModel change
                $scope.$watch('ngModel', function (newValue, oldValue) {
                    // set newValue
                    if (_.size(newValue)) {
                        // set the value
                        initialize();
                    } else {
                        // set empty
                        formControl.val(null).trigger('change');
                        // formControl.empty();
                    }
                });

                if (attrs.required) {
                    element.find('.form-input .select2-selection--multiple').addClass('required');
                }

            }
        }
    }]);

});
