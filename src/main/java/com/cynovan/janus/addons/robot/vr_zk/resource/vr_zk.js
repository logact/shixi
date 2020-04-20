define(['echarts', 'threejs'], function (echarts) {
    var app = angular.module('app');

    app.controller('RobotVRZKController', ['$scope', '$timeout', 'AppComponent', 'dialog', 'AppDataService', 'websocket',
        function ($scope, $timeout, AppComponent, dialog, AppDataService, websocket) {
            var ctrl = this;

            var appName = 'robot';
            var renderWidth, renderHeight, container, camera, scene, controls, renderer, scale = 20;
            let objMap = {}, parentObject = new THREE.Object3D(), loader = new THREE.CTMLoader();
            let OneDegree = Math.PI / 180, timestamps = [];
            var echartPositionObj, echartSpeedObj, cycle = 188;
            var AppConfig = {};
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

            var meshCenterMap = {};
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
                    AppComponent.deviceselect($('#vrzk_bind_device_box'), {'robot.show': true}, uuid).progress(function (bind) {
                        _.set(AppConfig, 'uuid', bind.uuid);
                        _.set(AppConfig, 'deviceName', bind.deviceName);
                        ctrl.refreshData();
                    });
                },
                refreshData: function () {
                    AppDataService.set(appName, 'vr_zk', AppConfig);
                    dialog.notyWithRefresh('数据配置已完成,2秒后自动刷新页面运行', $scope);
                },
                initData: function () {
                    AppDataService.get(appName, 'vr_zk').success(function (result) {
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
                                cycle: 188
                            };
                        } else {
                            AppConfig = result;
                            cycle = _.parseInt(_.get(AppConfig, 'cycle', 188));
                        }
                        ctrl.initDeviceSelect();
                        ctrl.subscribeData();
                    });
                },
                subscribeData: function () {
                    var uuid = _.get(AppConfig, 'uuid', '');
                    if (!uuid) {
                        dialog.noty('请选择设备运行');
                        return false;
                    }
                    websocket.sub({
                        topic: 'deviceData/' + uuid,
                        scope: $scope,
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
                    $('span.data_value').each(function () {
                        var ele = $(this);
                        var valueKey = ele.data('key');
                        if (valueKey) {
                            var value = _.get(data, _.get(AppConfig, valueKey, ''), '');
                            if (!_.isUndefined(value)) {
                                ele.text(value);
                            }
                        }
                    });

                    $('span.item_state').each(function () {
                        var ele = $(this);
                        var valueKey = ele.data('key');
                        if (valueKey) {
                            var value = _.get(data, _.get(AppConfig, valueKey, ''), '');
                            value = _.toLower(value);
                            if (value === 'false' || !value) {
                                ele.removeClass('active');
                            } else {
                                ele.addClass('active');
                            }
                        }
                    });
                },
                updateRobot: function (data) {
                    var valueDatas = [];
                    _.times(6, function (index) {
                        var fieldIdx = index + 1;
                        var object = objMap[`${fieldIdx + 1}.ctm`];

                        var value = _.get(data, _.get(AppConfig, 'axis' + fieldIdx + '_posi', ''), 0);
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
                        if (fieldIdx === 1 || fieldIdx === 6) {
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
                        template: 'vr_robot_zk_config_template',
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
                                AppDataService.set(appName, 'vr_zk', AppConfig);
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
                        legend: {
                            data: ['轴1位置', '轴2位置', '轴3位置', '轴4位置', '轴5位置', '轴6位置']
                        },
                        tooltip: {
                            trigger: 'axis'
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
                        tooltip: {
                            trigger: 'axis'
                        },
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
                        filename: '1.ctm',
                        option: {
                            color: '#954A2B'
                        }
                    }, {
                        filename: '2.ctm',
                        option: {
                            color: '#954A2B'
                        },
                        offset: {
                            x: -0.6595239341259003,
                            y: -0.007650021910667420085,
                            z: 0.001
                        }
                    }, {
                        filename: '3.ctm',
                        option: {
                            color: '#954A2B'
                        },
                        offset: {
                            x: -0.74,
                            y: -0.21497118473052979,
                            z: -0.091
                        }
                    }, {
                        filename: '4.ctm',
                        option: {
                            color: '#954A2B'
                        },
                        offset: {
                            x: -1.32,
                            y: 0.012097030878067017,
                            z: -0.099
                        }
                    }, {
                        filename: '5.ctm',
                        option: {
                            color: '#954A2B'
                        },
                        offset: {
                            x: -1.4987232685089111,
                            y: -0.029374241828918457,
                            z: -0.5981036722660065
                        }
                    }, {
                        filename: '6.ctm',
                        option: {
                            color: '#954A2B'
                        },
                        offset: {
                            x: -1.4962903261184692,
                            y: -0.024450138211250305,
                            z: -0.77
                        }
                    }, {
                        filename: '7.ctm',
                        option: {
                            color: '#954A2B'
                        },
                        offset: {
                            x: -1.493,
                            y: -0.05072762444615364,
                            z: -1.0928997695446014
                        }
                    }]

                    ctrl.loadCtmFileAsyc(files, parentObject,
                        function (file, object, mesh) {
                            if (file.filename === '2.ctm') {
                                object.position.x = 0.65;
                                object.position.y = 0;
                                object.position.z = 0;
                                object.control = 'x';
                            } else if (file.filename === '3.ctm') {
                                object.position.x = 0.07999999;
                                object.position.y = 0.25;
                                object.position.z = 0.08;
                                object.control = 'y';
                            } else if (file.filename === '4.ctm') {
                                object.position.x = 0.58;
                                object.position.y = -0.24;
                                object.position.z = 0;
                                object.control = 'y';
                            } else if (file.filename === '5.ctm') {
                                object.position.x = 0.18;
                                object.position.y = 0.04;
                                object.position.z = 0.52;
                                object.control = 'z';
                            } else if (file.filename === '6.ctm') {
                                object.position.y = 0;
                                object.position.z = 0.163;
                                object.control = 'y';
                            } else if (file.filename === '7.ctm') {
                                object.position.x = 0;
                                object.position.y = 0.02;
                                object.position.z = 0.32;
                                object.control = 'z';
                            }
                            objMap[file.filename] = object;
                        });
                },
                autoWidth: function () {
                    renderWidth = $('#zk_webgl_box').width();
                    renderHeight = $(window).height() - 200;

                    if (camera) {
                        camera.aspect = renderWidth / renderHeight;
                        camera.updateProjectionMatrix();
                    }
                    if (renderer) {
                        renderer.setSize(renderWidth, renderHeight);
                    }
                    $('.zk_left').height(renderHeight - 10);
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
                                meshCenterMap[params.filename] = offset;
                            }
                        }

                        var mesh = new THREE.Mesh(geometry, material);
                        if (params.beforeCreate && _.isFunction(params.beforeCreate)) {
                            params.beforeCreate.call(null, geometry, mesh);
                        }
                        deferred.resolve(mesh, params);
                    });
                    return deferred;
                },
                loadCtmFileAsyc: function (files, parentObject, callback, first) {
                    if (files.length) {
                        var file = files.shift();

                        ctrl.loadCtmFile(file).done(function (mesh) {
                            parentObject.add(mesh);
                            if (file.helper === true) {
                            }
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
                    return cynovan.r_path + 'robot/vr_zk/resource/ctm/' + glfile + '?v=' + cynovan.version;
                },
                initWebGL: function () {
                    container = document.getElementById('zk_webgl_box');
                    camera = new THREE.PerspectiveCamera(30, renderWidth / renderHeight, 1, 10000);
                    camera.position.x = 85;
                    camera.position.y = -135;
                    camera.position.z = 0;

                    parentObject.position.y = -25;
                    parentObject.position.z = -10;

                    parentObject.scale.set(scale, scale, scale);

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
                    controls.enableDamping = false;
                    controls.enableZoom = true;
                    controls.enableRotate = true;
                    controls.zoomSpeed = 6;

                    scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444, 1.5));

                    var light = new THREE.DirectionalLight(0xffffff, 0.4);
                    light.position.set(3, 3, 3);
                    scene.add(light);

                    objMap['parentObject'] = parentObject;
                    scene.add(parentObject);

                    objMap['camera'] = camera;

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
                },
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