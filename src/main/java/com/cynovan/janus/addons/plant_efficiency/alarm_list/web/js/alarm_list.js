define(['echarts'], function (echarts) {
    var app = angular.module('app');
    app.controller('AlarmController', ['$scope', '$element', 'DBUtils','http', function ($scope, $element, DBUtils,http) {
            let ctrl = this;
            _.extend(ctrl, {
                initalize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                    ctrl.initListOption();
                    ctrl.initAlarmChart();
                },
                initData: function () {
                    $scope.alarmnum=0;
                    DBUtils.list("deviceClassification", {},{id:1,name:1}).success(function (result) {
                        $scope.productionList = _.get(result, "datas.result", []);
                        $scope.productionList.unshift({
                            name: "全部",
                            id: "all"
                        });
                        _.set($scope, "query.production.id", "all");
                    });
                },
                bindEvent: function () {
                    $scope.$watch("query.production.id", function (productionId) {
                        if (_.isEmpty(productionId)) {
                            _.unset(ctrl.options.query, "type.classificationId");
                        } else if (productionId === "all") {
                            _.unset(ctrl.options.query, "type.classificationId");
                        } else {
                            _.extend(ctrl.options.query, {"type.classificationId": productionId});
                        }
                        ctrl.refreshTable();
                    }, true);
                },
                initListOption: function () {
                    ctrl.options = {
                        collection: 'device_timeline',
                        filled: true,
                        query: {
                            "stateType": "alarm"
                        },
                        order:[[6,'asc']],
                        columns: [{
                            name: 'uuid',
                            title: '设备UUID',
                            width: '15%',
                            search: 'true'
                        }, {
                            name: 'device_name',
                            title: '设备名称',
                            width: '15%',
                            search: 'true'
                        }, {
                            name:'type.classificationId',
                            title:'设备类型',
                            visible:false
                        },{
                            name: 'state',
                            title: '报警码',
                            width: '10%',
                            search: 'true'
                        }, {
                            name: 'stateName',
                            title: '报警描述',
                            width: '20%',
                            search: 'true'
                        }, {
                            name: 'start_date',
                            title: '开始时间',
                            width: '15%',
                            search: 'true'
                        }, {
                            name: 'end_date',
                            title: '结束时间',
                            width: '15%',
                            search: 'true'
                        }, {
                            name: 'duration',
                            title: '持续时间(秒)',
                            width: '10%',
                            search: 'true',
                            render: function (data, type, row) {
                                return row.duration / 1000;
                            }
                        }]
                    }
                },
                initAlarmChart:function(){
                    let today=moment().format('YYYY-MM-DD');
                    http.post("alarmList/getRecentAlarmNum",{
                        startdate: moment().subtract(6, 'days').format('YYYY-MM-DD'),
                    }).success(function (result) {
                        var alarmlist=_.get(result,'datas.alarmList',{});
                        let options={
                            title: {
                                text: '近七天报警总数'
                            },
                            tooltip: {
                                trigger: 'item',
                                formatter: '报警数量:{c}'
                            },
                            grid:{
                              bottom:20
                            },
                            xAxis: {
                                type: 'category',
                                data: []
                            },
                            yAxis: {
                                type: 'value'
                            },
                            series: [{
                                data: [],
                                type: 'line'
                            }]
                        };
                        _.forEach(alarmlist,function (value) {
                            if(_.isEqual(today,_.get(value,'_id'))){
                                $scope.alarmnum=_.get(value,'alarmnum');
                            }
                            options.xAxis.data.push(_.get(value,'_id'));
                            options.series[0].data.push(_.get(value,'alarmnum'));
                        });
                        echarts.init($(".alarmchart")[0]).setOption(options);
                    })
                },
                refreshTable: function () {
                    $element.find('.search-input').val('');
                    var table = $element.find('.c-table');
                    table.DataTable().ajax.reload();
                }
            });
            ctrl.initalize();
        }]
    );
});