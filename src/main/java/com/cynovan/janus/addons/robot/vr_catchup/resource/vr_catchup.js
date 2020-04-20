define(['echarts', 'threejs'], function (echarts) {
    var app = angular.module('app');

    app.controller('RobotVRCatchUpController', ['$scope', '$timeout', 'AppComponent', 'dialog', 'AppDataService', 'websocket',
        function ($scope, $timeout, AppComponent, dialog, AppDataService, websocket) {
            var ctrl = this;

            var appName = 'robot';
            var renderWidth, renderHeight, container, camera, scene, controls, renderer, scale = 60;
            let objMap = {}, parentObject = new THREE.Object3D(), loader = new THREE.CTMLoader();
            let OneDegree = Math.PI / 180, timestamps = [];
            var xChart, zChart, cycle = 188;
            var AppConfig = {};

            var usedGongJianIndex = [];
            var lastGongjianFlag = false;
            var lastXipanFlag = false;
            var lastQigangFlag = false;
            var xData = [],
                zData = [];

            var distance = {
                x: {
                    s: 0.39,
                    e: -0.5,
                    s1: 200,
                    e1: -290
                },
                z: {
                    s: 0.18,
                    e: -0.14,
                    s1: -60,
                    e1: 60
                }
            };
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
                    AppComponent.deviceselect($('#vrcatchup_bind_device_box'), {'robot.show': true}, uuid).progress(function (bind) {
                        _.set(AppConfig, 'uuid', bind.uuid);
                        _.set(AppConfig, 'deviceName', bind.deviceName);
                        ctrl.refreshData();
                    });
                },
                refreshData: function () {
                    AppDataService.set(appName, 'vr_catchup', AppConfig);
                    dialog.notyWithRefresh('数据配置已完成,2秒后自动刷新页面运行', $scope);
                },
                initData: function () {
                    AppDataService.get(appName, 'vr_catchup').success(function (result) {
                        if (_.isEmpty(result)) {
                            AppConfig = {
                                tsstart: 'tsstart',
                                axis1_posi: 'gdVisuPos_x',
                                axis2_posi: 'gdVisuPos_z',
                                cycle: 188,
                                gongjian_time: 200
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
                    ctrl.updateGongjian(data);
                },
                updateGongjian: function (data) {
                    var tsstart = _.get(data, _.get(AppConfig, 'tsstart', ''), false);
                    tsstart = _.lowerCase(tsstart);
                    if (tsstart === '0' || tsstart === 'false' || tsstart === false) {
                        tsstart = false;
                    } else {
                        tsstart = true;
                    }

                    if (lastGongjianFlag !== tsstart && tsstart === true) {
                        /*放下一个工件*/
                        var notUsedIdx;
                        for (let i = 1; i < 11; i++) {
                            var findIdx = _.indexOf(usedGongJianIndex, i);
                            if (findIdx === -1) {
                                notUsedIdx = i;
                                break;
                            }
                        }
                        usedGongJianIndex.push(notUsedIdx);
                        var obj = objMap['gongjian_' + notUsedIdx];

                        var time = _.get(AppConfig, 'gongjian_time', 200);
                        time = parseInt(time);
                        if (_.isNaN(time)) {
                            time = 200;
                        }
                        obj.position.x = 0.04;
                        obj.visible = true;
                        ctrl.setAnimate(obj, 'x', 0.55, time, 'position');
                    }
                    lastGongjianFlag = tsstart;

                    var xipan = _.get(data, _.get(AppConfig, 'xipan', ''), false);
                    xipan = _.lowerCase(xipan);
                    if (xipan === '0' || xipan === 'false' || xipan === false) {
                        xipan = false;
                    } else {
                        xipan = true;
                    }

                    objMap['xipan_gongjian'].visible = xipan;

                    if (lastXipanFlag !== xipan && xipan === true) {
                        /*隐藏滑动中的工件*/
                        var idx = usedGongJianIndex.shift();
                        if (idx) {
                            var gongjian = objMap['gongjian_' + idx];
                            gongjian.visible = false;
                            gongjian.position.x = 0.04;
                        }
                    }
                    lastXipanFlag = xipan;

                    var qigang = _.get(data, _.get(AppConfig, 'qigang', ''), false);
                    qigang = _.lowerCase(qigang);
                    if (qigang === '0' || qigang === 'false' || qigang === false) {
                        qigang = false;
                    } else {
                        qigang = true;
                    }

                    if (lastQigangFlag !== qigang) {
                        if (qigang === true) {
                            ctrl.setAnimate(objMap['y'], 'z', -0.08, 300, 'position');
                        } else {
                            ctrl.setAnimate(objMap['y'], 'z', 0, 300, 'position');
                        }
                    }
                    lastQigangFlag = qigang;
                },
                updateRobot: function (data) {
                    /*x轴的运动*/
                    var xValue = _.get(data, _.get(AppConfig, 'axis1_posi', ''), 0);
                    zValue = parseFloat(xValue);
                    if (_.isNaN(xValue)) {
                        zValue = 0;
                    }
                    var target = ctrl.getAxisDiff('x', xValue);
                    var xObj = objMap['x'];
                    ctrl.setAnimate(xObj, xObj.control, target, cycle, 'position');

                    /*Z轴的运行*/
                    var zValue = _.get(data, _.get(AppConfig, 'axis2_posi', ''), 0);
                    zValue = parseFloat(zValue);
                    if (_.isNaN(zValue)) {
                        zValue = 0;
                    }
                    var target = ctrl.getAxisDiff('z', zValue);
                    var zObj = objMap['z'];
                    ctrl.setAnimate(zObj, zObj.control, target, cycle, 'position');

                    if (xData.length > 50) {
                        xData.shift();
                    }

                    if (zData.length > 50) {
                        zData.shift();
                    }

                    xData.push(xValue);
                    zData.push(zValue);
                },
                getAxisDiff: function (axis, value) {
                    var dis = _.get(distance, axis, {});
                    var model_dis = Math.abs(value - dis.s1);
                    var diff = ((dis.s - dis.e) * (model_dis / (dis.e1 - dis.s1)));
                    diff = Math.abs(diff);
                    diff = dis.s - diff;
                    return diff;
                },
                updateChart: function (data) {
                    if (xChart) {
                        var posiOpts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: xData
                                }
                            ]
                        };
                        xChart.setOption(posiOpts);
                    }

                    if (zChart) {
                        var speedOpts = {
                            xAxis: [
                                {
                                    data: timestamps
                                }
                            ],
                            series: [
                                {
                                    data: zData
                                }
                            ]
                        };
                        zChart.setOption(speedOpts);
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
                        template: 'vr_robot_catchup_config_template',
                        width: 1200,
                        data: {
                            entity: AppConfig
                        },
                        controller: ['$scope', function (dialogScope) {
                            dialogScope.$on('success', function () {
                                AppDataService.set(appName, 'vr_catchup', AppConfig);
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
                            data: ['X轴位置']
                        },
                        tooltip: {
                            trigger: 'axis'
                        },
                        yAxis: [
                            {
                                type: 'value',
                                name: '轴位置'
                            }
                        ],
                        series: [
                            {
                                type: 'line',
                                name: 'X轴位置',
                                data: []
                            }
                        ]
                    };
                    var echartPositionEle = $('.echart_position');
                    xChart = echarts.init(echartPositionEle[0]);
                    xChart.setOption(positionOptions);

                    var speedOptions = {
                        xAxis: [
                            {
                                type: 'category',
                                data: timestamps
                            }
                        ],
                        legend: {
                            data: ['Z轴位置']
                        },
                        yAxis: [
                            {
                                type: 'value',
                                name: '轴位置'
                            }
                        ],
                        series: [
                            {
                                type: 'line',
                                name: 'Z轴位置',
                                data: []
                            }
                        ]
                    };
                    var echartSpeedEle = $('.echart_speed');
                    zChart = echarts.init(echartSpeedEle[0]);
                    zChart.setOption(speedOptions);
                },
                bindEvent: function () {
                    $(window).resize(function () {
                        ctrl.autoWidth();
                        zChart.resize();
                        xChart.resize();
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
                        filename: 'dizuo.ctm',
                        option: {
                            color: '#fff'
                        }
                    }, {
                        filename: 'pidai.ctm',
                        option: {
                            color: '#356941'
                        }
                    }, {
                        filename: 'sensor.ctm',
                        option: {
                            color: '#514E48'
                        }
                    }];
                    _.each(files, function (file) {
                        ctrl.loadCtmFile(file).done(function (mesh, param) {
                            parentObject.add(mesh);
                        });
                    });

                    var zhuangpeiFiles = [{
                        filename: 'x1.ctm',
                        option: {
                            color: '#fff'
                        }
                    }, {
                        filename: 'x2.ctm'
                    }, {
                        filename: 'z1.ctm'
                    }, {
                        filename: 'z2.ctm'
                    }, {
                        filename: 'y.ctm',
                        option: {
                            color: '#fff'
                        }
                    }, {
                        filename: 'xipan.ctm',
                        option: {
                            color: '#fff'
                        }
                    }, {
                        filename: 'gongjian.ctm',
                        option: {
                            color: 'red'
                        }
                    }];

                    ctrl.loadCtmFileAsyc(zhuangpeiFiles, parentObject, function (file, object, mesh) {
                        if (file.filename === 'x1.ctm') {
                            mesh.control = 'x';
                            objMap['x'] = mesh;
                        } else {
                            if (file.filename === 'z1.ctm') {
                                object.control = 'y';
                                objMap['z'] = object;
                            } else if (file.filename === 'gongjian.ctm') {
                                object.position.x = 0.31;
                                object.position.y = 0.1;
                                object.position.z = -0.01;
                                object.visible = false;
                                objMap['xipan_gongjian'] = object;
                            } else if (file.filename === 'y.ctm') {
                                object.control = 'z';
                                objMap['y'] = object;
                            }
                        }
                    });

                    var gongjian = {
                        filename: 'gongjian.ctm',
                        option: {
                            color: 'red'
                        }
                    };

                    _.times(10, function (idx) {
                        ctrl.loadCtmFile(gongjian).done(function (mesh, param) {
                            parentObject.add(mesh);
                            mesh.position.x = 0.04;
                            mesh.position.z = -0.01;
                            mesh.visible = false;
                            objMap[`gongjian_${idx + 1}`] = mesh;
                        });
                    });
                },
                autoWidth: function () {
                    renderWidth = $('#catchup_webgl_box').width();
                    renderHeight = $(window).height() - 200;

                    if (camera) {
                        camera.aspect = renderWidth / renderHeight;
                        camera.updateProjectionMatrix();
                    }
                    if (renderer) {
                        renderer.setSize(renderWidth, renderHeight);
                    }
                    $('.catchup_left').height(renderHeight - 10);
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
                    return cynovan.r_path + 'robot/vr_catchup/resource/ctm/' + glfile + '?v=' + cynovan.version;
                },
                initWebGL: function () {
                    container = document.getElementById('catchup_webgl_box');
                    camera = new THREE.PerspectiveCamera(30, renderWidth / renderHeight, 1, 10000);
                    camera.position.x = 45;
                    camera.position.y = 110;
                    camera.position.z = -240;

                    parentObject.scale.set(scale, scale, scale);

                    parentObject.position.x = -10;
                    parentObject.position.y = 65;
                    parentObject.position.z = 5;

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
                },
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
            });
            $timeout(function () {
                ctrl.initialize();
            }, 300);
        }]);
});