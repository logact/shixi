define(['echarts', 'threejs'], function (echarts) {
    var app = angular.module('app');

    app.controller('RobotVRA728Controller', ['$scope', '$timeout', 'AppComponent', 'dialog', 'AppDataService', '$element', 'websocket',
        function ($scope, $timeout, AppComponent, dialog, AppDataService, $element, websocket) {
            var ctrl = this;

            var appName = 'robot';
            var renderWidth, renderHeight, container, camera, scene, controls, renderer, scale = 150;
            let objMap = {}, parentObject = new THREE.Object3D(), loader = new THREE.CTMLoader();
            let OneDegree = Math.PI / 180, timestamps = [];
            var echartPositionObj, echartSpeedObj, cycle = 188;
            var AppConfig = {};
            $scope.deviceName = '模型-A728';
            var chartPosiData = {
                    '1': [],
                    '2': [],
                    '3': [],
                    '4': [],
                    '5': [],
                    '6': []
                },
                chartSpeedData = {
                    '1': [],
                    '2': [],
                    '3': [],
                    '4': [],
                    '5': [],
                    '6': []
                }
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.initData();
                    ctrl.autoWidth();
                    ctrl.initCharts();
                    ctrl.initWebGL();
                    ctrl.initRobot();
                },
                initDeviceSelect: function () {
                    var uuid = _.get(AppConfig, 'uuid', '');
                    AppComponent.deviceselect($('#vra728_bind_device_box'), {'robot.show': true}, uuid).progress(function (bind) {
                        _.set(AppConfig, 'uuid', bind.uuid);
                        _.set(AppConfig, 'deviceName', bind.deviceName);
                        ctrl.refreshData();
                    });
                },
                refreshData: function () {
                    AppDataService.set(appName, 'vr_a728', AppConfig);
                    dialog.notyWithRefresh('数据配置已完成,2秒后自动刷新页面运行', $scope);
                },
                initData: function () {
                    AppDataService.get(appName, 'vr_a728').success(function (result) {
                        if (_.isEmpty(result)) {
                            AppConfig = {
                                axis1_posi: '003_Axis1ProfilePosition',
                                axis1_direc: '1',
                                axis1_speed: '019_Axis1ProfileVelocity',
                                axis2_posi: '004_Axis2ProfilePosition',
                                axis2_direc: '1',
                                axis2_speed: '020_Axis2ProfileVelocity',
                                axis3_posi: '005_Axis3ProfilePosition',
                                axis3_direc: '1',
                                axis3_speed: '021_Axis3ProfileVelocity',
                                axis4_posi: '006_Axis4ProfilePosition',
                                axis4_direc: '1',
                                axis4_speed: '022_Axis4ProfileVelocity',
                                axis5_posi: '007_Axis5ProfilePosition',
                                axis5_direc: '1',
                                axis5_speed: '023_Axis5ProfileVelocity',
                                axis6_posi: '008_Axis6ProfilePosition',
                                axis6_direc: '1',
                                axis6_speed: '024_Axis6ProfileVelocity',
                                cycle: 188,
                                cf_wcs: '071_WCSNumber',
                                cf_tcs: '070_TCSNumber',
                                cf_x: '011_CartesianXPosition',
                                cf_y: '012_CartesianYPosition',
                                cf_z: '013_CartesianZPosition',
                                cf_rx: '014_CartesianAPosition',
                                cf_ry: '015_CartesianBPosition',
                                cf_rz: '016_CartesianCPosition',
                                ac_1: '077_Axis1ProfileAcc',
                                ac_2: '078_Axis2ProfileAcc',
                                ac_3: '079_Axis3ProfileAcc',
                                ac_4: '080_Axis4ProfileAcc',
                                ac_5: '081_Axis5ProfileAcc',
                                ac_6: '082_Axis6ProfileAcc',
                                temper_1: '043_Axis1ActualCurrent',
                                temper_2: '044_Axis2ActualCurrent',
                                temper_3: '045_Axis3ActualCurrent',
                                temper_4: '046_Axis4ActualCurrent',
                                temper_5: '047_Axis5ActualCurrent',
                                temper_6: '048_Axis6ActualCurrent',
                                linevelocity: '076_LineVelocity',
                                posture: '085_OrientationNumber',
                                movement_state: '059_WorkMode',
                                error_state: '068_ERRORStatus',
                                electrify_time: '086_BootTime',
                                run_time: '087_RunTime',
                                input_port_: 'input_port_',
                                output_port_: 'output_port_',
                            };
                        } else {
                            AppConfig = result;
                            cycle = _.parseInt(_.get(AppConfig, 'cycle', 188));
                        }
                        ctrl.initDeviceSelect();
                        ctrl.subscribeData();
                        ctrl.setDeviceName();
                    });
                },
                setDeviceName: function () {
                    var uuid = _.get(AppConfig, 'uuid', '');
                    var deviceName = _.get(AppConfig, 'deviceName', '');
                    deviceName = _.replace(deviceName, '(' + uuid + ')', '');

                    deviceName = deviceName || '模型-A728';
                    $scope.deviceName = deviceName;
                },
                subscribeData: function () {
                    var uuid = _.get(AppConfig, 'uuid', '');
                    if (!uuid) {
                        dialog.noty('请选择设备运行');
                        return false;
                    }
                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope:$scope,
                        onmessage: function (data) {
                            if (timestamps.length > 50) {
                                timestamps.shift();
                            }
                            var time = _.get(data, 'time', '');
                            if (time.length > 10) {
                                time = time.substring(10);
                            }
                            timestamps.push(time);
                            ctrl.onData(_.get(data, 'data', {}));
                        }
                    });
                },
                onData: function (data) {
                    ctrl.updateRobot(data);
                    ctrl.updateChart(data);
                    ctrl.updateValue(data);
                },
                updateValue: function (data) {
                    $element.find('.value_content').each(function () {
                        var ele = $(this);
                        var valueKey = ele.data('key');
                        var value = _.get(data, _.get(AppConfig, valueKey, ''), '');
                        ele.text(value);
                    });

                    $('.vr_728_state_item').each(function () {
                        var ele = $(this);
                        var valueKey = ele.data('key');

                        var value = false;
                        if (valueKey === 'output_port_' || valueKey === 'input_port_') {
                            var suffix = _.get(AppConfig, valueKey, '');
                            var index = ele.data('index');
                            value = _.get(data, suffix + index, false);
                            if (value === false || value == '0' || value == 'false') {
                                value = false;
                            } else {
                                value = true;
                            }
                        } else {
                            value = ctrl.getBooleanValue(data, valueKey);
                        }
                        if (value) {
                            ele.addClass('active');
                        } else {
                            ele.removeClass('active');
                        }
                    });
                },
                showState: function (keyword) {
                    var title = 'Input Port讯号';
                    if (keyword === 'output_port_') {
                        title = 'Output Port讯号';
                    }
                    var items = [];
                    _.times(96, function (idx) {
                        items.push(idx + 1)
                    });

                    dialog.show({
                        title: title,
                        'template': 'vr_robot_a728_state_template',
                        width: 1200,
                        cancel: false,
                        data: {
                            key: keyword,
                            items: items
                        }
                    })
                },
                getBooleanValue: function (data, fieldName) {
                    var value = _.get(data, _.get(AppConfig, fieldName, ''), false);
                    if (value === false || value == '0' || value == 'false') {
                        return false;
                    }
                    return true;
                },
                updateRobot: function (data) {
                    var valueDatas = [];
                    _.times(6, function (index) {
                        var ctmIdx = index + 1;
                        var object = objMap[`${ctmIdx}.ctm`];
                        var value = _.get(data, _.get(AppConfig, 'axis' + ctmIdx + '_posi', ''), 0);
                        value = parseFloat(value);
                        if (_.isNaN(value)) {
                            value = 0;
                        }

                        var currentPosition = value * OneDegree;
                        valueDatas.push(value);

                        var diff = 0;
                        var axisIndex = index + 1;
                        var direc = _.get(AppConfig, `axis${axisIndex}_direc`, '1');

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

                    _.each(chartPosiData, function (values, key) {
                        if (values.length > 50) {
                            values.shift();
                        }
                        var idx = parseInt(key) - 1;
                        values.push(valueDatas[idx]);
                    });
                },
                updateChart: function (data) {
                    var valueDatas = [];
                    _.times(6, function (idx) {
                        idx = idx + 1;
                        var value = _.get(data, _.get(AppConfig, 'axis' + idx + '_speed', ''), 0);
                        value = parseFloat(value);
                        if (_.isNaN(value)) {
                            value = 0;
                        }
                        valueDatas.push(value);
                    });

                    _.each(chartSpeedData, function (values, key) {
                        if (values.length > 50) {
                            values.shift();
                        }
                        var idx = parseInt(key) - 1;
                        values.push(valueDatas[idx]);
                    });

                    if (echartPositionObj) {
                        var posiOpts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: chartPosiData[1]
                                },
                                {
                                    data: chartPosiData[2]
                                },
                                {
                                    data: chartPosiData[3]
                                },
                                {
                                    data: chartPosiData[4]
                                }, {
                                    data: chartPosiData[5]
                                }, {
                                    data: chartPosiData[6]
                                }
                            ]
                        };
                        echartPositionObj.setOption(posiOpts);
                    }

                    if (echartSpeedObj) {
                        var speedOpts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: chartSpeedData[1]
                                },
                                {
                                    data: chartSpeedData[2]
                                },
                                {
                                    data: chartSpeedData[3]
                                },
                                {
                                    data: chartSpeedData[4]
                                }, {
                                    data: chartSpeedData[5]
                                }, {
                                    data: chartSpeedData[6]
                                }
                            ]
                        };
                        echartSpeedObj.setOption(speedOpts);
                    }
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
                        template: 'vr_robot_a728_config_template',
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
                                AppDataService.set(appName, 'vr_a728', AppConfig);
                                dialog.notyWithRefresh('数据配置已完成,2秒后自动刷新页面运行', $scope);
                            });
                        }]
                    });
                },
                initCharts: function () {
                    var positionOptions = {
                        xAxis: [
                            {
                                type: 'category',
                                data: timestamps
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
                    var echartPositionEle = $('.echart_position');
                    echartPositionObj = echarts.init(echartPositionEle[0]);
                    echartPositionObj.setOption(positionOptions);

                    var speedOptions = {
                        xAxis: [
                            {
                                type: 'category',
                                data: timestamps
                            }
                        ],
                        legend: {
                            data: ['轴1速度', '轴2速度', '轴3速度', '轴4速度', '轴5速度', '轴6速度']
                        },
                        yAxis: [
                            {
                                type: 'value',
                                name: '轴速度曲线'
                            }
                        ],
                        series: [
                            {
                                type: 'line',
                                name: '轴1速度',
                                data: []
                            },
                            {
                                type: 'line',
                                name: '轴2速度',
                                data: []
                            },
                            {
                                type: 'line',
                                name: '轴3速度',
                                data: []
                            },
                            {
                                type: 'line',
                                name: '轴4速度',
                                data: []
                            }, {
                                type: 'line',
                                name: '轴5速度',
                                data: []
                            }, {
                                type: 'line',
                                name: '轴6速度',
                                data: []
                            }
                        ]
                    };
                    var echartSpeedEle = $('.echart_speed');
                    echartSpeedObj = echarts.init(echartSpeedEle[0]);
                    echartSpeedObj.setOption(speedOptions);
                },
                bindEvent: function () {
                    $(window).resize(function () {
                        ctrl.autoWidth();
                        echartPositionObj.resize();
                        echartSpeedObj.resize();
                    });

                    $('#obj_input').change(function () {
                        var val = $(this).val();
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
                initRobot: function () {
                    var files = [{
                        filename: 'base.ctm',
                        option: {
                            color: '#209698'
                        }
                    }, {
                        filename: '1.ctm',
                        offset: {
                            // x: -0.02807769924402237,
                            x: 0,
                            y: -0.3215549662709236,
                            // z: 0.015155453234910965
                            z: 0
                        },
                        option: {
                            color: '#209698'
                        }
                    }, {
                        filename: '2.ctm',
                        offset: {
                            x: -0.10081632807850838,
                            // y: -0.4739062339067459,
                            y: -0.34,
                            z: -0.14231079816818237
                        },
                        option: {
                            color: '#209698'
                        }
                    }, {
                        filename: '3.ctm',
                        offset: {
                            // x: -0.06520088389515877,
                            x: -0.098,
                            // y: -0.6902840733528137,
                            y: -0.64,
                            // z: 0.006645377725362778
                            z: 0.0066
                        },
                        option: {
                            color: '#209698'
                        }
                    }, {
                        filename: '4.ctm',
                        offset: 'center',
                        option: {
                            color: '#209698'
                        }
                    }, {
                        filename: '5.ctm',
                        offset: {
                            // x: -0.42299380898475647,
                            x: -0.41,
                            y: -0.7443690299987793,
                            z: -0.00025436654686927795
                        },
                        option: {
                            color: '#209698'
                        }
                    }, {
                        filename: '6.ctm',
                        offset: 'center',
                        option: {
                            color: '#209698'
                        }
                    }];

                    ctrl.loadCtmFileAsyc(files, parentObject, function (file, object, mesh) {
                        if (file.filename === '1.ctm') {
                            object.control = 'y';
                            object.position.x = 0;
                            object.position.y = 0.29;
                            object.position.z = 0;
                            object.type = 'rotation';
                        } else if (file.filename === '2.ctm') {
                            object.control = 'z';
                            object.position.x = 0.1;
                            object.position.y = 0.02;
                            object.position.z = 0.14;
                            object.type = 'rotation';
                        } else if (file.filename === '3.ctm') {
                            object.control = 'z';
                            object.position.x = 0;
                            object.position.y = 0.3;
                            object.position.z = -0.145;
                            object.type = 'rotation';
                        } else if (file.filename === '4.ctm') {
                            object.control = 'x';
                            object.position.x = 0.24;
                            object.position.y = 0.11;
                            object.position.z = 0;
                            object.type = 'rotation';
                        } else if (file.filename === '5.ctm') {
                            object.control = 'z';
                            object.position.x = 0.08;
                            object.position.y = 0;
                            object.position.z = 0;
                            object.type = 'rotation';
                        } else if (file.filename === '6.ctm') {
                            object.control = 'x';
                            object.position.x = 0.08;
                            object.position.y = 0;
                            object.position.z = -0.003;
                            object.type = 'rotation';
                        }
                        objMap[file.filename] = object;
                    });
                },
                autoWidth: function () {
                    renderWidth = $('#a728_webgl_box').width();

                    renderHeight = $('#a728_webgl_box').height();

                    if (camera) {
                        camera.aspect = renderWidth / renderHeight;
                        camera.updateProjectionMatrix();
                    }
                    if (renderer) {
                        renderer.setSize(renderWidth, renderHeight);
                    }
                    var winheight = $(window).height();
                    var leftHeight = winheight - 200;
                    $('.a728_left').height(winheight - 200);

                    var boxes = $('.vr_a728_box');
                    var leftWidth = $('.a728_left').width();
                    boxes.width((leftWidth - 20) / 4);
                    boxes.height(leftHeight - 495);

                    var stateBoxHeight = leftHeight - 525;
                    $('.vr_a728_state_box').height(stateBoxHeight);

                    var stateItemHeight = (stateBoxHeight - 40) / 4;
                    $('.vr_728_state_item_wrap').height(stateItemHeight);

                    var stateItemWidth = $('.vr_a728_state_box').width();
                    $('.vr_728_state_item_wrap').width((stateItemWidth - 10) / 4);
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
                    return cynovan.r_path + 'robot/vr_a728/resource/ctm/' + glfile+ '?v=' + cynovan.version;
                },
                initWebGL: function () {
                    container = document.getElementById('a728_webgl_box');
                    camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 1, 10000);
                    camera.position.set(0, 0, 150);

                    parentObject.scale.set(scale, scale, scale);
                    /*parentObject.position.x = 0.01;
                    parentObject.position.y = -22;
                    parentObject.position.z = -35;
                    parentObject.rotation.x = 0;*/
                    parentObject.position.x = 15;
                    parentObject.position.y = -58;
                    parentObject.rotation.y = 180 * OneDegree;

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
                    controls.zoomSpeed = 10;

                    scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444, 1.5));

                    var light = new THREE.DirectionalLight(0xffffff, 0.4);
                    light.position.set(3, 3, 3);
                    scene.add(light);

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
                            xxxx += 1;
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
                            xxxx -= 1;
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