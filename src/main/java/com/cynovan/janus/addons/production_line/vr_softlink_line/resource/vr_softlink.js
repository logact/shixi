define(['echarts', 'web/lib/hls/hls', 'threejs'], function (echarts, Hls) {
    var app = angular.module('app');

    app.controller('VRSoftlinkLineController', ['$scope', '$timeout', 'AppComponent', 'dialog', 'AppDataService', '$element', 'DeviceService',
        function ($scope, $timeout, AppComponent, dialog, AppDataService, $element, DeviceService) {
            var ctrl = this;

            var appName = 'robot', configKey = 'vr_automated';
            var renderWidth, renderHeight, container, camera, scene, controls, renderer, scale = 45;
            var objMap = {}, parentObject = new THREE.Object3D(), loader = new THREE.CTMLoader();
            var OneDegree = Math.PI / 180, cycle = 188, cycle2 = 188;
            var AppConfig = {};
            var stompClient, subTopics = [];
            var rfidData = {};
            var echartPositionObj1, echartPositionObj2, timestamps1 = [], timestamps2 = [];
            var chartPosiData1 = {'1': [], '2': [], '3': [], '4': [], '5': [], '6': []},
                chartPosiData2 = {'1': [], '2': [], '3': [], '4': [], '5': [], '6': []};
            var stateMap = {
                'r1_zhuaqu': false,
                'r1_fangzhi': false,
                'r2_zhuaqu': false,
                'r2_fangzhi': false,
                jiance_qigang_active: false,
                jiance_qigang_disabled: false,
                rfid_result: false,
                xl_ng_active: false,
                xl_ng_disabled: false,
                xl_zudang_active: false,
                xl_zudang_disabled: false,
                xl_end_active: false,
                xl_end_disabled: false
            };
            var robotPosiMap = {};
            var robotStateFields = {
                1: ['r1_zhuaqu', 'r1_fangzhi'],//上料机器人
                2: ['r2_zhuaqu', 'r2_fangzhi'],//下料机器人
                3: ['jiance_qigang_active', 'jiance_qigang_disabled', 'rfid_result', 'xl_ng_active', 'xl_ng_disabled', 'xl_zudang_active',
                    'xl_zudang_disabled', 'xl_end_active', 'xl_end_disabled']//产线的配置
            }
            var pushList = {
                1: {'LineStart': true},
                2: {'LineStop': true},
                3: {'LineMode1': true},
                4: {'LineMode2': true}
            };
            /*标记每个位置停留的工件,1上料，2下料阻挡部分，3下料结束部分*/
            var holdGongJianMap = {1: [], 2: [], 3: []};
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.initData();
                    ctrl.autoWidth();
                    ctrl.initWebGL();
                    // dialog.waiting('模型加载中...');
                    ctrl.autoLayout();
                    ctrl.initCharts();
                    ctrl.initChangjing();
                    ctrl.initRobot(1);
                    ctrl.initRobot(2);
                    ctrl.initShangliaoGongjian();
                    ctrl.initXialiaoGongjian();
                },
                initDeviceSelect: function () {
                    /*上料机器人*/
                    var uuid = _.get(AppConfig, 'uuid', '');
                    AppComponent.deviceselect($('#vrsoftlink_bind_device_box'), {}, uuid).progress(function (bind) {
                        _.set(AppConfig, 'uuid', bind.uuid);
                        _.set(AppConfig, 'deviceName', bind.deviceName);
                        ctrl.refreshData();
                    });

                    /*下料机器人*/
                    var uuid3 = _.get(AppConfig, 'uuid3', '');
                    AppComponent.deviceselect($('#vrsoftlink_bind_robot2_box'), {}, uuid3).progress(function (bind) {
                        _.set(AppConfig, 'uuid3', bind.uuid);
                        _.set(AppConfig, 'deviceName3', bind.deviceName);
                        ctrl.refreshData();
                    });

                    /*产线*/
                    var uuid2 = _.get(AppConfig, 'uuid2', '');
                    AppComponent.deviceselect($('#vrsoftlink_bind_line_box'), {}, uuid2).progress(function (bind) {
                        _.set(AppConfig, 'uuid2', bind.uuid);
                        _.set(AppConfig, 'deviceName2', bind.deviceName);
                        ctrl.refreshData();
                    });
                },
                refreshData: _.debounce(function () {
                    AppDataService.set(appName, configKey, AppConfig);
                    dialog.notyWithRefresh('数据配置已完成,2秒后自动刷新页面运行', $scope);
                }, 300),
                autoLayout: _.debounce(function () {
                    var leftEle = $element.find('.automated_left');
                    var vedioEle = $element.find('#rtspvedio');
                    vedioEle.attr('width', leftEle.width());
                    vedioEle.attr('height', 280);

                    renderWidth = $('#automated_webgl_box').width();
                    renderHeight = $(window).height() - 430;

                    if (camera) {
                        camera.aspect = renderWidth / renderHeight;
                        camera.updateProjectionMatrix();
                    }
                    if (renderer) {
                        renderer.setSize(renderWidth, renderHeight);
                    }
                }, 300),
                initCamera: function () {
                    var camera_url = _.get(AppConfig, 'camera_url');
                    if (camera_url) {
                        var video = document.getElementById('rtspvedio');
                        if (Hls.isSupported()) {
                            var hls = new Hls();
                            hls.attachMedia(video);
                            hls.on(Hls.Events.MEDIA_ATTACHED, function () {
                                hls.loadSource(camera_url);
                                hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                                    video.play();
                                });
                            });
                        }
                    }
                },
                loadRfidData: function () {
                    var rfid_url = _.get(AppConfig, 'rfid_url');
                    if (rfid_url) {
                        $.ajax({
                            url: rfid_url,
                            type: 'get',
                            dataType: 'json'
                        }).done(function (result) {
                            ctrl.renderRfidData(result);
                        });
                    }
                },
                showRfidDetails: function () {
                    dialog.show({
                        title: '检测详细列表',
                        template: 'vr_softlink_rfid_detail_template',
                        width: 1200,
                        data: {
                            datas: rfidData.data || []
                        },
                        cancel: false
                    })
                },
                renderRfidData: function (result) {
                    rfidData = result;
                    if (!_.isEmpty(result)) {
                        $element.find('.collect_info_value').each(function () {
                            var ele = $(this);
                            var dataKey = ele.data('key');
                            if (dataKey) {
                                var value = _.get(result, dataKey, 0);
                                ele.text(value);
                            }
                        });

                        /*render table*/
                        var datas = result.data;
                        if (_.isArray(datas) && _.size(datas)) {
                            datas = _.reverse(datas);
                            _.each(datas, function (item) {
                                if (item.NG) {
                                    item.NG = '是';
                                } else {
                                    item.NG = '否';
                                }

                                if (item.tags) {
                                    var tags = _.chunk(item.tags, 3);
                                    tags = _.map(tags, function (item) {
                                        return _.join(item, ',');
                                    });
                                    item.tags = _.join(tags, '<br/>');
                                }
                            });
                        }
                    }
                },
                initData: function () {
                    AppDataService.get(appName, configKey).success(function (result) {
                        if (_.isEmpty(result)) {
                            AppConfig = {
                                axis1_posi: '003_Axis1ProfilePosition',
                                axis2_posi: '004_Axis2ProfilePosition',
                                axis3_posi: '005_Axis3ProfilePosition',
                                axis4_posi: '006_Axis4ProfilePosition',
                                axis5_posi: '007_Axis5ProfilePosition',
                                axis6_posi: '008_Axis6ProfilePosition',
                                axis1_direc: '1',
                                axis2_direc: '1',
                                axis3_direc: '1',
                                axis4_direc: '1',
                                axis5_direc: '1',
                                axis6_direc: '1',
                                chuansongdai1_speed: 2000,
                                cycle: 188,
                                cycle2: 188,
                                chuansongdai2_speed: 2000,
                                r2_axis1_posi: '003_Axis1ProfilePosition',
                                r2_axis2_posi: '004_Axis2ProfilePosition',
                                r2_axis3_posi: '005_Axis3ProfilePosition',
                                r2_axis4_posi: '006_Axis4ProfilePosition',
                                r2_axis5_posi: '007_Axis5ProfilePosition',
                                r2_axis6_posi: '008_Axis6ProfilePosition',
                                r2_axis1_direc: '1',
                                r2_axis2_direc: '1',
                                r2_axis3_direc: '1',
                                r2_axis4_direc: '1',
                                r2_axis5_direc: '1',
                                r2_axis6_direc: '1',
                            };
                        } else {
                            AppConfig = result;
                            cycle = _.parseInt(_.get(AppConfig, 'cycle', 188));
                            cycle2 = _.parseInt(_.get(AppConfig, 'cycle2', 188));
                        }
                        ctrl.initDeviceSelect();
                        $timeout(function () {
                            ctrl.initCamera();
                        }, 1000);
                        ctrl.loadRfidData();
                        ctrl.subscribeData();
                    });
                },
                initCharts: function () {
                    var positionOptions1 = {
                        xAxis: [
                            {
                                type: 'category',
                                data: timestamps1
                            }
                        ],
                        tooltip: {
                            trigger: 'axis'
                        },
                        legend: {
                            data: ['轴1位置', '轴2位置', '轴3位置', '轴4位置', '轴5位置', '轴6位置']
                        },
                        yAxis: [
                            {
                                type: 'value',
                                name: '轴位置曲线'
                            }
                        ],
                        series: [
                            {
                                type: 'line',
                                name: '轴1位置',
                                data: []
                            },
                            {
                                type: 'line',
                                name: '轴2位置',
                                data: []
                            },
                            {
                                type: 'line',
                                name: '轴3位置',
                                data: []
                            },
                            {
                                type: 'line',
                                name: '轴4位置',
                                data: []
                            }, {
                                type: 'line',
                                name: '轴5位置',
                                data: []
                            }, {
                                type: 'line',
                                name: '轴6位置',
                                data: []
                            }
                        ]
                    };
                    var echartPositionEle1 = $('.echart_position1');
                    echartPositionObj1 = echarts.init(echartPositionEle1[0]);
                    echartPositionObj1.setOption(positionOptions1);

                    var positionOptions2 = {
                        xAxis: [
                            {
                                type: 'category',
                                data: timestamps2
                            }
                        ],
                        tooltip: {
                            trigger: 'axis'
                        },
                        legend: {
                            data: ['轴1位置', '轴2位置', '轴3位置', '轴4位置', '轴5位置', '轴6位置']
                        },
                        yAxis: [
                            {
                                type: 'value',
                                name: '轴位置曲线'
                            }
                        ],
                        series: [
                            {
                                type: 'line',
                                name: '轴1位置',
                                data: []
                            },
                            {
                                type: 'line',
                                name: '轴2位置',
                                data: []
                            },
                            {
                                type: 'line',
                                name: '轴3位置',
                                data: []
                            },
                            {
                                type: 'line',
                                name: '轴4位置',
                                data: []
                            }, {
                                type: 'line',
                                name: '轴5位置',
                                data: []
                            }, {
                                type: 'line',
                                name: '轴6位置',
                                data: []
                            }
                        ]
                    };
                    var echartPositionEle2 = $('.echart_position2');
                    echartPositionObj2 = echarts.init(echartPositionEle2[0]);
                    echartPositionObj2.setOption(positionOptions2);
                },
                subscribeData: function () {
                    var uuids = [];
                    var uuid1 = _.get(AppConfig, 'uuid', '');
                    if (uuid1) {
                        uuids.push(uuid1);
                    }

                    var uuid2 = _.get(AppConfig, 'uuid2', '');
                    if (uuid2) {
                        uuids.push(uuid2);
                    }

                    var uuid3 = _.get(AppConfig, 'uuid3', '');
                    if (uuid3) {
                        uuids.push(uuid3);
                    }

                    if (!uuids.length) {
                        dialog.noty('请选择设备');
                        return false;
                    }
                    uuids = _.uniq(uuids);

                    var socket = new SockJS(cynovan.c_path + '/ws', null, {});
                    stompClient = Stomp.over(socket);
                    stompClient.connect({}, function (frame) {
                        _.each(uuids, function (uuid) {
                            var topic = '/ws/deviceData/' + uuid;
                            var subObject = stompClient.subscribe(topic, function (result) {
                                if (result.body) {
                                    var data = $.parseJSON(result.body);
                                    if (data.uuid === uuid1) {
                                        ctrl.pushTimestamp(data, 1);
                                        ctrl.onSLRobotData(_.get(data, 'data', {}));
                                    }
                                    if (data.uuid === uuid3) {
                                        ctrl.pushTimestamp(data, 2);
                                        ctrl.onXLRobotData(_.get(data, 'data', {}));
                                    }
                                    if (data.uuid === uuid2) {
                                        ctrl.onLineData(_.get(data, 'data', {}));
                                    }
                                }
                            });
                            subTopics.push(subObject);
                        });
                    });
                },
                pushTimestamp: function (data, key) {
                    var timestamp = timestamps1;
                    if (key === 2) {
                        timestamp = timestamps2;
                    }
                    if (timestamp.length > 50) {
                        timestamp.shift();
                    }
                    var time = _.get(data, 'time', '');
                    if (time.length > 10) {
                        time = time.substring(10);
                    }
                    timestamp.push(time);
                },
                onSLRobotData: function (data) {
                    ctrl.robotAnimate(data, 1);
                    ctrl.putState(data, 1);
                    ctrl.updateSLRobotState(data);
                },
                onXLRobotData: function (data) {
                    /*机器人运动*/
                    ctrl.robotAnimate(data, 2);
                    ctrl.putState(data, 2);
                    ctrl.updateXLRobotState(data);
                },
                putState: function (data, robotKey) {
                    var fields = robotStateFields[robotKey];
                    _.each(fields, function (field) {
                        var fieldValue = _.get(data, _.get(AppConfig, field, ''), false);
                        if (_.isString(fieldValue)) {
                            fieldValue = _.lowerCase(fieldValue);
                        }
                        if (!fieldValue || fieldValue === 'false' || fieldValue === '0') {
                            fieldValue = false;
                        } else {
                            fieldValue = true;
                        }
                        var oldValue = _.get(stateMap, field, false);
                        _.set(stateMap, field, fieldValue);
                        if (oldValue !== fieldValue) {
                            ctrl.onStateChange(field, fieldValue);
                        }
                    });
                },
                onStateChange: function (fieldKey, newValue) {
                    if (fieldKey === 'r1_zhuaqu') {
                        if (newValue === true) {
                            /*上料机器人抓取时,检查区域4(下料OK区域)工件，自动隐藏并归位*/
                            var usedIndexes = _.get(holdGongJianMap, 2, []);

                            /*4位置存在多个堆积工件，需要按顺序减除*/
                            var posi4GongJianIdx = _.findIndex(usedIndexes, {posi: 4});
                            if (posi4GongJianIdx > -1) {
                                var posi4Gongjian = usedIndexes[posi4GongJianIdx];
                                var obj = objMap['xialiao_gongjian' + posi4Gongjian.idx];
                                ctrl.setVisible(obj, false);
                                obj.position.x = -1.415;
                                obj.position.y = -0.5;
                                obj.position.z = -0.09;
                                /*从使用列表中删除该项*/
                                usedIndexes.splice(posi4GongJianIdx, 1);
                                _.setWith(holdGongJianMap, 2, usedIndexes, Object);

                                /*后面所有的堆积工件往结束区滑动*/
                                var posi4GongjianArr = _.filter(usedIndexes, {posi: 4});
                                if (posi4GongjianArr.length) {
                                    _.each(posi4GongjianArr, function (item, idx) {
                                        var itemObj = objMap['xialiao_gongjian' + item.idx];
                                        ctrl.setAnimate(itemObj, 'x', -0.0047 - (0.2383 * idx), 350, 'position');
                                    });
                                }
                            }
                        } else {
                            ctrl.addShangliaoGongJian();
                        }
                    } else if (fieldKey === 'r2_zhuaqu') {
                        if (newValue === true) {
                            ctrl.removeShangliaoGongJian();
                        }
                    } else if (fieldKey === 'r2_fangzhi') {
                        if (newValue === true) {
                            ctrl.addXialiaoGongJian();
                        }
                    } else if (fieldKey === 'xl_ng_active') {
                        var obj1 = objMap['fanhui_ng_qigang1'];
                        var obj2 = objMap['fanhui_ng_qigang2'];
                        if (newValue === true) {
                            ctrl.movePosi1To2();
                            ctrl.setAnimate(obj1, 'y', -0.24, 300, 'position');
                            ctrl.setAnimate(obj2, 'y', -0.24, 300, 'position');
                        } else {
                            ctrl.setAnimate(obj1, 'y', 0, 300, 'position');
                            ctrl.setAnimate(obj2, 'y', 0, 300, 'position');
                        }
                    } else if (fieldKey === 'xl_zudang_active') {
                        var obj1 = objMap['fanhui_zudang_qigang1'];
                        var obj2 = objMap['fanhui_zudang_qigang2'];
                        if (newValue === true) {
                            /*气缸往上弹出*/
                            ctrl.setAnimate(obj1, 'z', 0.06, 300, 'position');
                            ctrl.setAnimate(obj2, 'z', 0.06, 300, 'position');
                        } else {
                            /*气缸往下隐藏*/
                            ctrl.setAnimate(obj1, 'z', 0, 300, 'position');
                            ctrl.setAnimate(obj2, 'z', 0, 300, 'position');
                        }
                    } else if (fieldKey === 'xl_end_active') {
                        var obj1 = objMap['fanhui_end_qigang1'];
                        var obj2 = objMap['fanhui_end_qigang2'];
                        if (newValue === true) {
                            ctrl.movePosi3To4();
                            ctrl.setAnimate(obj1, 'y', 0.24, 150, 'position');
                            ctrl.setAnimate(obj2, 'y', 0.24, 150, 'position');
                        } else {
                            ctrl.setAnimate(obj1, 'y', 0, 150, 'position');
                            ctrl.setAnimate(obj2, 'y', 0, 150, 'position');
                        }
                    } else if (fieldKey === 'jiance_qigang_active') {
                        /*检测气缸伸出*/
                        var obj1 = objMap['zudang_1'];
                        var obj2 = objMap['zudang_2'];
                        var obj3 = objMap['zudang_3'];
                        if (newValue === true) {
                            ctrl.setAnimate(obj1, 'y', -0.243, 10, 'position');
                            ctrl.setAnimate(obj2, 'y', -0.243, 10, 'position');
                            ctrl.setAnimate(obj3, 'y', -0.243, 10, 'position');
                        } else {
                            ctrl.setAnimate(obj1, 'y', 0, 10, 'position');
                            ctrl.setAnimate(obj2, 'y', 0, 10, 'position');
                            ctrl.setAnimate(obj3, 'y', 0, 10, 'position');
                        }
                    }
                },
                movePosi3To4: function () {
                    /*检查3位置(NG结束区域)是否有工件，有的话，滑动到4位置（OK结束区域）*/
                    /*3位置是有工件堆积的情况*/
                    var usedIndexes = _.get(holdGongJianMap, 2, []);

                    var posi3GongjianIdx = _.findIndex(usedIndexes, {posi: 3});
                    if (posi3GongjianIdx > -1) {
                        var posi3Gongjian = usedIndexes[posi3GongjianIdx];
                        var obj = objMap['xialiao_gongjian' + posi3Gongjian.idx];
                        ctrl.setAnimate(obj, 'y', -0.5, 150, 'position');
                        /*更改工件的所属区域*/
                        posi3Gongjian.posi = 4;

                        /*堆积在3区域的工件，全部滑动到底部*/
                        var posi3Arr = _.filter(usedIndexes, {posi: 3});
                        if (posi3Arr.length) {
                            _.each(posi3Arr, function (item, idx) {
                                var itemObj = objMap['xialiao_gongjian' + item.idx];
                                ctrl.setAnimate(itemObj, 'x', -0.0047 - (0.2383 * idx), 350, 'position');
                            });
                        }
                    }
                },
                movePosi1To2: function () {
                    /*检查1位置(上料位置)是否有工件，有的话，滑动到2位置（上料NG位置）*/
                    var usedIndexes = _.get(holdGongJianMap, 2, []);
                    var okGongjianIdx = _.find(usedIndexes, {posi: 1});
                    if (okGongjianIdx) {
                        var obj = objMap['xialiao_gongjian' + okGongjianIdx.idx];
                        ctrl.setAnimate(obj, 'y', -0.733, 350, 'position');
                        /*更改工件的所属区域*/
                        okGongjianIdx.posi = 2;
                    }
                },
                removeShangliaoGongJian: function () {
                    var usedIndexes = _.get(holdGongJianMap, 1, []);
                    if (usedIndexes.length > 0) {
                        var idx = usedIndexes.shift();
                        var obj = objMap['shangliao_gongjian' + idx];
                        ctrl.setVisible(obj, false);
                        obj.position.x = 0;

                        var cloneGongjian = _.clone(usedIndexes);
                        _.each(cloneGongjian, function (gongjianIdx, index) {
                            var objItem = objMap['shangliao_gongjian' + gongjianIdx];
                            if (objItem) {
                                ctrl.setAnimate(objItem, 'x', -1.184 + (0.235 * index), 350, 'position');
                            }
                        });
                    }
                },
                addXialiaoGongJian: function () {
                    /*存储在key为2的列表里，*/
                    var xialiaoUsedIdxes = _.get(holdGongJianMap, 2, []);
                    var notUsedIdx = -1;
                    for (var i = 1; i < 7; i++) {
                        var finded = _.find(xialiaoUsedIdxes, {idx: i});
                        if (!finded) {
                            notUsedIdx = i;
                            break;
                        }
                    }
                    if (notUsedIdx > -1) {
                        var obj = objMap['xialiao_gongjian' + notUsedIdx];
                        ctrl.setVisible(obj, true);

                        /*posi代表目前该工件所在位置,1代表放置位置，2代表NG区域，3代表NG结束区域，4代表OK结束区域*/
                        xialiaoUsedIdxes.push({
                            idx: notUsedIdx,
                            posi: 1
                        });
                        _.setWith(holdGongJianMap, 2, xialiaoUsedIdxes, Object);
                    }
                },
                addShangliaoGongJian: function () {
                    /*首先取到未使用的工件*/
                    var usedIndexes = _.get(holdGongJianMap, 1, []);
                    var notUsedIdx = -1;
                    for (var i = 1; i < 7; i++) {
                        if (_.indexOf(usedIndexes, i) === -1) {
                            notUsedIdx = i;
                            break;
                        }
                    }
                    if (notUsedIdx > -1) {
                        var obj = objMap['shangliao_gongjian' + notUsedIdx];
                        ctrl.setVisible(obj, true);

                        /*运动到等待抓取位置,判断等待位置有几个纸箱，动态调整位置*/
                        var count = _.size(usedIndexes);
                        //-2.166代表要到达的位置
                        var position = -1.184 + (count * 0.235);
                        var speedTimes = ctrl.getShangliaoSpeed(position);
                        ctrl.setAnimate(obj, 'x', position, speedTimes, 'position');
                        usedIndexes.push(notUsedIdx);
                        _.set(holdGongJianMap, 1, usedIndexes);
                    }
                },
                updateXLRobotState: function (data) {
                    var r2_fangzhi = ctrl.getState('r2_fangzhi');
                    if (r2_fangzhi === true) {
                        ctrl.setVisible('robot2_gongjian', false);
                    }

                    var r2_zhuaqu = ctrl.getState('r2_zhuaqu');
                    ctrl.setVisible('robot2_gongjian', r2_zhuaqu);
                },
                updateSLRobotState: function (data) {
                    /*===判断机器人手抓上是否显示工件===*/
                    var r1_fangzhi = ctrl.getState('r1_fangzhi');
                    if (r1_fangzhi === true) {
                        /*有放置信号，则隐藏机器人上工件*/
                        ctrl.setVisible('robot1_gongjian', false);
                    }

                    var r1_zhuaqu = ctrl.getState('r1_zhuaqu');
                    ctrl.setVisible('robot1_gongjian', r1_zhuaqu);
                },
                getState: function (stateKey) {
                    return _.get(stateMap, stateKey, false);
                },
                robotAnimate: function (data, robotKey) {
                    var valueDatas = [];
                    _.times(6, function (index) {
                        var ctmIdx = index + 1;
                        var object = objMap[`robot/${ctmIdx}.ctm${robotKey}`];

                        var fieldPrefix = '';
                        if (robotKey === 2) {
                            fieldPrefix = 'r2_';
                        }
                        var value = _.get(data, _.get(AppConfig, `${fieldPrefix}axis${ctmIdx}_posi`, ''), 0);
                        value = parseFloat(value);
                        if (_.isNaN(value)) {
                            value = 0;
                        }

                        valueDatas.push(value);

                        /*处理偏置问题*/
                        var offset = _.get(AppConfig, `${fieldPrefix}axis${ctmIdx}_offset`, 0);
                        offset = parseFloat(offset);
                        if (_.isNaN(offset)) {
                            offset = 0;
                        }
                        value += offset;

                        _.setWith(robotPosiMap, `${robotKey}.${ctmIdx}`, value, Object);

                        var currentPosition = value * OneDegree;

                        var diff = 0;
                        var axisIndex = index + 1;
                        var direc = _.get(AppConfig, `${fieldPrefix}axis${axisIndex}_direc`, '1');

                        var front = true;
                        if (ctmIdx === 1 || ctmIdx === 4) {
                            front = false;
                        }

                        currentPosition = ctrl.getAxisDirecPosition(currentPosition, direc, front);
                        diff += currentPosition;
                        if (object) {
                            ctrl.setAnimate(object, object.control, diff, cycle);
                        }
                    });

                    ctrl.updateChart(valueDatas, robotKey);
                },
                onLineData: function (data) {
                    ctrl.putState(data, 3);
                    ctrl.updateLineState(data);
                    ctrl.updateLineCount(data);
                },
                updateLineCount: function (data) {
                    $('.collect_info_value').each(function () {
                        var ele = $(this);
                        var dataKey = ele.data('key');
                        if (dataKey) {
                            var fieldValue = _.get(data, _.get(AppConfig, dataKey, ''), '');
                            ele.text(fieldValue);
                        }
                    });
                },
                updateLineState: function (data) {
                    /*检查阻挡气缸的状态*/
                    var zudang = ctrl.getState('xl_zudang_active');
                    if (zudang === false) {
                        /*气缸未阻挡时,则检查1位置(下料区域)&2位置(下料NG位置)是否有工件，
                        * 如果有，1位置(下料区域)滑动到4位置，2位置滑动到3位置*/
                        var xialiaoUsedIdxes = _.get(holdGongJianMap, 2, []);


                        /*找到1位置的工件*/
                        var posi1Idx = _.find(xialiaoUsedIdxes, {posi: 1});
                        if (posi1Idx) {
                            var obj = objMap['xialiao_gongjian' + posi1Idx.idx];
                            var posi4Count = _.size(_.filter(xialiaoUsedIdxes, {posi: 4}));

                            var posi = -0.0047 - (0.2383 * posi4Count);
                            var speedTimes = ctrl.getXialiaoSpeed(posi);

                            ctrl.setAnimate(obj, 'x', posi, speedTimes, 'position');
                            posi1Idx.posi = 4;
                        }

                        var posi2Idx = _.find(xialiaoUsedIdxes, {posi: 2});
                        if (posi2Idx) {
                            /*3位置上的工件需要堆积显示*/
                            var obj = objMap['xialiao_gongjian' + posi2Idx.idx];
                            var posi3Count = _.size(_.filter(xialiaoUsedIdxes, {posi: 3}));

                            var posi = -0.0047 - (0.2383 * posi3Count);
                            var speedTimes = ctrl.getXialiaoSpeed(posi);

                            ctrl.setAnimate(obj, 'x', posi, speedTimes, 'position');
                            posi2Idx.posi = 3;
                        }
                    }
                },
                getShangliaoSpeed: function (position) {
                    var speedTimes = _.get(AppConfig, 'chuansongdai1_speed', 2000);
                    speedTimes = _.parseInt(speedTimes);
                    if (_.isNaN(speedTimes)) {
                        speedTimes = 2000;
                    }

                    var total = 0 - (-1.184);

                    var range = Math.abs(0 - position);
                    return speedTimes * (range / total);
                },
                getXialiaoSpeed: function (position) {
                    var speedTimes = _.get(AppConfig, 'chuansongdai2_speed', 2000);
                    speedTimes = _.parseInt(speedTimes);
                    if (_.isNaN(speedTimes)) {
                        speedTimes = 2000;
                    }

                    var total = Math.abs(-1.415 - (-0.0047));
                    var range = Math.abs(-1.415 - position);
                    return speedTimes * (range / total);
                },
                setVisible: function (name, visible) {
                    var obj = name;
                    if (_.isString(name)) {
                        obj = objMap[name];
                    }
                    if (obj) {
                        obj.visible = visible;
                    }
                },
                updateChart: function (valueDatas, robotKey) {
                    var posiData = chartPosiData1, chartObj, timestamps;
                    if (robotKey === 2) {
                        posiData = chartPosiData2;
                    }
                    _.each(posiData, function (values, key) {
                        if (values.length > 50) {
                            values.shift();
                        }
                        var idx = parseInt(key) - 1;
                        values.push(valueDatas[idx]);
                    });

                    if (robotKey === 1) {
                        chartObj = echartPositionObj1;
                        timestamps = timestamps1;
                        posiData = chartPosiData1;
                    } else {
                        chartObj = echartPositionObj2;
                        timestamps = timestamps2;
                        posiData = chartPosiData2;
                    }
                    if (chartObj) {
                        var posiOpts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: posiData[1]
                                },
                                {
                                    data: posiData[2]
                                },
                                {
                                    data: posiData[3]
                                },
                                {
                                    data: posiData[4]
                                }, {
                                    data: posiData[5]
                                }, {
                                    data: posiData[6]
                                }
                            ]
                        };
                        chartObj.setOption(posiOpts);
                    }
                },
                getBooleanValue: function (data, fieldName) {
                    var value = _.get(data, _.get(AppConfig, fieldName, ''), false);
                    if (_.isString(value)) {
                        fieldValue = _.lowerCase(value);
                    }
                    if (value === false || value == '0' || value == 'false') {
                        return false;
                    }
                    return true;
                },
                getStringValue: function () {
                    var value = _.get(data, _.get(AppConfig, fieldName, ''), '');
                    return value;
                },
                getAxisDirecPosition: function (position, direc, front) {
                    if (direc === '1') {
                        if (front === true) {
                            return position;
                        }
                        return -position;
                    } else {
                        if (front === true) {
                            return -position;
                        }
                        return position;
                    }
                },
                setAnimate: function (object, axis, to, time, type) {
                    var deferred = $.Deferred();
                    type = type || 'rotation';
                    var fromObject = {};
                    fromObject[axis] = object[type][axis];
                    fromObject.obj = object;
                    var toObject = {};
                    toObject[axis] = to;

                    new TWEEN.Tween(fromObject)
                        .to(toObject, time)
                        .onUpdate(function () {
                            this.obj[type][axis] = this[axis];
                        })
                        .onComplete(function () {
                            deferred.resolve();
                        })
                        .easing(TWEEN.Easing.Linear.None)
                        .start();
                    return deferred;
                },
                modifyConfig: function () {
                    dialog.show({
                        title: false,
                        template: 'vr_softlink_config_template',
                        width: 1200,
                        data: {
                            entity: AppConfig,
                            direcOptions: [{
                                id: '1',
                                name: '正时针方向运动'
                            }, {
                                id: '2',
                                name: '逆时针方向运动'
                            }]
                        },
                        controller: ['$scope', function (dialogScope) {
                            dialogScope.$on('success', function () {
                                AppDataService.set(appName, configKey, AppConfig);
                                dialog.notyWithRefresh('数据配置已完成,2秒后自动刷新页面运行', $scope);
                            });
                        }]
                    });
                },
                push: function (idx) {
                    var pushData = pushList[idx];
                    var uuid2 = _.get(AppConfig, 'uuid2', '');
                    if (pushData && uuid2) {
                        DeviceService.push(uuid2, 'update', pushData);
                    }
                },
                bindEvent: function () {
                    setInterval(function () {
                        ctrl.loadRfidData();
                    }, 5000);

                    $(window).resize(function () {
                        ctrl.autoLayout();
                    });

                    $('#obj_input').change(function () {
                        var val
                            = $(this).val();
                        if (val) {
                            var arr = val.split(',');
                            var oKey = arr.shift();

                            var object = objMap[oKey];
                            if (object) {
                                object.visible = true;
                                var type = arr.shift() || 'position';
                                var pp = object[type];
                                if (pp) {
                                    $('#x_input').val(pp.x || 0);
                                    $('#y_input').val(pp.y || 0);
                                    $('#z_input').val(pp.z || 0);
                                }
                            }
                        }
                    });

                    $scope.$on("$destroy", function () {
                        if (stompClient) {
                            if (_.size(subTopics)) {
                                _.each(subTopics, function (obj) {
                                    if (obj) {
                                        obj.unsubscribe();
                                    }
                                })
                            }
                        }
                        _.each(objMap, function (mesh, key) {
                            scene.remove(mesh);
                            if (_.isFunction(mesh.dispose)) {
                                mesh.dispose();
                            }
                            if (!_.isUndefined(mesh.geometry) && _.isFunction(mesh.geometry.dispose)) {
                                mesh.geometry.dispose();
                            }
                            if (!_.isUndefined(mesh.material) && _.isFunction(mesh.material.dispose)) {
                                mesh.material.dispose();
                            }
                        })
                    });
                },
                initChangjing: function () {
                    var files = [{
                        filename: 'guding/anzhuangban.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'guding/chelun.ctm',
                        option: {
                            color: "#393D3D"
                        }
                    }, {
                        filename: 'guding/dangban.ctm',
                        option: {
                            color: '#C5C59E'
                        }
                    }, {
                        filename: 'guding/daoxiangban.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'guding/daoxiangban_zuo.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'guding/floor.ctm',
                        option: {
                            color: '#CDD1CF'
                        }
                    }, {
                        filename: 'guding/jiance_zhuti.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'guding/jingbaodeng_green.ctm',
                        option: {
                            color: 'green'
                        }
                    }, {
                        filename: 'guding/jingbaodeng_red.ctm',
                    }, {
                        filename: 'guding/jingbaodeng_yellow.ctm',
                        option: {
                            color: 'yellow'
                        }
                    }, {
                        filename: 'guding/jingbaodeng_zhuti.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'guding/led.ctm',
                        option: {
                            color: '#121619'
                        }
                    }, {
                        filename: 'guding/lianjie.ctm',
                        option: {
                            color: "#353433"
                        }
                    }, {
                        filename: 'guding/pidai.ctm',
                        option: {
                            color: '#0DC201'
                        }
                    }, {
                        filename: 'guding/qigang.ctm',
                        option: {
                            color: "#F8F8F8"
                        }
                    }, {
                        filename: 'guding/sensor.ctm',
                        option: {
                            color: "#4A4A4A"
                        }
                    }, {
                        filename: 'zudang/huakuai.ctm',
                        option: {
                            color: '#887B8A'
                        }
                    }, {
                        filename: 'zudang/lianjie.ctm',
                        option: {
                            color: '#887B8A'
                        }
                    }, {
                        filename: 'zudang/yundong.ctm',
                        option: {
                            color: '#887B8A'
                        }
                    }, {
                        filename: 'ng/lianjie.ctm'
                    }, {
                        filename: 'ng/yundong.ctm'
                    }, {
                        filename: 'shangliao_qigang/lianjie.ctm'
                    }, {
                        filename: 'shangliao_qigang/yundong.ctm'
                    }, {
                        filename: 'guding_fanhui/anzhuang.ctm'
                    }, {
                        filename: 'guding_fanhui/banjin.ctm',
                        option: {
                            color: "#E2DCD6"
                        }
                    }, {
                        filename: 'guding_fanhui/chelun.ctm',
                        option: {
                            color: "#393D3D"
                        }
                    }, {
                        filename: 'guding_fanhui/lianjie.ctm',
                        option: {
                            color: '#121619'
                        }

                    }, {
                        filename: 'guding_fanhui/qigang.ctm'
                    }, {
                        filename: 'guding_fanhui/shangliao_qigang.ctm'
                    }, {
                        filename: 'guding_fanhui/xiantong.ctm',
                        option: {
                            color: '#121619'
                        }
                    }, {
                        filename: 'guding_fanhui/zhuti.ctm'
                    }, {
                        filename: 'guding_fanhui/zudang_qigang.ctm'
                    }, {
                        filename: 'zudang_qigang/banjin.ctm'
                    }, {
                        filename: 'zudang_qigang/zhou.ctm'
                    }, {
                        filename: 'robot/chelun.ctm',
                        option: {
                            color: "#393D3D"
                        }
                    }, {
                        filename: 'robot/xiangti.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'xialiao_robot/xiangti.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'xialiao_robot/chelun.ctm',
                        option: {
                            color: "#393D3D"
                        }
                    }];

                    _.each(files, function (file) {
                        ctrl.loadCtmFile(file).done(function (mesh, param) {
                            parentObject.add(mesh);
                            if (param.filename === 'zudang_qigang/banjin.ctm') {
                                objMap['fanhui_zudang_qigang1'] = mesh;
                            } else if (param.filename === 'zudang_qigang/zhou.ctm') {
                                objMap['fanhui_zudang_qigang2'] = mesh;
                            } else if (param.filename === 'shangliao_qigang/lianjie.ctm') {
                                objMap['fanhui_end_qigang1'] = mesh;
                            } else if (param.filename === 'shangliao_qigang/yundong.ctm') {
                                objMap['fanhui_end_qigang2'] = mesh;
                            } else if (param.filename === 'ng/lianjie.ctm') {
                                objMap['fanhui_ng_qigang1'] = mesh;
                            } else if (param.filename === 'ng/yundong.ctm') {
                                objMap['fanhui_ng_qigang2'] = mesh;
                            } else if (param.filename === 'zudang/huakuai.ctm') {
                                objMap['zudang_1'] = mesh;
                            } else if (param.filename === 'zudang/lianjie.ctm') {
                                objMap['zudang_2'] = mesh;
                            } else if (param.filename === 'zudang/yundong.ctm') {
                                objMap['zudang_3'] = mesh;
                            } else if (param.filename === 'robot/xiangti.ctm') {
                                objMap['robot1_xiangti'] = mesh;
                                mesh.position.x = 0.07;
                                mesh.position.y = -0.05;
                                mesh.position.z = -0.03;
                            } else if (param.filename === 'xialiao_robot/xiangti.ctm') {
                                objMap['robot2_xiangti'] = mesh;
                                mesh.position.z = -0.03;
                            } else if (param.filename === 'robot/chelun.ctm') {
                                objMap['robo1_chelun'] = mesh;
                                mesh.position.x = 0.07;
                            }
                        });
                    });
                },
                initShangliaoGongjian: function () {
                    _.times(6, function (idx) {
                        var file = {
                            filename: 'gongjian.ctm',
                            idx: idx + 1,
                            option: {
                                color: '#783812'
                            }
                        };
                        ctrl.loadCtmFile(file).done(function (mesh, param) {
                            parentObject.add(mesh);
                            mesh.visible = false;
                            objMap['shangliao_gongjian' + param.idx] = mesh;
                        });
                    });
                },
                initXialiaoGongjian: function () {
                    _.times(6, function (idx) {
                        var file = {
                            filename: 'gongjian.ctm',
                            idx: idx + 1,
                            option: {
                                color: '#783812'
                            }
                        };
                        ctrl.loadCtmFile(file).done(function (mesh, param) {
                            parentObject.add(mesh);
                            mesh.visible = false;
                            mesh.position.x = -1.415;
                            mesh.position.y = -0.5;
                            mesh.position.z = -0.09;
                            objMap['xialiao_gongjian' + param.idx] = mesh;
                        });
                    });
                },
                initRobot: function (robotKey) {
                    var files = [{
                            filename: 'robot/base.ctm',
                            option: {
                                color: '#ffffff'
                            }
                        }, {
                            filename: 'robot/1.ctm',
                            offset: {
                                x: -1.007,
                                y: -0.25200071930885315,
                                z: -1.2289021611213684
                            },
                            option: {
                                color: '#ffffff'
                            }
                        }, {
                            filename: 'robot/2.ctm',
                            offset: {
                                x: -0.9541674852371216,
                                y: -0.25198985636234283,
                                // z: -1.4055099487304688
                                z: -1.275
                            },
                            option: {
                                color: '#ffffff'
                            }
                        }, {
                            filename: 'robot/3.ctm',
                            offset: {
                                // x: -0.9272277653217316,
                                x: -0.954,
                                y: -0.25200721621513367,
                                // z: -1.6000072360038757
                                z: -1.55
                            }
                            ,
                            option: {
                                color: '#ffffff'
                            }
                        }, {
                            filename: 'robot/4.ctm',
                            offset:
                                'center',
                            option:
                                {
                                    color: '#ffffff'
                                }
                        }, {
                            filename: 'robot/5.ctm',
                            offset: {
                                x: -0.652594804763794,
                                y: -0.2569952979683876,
                                // z: -1.6206916570663452
                                z: -1.614
                            },
                            option: {
                                color: '#ffffff'
                            }
                        }, {
                            filename: 'robot/6.ctm',
                            offset:
                                'center',
                            option: {
                                color: '#ffffff'
                            }
                        },
                            {
                                filename: 'robot/xipan_zhuti.ctm',
                                offset: 'center'
                            }, {
                                filename: 'robot/xipan_xuanzhuan.ctm',
                                offset: 'center',
                                option: {
                                    color: '#121619'
                                }
                            }, {
                                filename: 'robot/xipan.ctm',
                                offset: 'center',
                                option: {
                                    color: '#121619'
                                }
                            }, {
                                filename: 'gongjian.ctm',
                                offset: 'center',
                                option: {
                                    color: '#783812'
                                }
                            }
                        ]
                    ;

                    ctrl.loadCtmFileAsyc(files, parentObject, function (file, object, mesh) {
                        if (file.filename === 'robot/base.ctm') {
                            if (robotKey === 2) {
                                mesh.position.y = 0.67;
                                mesh.position.z = -0.26;
                                mesh.rotation.z = 180 * OneDegree;
                            } else {
                                mesh.position.x = 0.07;
                                mesh.position.y = -0.05;
                                mesh.position.z = -0.03;
                            }
                            objMap['robot/base.ctm' + robotKey] = mesh;
                        } else if (file.filename === 'gongjian.ctm') {
                            object.visible = false;
                            object.position.z = -0.06;
                            object.rotation.z = 90 * OneDegree;
                            objMap['robot' + robotKey + '_gongjian'] = object;
                        } else {
                            if (file.filename === 'robot/1.ctm') {
                                object.control = 'z';
                                object.position.x = 1.01;
                                object.position.y = 0.253;
                                object.position.z = 1.228;
                            } else if (file.filename === 'robot/2.ctm') {
                                object.control = 'y';
                                object.position.x = -0.05;
                                object.position.y = -0.003;
                                object.position.z = 0.047;
                            } else if (file.filename === 'robot/3.ctm') {
                                object.control = 'y';
                                object.position.z = 0.28;
                            } else if (file.filename === 'robot/4.ctm') {
                                object.control = 'x';
                                object.position.x = -0.24;
                                object.position.y = 0;
                                object.position.z = 0.07;
                            } else if (file.filename === 'robot/5.ctm') {
                                object.control = 'y';
                                object.position.x = -0.06;
                                object.position.y = 0;
                                object.position.z = -0.01;
                            } else if (file.filename === 'robot/6.ctm') {
                                object.control = 'z';
                                object.position.z = -0.066;
                            } else if (file.filename === 'robot/xipan_xuanzhuan.ctm') {
                                object.position.z = -0.035;
                            } else if (file.filename === 'robot/xipan.ctm') {
                                object.position.z = -0.035;
                            }
                            objMap[file.filename + robotKey] = object;
                        }
                    });
                },
                autoWidth: function () {
                    renderWidth = $('#automated_webgl_box').width();
                    renderHeight = $(window).height() - 200;

                    if (camera) {
                        camera.aspect = renderWidth / renderHeight;
                        camera.updateProjectionMatrix();
                    }
                    if (renderer) {
                        renderer.setSize(renderWidth, renderHeight);
                    }
                    $('.automated_left').height(renderHeight - 10);
                },
                loadCtmFile: function (params) {
                    var deferred = $.Deferred();
                    loader.load(ctrl.getCtmURL(params.filename), function (geometry) {
                        var option = {
                            roughness: 0.5,
                            metalness: 0.5,
                            shading: THREE.FlatShading,
                            transparent: true
                        };
                        if (params.option) {
                            option = _.extend(option, params.option);
                        }
                        var material = new THREE.MeshStandardMaterial(option);

                        if (params.offset) {
                            var offset = params.offset;
                            if (offset === 'center') {
                                geometry.center();
                            }
                            if (!_.isUndefined(offset.x)) {
                                geometry.translate(offset.x, offset.y, offset.z);
                            }
                        }

                        if (params.beforeCreate && _.isFunction(params.beforeCreate)) {
                            params.beforeCreate.call(null, geometry);
                        }

                        var mesh = new THREE.Mesh(geometry, material);
                        deferred.resolve(mesh, params);
                    });
                    return deferred;
                },
                loadCtmFileAsyc: function (files, parentObject, callback, first) {
                    if (files.length) {
                        var file = files.shift();

                        ctrl.loadCtmFile(file).done(function (mesh) {
                            parentObject.add(mesh);
                            var object = new THREE.Object3D();
                            if (_.isUndefined(first)) {
                                mesh.add(object);
                            } else {
                                parentObject.add(object);
                            }

                            if (file.p === true) {

                            }

                            if (_.isFunction(callback)) {
                                callback.call(null, file, parentObject, mesh);
                            }
                            ctrl.loadCtmFileAsyc(files, object, callback, false);
                        });
                    }
                },
                getCtmURL: function (glfile) {
                    return cynovan.r_path + 'production_line/vr_softlink_line/resource/ctm/' + glfile + '?v=' + cynovan.version;
                },
                initWebGL: function () {
                    container = document.getElementById('automated_webgl_box');
                    camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 1, 10000);
                    camera.position.set(-149, 51, -9);

                    parentObject.position.x = -45;
                    parentObject.position.y = -20;

                    parentObject.rotation.x = -91 * OneDegree;
                    parentObject.rotation.y = -20 * OneDegree;
                    parentObject.rotation.z = -93 * OneDegree;

                    parentObject.scale.set(scale, scale, scale);
                    objMap['camera'] = camera;

                    scene = new THREE.Scene();
                    scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

                    renderer = new THREE.WebGLRenderer({antialias: true});
                    renderer.setClearColor(scene.fog.color);
                    renderer.setPixelRatio(window.devicePixelRatio);
                    renderer.setSize(renderWidth, renderHeight);
                    renderer.domElement.style.position = "relative";

                    container.appendChild(renderer.domElement);

                    renderer.gammaInput = true;
                    renderer.gammaOutput = true;
                    renderer.shadowMap.enabled = true;

                    controls = new THREE.OrbitControls(camera, renderer.domElement);
                    controls.enableDamping = false
                    controls.enableZoom = true;
                    controls.enableRoute = true;
                    controls.zoomSpeed = 1;

                    scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444, 2.5));

                    // var light = new THREE.DirectionalLight(0xffffff, 1);
                    // light.position.set(50, 50, 50);
                    // scene.add(light);

                    objMap['parentObject'] = parentObject;
                    scene.add(parentObject);

                    function render() {
                        renderer.render(scene, camera);
                    }

                    function animate() {
                        requestAnimationFrame(animate);
                        render();
                        TWEEN.update();
                        controls.update();
                    }

                    animate();
                }
                ,
                plusPoint: function (axis) {
                    var value = $('#obj_input').val();
                    var arr = value.split(',');
                    var key = arr.shift();
                    var object = objMap[key];
                    if (object) {
                        var type = arr.shift() || 'position';

                        var xxxx = $('#' + axis + '_input').val();
                        xxxx = parseFloat(xxxx);
                        if (type === 'position') {
                            xxxx += 0.01;
                        } else {
                            xxxx += (OneDegree * 3);
                        }
                        object[type][axis] = xxxx;
                        $('#' + axis + '_input').val(xxxx);
                    }
                }
                ,
                miniPoint: function (axis) {
                    var value = $('#obj_input').val();
                    var arr = value.split(',');
                    var key = arr.shift();
                    var object = objMap[key];
                    if (object) {
                        var type = arr.shift() || 'position';

                        var xxxx = $('#' + axis + '_input').val();
                        xxxx = parseFloat(xxxx);
                        if (type === 'position') {
                            xxxx -= 0.01;
                        } else {
                            xxxx -= (OneDegree * 3);
                        }
                        object[type][axis] = xxxx;
                        $('#' + axis + '_input').val(xxxx);
                    }
                }
                ,
                move: function () {
                    var val = $('#animate_input').val();
                    if (val) {
                        var arr = val.split(',');
                        var objectKey = arr.shift();
                        var object = objMap[objectKey];
                        if (object) {
                            var type = arr.shift();
                            var axis = arr.shift();
                            var direc = parseInt(arr.shift());
                            var baseValue = direc ? 0.01 : -0.01;
                            var times = 0;
                            var interval = setInterval(function () {
                                object[type][axis] += baseValue;
                                times++;
                                if (times === 6000) {
                                    times = 0;
                                    window.clearInterval(interval);
                                }
                            }, 10);
                        }
                    }
                }
            })
            ;
            $timeout(function () {
                ctrl.initialize();
            }, 300);
        }]);
});