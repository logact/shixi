define(['echarts'], function (echarts) {
    var app = angular.module('app');
    app.controller('HistoryDataController', ['$scope', '$rootScope', '$state', 'DBUtils', 'dialog', 'http',
        '$timeout', 'AppComponent', '$element', 'util', '$filter', 'AppDataService',
        function ($scope, $rootScope, $state, DBUtils, dialog, http, $timeout,
                  AppComponent, $element, util, $filter, AppDataService) {
            var ctrl = this;
            $scope.entity = {};
            $scope.fieldOvermuchTips = false;// 栏位过多提示
            $scope.echartShow = false;
            var dateformat = 'yyyy-MM-dd HH:mm:ss.sss';

            var chartObj;
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initConfig();
                    ctrl.bindEvent();
                },
                bindEvent: function () {
                    $(window).resize(_.debounce(function () {
                        if (chartObj) {
                            chartObj.resize();
                        }
                    }, 300));
                },
                showConfigBox: function () {
                    $(".chartSettingBox").slideDown("fast");
                    $scope.echartShow = false;
                },
                hideConfigBox: function () {
                    $(".chartSettingBox").slideUp("fast");
                    $scope.echartShow = true;
                },
                loadDevice: function (uuid) {
                    AppComponent.deviceselect($('#deviceSelectBox'), {}, uuid).progress(function (bind) {
                        $scope.entity.uuid = bind.uuid;
                        $scope.entity.selectedFields = [];// 更改uuid时,清空上一个uuid设置的栏位
                        util.apply($scope);
                    });
                },
                initConfig: function () {
                    AppDataService.get('app_historydata', 'config').success(function (result) {
                        if (_.isEmpty(result)) {
                            ctrl.loadDevice("");
                            dialog.noty("请配置历史数据图表");
                            ctrl.setDataRange(0);
                            $scope.entity.dataRange = "week"; // 默认数据范围为过去一周
                            $scope.entity.dataAmount = "10000"; // 默认数据量为10000
                        } else {
                            $(".chartSettingBox").slideUp(100);
                            $scope.echartShow = true;
                            $scope.entity = result;
                            $scope.entity.selectedFields = util.removeHashKey($scope.entity.selectedFields);
                            if (_.size($scope.entity.selectedFields) > 6) {
                                $scope.fieldOvermuchTips = true;
                            }
                            ctrl.loadDevice($scope.entity.uuid);
                            ctrl.createEcharts($scope.entity);
                        }
                    });
                },
                setDataRange: function (value) {
                    var date = new Date();
                    var format = "YYYY-MM-DD";
                    var endDate = moment(new Date()).format(format);
                    $scope.entity.end = endDate;
                    if (value === 0) { //过去一周
                        $scope.entity.start = moment(date).subtract(1, 'weeks').format(format);
                    } else if (value === 1) { //过去一月
                        $scope.entity.start = moment(date).subtract(1, 'months').format(format);
                    } else if (value === 3) { //过去三月
                        $scope.entity.start = moment(date).subtract(3, 'months').format(format);
                    } else if (value === 6) { ////过去半年
                        $scope.entity.start = moment(date).subtract(6, 'months').format(format);
                    }
                },
                setConfig: function () {
                    var entity = _.cloneDeep($scope.entity);
                    if (!entity.uuid) {
                        dialog.noty("请选择设备");
                        return false;
                    }
                    if (!_.size(entity.selectedFields)) {
                        tag = true;
                    } else {
                        var tag = false, unitTag = false;
                        _.forEach(entity.selectedFields, function (item, index) {
                            if (!item.id) {
                                tag = true;
                            } else {
                                if (!item.name) {
                                    item.name = item.id;
                                    $("#fieldName-" + index).val(item.id);
                                }
                            }
                            if (!item.unit) {
                                unitTag = true;
                            }
                        });
                    }
                    if (tag) {
                        dialog.noty("设备栏位不能为空");
                        return false;
                    }
                    if (unitTag) {
                        dialog.noty("设备栏位单位不能为空");
                        return false;
                    }
                    if (!entity.start || !entity.end) {
                        dialog.noty("请选择数据范围");
                        return false;
                    }
                    if (entity.start > entity.end) {
                        dialog.noty("开始日期须小于结束日期");
                        return false;
                    }

                    var SeparatedMonths = moment(new Date(entity.end)).diff(new Date(entity.start), 'months', true);
                    if (Math.round(SeparatedMonths) > 6) {
                        dialog.noty("数据范围最大为6个月");
                        return false;
                    }

                    $(".chartSettingBox").slideUp("fast");
                    entity.selectedFields = util.removeHashKey(entity.selectedFields);
                    AppDataService.set('app_historydata', 'config', entity);
                    ctrl.createEcharts(entity);
                },
                loadData: function (entity) {
                    $scope.entity = entity;
                    var dataAmount = _.get(entity, 'dataAmount', 10000);
                    var filter = {
                        uuid: entity.uuid,
                        start: moment(entity.start).toDate(),
                        end: moment(entity.end).toDate()
                    };
                    var fields = {
                        "_id": 1,
                        "time": 1,
                    };
                    _.each(entity.selectedFields, function (item) {
                        var completeField = 'data.' + item.id;
                        fields[completeField] = 1;
                    });

                    return DBUtils.list('deviceData', {
                        'uuid': filter.uuid,
                        time: {
                            $gte: {
                                $date: filter.start
                            },
                            $lte: {
                                $date: filter.end
                            }
                        },
                    }, fields, {
                        time: 1
                    }, dataAmount);
                },
                addValueToDataMap: function (dataMap, key, value) {
                    var values = _.get(dataMap, key, []);
                    values.push(value);
                    _.set(dataMap, key, values);
                },
                formatTime: function (item) {
                    var time = $filter('date')(item.time, dateformat);
                    time = time.substring(11);
                    return time;
                },
                createEcharts: function (entity) {
                    dialog.elemWaiting($element.find('#historyDataCharts'));
                    ctrl.loadData(entity).success(function (result) {
                        dialog.elemWaiting($element.find('#historyDataCharts'));
                        $scope.echartShow = true;
                        var list = _.get(result, 'datas.result', []);
                        $scope.dataAmountTips = _.size(list);
                        if (!_.size(list)) {
                            dialog.noty("未加载到历史数据");
                            return false;
                        }
                        var dataMap = {};
                        var selectedFields = entity.selectedFields;
                        var legendDatas = _.map(selectedFields, function (item) {
                            return item.name;
                        });
                        _.each(list, function (item) {
                            ctrl.addValueToDataMap(dataMap, 'time', ctrl.formatTime(item));
                            _.each(selectedFields, function (fieldItem) {
                                var field = fieldItem.id;
                                var fieldValue = _.get(item, `data.${field}`, 0);
                                ctrl.addValueToDataMap(dataMap, field, fieldValue);
                            });
                        });

                        var yAxisArr = [], seriesArr = [];
                        var leftOffset = 0, rightOffset = 0;
                        var unitArr = [];
                        _.each(selectedFields, function (item) {
                            var findUnit = _.find(unitArr, {unit: item.unit});
                            if (!findUnit) {
                                unitArr.push({
                                    unit: item.unit,
                                    idx: unitArr.length
                                });
                            }
                        });
                        if (_.size(unitArr)) {
                            _.each(unitArr, function (unitItem) {
                                var yAxis = {
                                    type: 'value',
                                    name: unitItem.unit
                                };
                                if (unitItem.idx % 2 === 0) {
                                    yAxis.position = 'left';
                                    yAxis.offset = leftOffset;
                                    leftOffset += 50;
                                } else {
                                    yAxis.position = 'right';
                                    yAxis.offset = rightOffset;
                                    rightOffset += 50;
                                }
                                yAxisArr.push(yAxis);
                            })
                        }
                        _.each(selectedFields, function (field) {
                            var findUnit = _.find(unitArr, {unit: field.unit});
                            seriesArr.push({
                                name: field.name,
                                type: 'line',
                                data: dataMap[field.id],
                                yAxisIndex: findUnit.idx
                            });
                        });

                        var options = {
                            tooltip: {
                                trigger: 'axis'
                            },
                            legend: {
                                data: legendDatas
                            },
                            dataZoom: [
                                {
                                    show: true,
                                    realtime: true
                                },
                                {
                                    type: 'inside'
                                }
                            ],
                            toolbox: {
                                feature: {
                                    dataZoom: {
                                        yAxisIndex: 'none'
                                    },
                                    dataView: {readOnly: true},
                                    restore: {},
                                    saveAsImage: {
                                        name: 'chart'
                                    }
                                }
                            },
                            xAxis: {
                                type: 'category',
                                data: dataMap['time']
                            },
                            yAxis: yAxisArr,
                            series: seriesArr
                        };
                        if (chartObj) {
                            chartObj.clear();
                        }
                        chartObj = echarts.init(document.getElementById('historyDataCharts'));
                        chartObj.setOption(options);
                    });
                },
                addFieldRow: function () {
                    var items = _.get($scope.entity, 'selectedFields', []);
                    items.push({});
                    _.set($scope.entity, 'selectedFields', items);
                    if (_.size(items) > 6) {
                        $scope.fieldOvermuchTips = true;
                    }
                },
                removeFieldRow: function (index) {
                    $scope.entity.selectedFields.splice(index, 1);
                    if (_.size($scope.entity.selectedFields) <= 6) {
                        $scope.fieldOvermuchTips = false;
                    }
                },
                showFieldData: function (index) {
                    if (!$scope.entity.uuid) {
                        dialog.noty("请选择设备");
                        return false;
                    }
                    DBUtils.find('device', {
                        uuid: $scope.entity.uuid
                    }).success(function (result) {
                        var device = _.get(result, 'datas.result', {});
                        var dynamicData = _.get(device, 'dynamicData', {});
                        if (_.isEmpty(dynamicData)) {
                            dialog.noty("未加载到栏位");
                        } else {
                            dialog.show({
                                template: 'historydata_chooseField_template',
                                width: 1200,
                                title: '选择设备栏位',
                                controller: 'FieldSelectedController',
                                controllerAs: 'ctrl',
                                data: {
                                    items: dynamicData,
                                    trigger: {
                                        onSuccess: function (data) {
                                            $scope.entity.selectedFields[index].id = data;
                                            $scope.entity.selectedFields[index].name = '';
                                            $scope.entity.selectedFields[index].unit = '';
                                            $('#filedInput-' + index).val(data);
                                            $('#fieldName-' + index).val('');
                                            $('#fieldUnit-' + index).val('');
                                        }
                                    }
                                }
                            });
                        }
                    });
                }
            });
            ctrl.initialize();
        }]);
    app.controller('FieldSelectedController', ['$scope', function ($scope) {
        var ctrl = this;
        _.extend(ctrl, {
            initialize: function () {
                $scope.$on('success', function () {
                    var fieldValue = $("#fieldSelect").val();
                    $scope.trigger.onSuccess(fieldValue);
                });
            },
        });
        ctrl.initialize();
    }]);
});