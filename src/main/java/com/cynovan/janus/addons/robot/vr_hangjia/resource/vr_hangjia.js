define(['echarts', 'threejs'], function (echarts) {
    var app = angular.module('app');

    app.controller('VRHangJiaRobotController', ['$scope', '$timeout', 'AppComponent', 'dialog', 'AppDataService', 'websocket',
        function ($scope, $timeout, AppComponent, dialog, AppDataService, websocket) {
            var ctrl = this;

            var appName = 'robot';
            var renderWidth, renderHeight, container, camera, scene, controls, renderer, scale = 5;
            let objMap = {}, parentObject = new THREE.Object3D(), loader = new THREE.CTMLoader();
            let OneDegree = Math.PI / 180, timestamps = [];
            var xChart, zChart, cycle = 188;
            var AppConfig = {};

            var distance = {
                x: {
                    s: 0.53,
                    e: -4.88,
                    s1: -523,
                    e1: 4981
                },
                y: {
                    s: 3.46,
                    e: -0.65,
                    s1: 3314,
                    e1: -631
                },
                z: {
                    s: 0.19,
                    e: -0.83,
                    s1: 223,
                    e1: -873
                }
            };
            _.extend(ctrl, {
                initialize: function () {
                    ctrl.bindEvent();
                    ctrl.initData();
                    ctrl.autoWidth();
                    ctrl.initWebGL();
                    ctrl.initRobot();
                },
                initDeviceSelect: function () {
                    var uuid = _.get(AppConfig, 'uuid', '');
                    AppComponent.deviceselect($('#vrhangjia_bind_device_box'), {'robot.show': true}, uuid).progress(function (bind) {
                        _.set(AppConfig, 'uuid', bind.uuid);
                        _.set(AppConfig, 'deviceName', bind.deviceName);
                        ctrl.refreshData();
                    });
                },
                refreshData: function () {
                    AppDataService.set(appName, 'vr_hangjia', AppConfig);
                    dialog.notyWithRefresh('数据配置已完成,2秒后自动刷新页面运行', $scope);
                },
                initData: function () {
                    AppDataService.get(appName, 'vr_hangjia').success(function (result) {
                        if (_.isEmpty(result)) {
                            AppConfig = {
                                cycle: 188,
                                'gvl_XPosition': "gvl_XPosition",
                                'gvl_XVel': 'gvl_XVel',
                                'gvl_XLimitPositive': "gvl_XLimitPositive",
                                'gvl_XLimitNegative': 'gvl_XLimitNegative',
                                'gvl_Xstatus': 'gvl_Xstatus',
                                'gvl_YPosition': 'gvl_YPosition',
                                'gvl_YVel': "gvl_YVel",
                                'gvl_YLimitPositive': 'gvl_YLimitPositive',
                                'gvl_YLimitNegative': 'gvl_YLimitNegative',
                                'gvl_Ystatus': 'gvl_Ystatus',
                                'gvl_ZPosition': 'gvl_ZPosition',
                                'gvl_ZVel': 'gvl_ZVel',
                                'gvl_ZLimitPositive': 'gvl_ZLimitPositive',
                                'gvl_ZLimitNegative': 'gvl_ZLimitNegative',
                                'gvl_Zstatus': 'gvl_Zstatus',
                                'gvl_ZPosition': 'gvl_ZPosition',
                                'gvl_ZVel': 'gvl_ZVel',
                                'gvl_ZLimitPositive': 'gvl_ZLimitPositive',
                                'gvl_ZLimitNegative': 'gvl_ZLimitNegative',
                                'gvl_diancicongci': 'gvl_diancicongci',
                                'gvl_diancituici': "gvl_diancituici"
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
                    ctrl.updateData(data);
                },
                updateRobot: function (data) {
                    /*x轴的运动*/
                    var xValue = _.get(data, _.get(AppConfig, 'gvl_XPosition', ''), 0);
                    xValue = parseFloat(xValue);
                    if (_.isNaN(xValue)) {
                        xValue = 0;
                    }
                    var xTarget = ctrl.getAxisDiff('x', xValue);
                    var xObj = objMap['x'];
                    ctrl.setAnimate(xObj, xObj.control, xTarget, cycle, 'position');

                    /*Y轴的运动*/
                    var yValue = _.get(data, _.get(AppConfig, 'gvl_YPosition', ''), 0);
                    yValue = parseFloat(yValue);
                    if (_.isNaN(yValue)) {
                        yValue = 0;
                    }
                    var yTarget = ctrl.getAxisDiff('y', yValue);
                    var yObj = objMap['y'];
                    ctrl.setAnimate(yObj, yObj.control, yTarget, cycle, 'position');

                    /*Z轴的运动*/
                    var zValue = _.get(data, _.get(AppConfig, 'gvl_ZPosition', ''), 0);
                    zValue = parseFloat(zValue);
                    if (_.isNaN(zValue)) {
                        zValue = 0;
                    }
                    var zTarget = ctrl.getAxisDiff('z', zValue);
                    var zObject = objMap['z'];
                    ctrl.setAnimate(zObject, zObject.control, zTarget, cycle, 'position');
                },
                updateData: function (data) {
                    $('.hangjia_field_value').each(function () {
                        var ele = $(this);
                        var dataKey = ele.data('key');
                        if (dataKey) {
                            var value = _.get(data, _.get(AppConfig, dataKey, ''), 0);
                            ele.text(value);
                        }
                    });

                    $('.hangjia_field_state').each(function () {
                        var ele = $(this);
                        var dataKey = ele.data('key');

                        if (dataKey) {
                            var value = _.get(data, _.get(AppConfig, dataKey, ''), 0);
                            if (_.isString(value)) {
                                value = _.lowerCase(value);
                            }

                            if (value === true || value === 'true' || value === '1' || value === 1) {
                                value = true;
                            } else {
                                value = false;
                            }

                            if (value === true) {
                                ele.addClass('active');
                            } else {
                                ele.removeClass('active');
                            }
                        }
                    });
                },
                getAxisDiff: function (axis, value) {
                    var dis = _.get(distance, axis, {});
                    var model_dis = Math.abs(value - dis.s1);
                    var diff = ((dis.s - dis.e) * (model_dis / (dis.e1 - dis.s1)));
                    diff = Math.abs(diff);
                    diff = dis.s - diff;
                    return diff;
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
                        template: 'vr_robot_hangjia_config_template',
                        width: 1200,
                        data: {
                            entity: AppConfig
                        },
                        controller: ['$scope', function (dialogScope) {
                            dialogScope.$on('success', function () {
                                AppDataService.set(appName, 'vr_hangjia', AppConfig);
                                dialog.notyWithRefresh('数据配置已完成,2秒后自动刷新页面运行', $scope);
                            });
                        }]
                    });
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
                        filename: 'zhengti.ctm',
                        option: {
                            color: "#C8C8C8"
                        }
                    }, {
                        filename: 'qi_gui.ctm',
                        option: {
                            color: '#C8C8C8'
                        }
                    }, {
                        filename: 'dian_qi_gui.ctm',
                        option: {
                            color: '#C8C8C8'
                        }
                    }, {
                        filename: 'diban.ctm',
                        option: {
                            color: '#474747'
                        }
                    }, {
                        filename: 'qiege_1.ctm',
                        option: {
                            color: "#C8C8C8"
                        }
                    }, {
                        filename: 'qiege_2.ctm',
                        option: {
                            color: "#C8C8C8"
                        }
                    }, {
                        filename: 'xian_shi_gui.ctm',
                        option: {
                            color: "#C8C8C8"
                        }
                    }];
                    _.each(files, function (file) {
                        ctrl.loadCtmFile(file).done(function (mesh, param) {
                            parentObject.add(mesh);
                        });
                    });


                    var moveFiles = [{
                        option: {
                            color: '#808080'
                        },
                        filename: 'x_daogui.ctm'
                    }, {
                        option: {
                            color: '#808080'
                        },
                        filename: 'y_daogui.ctm'
                    }, {
                        option: {
                            color: '#808080'
                        },
                        filename: 'z_daogui.ctm',
                        option: {
                            color: '#808080'
                        }
                    }, {
                        filename: 'shou_zhua1.ctm',
                        option: {
                            color: '#EBFF23'
                        }
                    }, {
                        filename: 'shouzhua4.ctm',
                        option: {
                            color: '#EBFF23'
                        }
                    }, {
                        filename: 'shouzhua_2.ctm',
                        option: {
                            color: '#EBFF23'
                        }
                    }, {
                        filename: 'shouzhua_3.ctm',
                        option: {
                            color: '#EBFF23'
                        }
                    }];

                    ctrl.loadCtmFileAsyc(moveFiles, parentObject, function (file, object, mesh) {
                        if (file.filename === 'x_daogui.ctm') {
                            mesh.control = 'x';
                            objMap['x'] = mesh;
                        } else {
                            if (file.filename === 'y_daogui.ctm') {
                                object.control = 'z';
                                object.position.x = 0.1;
                                objMap['y'] = object;
                            } else if (file.filename === 'z_daogui.ctm') {
                                object.control = 'y';
                                object.position.x = -0.1;
                                object.position.z = -0.03;
                                objMap['z'] = object;
                            }
                        }
                    });
                },
                autoWidth: function () {
                    renderWidth = $('#hangjia_webgl_box').width();
                    renderHeight = $(window).height() - 200;

                    if (camera) {
                        camera.aspect = renderWidth / renderHeight;
                        camera.updateProjectionMatrix();
                    }
                    if (renderer) {
                        renderer.setSize(renderWidth, renderHeight);
                    }
                    $('.hangjia_left').height(renderHeight - 10);
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
                    return cynovan.r_path + 'robot/vr_hangjia/resource/ctm/' + glfile + '?v=' + cynovan.version;
                },
                initWebGL: function () {
                    container = document.getElementById('hangjia_webgl_box');
                    camera = new THREE.PerspectiveCamera(40, renderWidth / renderHeight, 1, 10000);
                    camera.position.x = 42;
                    camera.position.y = 30;

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
                    controls.enableDamping = false
                    controls.enableZoom = true;
                    controls.enableRoute = true;
                    controls.zoomSpeed = 10;

                    scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444, 2.5));

                    var light = new THREE.DirectionalLight(0xffffff, 1);
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
