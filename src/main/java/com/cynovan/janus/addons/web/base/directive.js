define(['web/base/service', 'dropzone', 'taggle', 'pagination', 'css!web/lib/prettyCheckbox/pretty-checkbox', 'web/base/many2one', 'web/base/one2many'], function () {
    var app = angular.module('cnv.directives', ['cnv.services', 'cnv.many2one', 'cnv.one2many']);

    app.directive('tabs', ['template', '$timeout',
        function (template, $timeout) {
            return {
                'restrict': 'EA',
                transclude: true,
                replace: true,
                scope: {
                    styleClass: '@'
                },
                templateUrl: template.getUrl('tabs'),
                link: function ($scope, element, attrs) {
                    if (attrs.styleClass) {
                        element.addClass(attrs.styleClass);
                    }
                },
                controller: ["$scope", function ($scope) {
                    var panes = $scope.panes = [];

                    $scope.select = function (pane) {
                        angular.forEach(panes, function (pane) {
                            pane.selected = false;
                        });
                        pane.selected = true;
                        if (_.isFunction(pane.onShow)) {
                            $timeout(function () {
                                pane.onShow.call(pane);
                            }, 150);
                        }
                    }

                    this.addPane = function (pane) {
                        if (panes.length == 0) $scope.select(pane);
                        panes.push(pane);
                    }
                }]
            };
        }])

    app.directive('tab', [function () {
        return {
            require: '^tabs',
            restrict: 'E',
            transclude: true,
            scope: {
                title: '@',
                // use on-show ,as angular auto transform to on-show
                onShow: '&'
            },
            link: function ($scope, element, attrs, tabsCtrl) {
                tabsCtrl.addPane($scope, element);
            },
            template: '<div class="tab-pane" ng-class="{active: selected}" ng-transclude></div>',
            replace: true
        };
    }]);

    app.directive('widget', ['template', function (template) {
        return {
            'restrict': 'EA',
            transclude: true,
            replace: true,
            templateUrl: template.getUrl('directive_widget'),
            scope: {
                title: '@',
            },
            link: function ($scope, element, attrs) {
            }
        };
    }]);

    app.directive('staticfield', ['template', 'DeviceService', 'dialog', '$rootScope', 'I18nService',
        function (template, DeviceService, dialog, $rootScope, I18nService) {
            return {
                'restrict': 'E',
                transclude: true,
                replace: true,
                scope: {
                    label: '@',
                    field: '@',
                    unit: '@',
                    // powerUnit: '@',
                    push: '@',
                    width: '@',
                    styleClass: '@',
                    uuid: '='
                },
                templateUrl: template.getUrl('directive_staticfield'),
                link: function ($scope, element, attrs) {
                    if (attrs.label) {
                        element.find('.static-field-label').html(attrs.label);
                    }
                    if (attrs.field) {
                        element.find('.static-field-value').data('key', attrs.field);
                    }
                    if (attrs.unit) {
                        element.find('.static-field-unit').html(attrs.unit);
                    }
                    // if (attrs.powerUnit) {
                    //     var lbElement = document.createElement('label');
                    //     lbElement.setAttribute('class', 'static-field-power-unit hide');
                    //     element.append(lbElement);
                    // }
                    if (attrs.push) {
                        element.find('.static-field-value').data('push', attrs.push);
                        element.on('click', '.static-field-push-btn', function () {
                            /*show the dialog */
                            var value = element.find('.static-field-value').text() || '';
                            dialog.show({
                                title: I18nService.getValue('数据下发', 'data.issue'),
                                width: 800,
                                template: 'directive_staticfield_push_template',
                                data: {
                                    entity: {
                                        desc: attrs.label,
                                        key: attrs.push,
                                        value: value
                                    }
                                },
                                controller: ['$scope', function (dialogScope) {
                                    dialogScope.$on('success', function (event, checkMessage) {
                                        var fieldValue = dialogScope.entity.value;
                                        fieldValue = _.trim(fieldValue);
                                        if (!fieldValue) {
                                            checkMessage.success = false;
                                            dialog.noty(I18nService.getValue('请输入有效的值', 'input.valid.value'));
                                            return false;
                                        }
                                        var updateObj = {};
                                        updateObj[$scope.push] = fieldValue;
                                        $rootScope.$broadcast('BeforePush', updateObj);
                                        DeviceService.push($scope.uuid, 'update', updateObj);
                                    });
                                }]
                            });
                        });
                    }
                    if (attrs.width) {
                        element.find('.static-field-label').width(attrs.width);
                    }
                    if (attrs.styleClass) {
                        element.addClass(attrs.styleClass);
                    }
                }
            }
        }]);

    app.directive('staticswitch', ['template', function (template) {
        return {
            'restrict': 'E',
            transclude: true,
            replace: true,
            scope: {
                label: '@',
                field: '@',
                styleClass: '@',
                width: '@'
            },
            templateUrl: template.getUrl('directive_staticswitch'),
            link: function ($scope, element, attrs) {
                if (attrs.label) {
                    element.find('.switch-field-label').html(attrs.label);
                }
                if (attrs.field) {
                    element.find('.static-switch-state').data('key', attrs.field);
                }
                if (attrs.width) {
                    element.find('.switch-field-label').width(attrs.width);
                }
                if (attrs.styleClass) {
                    element.addClass(attrs.styleClass)
                }
            }
        }
    }]);

    app.directive('staticstate', ['template', function (template) {
        return {
            'restrict': 'E',
            transclude: true,
            replace: true,
            scope: {
                label: '@',
                field: '@',
                styleClass: '@',
                width: '@'
            },
            templateUrl: template.getUrl('directive_state'),
            link: function ($scope, element, attrs) {
                if (attrs.label) {
                    element.find('.state-field-label').html(attrs.label);
                }
                if (attrs.field) {
                    element.find('.static-state-state').data('key', attrs.field);
                }
                if (attrs.width) {
                    element.find('.state-field-label').width(attrs.width);
                }
                if (attrs.styleClass) {
                    element.addClass(attrs.styleClass)
                }
            }
        }
    }]);

    app.directive('cnvimage', ['template', 'util', 'FileUploadService', '$timeout',
        function (template, util, FileUploadService, $timeout) {
            return {
                'restrict': 'EA',
                'templateUrl': template.getUrl('directive_cnvimage'),
                'replate': true,
                scope: {
                    ngModel: '=',
                    label: '@',
                    default: '@',
                    width: '@',
                    height: '@',
                    disabled: '@',
                    tips: '@ '
                },
                link: function ($scope, element, attrs, controller) {
                    if (!attrs.width) {
                        attrs.width = 300;
                    }
                    if (!attrs.height) {
                        attrs.height = 300;
                    }
                    $scope.label = attrs.label;

                    $scope.$watch('ngModel', function (newValue, oldValue) {
                        setImage(newValue);
                    });

                    $scope.disabled = false;
                    if (attrs.disabled === 'true' || attrs.disabled === true) {
                        $scope.disabled = true;
                    }

                    /* Main function */
                    var setImage = function (image_id) {
                        $scope.ngModel = image_id;
                        if (image_id) {
                            var url = util.getImageUrl(image_id);
                            element.find('.img-field').attr('src', url);
                            element.find('[data-fancybox]').attr('href', url + '?thumb=false');
                        } else {
                            element.find('.img-field').attr('src', '');
                            element.find('[data-fancybox]').attr('href', '');
                        }
                    };

                    $timeout(function () {
                        FileUploadService.initialize({
                            buttonElement: element.find('.add-btn'),
                            fileElement: element.find('input[type="file"]'),
                            width: attrs.width,
                            height: attrs.height
                        }).progress(function (result) {
                            var imageId = _.get(result, 'datas.id', '');
                            if (imageId) {
                                setImage(imageId);
                                util.apply($scope);
                            }
                        });
                    }, 300);

                    element.find('[data-fancybox]').fancybox({});

                    $scope.remove = function () {
                        setImage('');
                    }
                }
            }
        }]);

    app.directive('field', ['template', '$timeout', 'dialog', "I18nService", function (template, $timeout, dialog, I18nService) {
        return {
            'restrict': 'E',
            transclude: true,
            replace: true,
            scope: {
                styleClass: '@',
                label: '@',
                ngModel: '=',
                info: '@',
                copy: '=',
                width: '@',
            },
            templateUrl: template.getUrl('directive_field'),
            link: function ($scope, element, attrs) {
                if (attrs.styleClass) {
                    element.addClass(attrs.styleClass);
                }
                if (_.isArray($scope.ngModel)) {
                    $scope.ngModel = _.join($scope.ngModel, ',');
                }

                if (attrs.width) {
                    var width = _.parseInt(attrs.width);
                    if (_.isNumber(width)) {
                        element.find('.c-field-label').width(width);
                        element.find('.c-field-value').css('marginLeft', width + 15);
                    }
                }

                if (attrs.info) {
                    $timeout(function () {
                        var tipElement = element.find('.control-info');
                        var myOpentip = new Opentip(tipElement, {
                            myOpentip: 'right'
                        });
                        myOpentip.setContent(attrs.info);
                    });
                }
                if ($scope.copy) {
                    $scope.copyField = function (event) {
                        var copyContent = $(event.currentTarget).parent().parent().siblings(".c-field-value").text();
                        var $temp = $("<input>");
                        $("body").append($temp);
                        $temp.val(copyContent).select();
                        document.execCommand("copy");
                        $temp.remove();
                        dialog.noty(I18nService.getValue("复制成功", 'copy.success'))
                    };
                }
            }
        }
    }]);

    app.directive('viewform', ['template', function (template) {
        return {
            'restrict': 'EA',
            'templateUrl': template.getUrl('directive_viewform'),
            'replace': true,
            'transclude': true,
            scope: false,
            compile: function (element, attrs) {
            }
        }
    }]);

    app.directive('cnvtextarea', ['template', '$timeout', function (template, $timeout) {
        return {
            'restrict': 'EA',
            replace: true,
            scope: {
                styleClass: '@',
                label: '@',
                ngModel: '=',
                required: '@',
                info: '@',
                width: '@',
                placeholder: '@'
            },
            templateUrl: template.getUrl('directive_textarea'),
            link: function ($scope, element, attrs) {
                if (attrs.styleClass) {
                    element.addClass(attrs.styleClass);
                }

                if (attrs.width) {
                    var width = _.parseInt(attrs.width);
                    if (_.isNumber(width)) {
                        element.find('.form-label').width(width);
                        element.find('.form-input').css('marginLeft', width + 15);
                    }
                }

                if (attrs.required) {
                    element.addClass('required');
                }

                if (attrs.info) {
                    $timeout(function () {
                        var tipElement = element.find('.control-info');
                        var myOpentip = new Opentip(tipElement, {
                            myOpentip: 'right'
                        });
                        myOpentip.setContent(attrs.info);
                    });
                }
            }
        }
    }]);

    app.directive('cnvtext', ['template', '$timeout',
        function (template, $timeout) {
            return {
                'restrict': 'EA',
                transclude: true,
                replace: true,
                scope: {
                    styleClass: '@',
                    label: '@',
                    ngModel: '=',
                    required: '@',
                    info: '@',
                    width: '@',
                    placeholder: '@',
                },
                templateUrl: template.getUrl('directive_cnvtext'),
                link: function ($scope, element, attrs) {
                    if (attrs.styleClass) {
                        element.addClass(attrs.styleClass);
                    }
                    if (attrs.width) {
                        var width = _.parseInt(attrs.width);
                        if (_.isNumber(width)) {
                            element.find('.form-label').width(width);
                            element.find('.form-input').css('marginLeft', width + 15);
                        }
                    }
                    if (attrs.required) {
                        element.find('.form-input .form-control').addClass('required');
                    }
                    if (attrs.info) {
                        $timeout(function () {
                            var tipElement = element.find('.control-info');
                            var myOpentip = new Opentip(tipElement, {
                                myOpentip: 'right'
                            });
                            myOpentip.setContent(attrs.info);
                        });
                    }
                }
            }
        }]);

    app.directive('cnvtags', ['template', 'DBUtils',
        function (template, DBUtils) {
            return {
                'restrict': 'EA',
                transclude: true,
                replace: true,
                scope: {
                    tagKey: '@',
                    label: '@',
                    ngModel: '=ngModel'
                },
                controllerAs: 'vm',
                templateUrl: template.getUrl('directive_cnvtags'),
                link: function ($scope, element, attrs) {
                    $scope.label = attrs.label;
                },
                controller: ['$scope', '$element',
                    function ($scope, $element) {
                        var vm = this;
                        vm.items = [];
                        vm.tagKey = $scope.tagKey;

                        $scope.showClear = false;

                        if (!$scope.ngModel) {
                            $scope.ngModel = [];
                        }

                        var ctrl = {
                            initialize: function () {
                                ctrl.loadTags();
                            },
                            loadTags: function () {
                                DBUtils.find('dataTag', {
                                    key: vm.tagKey
                                }).success(function (data) {
                                    var arr = _.get(data, "datas.result.tags", []);
                                    vm.items = arr;
                                    ctrl.bindSelect();
                                });
                            },
                            addTag: function (tagName) {
                                if (!~_.indexOf(vm.items, tagName)) {
                                    DBUtils.update('dataTag', {
                                        key: vm.tagKey
                                    }, {
                                        $addToSet: {
                                            'tags': tagName
                                        }
                                    }, true).success(function () {
                                        vm.items.push(tagName);
                                    });
                                }

                                if (!~_.indexOf($scope.ngModel, tagName)) {
                                    $scope.ngModel.push(tagName);
                                }
                            },
                            removeTag: function (tagName) {
                                _.remove(vm.items, function (item) {
                                    return item === tagName;
                                });
                                _.remove($scope.ngModel, function (item) {
                                    return item === tagName;
                                });
                            },
                            bindSelect: function () {
                                var tagSelect = $element.find('div.taggle_input')[0];
                                var taggleWidget = new Taggle(tagSelect, {
                                    tags: $scope.ngModel,
                                    saveOnBlur: true,
                                    onTagAdd: function (event, tag) {
                                        ctrl.addTag(tag);
                                    },
                                    onTagRemove: function (event, tag) {
                                        ctrl.removeTag(tag);
                                    }
                                });

                                var autocompleteInput = $element.find('input.taggle_input');
                                var appendTo = $element.find('div.taggle_input');
                                autocompleteInput.autocomplete({
                                    source: vm.items,
                                    appendTo: appendTo,
                                    position: {at: "left bottom", of: appendTo},
                                    select: function (event, data) {
                                        event.preventDefault();
                                        //Add the tag if user clicks
                                        if (event.which === 1) {
                                            taggleWidget.add(data.item.value);
                                        }
                                    }
                                });
                            }
                        }

                        ctrl.initialize();
                    }]
            }
        }]);
    app.directive('cnvdate', ['template', '$timeout',
        function (template, $timeout) {
            return {
                'restrict': 'EA',
                transclude: true,
                replace: true,
                scope: {
                    styleClass: '@',
                    label: '@',
                    ngModel: '=',
                    required: '@',
                    info: '@',
                    width: '@',
                    timepicker: '@',
                    placeholder: '@'
                },
                templateUrl: template.getUrl('directive_cnvdate'),
                link: function ($scope, element, attrs) {
                    if (attrs.styleClass) {
                        element.addClass(attrs.styleClass);
                    }
                    if (!attrs.width) {
                        attrs.width = '200px';
                    } else {
                        attrs.width = attrs.width + '';
                        if (attrs.width.indexOf('px') === -1) {
                            attrs.width = attrs.width + 'px';
                        }
                    }

                    if (attrs.required) {
                        element.addClass('required');
                    }

                    if (attrs.info) {
                        $timeout(function () {
                            var tipElement = element.find('.control-info');
                            var myOpentip = new Opentip(tipElement, {
                                myOpentip: 'right'
                            });
                            myOpentip.setContent(attrs.info);
                        });
                    }

                    if (attrs.timepicker === 'true') {
                        attrs.timepicker = true;
                    } else {
                        attrs.timepicker = false;
                    }

                    $timeout(function () {
                        var format = 'Y-m-d';
                        if (attrs.timepicker) {
                            format += ' H:i';
                        }
                        element.find('.form-control').datetimepicker({
                            format: format,
                            timepicker: attrs.timepicker
                        });
                    });
                }
            }
        }]);

    app.directive('cnvpwd', ['template', '$timeout',
        function (template, $timeout) {
            return {
                'restrict': 'EA',
                transclude: true,
                replace: true,
                scope: {
                    styleClass: '@',
                    label: '@',
                    ngModel: '=',
                    required: '@',
                    info: '@',
                    width: '@'
                },
                templateUrl: template.getUrl('directive_pwd'),
                link: function ($scope, element, attrs) {

                    if (attrs.styleClass) {
                        element.addClass(attrs.styleClass);
                    }

                    if (!attrs.width) {
                        attrs.width = '200px';
                    } else {
                        attrs.width = attrs.width + '';
                        if (attrs.width.indexOf('px') === -1) {
                            attrs.width = attrs.width + 'px';
                        }
                    }

                    if (attrs.required) {
                        element.addClass('required');
                    }

                    if (attrs.info) {
                        $timeout(function () {
                            var tipElement = element.find('.control-info');
                            var myOpentip = new Opentip(tipElement, {
                                myOpentip: 'right'
                            });
                            myOpentip.setContent(attrs.info);
                        });
                    }
                }
            }
        }]);

    app.directive('cnvswitch', ['template', function (template) {
        return {
            'restrict': 'EA',
            transclude: true,
            replace: true,
            scope: {
                styleClass: '@',
                label: '@',
                ngModel: '=ngModel',
                info: "@",
                onColor: "@",
                offColor: "@",
                onText: "@",
                offText: "@",
                size: "@"
            },
            template: template.get("directive_cnvswitch"),
            link: function ($scope, element, attrs, $timeout) {
                if (attrs.styleClass) {
                    element.addClass(attrs.styleClass);
                }

                if (attrs.info) {
                    $timeout(function () {
                        var tipElement = element.find('.control-info');
                        var myOpentip = new Opentip(tipElement, {
                            myOpentip: 'right'
                        });
                        myOpentip.setContent(attrs.info);
                    });
                }

                element.find('.c-switch-input').bootstrapSwitch({
                    onText: attrs.onText ? attrs.onText : '开',
                    offText: attrs.offText ? attrs.offText : '关',
                    onColor: attrs.onColor,
                    offColor: attrs.offColor,
                    state: $scope.ngModel,
                    size: attrs.size,
                    onSwitchChange: function (event, state) {
                        $scope.ngModel = state;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }
                });
            }
        }
    }]);

    app.directive('cnvcheckbox', ['template', '$timeout', function (template, $timeout) {
        return {
            'restrict': 'EA',
            transclude: true,
            replace: true,
            scope: {
                styleClass: '@',
                label: '@',
                checked: '&?',
                disabled: '&?',
                ngModel: '=ngModel',
                info: "@"
            },
            controllerAs: 'vm',
            bindToController: true,
            template: template.get("directive_cnvcheckbox"),
            link: function ($scope, element, attrs) {
                if (attrs.styleClass) {
                    element.addClass(attrs.styleClass);
                }

                if (attrs.info) {
                    $timeout(function () {
                        var tipElement = element.find('.control-info');
                        var myOpentip = new Opentip(tipElement, {
                            myOpentip: 'right'
                        });
                        myOpentip.setContent(attrs.info);
                    });
                }
            },
            controller: ['$scope', function ($scope) {
                var vm = this;

                if (angular.isFunction(vm.checked)) {
                    vm.ngModel = !!vm.checked();
                }

                vm.toggle = function () {
                    if (angular.isFunction(vm.disabled) && vm.disabled()) return;
                    vm.ngModel = !vm.ngModel;
                }
            }]
        }
    }]);

    app.directive('cnvnumber', ['template', '$timeout', function (template, $timeout) {
        return {
            'restrict': 'EA',
            transclude: true,
            replace: true,
            scope: {
                styleClass: '@',
                label: '@',
                ngModel: '=',
                required: '@',
                info: '@',
                width: '@',
                placeholder: '@'
            },
            template: template.get("directive_cnvnumber"),
            link: function ($scope, element, attrs) {
                if (attrs.styleClass) {
                    element.addClass(attrs.styleClass);
                }
                if (!attrs.width) {
                    attrs.width = '200px';
                } else {
                    attrs.width = attrs.width + '';
                    if (attrs.width.indexOf('px') === -1) {
                        attrs.width = attrs.width + 'px';
                    }
                }

                if (attrs.required) {
                    element.addClass('required');
                }

                element.find('input[type="text"]').keydown(function (e) {
                    // Allow: backspace, delete, tab, escape, enter and .
                    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
                        // Allow: Ctrl+A
                        (e.keyCode == 65 && e.ctrlKey === true) ||
                        // Allow: Ctrl+C
                        (e.keyCode == 67 && e.ctrlKey === true) ||
                        // Allow: Ctrl+X
                        (e.keyCode == 88 && e.ctrlKey === true) ||
                        // Allow: home, end, left, right
                        (e.keyCode >= 35 && e.keyCode <= 39)) {
                        // let it happen, don't do anything
                        return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                    }
                });

                if (attrs.info) {
                    $timeout(function () {
                        var tipElement = element.find('.control-info');
                        var myOpentip = new Opentip(tipElement, {
                            myOpentip: 'right'
                        });
                        myOpentip.setContent(attrs.info);
                    });
                }
            }
        }
    }]);

    app.directive('cnvselect', ['template', '$timeout', function (template, $timeout) {
        return {
            'restrict': 'EA',
            transclude: true,
            replace: true,
            scope: {
                styleClass: '@',
                label: '@',
                ngModel: '=',
                required: '@',
                options: '=',
                info: '@',
                ngDisabled: '=',
                defaultValue: '='
            },
            templateUrl: template.getUrl('directive_cnvselect'),
            controller: ['$scope', function ($scope) {
                let value = $scope.defaultValue;
                let ngModel = $scope.ngModel;
                if (value && !ngModel) {
                    $scope.ngModel = $scope.defaultValue;
                }
            }],
            link: function ($scope, element, attrs) {
                if (attrs.styleClass) {
                    element.addClass(attrs.styleClass);
                }

                if (attrs.info) {
                    $timeout(function () {
                        var tipElement = element.find('.control-info');
                        var myOpentip = new Opentip(tipElement, {
                            myOpentip: 'right'
                        });
                        myOpentip.setContent(attrs.info);
                    });
                }
            }
        }
    }]);

    app.directive('teamSelect', ['template', 'DBUtils', function (template, DBUtils) {
        return {
            restrict: 'E',
            scope: {
                entity: '=',
                label: '@'
            },
            templateUrl: template.getUrl('team_select'),
            link: function ($scope, element, attrs) {
                (function () {
                    DBUtils.list('team', {}).success(function (data) {
                        var teams = _.get(data, 'datas.result', {});
                        var html = [];
                        html.push('<option value=""></option>');
                        _.each(teams, function (team) {
                            html.push(`<option value="${team.code}">${team.name}</option>`);
                        });
                        html = html.join('');
                        var select = element.find('.team-select');
                        select.chosen('destroy');
                        select.html(html);
                        select.chosen({
                            search_contains: true,
                            allow_single_deselect: true,
                            width: "100%"
                        }).change(function (event, item) {
                            var team = {code: '', name: ''};
                            if (item) {
                                team.code = _.get(item, 'selected', '');
                                team.name = $(this).find("option:selected").text();
                            }
                            _.set($scope.entity, 'team', team);
                        });

                        var code = _.get($scope.entity, 'team.code', '');
                        var select = element.find('.team-select');
                        select.val(code);
                        select.trigger('chosen:updated');
                    })
                })();
            }
        }
    }]);

    app.directive('relatedSelect', ['template', 'DBUtils', function (template, DBUtils) {
        return {
            restrict: 'E',
            scope: {
                type: '@',
                ngModel: '=',
                defaultValue: '=',
                styleClass: '@',
                placeholder: '@'
            },
            templateUrl: template.getUrl('select_related_template'),
            controller: ['$scope', '$q', function ($scope, $q) {
                let value = $scope.defaultValue;
                let ngModel = $scope.ngModel;
                if (value && !ngModel) {
                    $scope.ngModel = $scope.defaultValue;
                }

                $scope.defered = $q.defer();
                let type = $scope.type;
                let html = [];
                if (type === 'device') {
                    DBUtils.list('device', {}).success(function (data) {
                        let deviceList = _.get(data, 'datas.result', []);
                        html.push('<option value=""></option>');
                        _.each(deviceList, function (device) {
                            html.push(`<option value="${device.uuid}">${device.baseInfo.name + '（' + device.uuid + '）'}</option>`);
                        });
                        $scope.defered.resolve(html);
                    })
                } else if (type === 'team') {
                    DBUtils.list('team', {}).success(function (data) {
                        let teams = _.get(data, 'datas.result', {});
                        html.push('<option value=""></option>');
                        _.each(teams, function (team) {
                            html.push(`<option value="${team.code}">${team.name}</option>`);
                        });
                        $scope.defered.resolve(html);
                    })
                }
            }],
            link: function ($scope, element, attrs) {
                if (attrs.styleClass) {
                    element.addClass(attrs.styleClass);
                }
                $scope.defered.promise.then(function (html) {
                    let selectElement = element.find('#related_select');
                    selectElement.html(html.join(''));
                    if (_.isArray($scope.ngModel)) {
                        selectElement.val($scope.ngModel);
                    }
                    selectElement.chosen({
                        search_contains: true,
                        allow_single_deselect: true,
                        widget: 100
                    });
                });
            }
        }
    }]);

    app.directive('subNav', ['template', 'util', 'http', '$stateParams', '$state', '$compile', 'janus', 'I18nService',
        function (template, util, http, $stateParams, $state, $compile, janus, I18nService) {
            return {
                'restrict': 'EA',
                transclude: true,
                replace: true,
                scope: {
                    options: '='
                },
                template: template.get('directive_sub_nav'),
                controller: ['$scope', '$element', '$timeout', 'dialog',
                    function ($scope, $element, $timeout, dialog) {
                        var options = $scope.options;
                        var ctrl = this;
                        options.label = options.label || I18nService.getValue('设备列表', 'device.list');
                        var key = options.menukey || $stateParams.menuIdx;
                        var selected = options.selected || $stateParams.id;
                        options.code = options.code || 'uuid';
                        options.name = options.name || 'baseInfo.name';

                        var allResultList = [];
                        $scope.filterResultList = [];
                        $scope.previousDevice = function () {
                            var currentIndex = _.findIndex($scope.filterResultList, function (item) {
                                return item.code == selected;
                            });
                            if (currentIndex === 0) {
                                dialog.noty(I18nService.getValue("当前已是列表中的第一项", ''));
                                return false;
                            }
                            var target = _.get($scope.filterResultList, currentIndex - 1);
                            $scope.goDetail(target);
                        };

                        $scope.nextDevice = function () {
                            var currentIndex = _.findIndex($scope.filterResultList, function (item) {
                                return item.code == selected;
                            });
                            if (currentIndex === ($scope.filterResultList.length - 1)) {
                                dialog.noty(I18nService.getValue("当前已是列表中的最后一项", ''));
                                return false;
                            }
                            var target = _.get($scope.filterResultList, currentIndex + 1);
                            $scope.goDetail(target);
                        };

                        $scope.switchPanel = function () {
                            var target = $element.find('.directiveSubNavTargetIcon');
                            var ele = $('.directiveListPanelSubNavPanel');
                            if (!ele.length) {
                                var html = template.get('directive_sub_nav_alert_panel');
                                $('body').append(html);

                                ele = $('.directiveListPanelSubNavPanel');

                                ele.position({
                                    of: target,
                                    collision: 'flipfit',
                                    at: 'right+15px bottom',
                                    my: 'right top',
                                });

                                $compile(ele)($scope);

                                $(document).on('click.subNav', function (event) {
                                    var e = $(event.target);
                                    if (e.closest('.directiveSubNavTargetIcon').length) {
                                        return false;
                                    }
                                    if (!e.closest('.directiveListPanelSubNavPanel').length) {
                                        $('.directiveListPanelSubNavPanel').remove();
                                    }
                                });
                            }
                            /*calc height*/
                            var top = parseInt(ele.css('top'));
                            var height = $(window).height() - top - 10;
                            ele.height(height);

                            ele.toggleClass('slideShow');
                        };

                        $scope.$on("$destroy", function () {
                            $(document).unbind('click.subNav');
                            $('.directiveListPanelSubNavPanel').remove();
                        });

                        $scope.search = function () {
                            var arr = _.filter(allResultList, function (item) {
                                return _.get(item, options.code, '').indexOf($scope.keyword) >= 0 ||
                                    _.get(item, options.name, '').indexOf($scope.keyword) >= 0;
                            });
                            var searchArr = [];
                            _.each(arr, function (item) {
                                var newItem = {
                                    code: _.get(item, options.code),
                                    name: _.get(item, options.name)
                                };
                                searchArr.push(util.removeHashKey(newItem));
                            });
                            $scope.filterResultList = searchArr;
                        };

                        $scope.goDetail = function (item) {
                            janus.goToMenuDetailByIndex(key, item.code);
                        };

                        _.extend(ctrl, {
                            initialize: function () {
                                ctrl.loadData();
                            },
                            loadData: function () {
                                http.get('dbs/kanbanlist', {
                                    collection: options.collection,
                                    query: util.encodeJSON(options.query || {}),
                                }).success(function (result) {
                                    allResultList = _.get(result, 'items', []);
                                    var newArr = [];
                                    _.each(allResultList, function (item) {
                                        var newItem = {
                                            code: _.get(item, options.code),
                                            name: _.get(item, options.name)
                                        };
                                        newArr.push(util.removeHashKey(newItem));
                                    });
                                    $scope.filterResultList = newArr;

                                    var targetIndex;
                                    var targetArr = $scope.filterResultList;
                                    targetIndex = _.findIndex(targetArr, function (item) {
                                        return item.code == selected
                                    });
                                    if (targetIndex >= 0) {
                                        $scope.currentDeviceIndex = targetIndex + 1;
                                        _.set(_.get(allResultList, targetIndex), 'selected', true);
                                    }
                                    util.apply($scope);
                                });
                            }
                        });
                        ctrl.initialize();
                    }],
                controllerAs: 'ctrl',
            }
        }]);

    app.directive('kanban', ['template', '$timeout', 'util', '$stateParams','I18nService', function (template, $timeout, util, $stateParams,I18nService) {
        return {
            'restrict': 'EA',
            transclude: true,
            replace: true,
            scope: {
                options: '='
            },
            template: template.get('directive_kanban'),
            controller: ['$scope', '$element',
                function ($scope, $element) {
                    var options = $scope.options;
                    var key = $stateParams.menuKey;
                    var ctrl = this;
                    _.extend(ctrl, {
                        initialize: function () {
                            ctrl.loadKanban();
                        },
                        loadKanban: function () {
                            var pageWidget = $element.pagination({
                                dataSource: 'dbs/kanbanlist',
                                locator: 'items',
                                totalNumberLocator: function (response) {
                                    return response.total;
                                },
                                pageSize: 20,
                                ajax: {
                                    type: 'post',
                                    dataType: 'json',
                                    data: {
                                        collection: options.collection,
                                        query: util.encodeJSON(options.query || {}),
                                        projector: util.encodeJSON(options.projector || {}),
                                        sort: util.encodeJSON(options.sort || {}),
                                    }
                                },
                                callback: function (items, pagination) {
                                    var listBox = $element.find('.kanban-list');
                                    var html = [];

                                    if(items.length==0){
                                        html.push('<div class="dataTable_empty_content"><div class="d_e_img"></div><div class="d_e_text">'+I18nService.getValue("暂无数据记录", "datatable.no.data")+'</div></div>');
                                    }
                                    _.each(items, function (item, idx) {
                                        if (idx % 4 === 0) {
                                            html.push('<div class="row">');
                                        }
                                        html.push('<div class="col-xs-3">');
                                        if (_.isFunction(options.itemRender)) {
                                            var itemHtml = options.itemRender(item);
                                            html.push(itemHtml);
                                        }
                                        html.push('</div>');
                                        if (idx % 4 === 3 || idx === (items.length - 1)) {
                                            html.push('</div>');
                                        }
                                    });

                                    listBox.html(html.join(''));
                                    listBox.find('.fancy-img').fancybox({});
                                }
                            });

                            $element.on('click', 'button,a', function (event) {
                                var target = $(event.target);
                                var data = target.attr('data');
                                $scope.$emit('buttonClicked.kanban', target, options, data);
                            });
                        }
                    });
                    ctrl.initialize();
                }],
//                controllerAs??
            controllerAs: 'ctrl',
            link: function ($scope, element) {
                $timeout(function () {
                    element.find('.search-input').keydown(function (event) {
                        if (event.keyCode == 13) {
                            // $scope.reload();
                        }
                    });
                }, 500)
            }
        }
    }]);

    app.directive('list', ['template', '$timeout', '$stateParams', 'I18nService', function (template, $timeout, $stateParams, I18nService) {
        return {
            'restrict': 'EA',
            transclude: true,
            replace: true,
            scope: {
                options: '='
            },
            template: template.get('directive_list'),
            controller: ['$scope', '$element', '$attrs',
                function ($scope, $element, $attrs) {
                    $scope.reload = function () {
//                    $element.find()?
                        var table = $element.find('.c-table');
                        table.DataTable().ajax.reload();
                    };
                    $scope.initReload = function () {
                        $element.find('.search-input').val('');
                        var table = $element.find('.c-table');
                        table.DataTable().ajax.reload();
                    };

                    if ($scope.options.toolbar !== false) {
                        $scope.options.toolbar = true;
                    }
                    if ($scope.options.columns) {
                        _.each($scope.options.columns, function (column) {
                            column.data = column.data || column.name;
                        });
                    }

                    if ($scope.options.filled === true) {
                        $element.addClass('filled');
                    }


                    var key = $stateParams.menuKey;
                    var options = _.extend(options, $scope.options);
                    if (!options.data) {
                        /*Ajax calling*/
                        options = _.extend(options, {
                            "processing": true,
                            "serverSide": true,
                            "ajax": {
                                type: 'post',
                                url: "dbs/pagelist",
                                data: {
                                    collection: options.collection
                                },
                                beforeSend: function (event, ajaxSetting) {

                                    var filterObject = {
                                        filter: {
                                            query: {},
                                            keyword: ''
                                        },
                                        params: {}
                                    };
                                    var projectorObject = {};
                                    if (_.isObject(options.query)) {
                                        filterObject.filter.query = options.query;
                                    }
                                    if (_.isFunction(options.query)) {
                                        filterObject.filter.query = options.query.call(null);
                                    }
                                    var columns = _.map(options.columns, function (col) {
                                        return {
                                            name: col.name || '',
                                            data: col.data || col.name,
                                            query: col.query || true,
                                            search: col.search || false
                                        }
                                    });
                                    filterObject.columns = encodeURI(JSON.stringify(columns));
                                    var keyword = $element.find('.search-input').val();
                                    if (keyword) {
                                        filterObject.filter.keyword = encodeURIComponent(keyword);
                                    }

                                    var table = $element.find('.c-table').DataTable();
                                    var order = table.order();

                                    var name = _.get(table.settings().init().columns, _.get(order, '0.0', 0), '').name || '';
                                    filterObject.order = name;
                                    filterObject.asc = _.isEqual(_.get(order, '0.1', 'asc'), 'asc');

                                    $scope.$emit('beforeQuery.list', options, ajaxSetting, filterObject);
                                    /*Append the data*/
                                    if (filterObject) {
                                        var paramArr = [];
                                        _.each(filterObject, function (value, key) {
                                            if (value) {
                                                var item = key + '=';
                                                if (_.isObject(value)) {
                                                    value = JSON.stringify(value);
                                                }
                                                item += value;
                                                paramArr.push(item);
                                            }
                                        });
                                        ajaxSetting.data += ('&' + paramArr.join('&'));
                                    }
                                }
                            }
                        });
                    }
                    options.columnDefs = options.columnDefs || [];
                    options.columnDefs.push({
                        defaultContent: '',
                        targets: '_all'
                    })
                    options = _.extend(options, {
                        "bLengthChange": false,
                        "bFilter": false,
                        searching: false,
                        orderMulti: false,
                        "iDisplayLength": 10,
                        pagingType: 'simple_numbers',
                        "language": {
                            "sProcessing": I18nService.getValue("处理中...", "datatable.processing"),
                            "sLengthMenu": I18nService.getValue("显示 _MENU_ 项结果", "datatable.show.count"),
                            "sZeroRecords": I18nService.getValue("没有匹配结果", "datatable.null.filter"),
                            "sInfo": I18nService.getValue("显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项", "datatable.show.result"),
                            "sInfoEmpty": I18nService.getValue("显示第 0 至 0 项结果，共 0 项", "datatable.show.empty"),
                            "sInfoFiltered": "",
                            "sInfoPostFix": "",
                            "sSearch": I18nService.getValue("搜索:", "datatable.search"),
                            "sUrl": "",
                            "sLoadingRecords": I18nService.getValue("载入中...", "datatable.loading"),
                            "sInfoThousands": ",",
                            sEmptyTable: `<div class="dataTable_empty_content"><div class="d_e_img"></div><div class="d_e_text">${I18nService.getValue("暂无数据记录", "datatable.no.data")}</div></div>`,
                            "oPaginate": {
                                "sFirst": I18nService.getValue("首页", "datatable.first"),
                                "sPrevious": "<",
                                "sNext": ">",
                                "sLast": I18nService.getValue("末页", "datatable.last")
                            },
                            "oAria": {
                                "sSortAscending": I18nService.getValue(": 以升序排列此列", "datatable.asce"),
                                "sSortDescending": I18nService.getValue(": 以降序排列此列", "datatable.desc")
                            }
                        }
                    });

                    function initialize() {
                        var table = $element.find('.c-table');
                        var datatable = table.DataTable(options);

                        $scope.$emit('beforeLoad');
                        table.on('xhr.dt', function (event, options, jsondata, ajax) {
                            if (jsondata && jsondata.data) {
                                _.each(jsondata.data, function (row) {
                                    row.DT_RowId = row.id || '';
                                });
                            }
                            $scope.$broadcast('afterQuery.list', jsondata);
                            $scope.$emit('rendered.list', jsondata);
                        });

                        table.on('click', 'button,a,input', function (event) {
                            var rowdata = table.DataTable().row($(this).parents('tr')).data();
                            $scope.$emit('buttonClicked.list', $(event.target), options, rowdata);
                        });

                    }

                    initialize();
                }],
            link: function ($scope, element, attrs) {
                $timeout(function () {
                    element.find('.search-input').keydown(function (event) {
                        if (event.keyCode == 13) {
                            $scope.reload();
                        }
                    });
                }, 500)
            }
        }
    }]);

    app.directive('keyEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.keyEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });
//
    app.directive('dropzone', function () {
        return {
//        （字符串）可选参数，指明指令在DOM里面以什么形式被声明；取值有：E(元素),A(属性),C(类),M(注释)，其中默认值为A；当然也可以两个一起用，比如EA.表示即可以是元素也可以是属性。
            restrict: 'A',
//            可见，link和controller的相同点在于里面都可包含数据源和操作。不同点在于：link能控制渲染html元素的过程，而controller不能，controller的模版写死的，仅侧重于提供数据源和操作。
// 这里为什么直接是scope 和element不用美元符
            link: function (scope, element, attrs) {
                var config = {
                    url: cynovan.c_path + '/gridfs/upload',
                    // maxFilesize: 100,
                    paramName: "FILE",
                    // maxThumbnailFilesize: 10,
                    parallelUploads: 1,
                    autoProcessQueue: false
                };

                var eventHandlers = {
                    'addedfile': function (file) {
                        scope.file = file;
                        if (this.files[1] != null) {
                            this.removeFile(this.files[0]);
                        }
                        scope.$apply(function () {
                            scope.fileAdded = true;
                        });
                    },

                    'success': function (file, response) {
                    }

                };

                dropzone = new Dropzone(element[0], config);

                angular.forEach(eventHandlers, function (handler, event) {
                    dropzone.on(event, handler);
                });

                scope.processDropzone = function () {
                    dropzone.processQueue();
                };

                scope.resetDropzone = function () {
                    dropzone.removeAllFiles();
                }
            }
        }
    });

    app.directive('gyProcess', ['template', function (template) {
        return {
            'restrict': 'EA',
            transclude: true,
            replace: true,
            scope: {
                uuid: '='
            },
            template: template.get('directive_gy_process'),
            controller: ['$scope', 'DBUtils', 'util', 'dialog',
                function ($scope, DBUtils, util, dialog) {
                    var ctrl = this;
                    var uuid = $scope.uuid;
                    $scope.entity = {}

                    $scope.addRow = function () {
                        $scope.entity.gy_process.gyparam.push({});
                        util.apply($scope);
                    };

                    $scope.removeRow = function (index) {
                        $scope.entity.gy_process.gyparam.splice(index, 1);
                        util.apply($scope);
                    };

                    $scope.saveGyProcess = function () {
                        var gy_process = _.cloneDeep($scope.entity.gy_process);
                        if (!gy_process.gyid) {
                            dialog.noty("请输入工艺编号");
                            return false;
                        }
                        if (!gy_process.gyname) {
                            dialog.noty("请输入工艺名称");
                            return false;
                        }

                        gy_process.gyparam = util.removeHashKey(gy_process.gyparam);
                        if (_.size(gy_process.gyparam)) {
                            var tag = false, paramValueTag = false;
                            _.forEach(gy_process.gyparam, function (item) {
                                if (!item.paramid) {
                                    tag = true;
                                }
                                if (!item.paramValue) {
                                    paramValueTag = true;
                                }
                            });
                            if (tag) {
                                dialog.noty("请输入参数ID");
                                return false;
                            }
                            if (paramValueTag) {
                                dialog.noty("请输入参数值");
                                return false;
                            }
                        }

                        DBUtils.update('device', {
                            uuid: uuid
                        }, {
                            $set: {
                                'gy_process': gy_process
                            }
                        }).success(function () {
                            dialog.noty('操作成功');
                        });

                    };

                    _.extend(ctrl, {
                        initialize: function () {
                            ctrl.loadData();
                            ctrl.bindEvent();
                        },
                        loadData: function () {
                            DBUtils.find('device', {
                                uuid: uuid
                            }).success(function (result) {
                                $scope.entity.gy_process = _.get(result, 'datas.result.gy_process', {});
                                if (_.isEmpty($scope.entity.gy_process)) {
                                    _.extend($scope.entity.gy_process, {
                                        gyparam: []
                                    });
                                }
                            });
                        },
                        bindEvent: function () {
                            $scope.$watch('entity.gy_process.sop_photo', function (newValue, oldValue) {
                                if (!_.isUndefined(newValue)) {
                                    if (newValue !== oldValue && !_.isUndefined(oldValue)) {
                                        DBUtils.update('device', {
                                            uuid: uuid
                                        }, {
                                            $set: {
                                                'gy_process.sop_photo': newValue
                                            }
                                        }).success(function () {
                                        });
                                    }
                                }
                            });
                        }
                    });
                    ctrl.initialize();
                }],
            controllerAs: 'ctrl',
        }
    }]);

});
