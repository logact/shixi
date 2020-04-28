define(['echarts','ztree'], function (echarts) {
    var app = angular.module('app');
    //    AppComponent 从哪里来的？
    app.controller('analysisController', ['$scope', 'DBUtils', 'dialog', 'http', 'util', "I18nService", "$element", 'janus', '$timeout',
        'AppComponent',
        function ($scope, DBUtils, dialog, http, util, I18nService, $element, janus, $timeout, AppComponent) {
            var ctrl = this;
            // 这里的属性都是放到了this的原型链上吗？根据测试结果这个好像并不是绑定在原型链上面的
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initProductChart();
                    ctrl.initZTree();
                },
                initZTree:function(){
                    var zTreeObj;
                    var setting = {
                        data: {
                            simpleData: {
                                enable: true,
                                idKey: "id",
                                pIdKey: "pId",
                                rootPId: ""
                            }
                        }
                    }
                    var zNodes = [
                        { id: 1, pId: 0, name: "product type " },
                        { id: 101, pId: 1, name: "ice drink" },
                        { id: 102, pId: 1, name: "hot food" }
                    ]
                    http.post("analysis/type").success((result)=>{
                        zNodes= _.get(result,"datas.result");
                        console.log(">.....>>>zNodes")
                        console.log(zNodes)
                        zTreeObj = $.fn.zTree.init($("#device-tree-container"),setting,zNodes);
                    })
                  
                },
                initProductChart: function () {
                    console.log("initProductChart")
                    DBUtils.list('productSale',{},{
                        
                    }).success(function (result) {
                        let f0t250=0;
                        let f250t500=0;
                        let f500t750=0;
                        let f750t1000=0;
//                        三个参数第一个要取值的元素 ,第二个参数 取值目标的路径，第三个参数 默认值。
                
                        let sales = _.get(result, 'datas.result', []);
                        console.log(sales)
                        console.log("sales")
                        _.forEach(sales, function (sale) {
                            let price = _.get(sale, "price", 0);
                            if(price>=0&&price<250){
                                f0t250++;
                            }else if(price>=250&&price<500){
                                f250t500++;
                            }else if(price>=500&&price<750){
                                f500t750++;
                            }else if(price>=75&&price<1000){
                                f750t1000++;
                            }
                        });
                        console.log("after")
                        console.log("f0t250="+f0t250)
                        console.log("f250t500="+f250t500)
                        console.log("f500t750="+f500t750)
                        console.log("f750t1000="+f750t1000)
                  
                        //     这里为什么要加#号呢？这里是使用的是jquery 的用法使用#号取出来id=state_chart的元素但是为什么要在后面加上一个下标
//                         好像这里不加下标也行。
                        let statechart = echarts.init($("#state_chart")[0]);
                        console.log("statechart")
                        console.log(statechart)
//       这里这样好像也是可以的
//                        let statechart = echarts.init("state_chart");

                        let option = {
                            tooltip: {
                                trigger: 'item',
//                               这里表示的是{b} 表示属性列{c}表示属性值。
                                formatter: '{b}: {c}'
                            },
                            legend: {
                                icon: 'circle',
                                orient: 'hoverAnimation',
                                right: '100px',
                                y: 'center',
                                itemGap: 20,
                                textStyle: {
                                    fontSize: 15,
                                },
                                data: ['0~250', '250~500', '500~750', '750~1000']
                            },
                            series: [
                                {
//                                表示这是一个饼图
                                    type: 'pie',
//                                    这里给的也是一个数组
                                    center: ['40%', '50%'],
//                                    这里给的是一个数组
                                    radius: ['40%', '90%'],
                                    color: ['#5AD8A6', '#EEEE00', 'red', '#7D7D7D'],
//                                    这个label的作用 里面数据的百分比
                                    label: {
                                        normal: {
                                            show: true,
                                            position: 'inside',
                                            formatter: function (data) {
                                                if (data.value > 0) {
                                                    return data.percent + '%';
                                                }
                                                return ' ';
                                            }
                                        }
                                    },
                                    data: [
                                        { value: f0t250, name: '0~250' },
                                        { value: f250t500, name: '250~500' },
                                        { value: f500t750, name: '500~750' },
                                        { value: f750t1000, name: '750~1000' }
                                    ]
                                }
                            ]
                        };
                        statechart.setOption(option);
                    });
                },
            });
            ctrl.initialize();
        }]);
});