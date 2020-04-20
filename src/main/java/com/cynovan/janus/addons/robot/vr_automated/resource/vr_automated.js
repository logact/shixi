define(['echarts', 'web/lib/hls/hls', 'threejs'], function (echarts, Hls) {
    var app = angular.module('app');

    app.controller('VRAutoMatedController', ['$scope', '$timeout', 'AppComponent', 'dialog', 'AppDataService', '$element', 'DeviceService',
        function ($scope, $timeout, AppComponent, dialog, AppDataService, $element, DeviceService) {
            var ctrl = this;

            var appName = 'robot', configKey = 'vr_automated';
            var renderWidth, renderHeight, container, camera, scene, controls, renderer, scale = 56;
            var objMap = {}, parentObject = new THREE.Object3D(), loader = new THREE.CTMLoader();
            var OneDegree = Math.PI / 180, cycle = 188, cycle2 = 188;
            var AppConfig = {};
            var stompClient, subTopics = [];
            var rfidData = {};
            var echartPositionObj1, echartPositionObj2, timestamps1 = [], timestamps2 = [];
            var chartPosiData1 = {'1': [], '2': [], '3': [], '4': [], '5': [], '6': []},
                chartPosiData2 = {'1': [], '2': [], '3': [], '4': [], '5': [], '6': []};

            var dateMap = {};
            var stateMap = {
                r1_zhuaqu: false,
                r1_fangzhi: false,
                r2_zhuaqu: false,
                r2_fangzhi: false,
                lk_1_active: false,
                lk_2_active: false,
                lk_3_active: false,
                lk_4_active: false,
                sl_start_active: false,
                //RFID挡板默认是关闭的
                dangban: true,
                /*上料结束区域*/
                sl_end_active: false,
                ng_active: false,
                xl_start_active: false,
                //阻挡气缸默认是打开的,true是关的
                zudang_qigang: true,
                xl_end_active: false
            };
            var robotPosiMap = {};
            var robotStateFields = {
                1: ['r1_zhuaqu', 'r1_fangzhi', 'lk_1_active', 'lk_2_active', 'lk_3_active', 'lk_4_active'],//上料机器人
                2: ['r2_zhuaqu', 'r2_fangzhi', 'ng_active', 'sl_end_active'],//下料机器人
                3: ['sl_start_active', 'xl_start_active', 'xl_db_active', 'xl_end_active', 'dangban', 'zudang_qigang']//产线的配置
            }
            var pushList = {
                1: {'LineStart': true},
                2: {'LineStop': true},
                3: {'LineMode1': true},
                4: {'LineMode2': true}
            };
            /*标记每个位置停留的工件,1上料，2下料阻挡部分，3下料结束部分*/
            var hold1List = [], hold2List = [], hold3List = [];
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.initData();
                    ctrl.autoWidth();
                    ctrl.initWebGL();
                    dialog.waiting('模型加载中...');
                    ctrl.autoLayout();
                    ctrl.initCharts();
                    ctrl.initChangjing();
                    /*上料机器人*/
                    ctrl.initRobot(1);
                    /*下料机器人*/
                    ctrl.initRobot(2);
                    ctrl.initLiaojiaGongjian();
                    ctrl.initShangLiaoGongjian();
                    ctrl.initNGGongJian();
                    ctrl.initXialiaoGongjian();
                },
                initDeviceSelect: function () {
                    /*上料机器人*/
                    var uuid = _.get(AppConfig, 'uuid', '');
                    AppComponent.deviceselect($('#vrautomated_bind_device_box'), {'robot.show': true}, uuid).progress(function (bind) {
                        _.set(AppConfig, 'uuid', bind.uuid);
                        _.set(AppConfig, 'deviceName', bind.deviceName);
                        ctrl.refreshData();
                    });

                    /*下料机器人*/
                    var uuid3 = _.get(AppConfig, 'uuid3', '');
                    AppComponent.deviceselect($('#vrautomated_bind_robot2_box'), {'robot.show': true}, uuid3).progress(function (bind) {
                        _.set(AppConfig, 'uuid3', bind.uuid);
                        _.set(AppConfig, 'deviceName3', bind.deviceName);
                        ctrl.refreshData();
                    });

                    /*产线*/
                    var uuid2 = _.get(AppConfig, 'uuid2', '');
                    AppComponent.deviceselect($('#vrautomated_bind_line_box'), {}, uuid2).progress(function (bind) {
                        _.set(AppConfig, 'uuid2', bind.uuid);
                        _.set(AppConfig, 'deviceName2', bind.deviceName);
                        ctrl.refreshData();
                    });
                },
                refreshData: function () {
                    AppDataService.set(appName, configKey, AppConfig);
                    dialog.notyWithRefresh('数据配置已完成,2秒后自动刷新页面运行', $scope);
                },
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
                        if (camera_url.indexOf('m3u8') === -1) {
                            var vedioEle = $element.find('#rtspvedio')[0];
                            vedioEle.setAttribute('src', camera_url);
                            vedioEle.load();
                            $timeout(function () {
                                vedioEle.play();
                            }, 300);
                        } else {
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
                        template: 'vr_automated_rfid_detail_template',
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
                    stompClient.debug = null;
                    stompClient.connect({}, function (frame) {
                        _.each(uuids, function (uuid) {
                            var topic = '/ws/deviceData/' + uuid;
                            var subObject = stompClient.subscribe(topic, function (result) {
                                if (result.body) {
                                    var data = $.parseJSON(result.body);
                                    if (data.uuid === uuid1) {
                                        ctrl.pushTimestamp(data, 1);
                                        /*机器人判断其一轴位置*/
                                        ctrl.onSLRobotData(_.get(data, 'data', {}));
                                    }
                                    if (data.uuid === uuid3) {
                                        ctrl.pushTimestamp(data, 2);
                                        ctrl.onXLRobotData(_.get(data, 'data', {}));
                                    }
                                    if (data.uuid === uuid2) {
                                        ctrl.onLineData(_.get(data, 'data', {}));
                                    }
                                    ctrl.qigangOpen();
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
                            ctrl.onStateChange(field, fieldValue, data, robotKey);
                        }
                    });
                },
                onStateChange: function (fieldKey, newValue, data) {
                    if (fieldKey === 'sl_start_active') {
                        if (newValue === true) {
                            /*上料产线上增加一个工件，并自动滑动到尾部*/
                            ctrl.addShangliaoGongJian();
                        }
                    } else if (fieldKey === 'sl_end_active') {
                        if (newValue === false) {
                            ctrl.removeShangliaoGongJian();
                        }
                    } else if (fieldKey === 'sl_end_active') {
                        if (newValue === false) {
                            ctrl.removeShangliaoGongJian();
                        }
                    } else if (fieldKey === 'xl_start_active') {
                        if (newValue === true) {
                            $timeout(function () {
                                ctrl.addXialiaoGongJian();
                            }, 300);
                        }
                    } else if (fieldKey === 'xl_end_active') {
                        /*下料区结束位置的传感器*/
                        if (newValue === false) {
                            ctrl.removeXialiaoGongJian();
                        }
                    } else if (fieldKey === 'xl_end_active') {
                        /*下料区结束位置的传感器*/
                        if (newValue === false) {
                            ctrl.removeXialiaoGongJian();
                        }
                    } else if (fieldKey === 'ng_active') {
                        /*NG区域的传感器*/
                        var ngObj = objMap['ng_gongjian_1'];
                        if (newValue === false) {
                            ctrl.setVisible(ngObj, false);
                        } else {
                            ctrl.setVisible(ngObj, true);
                        }
                    } else if (fieldKey === 'dangban') {
                        ctrl.updateDangBan(newValue);
                    }
                },
                betweenArea: function (value, startKey, endKey) {
                    /*value为1轴的位置数据，该位置最终的位置，并非设备直接传上来的位置数据*/
                    var startValue = ctrl.toFloat(_.get(AppConfig, startKey, ''));
                    var endValue = ctrl.toFloat(_.get(AppConfig, endKey, ''));
                    if (value >= startValue && value <= endValue) {
                        return true;
                    }
                    return false;
                },
                toFloat: function (value) {
                    value = parseFloat(value);
                    if (_.isNaN(value)) {
                        value = 0;
                    }
                    return value;
                },
                qigangClose: function () {
                    var xialiao_zudang_1 = objMap['xialiao_zudang_1'];
                    var xialiao_zudang_2 = objMap['xialiao_zudang_2'];
                    ctrl.setAnimate(xialiao_zudang_1, 'x', 0.065, 300, 'position');
                    ctrl.setAnimate(xialiao_zudang_2, 'x', -0.065, 300, 'position');
                },
                qigangOpen: function () {
                    if (hold2List.length > 0 && hold3List.length === 0) {
                        var idx = _.first(hold2List);
                        var obj = objMap['xialiao_gongjian_' + idx];
                        if (obj.animate === false) {
                            /*工件添加进底部区域*/
                            hold2List.shift()
                            /*移动到底部,计算底部已经存在的工件数量*/
                            var count = _.size(hold3List);
                            var position = 0.362 - (count * 0.17);
                            var speedTimes = ctrl.getXialiaoSpeed(position, obj.position.z || 0);
                            hold3List.push(idx);
                            ctrl.setAnimate(obj, 'z', position, speedTimes, 'position').done(function () {
                                ctrl.log('下料产线中间气缸开启,一个纸箱滑入底部:0%', idx);
                            });
                        }
                    }
                },
                removeXialiaoGongJian: function () {
                    var checked = ctrl.checkLastDate('end_xialiao');
                    if (checked === false) {
                        return;
                    }
                    if (hold3List.length > 0) {
                        var idx = _.first(hold3List);
                        var obj = objMap['xialiao_gongjian_' + idx];
                        hold3List.shift();
                        ctrl.log('上料机器人抓取下料结束区域的纸箱,序号:0%', idx);
                        ctrl.setVisible(obj, false);
                        obj.position.z = -2.22;
                        if (hold3List.length > 0) {
                            var cloneGongjian = _.clone(hold3List);
                            _.each(cloneGongjian, function (gongjianIdx, index) {
                                var objItem = objMap['xialiao_gongjian_' + gongjianIdx];
                                if (objItem && objItem.animate === false) {
                                    ctrl.setAnimate(objItem, 'z', 0.362 - (0.17 * index), 350, 'position');
                                }
                            });
                        }
                    }
                },
                removeShangliaoGongJian: function () {
                    var checked = ctrl.checkLastDate('start_xialiao');
                    if (checked === false) {
                        return;
                    }
                    if (hold1List.length > 0) {
                        var idx = hold1List.shift();
                        var obj = objMap['shangliao_gongjian_' + idx];
                        ctrl.setVisible(obj, false);
                        obj.position.z = 0.13;

                        ctrl.log('下料机器人从上料结束区域抓取纸箱');
                    }
                },
                addXialiaoGongJian: function () {
                    var checked = ctrl.checkLastDate('end_shangliao');
                    if (checked === false) {
                        return;
                    }

                    var usedArr = _.concat(hold2List, hold3List);

                    var notUsedIdx = ctrl.getRandom(usedArr, 'xialiao_gongjian_', 'z', -2.22);
                    console.log('已经使用的list 为:' + _.join(usedArr, ','));
                    if (notUsedIdx > -1) {
                        var obj = objMap['xialiao_gongjian_' + notUsedIdx];
                        ctrl.setVisible(obj, true);

                        var count = _.size(hold2List);
                        var position = -0.355 - (count * 0.17);
                        var speedTimes = ctrl.getXialiaoSpeed(position);
                        hold2List.push(notUsedIdx);
                        ctrl.log('下料区域纸箱滑动至气缸位置,序号:0%,滑动时间为:1%', notUsedIdx, speedTimes);
                        ctrl.setAnimate(obj, 'z', position, speedTimes, 'position').done(function () {
                            ctrl.log(`纸箱已滑动至下料区域中间位置,序号:0%`, notUsedIdx);
                            ctrl.qigangOpen();
                        });
                    }
                },
                checkLastDate: function (key) {
                    var lastTime = _.get(dateMap, key, 0);
                    var newTime = new Date().getTime();
                    if (lastTime === 0) {
                        _.set(dateMap, key, newTime);
                        return true;
                    }
                    var diff = newTime - lastTime;
                    if (diff >= 4500) {
                        _.set(dateMap, key, newTime);
                        return true;
                    }
                    return false;
                },
                getRandom: function (arr, prefix, posiType, initValue) {
                    var notUsedList = _.difference(_.range(1, 7), arr);

                    var notUsedIdx = _.get(notUsedList, _.random(0, notUsedList.length - 1));
                    var obj = objMap[prefix + notUsedIdx];
                    if (obj) {
                        if (obj.visible === false) {
                            if (obj.position[posiType] === initValue) {
                                return notUsedIdx;
                            }
                        }
                    }
                    return ctrl.getRandom(arr, prefix, posiType, initValue);
                },
                addShangliaoGongJian: function () {
                    var checked = ctrl.checkLastDate('start_shangliao');
                    if (checked === false) {
                        return;
                    }
                    /*首先取到未使用的工件*/
                    var notUsedIdx = ctrl.getRandom(hold1List, 'shangliao_gongjian_', 'z', 0.13);
                    if (notUsedIdx > -1) {
                        var obj = objMap['shangliao_gongjian_' + notUsedIdx];
                        ctrl.setVisible(obj, true);

                        /*运动到等待抓取位置,判断等待位置有几个纸箱，动态调整位置*/
                        var count = _.size(hold1List);
                        //-2.166代表要到达的位置
                        var position = -2.166 + (count * 0.17);
                        var speedTimes = ctrl.getShangliaoSpeed(position);
                        ctrl.log('上料区域增加一个纸箱,滑动时间为:0% , 滑动位置为:1%', speedTimes, position);
                        hold1List.push(notUsedIdx);
                        ctrl.setAnimate(obj, 'z', position, speedTimes, 'position').done(function () {
                            ctrl.log('纸箱已滑动至上料结束区域');
                        });
                    }
                },
                updateXLRobotState: function (data) {
                    var r2_fangzhi = ctrl.getState('r2_fangzhi');
                    if (r2_fangzhi === true) {
                        ctrl.setVisible('robot_xialiao_gongjian', false);
                    } else {
                        ctrl.setVisible('robot_xialiao_gongjian', true);
                    }

                    /*var r2_zhuaqu = ctrl.getState('r2_zhuaqu');
                    ctrl.setVisible('robot_xialiao_gongjian', r2_zhuaqu);*/

                    var cloneGongjian = _.clone(hold1List);
                    _.each(cloneGongjian, function (gongjianIdx, index) {
                        var objItem = objMap['shangliao_gongjian_' + gongjianIdx];
                        if (objItem && objItem.animate === false) {
                            var targetPosi = -2.166 + (0.17 * index);
                            if (objItem.position.z !== targetPosi) {
                                ctrl.setAnimate(objItem, 'z', targetPosi, 350, 'position');
                            }
                        }
                    });
                },
                /*根据机器人一轴位置在区域范围内 以及 状态指标*/
                updateSLRobotState: function (data) {
                    /*===判断机器人手抓上是否显示工件===*/
                    var r1_fangzhi = ctrl.getState('r1_fangzhi');
                    if (r1_fangzhi === true) {
                        /*有放置信号，则隐藏机器人上工件*/
                        ctrl.setVisible('robot_shangliao_gongjian', false);
                    }

                    var r1_zhuaqu = ctrl.getState('r1_zhuaqu');
                    ctrl.setVisible('robot_shangliao_gongjian', r1_zhuaqu);

                    /*======料框是否显示工件=====*/
                    _.times(4, function (idx) {
                        idx = idx + 1;
                        var field = `lk_${idx}_active`;
                        var value = ctrl.getState(field);
                        var meshName = `liaojia_gongjian_${idx}`;
                        ctrl.setVisible(meshName, value);
                    });
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

                    /*挡板部分的工件一次向前挪动*/
                    if (hold2List.length > 0) {
                        var cloneGongjian = _.clone(hold2List);
                        var firstIdx = _.first(cloneGongjian);
                        if (firstIdx) {
                            _.each(cloneGongjian, function (gongjianIdx, index) {
                                var objItem = objMap['xialiao_gongjian_' + gongjianIdx];
                                if (objItem && objItem.animate === false) {
                                    var targetPosi = -0.355 - (0.17 * index);
                                    if (objItem.position.z !== targetPosi) {
                                        ctrl.setAnimate(objItem, 'z', targetPosi, 200, 'position');
                                    }
                                }
                            });
                        }
                    }
                },
                updateLineState: function (data) {
                    var zudangQiGang = ctrl.getBooleanValue(data, 'zudang_qigang');
                    if (zudangQiGang === true) {
                        ctrl.qigangClose();
                    } else {
                        var xialiao_zudang_1 = objMap['xialiao_zudang_1'];
                        var xialiao_zudang_2 = objMap['xialiao_zudang_2'];
                        ctrl.setAnimate(xialiao_zudang_1, 'x', 0, 300, 'position');
                        ctrl.setAnimate(xialiao_zudang_2, 'x', 0, 300, 'position');
                    }
                },
                updateDangBan: function (dangban) {
                    var obj1 = objMap['dangban_qian/dangban.ctm'];
                    var obj2 = objMap['dangban_qian/lianjie.ctm'];
                    var obj3 = objMap['dangban_qian/qigang.ctm'];
                    if (dangban) {
                        ctrl.setAnimate(obj1, 'x', 0, 500, 'position');
                        ctrl.setAnimate(obj2, 'x', 0, 500, 'position');
                        ctrl.setAnimate(obj3, 'x', 0, 500, 'position');
                    } else {
                        ctrl.setAnimate(obj1, 'x', -0.23, 500, 'position');
                        ctrl.setAnimate(obj2, 'x', -0.23, 500, 'position');
                        ctrl.setAnimate(obj3, 'x', -0.23, 500, 'position');
                    }
                },
                getShangliaoSpeed: function (position) {
                    var speedTimes = _.get(AppConfig, 'chuansongdai1_speed', 2000);
                    speedTimes = _.parseInt(speedTimes);
                    if (_.isNaN(speedTimes)) {
                        speedTimes = 2000;
                    }

                    var total = Math.abs(0.13 - (-2.166));

                    var range = Math.abs(0.13 - position);
                    return _.parseInt(speedTimes * (range / total));
                },
                getXialiaoSpeed: function (position, start) {
                    start = start || -2.22;
                    var speedTimes = _.get(AppConfig, 'chuansongdai2_speed', 2000);
                    speedTimes = _.parseInt(speedTimes);
                    if (_.isNaN(speedTimes)) {
                        speedTimes = 2000;
                    }

                    var total = Math.abs(-2.22 - 0.362);

                    var range = Math.abs(start - position);
                    return parseInt(speedTimes * (range / total));
                },
                setVisible: function (name, visible) {
                    var obj = name;
                    if (_.isString(name)) {
                        obj = objMap[name];
                    }
                    if (obj) {
                        obj.visible = visible;
                    }
                }
                ,
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
                }
                ,
                getBooleanValue: function (data, fieldName) {
                    var value = _.get(data, _.get(AppConfig, fieldName, ''), false);
                    if (_.isString(value)) {
                        value = _.lowerCase(value);
                    }
                    if (value === false || value == '0' || value == 'false') {
                        return false;
                    }
                    return true;
                }
                ,
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
                    object.animate = true;

                    new TWEEN.Tween(fromObject)
                        .to(toObject, time)
                        .onUpdate(function () {
                            this.obj[type][axis] = this[axis];
                        })
                        .onComplete(function () {
                            object.animate = false;
                            deferred.resolve();
                        })
                        .easing(TWEEN.Easing.Linear.None)
                        .start();
                    return deferred;
                },
                modifyConfig: function () {
                    dialog.show({
                        title: false,
                        template: 'vr_automated_config_template',
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
                }
                ,
                push: function (idx) {
                    var pushData = pushList[idx];
                    var uuid2 = _.get(AppConfig, 'uuid2', '');
                    if (pushData && uuid2) {
                        DeviceService.push(uuid2, 'update', pushData);
                    }
                }
                ,
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
                }
                ,
                initChangjing: function () {
                    var files = [{
                        filename: 'guding/floor.ctm',
                        option: {
                            color: '#CDD1CF'
                        }
                    }, {
                        filename: 'guding/dianji.ctm',
                        option: {
                            color: "#D0D7F4"
                        }
                    }, {
                        filename: 'guding/dizuo.ctm',
                        option: {
                            color: "#393D3D"
                        }
                    }, {
                        filename: 'guding/jiance.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'guding/sensor.ctm',
                        option: {
                            color: '#7ACC7F'
                        }
                    }, {
                        filename: 'guding/banjin.ctm',
                        option: {
                            color: '#D8DEFF'
                        }
                    }, {
                        filename: 'guding/led.ctm',
                        option: {
                            color: '#121619'
                        }
                    }, {
                        filename: 'guding/chelun.ctm',
                        option: {
                            color: "#393D3D"
                        }
                    }, {
                        filename: 'guding/pidai.ctm',
                        option: {
                            color: '#0DC201'
                        }
                    }, {
                        filename: 'guding/daopxiangban.ctm',
                        option: {
                            color: "#FFDAFF"
                        }
                    }, {
                        filename: 'ng/chelun.ctm',
                        option: {
                            color: "#393D3D"
                        }
                    }, {
                        filename: 'ng/fushou.ctm',
                        option: {
                            color: '#232121'
                        }
                    }, {
                        filename: 'ng/sensor.ctm',
                        option: {
                            color: '#7ACC7F'
                        }
                    }, {
                        filename: 'ng/zhuti.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'line/line.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'line/line_floor.ctm',
                        option: {
                            color: "#393D3D"
                        }
                    }, {
                        filename: 'line/pidai.ctm',
                        option: {
                            color: '#0DC201'
                        }
                    }, {
                        filename: 'line/qigang.ctm'
                    }, {
                        filename: 'line/sensor.ctm',
                        option: {
                            color: '#7ACC7F'
                        }
                    }, {
                        filename: 'dangban_qian/dangban.ctm',
                        option: {
                            color: '#C5C59E'
                        }
                    }, {
                        filename: 'dangban_qian/lianjie.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_qian/qigang.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_shang/dangban.ctm',
                        option: {
                            color: '#C5C59E'
                        }
                    }, {
                        filename: 'dangban_shang/lianjie.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_shang/qigang.ctm',
                        option: {
                            color: "#ABB1C9"
                        }
                    }, {
                        filename: 'dangban_zuo/dangban.ctm',
                        option: {
                            color: '#C5C59E'
                        }
                    }, {
                        filename: 'dangban_zuo/lianjie.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_zuo/yundong.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_you/dangban.ctm',
                        option: {
                            color: '#C5C59E'
                        }
                    }, {
                        filename: 'dangban_you/lianjie.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_you/yundong.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'shangliao/chelun.ctm',
                        option: {
                            color: "#393D3D"
                        }
                    }, {
                        filename: 'shangliao/fushou.ctm',
                        option: {
                            color: '#232121'
                        }
                    }, {
                        filename: 'shangliao/sensor.ctm',
                        option: {
                            color: '#7ACC7F'
                        }
                    }, {
                        filename: 'shangliao/zhuti.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_you_zu/lianjie.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_you_zu/qigang.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_you_zu/zudang.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_zuo_zu/lianjie.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_zuo_zu/qigang.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'dangban_zuo_zu/zudang.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'guding_robot/shangliao_guding.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'guding_robot/xialiao_guding.ctm',
                        option: {
                            color: '#ffffff'
                        }
                    }];

                    _.each(files, function (file) {
                        ctrl.loadCtmFile(file).done(function (mesh, param) {
                            // objMap[param.filename] = mesh;
                            parentObject.add(mesh);
                            if (param.filename === 'dangban_you_zu/zudang.ctm') {
                                objMap['xialiao_zudang_1'] = mesh;
                            } else if (param.filename === 'dangban_zuo_zu/zudang.ctm') {
                                objMap['xialiao_zudang_2'] = mesh;
                            } else if (param.filename.indexOf('dangban_qian/') > -1) {
                                objMap[param.filename] = mesh;
                            }
                        });
                    });
                }
                ,
                initXialiaoGongjian: function () {
                    _.times(6, function (idx) {
                        var file = {
                            filename: 'gongjian.ctm',
                            idx: idx + 1,
                            offset: 'center',
                            option: {
                                color: '#783812'
                            }
                        };
                        ctrl.loadCtmFile(file).done(function (mesh, param) {
                            var filename = 'xialiao_gongjian_' + param.idx;
                            mesh.position.x = -0.585;
                            mesh.position.y = -0.802;
                            mesh.position.z = -2.22;
                            mesh.rotation.y = 90 * OneDegree;
                            objMap[filename] = mesh;
                            mesh.visible = false;
                            parentObject.add(mesh);
                        });
                    })
                }
                ,
                initNGGongJian: function () {
                    var file = {
                        filename: 'gongjian.ctm',
                        idx: 1,
                        option: {
                            color: '#783812'
                        }
                    };
                    ctrl.loadCtmFile(file).done(function (mesh, param) {
                        var filename = 'ng_gongjian_' + param.idx;
                        mesh.position.x = 0.2;
                        mesh.position.y = -0.012;
                        mesh.position.z = -3.63;
                        objMap[filename] = mesh;
                        mesh.visible = false;
                        parentObject.add(mesh);
                    });
                }
                ,
                initShangLiaoGongjian: function () {
                    _.times(6, function (idx) {
                        var file = {
                            filename: 'gongjian.ctm',
                            idx: idx + 1,
                            offset: 'center',
                            option: {
                                color: '#783812'
                            }
                        };
                        ctrl.loadCtmFile(file).done(function (mesh, param) {
                            var filename = 'shangliao_gongjian_' + param.idx;
                            mesh.position.x = 0.41;
                            mesh.position.y = -0.75;
                            mesh.position.z = 0.13;
                            mesh.rotation.y = 90 * OneDegree;
                            objMap[filename] = mesh;
                            mesh.visible = false;
                            parentObject.add(mesh);
                        });
                    });
                }
                ,
                initLiaojiaGongjian: function () {
                    _.times(4, function (idx) {
                        var file = {
                            filename: 'gongjian.ctm',
                            idx: idx + 1,
                            option: {
                                color: '#783812'
                            }
                        };
                        ctrl.loadCtmFile(file).done(function (mesh, param) {
                            var filename = 'liaojia_gongjian_' + param.idx;
                            if (param.idx === 1) {

                            } else if (param.idx === 2) {
                                mesh.position.z = 0.284;
                            } else if (param.idx === 3) {
                                mesh.position.x = 0.27;
                            } else {
                                mesh.position.z = 0.284;
                                mesh.position.x = 0.27;
                            }
                            mesh.visible = false;
                            objMap[filename] = mesh;
                            parentObject.add(mesh);
                        });
                    });
                }
                ,
                initRobot: function (robotKey) {
                    var files = [{
                        filename: 'robot/base.ctm',
                        option: {
                            color: '#199796'
                        }
                    }, {
                        filename: 'robot/1.ctm',
                        offset: {
                            // x: -0.02807769924402237,
                            x: 0,
                            y: -0.3215549662709236,
                            // z: 0.015155453234910965
                            z: 0
                        },
                        option: {
                            color: '#199796'
                        }
                    }, {
                        filename: 'robot/2.ctm',
                        offset: {
                            x: -0.10081632807850838,
                            // y: -0.4739062339067459,
                            y: -0.34,
                            z: -0.14231079816818237
                        },
                        option: {
                            color: '#199796'
                        }
                    }, {
                        filename: 'robot/3.ctm',
                        offset: {
                            // x: -0.06520088389515877,
                            x: -0.098,
                            // y: -0.6902840733528137,
                            y: -0.64,
                            // z: 0.006645377725362778
                            z: 0.0066
                        },
                        option: {
                            color: '#199796'
                        }
                    }, {
                        filename: 'robot/4.ctm',
                        offset: 'center',
                        option: {
                            color: '#199796'
                        }
                    }, {
                        filename: 'robot/5.ctm',
                        offset: {
                            // x: -0.42299380898475647,
                            x: -0.41,
                            y: -0.7443690299987793,
                            z: -0.00025436654686927795
                        },
                        option: {
                            color: '#199796'
                        }
                    }, {
                        filename: 'robot/6.ctm',
                        offset: 'center',
                        option: {
                            color: '#199796'
                        }
                    }, {
                        filename: 'robot/zhua1.ctm',
                        offset: 'center',
                        option: {
                            color: '#ffffff'
                        }
                    }, {
                        filename: 'robot/zhua2.ctm',
                        offset: 'center',
                        option: {
                            color: '#ADB3CC'
                        }
                    }, {
                        filename: 'robot/zhua3.ctm',
                        offset: 'center',
                        option: {
                            color: '#cdd033'
                        }
                    }, {
                        filename: 'gongjian.ctm',
                        offset: 'center',
                        option: {
                            color: '#783812'
                        }
                    }];

                    ctrl.loadCtmFileAsyc(files, parentObject, function (file, object, mesh) {
                        if (file.filename === 'robot/base.ctm') {
                            if (robotKey === 1) {
                                /*上料机器人*/
                                mesh.position.x = 0.0068;
                                mesh.position.y = -0.934;
                                mesh.position.z = 0.655;
                                mesh.rotation.y = 180 * OneDegree;
                            } else {
                                mesh.position.x = -0.071;
                                mesh.position.y = -0.885;
                                mesh.position.z = -2.226;
                                mesh.rotation.y = 90 * OneDegree;
                            }
                            objMap[file.filename + robotKey] = mesh;
                        } else if (file.filename === 'robot/zhua1.ctm') {
                            object.position.x = 0.14;
                            object.position.y = -0.001;
                            object.position.z = -0.003;
                            object.rotation.z = 90 * OneDegree;
                            objMap[file.filename] = object;
                        } else if (file.filename === 'robot/zhua2.ctm') {
                            object.position.y = 0.036;
                            objMap[file.filename] = object;
                        } else if (file.filename === 'robot/zhua3.ctm') {
                            object.position.y = -0.11;
                            objMap[file.filename] = object;
                        } else if (file.filename === 'gongjian.ctm') {
                            object.rotation.y = 90 * OneDegree;
                            object.visible = false;
                            if (robotKey === 1) {
                                objMap['robot_shangliao_gongjian'] = object;
                            } else {
                                objMap['robot_xialiao_gongjian'] = object;
                                dialog.hideWaiting();
                            }
                        } else {
                            if (file.filename === 'robot/1.ctm') {
                                object.control = 'y';
                                object.position.x = 0;
                                object.position.y = 0.29;
                                object.position.z = 0;
                                object.type = 'rotation';
                                if (robotKey === 2) {
                                    object.rotation.y = -90 * OneDegree;
                                }
                            } else if (file.filename === 'robot/2.ctm') {
                                object.control = 'z';
                                object.position.x = 0.1;
                                object.position.y = 0.02;
                                object.position.z = 0.14;
                                object.type = 'rotation';
                            } else if (file.filename === 'robot/3.ctm') {
                                object.control = 'z';
                                object.position.x = 0;
                                object.position.y = 0.3;
                                object.position.z = -0.145;
                                object.type = 'rotation';
                            } else if (file.filename === 'robot/4.ctm') {
                                object.control = 'x';
                                object.position.x = 0.24;
                                object.position.y = 0.11;
                                object.position.z = 0;
                                object.type = 'rotation';
                            } else if (file.filename === 'robot/5.ctm') {
                                object.control = 'z';
                                object.position.x = 0.08;
                                object.position.y = 0;
                                object.position.z = 0;
                                object.rotation.z = -90 * OneDegree;
                                object.type = 'rotation';
                            } else if (file.filename === 'robot/6.ctm') {
                                object.control = 'x';
                                object.position.x = 0.08;
                                object.position.y = 0;
                                object.position.z = -0.003;
                                object.type = 'rotation';
                                dialog.hideWaiting();
                            } else if (file.filename === 'robot/zhua.ctm') {
                                object.position.x = 0.145;
                                object.position.z = -0.004;
                                object.rotation.z = 90 * OneDegree;
                            }
                            objMap[file.filename + robotKey] = object;
                        }
                    });
                }
                ,
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
                }
                ,
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
                }
                ,
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
                    return cynovan.r_path + 'robot/vr_automated/resource/ctm/' + glfile + '?v=' + cynovan.version;
                },
                log: function () {
                    var arr = _.toArray(arguments);
                    var message = arr.shift();
                    if (arr.length) {
                        _.each(arr, function (item, idx) {
                            message = _.replace(message, `${idx}%`, item);
                        })
                    }
                    var date = new Date();
                    message = date.toString('HH:mm:ss.') + date.getMilliseconds() + ':' + message;
                    console.log(message);
                },
                initWebGL: function () {
                    container = document.getElementById('automated_webgl_box');
                    camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 1, 10000);
                    camera.position.set(-149, 51, -9);

                    parentObject.scale.set(scale, scale, scale);

                    parentObject.position.x = 0;
                    parentObject.position.y = 50;
                    parentObject.position.z = 45;

                    parentObject.rotation.y = -5 * OneDegree;
                    parentObject.rotation.z = 20 * OneDegree;
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
                        render();
                        TWEEN.update();
                        controls.update();
                    }

                    setInterval(function () {
                        animate();
                    }, 40);
                },
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
            }, 500);
        }]);
});