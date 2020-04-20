define(['echarts', 'threejs'], function (echarts) {
    var app = angular.module('app');

    app.controller('VRZhuangBeiDaoRobotController', ['$scope', '$timeout', 'AppComponent', 'dialog', 'AppDataService', 'websocket',
        function ($scope, $timeout, AppComponent, dialog, AppDataService, websocket) {
            var ctrl = this;

            var appName = 'robot';
            var renderWidth, renderHeight, container, camera, scene, controls, renderer, scale = 1.5;
            let objMap = {}, parentObject = new THREE.Object3D(), loader = new THREE.CTMLoader();
            let OneDegree = Math.PI / 180, timestamps = [];
            var cycle = 188;
            var AppConfig = {};
            var current = 0, totalsize = 0, hiddenEevent = false;

            var anticlockwiseAxis = ['4-2', '4-3', '4-5', '4-6', '5-2', '5-3', '5-5', '5-6'];

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.calcProgress(46);
                    ctrl.bindEvent();
                    ctrl.initData();
                    ctrl.autoWidth();
                    ctrl.initWebGL();
                    ctrl.initScene();
                    ctrl.initRobot(1);
                    ctrl.initRobot(2);
                    ctrl.initRobot(3);
                    ctrl.initRobot2(4);
                    ctrl.initRobot2(5);
                },
                calcProgress: function (tt) {
                    totalsize = tt;

                    /*create the layer div*/
                    var layer = $('<div class="device_box_layer"></div>');
                    var height = $(window).height();
                    var width = $(window).width();
                    layer.css({
                        width: width + 'px',
                        height: height + 'px'
                    });
                    var element = $('<div class="cc_box"><div class="pp_box"><div class="pp_value"></div></div></div>');
                    $('body').append(layer);
                    $('body').append(element);
                    ctrl.setProgress();
                },
                setProgress: function () {
                    var element = $('.cc_box');
                    var percent = (current / totalsize) * 100;
                    if (percent > 100) {
                        percent = 100;
                    }
                    element.find('.pp_value').css({
                        'width': percent + '%'
                    });

                    if (percent === 100 && !hiddenEevent) {
                        hiddenEevent = true;
                        setTimeout(function () {
                            $('.cc_box').hide().remove();
                            $('.device_box_layer').hide().remove();

                            ctrl.subscribeData();
                        }, 3000);
                    }
                },
                initDeviceSelect: function () {
                    _.times(5, function (idx) {
                        idx = idx + 1;

                        var uuid = _.get(AppConfig, `uuid${idx}`, '');
                        AppComponent.deviceselect($(`#vrzhuangbeidao_bind_device_box${idx}`), {'robot.show': true}, uuid).progress(function (bind) {
                            _.set(AppConfig, `uuid${idx}`, bind.uuid);
                            _.set(AppConfig, 'deviceName${idx}', bind.deviceName);
                            ctrl.refreshData();
                        });
                    })
                },
                refreshData: _.debounce(function () {
                    AppDataService.set(appName, 'vr_zhuangbeidao', AppConfig);
                    dialog.notyWithRefresh('数据配置已完成,2秒后自动刷新页面运行', $scope);
                }, 300),
                initData: function () {
                    AppDataService.get(appName, 'vr_zhuangbeidao').success(function (result) {
                        if (_.isEmpty(result)) {
                            AppConfig = {
                                cycle: 188,
                                robot1_posi1: '003_Axis1ProfilePosition',
                                robot1_posi2: '004_Axis2ProfilePosition',
                                robot1_posi3: '005_Axis3ProfilePosition',
                                robot1_posi4: '006_Axis4ProfilePosition',
                                robot1_posi5: '007_Axis5ProfilePosition',
                                robot1_posi6: '008_Axis6ProfilePosition',
                                robot1_posi1_direc: '1',
                                robot1_posi2_direc: '1',
                                robot1_posi3_direc: '1',
                                robot1_posi4_direc: '1',
                                robot1_posi5_direc: '1',
                                robot1_posi6_direc: '1',
                                robot2_posi1: '003_Axis1ProfilePosition',
                                robot2_posi2: '004_Axis2ProfilePosition',
                                robot2_posi3: '005_Axis3ProfilePosition',
                                robot2_posi4: '006_Axis4ProfilePosition',
                                robot2_posi5: '007_Axis5ProfilePosition',
                                robot2_posi6: '008_Axis6ProfilePosition',
                                robot2_posi1_direc: '1',
                                robot2_posi2_direc: '1',
                                robot2_posi3_direc: '1',
                                robot2_posi4_direc: '1',
                                robot2_posi5_direc: '1',
                                robot2_posi6_direc: '1',
                                robot3_posi1: '003_Axis1ProfilePosition',
                                robot3_posi2: '004_Axis2ProfilePosition',
                                robot3_posi3: '005_Axis3ProfilePosition',
                                robot3_posi4: '006_Axis4ProfilePosition',
                                robot3_posi5: '007_Axis5ProfilePosition',
                                robot3_posi6: '008_Axis6ProfilePosition',
                                robot3_posi1_direc: '1',
                                robot3_posi2_direc: '1',
                                robot3_posi3_direc: '1',
                                robot3_posi4_direc: '1',
                                robot3_posi5_direc: '1',
                                robot3_posi6_direc: '1',
                                robot4_posi1: '003_Axis1ProfilePosition',
                                robot4_posi2: '004_Axis2ProfilePosition',
                                robot4_posi3: '005_Axis3ProfilePosition',
                                robot4_posi4: '006_Axis4ProfilePosition',
                                robot4_posi5: '007_Axis5ProfilePosition',
                                robot4_posi6: '008_Axis6ProfilePosition',
                                robot4_posi1_direc: '1',
                                robot4_posi2_direc: '1',
                                robot4_posi3_direc: '1',
                                robot4_posi4_direc: '1',
                                robot4_posi5_direc: '1',
                                robot4_posi6_direc: '1',
                                robot5_posi1: '003_Axis1ProfilePosition',
                                robot5_posi2: '004_Axis2ProfilePosition',
                                robot5_posi3: '005_Axis3ProfilePosition',
                                robot5_posi4: '006_Axis4ProfilePosition',
                                robot5_posi5: '007_Axis5ProfilePosition',
                                robot5_posi6: '008_Axis6ProfilePosition',
                                robot5_posi1_direc: '1',
                                robot5_posi2_direc: '1',
                                robot5_posi3_direc: '1',
                                robot5_posi4_direc: '1',
                                robot5_posi5_direc: '1',
                                robot5_posi6_direc: '1',
                            };
                        } else {
                            AppConfig = result;
                            cycle = _.parseInt(_.get(AppConfig, 'cycle', 188));
                        }
                        ctrl.initDeviceSelect();
                    });
                },
                subscribeData: function () {
                    var uuid1 = _.get(AppConfig, `uuid1`, '');
                    var uuid2 = _.get(AppConfig, `uuid2`, '');
                    var uuid3 = _.get(AppConfig, `uuid3`, '');
                    var uuid4 = _.get(AppConfig, `uuid4`, '');
                    var uuid5 = _.get(AppConfig, `uuid5`, '');

                    if (uuid1) {
                        websocket.sub({
                            topic: 'deviceData/' + uuid1,
                            scope: $scope,
                            onmessage: function (data) {
                                var deviceData = _.get(data, 'data', {});
                                ctrl.onData(deviceData, 1);
                            }
                        });
                    }

                    if (uuid2) {
                        websocket.sub({
                            topic: 'deviceData/' + uuid2,
                            scope: $scope,
                            onmessage: function (data) {
                                var deviceData = _.get(data, 'data', {});
                                ctrl.onData(deviceData, 2);
                            }
                        });
                    }

                    if (uuid3) {
                        websocket.sub({
                            topic: 'deviceData/' + uuid3,
                            scope: $scope,
                            onmessage: function (data) {
                                var deviceData = _.get(data, 'data', {});
                                ctrl.onData(deviceData, 3);
                            }
                        });
                    }

                    if (uuid4) {
                        websocket.sub({
                            topic: 'deviceData/' + uuid4,
                            scope: $scope,
                            onmessage: function (data) {
                                var deviceData = _.get(data, 'data', {});
                                ctrl.onData(deviceData, 4);
                            }
                        });
                    }

                    if (uuid5) {
                        websocket.sub({
                            topic: 'deviceData/' + uuid5,
                            scope: $scope,
                            onmessage: function (data) {
                                var deviceData = _.get(data, 'data', {});
                                ctrl.onData(deviceData, 5);
                            }
                        });
                    }
                },
                onData: function (data, idx) {
                    _.times(6, function (axisIdx) {
                        axisIdx = axisIdx + 1;

                        var mesh = objMap[`${idx}-${axisIdx}`];
                        if (mesh) {
                            var value = _.get(data, _.get(AppConfig, `robot${idx}_posi${axisIdx}`, ''), 0);
                            value = parseFloat(value);
                            if (_.isNaN(value)) {
                                value = 0;
                            }

                            var axis = `${idx}-${axisIdx}`;

                            var currentPosition = value * OneDegree;
                            var diff = 0;
                            var direc = _.get(AppConfig, `robot${idx}_posi${axisIdx}_direc`, '1');
                            var front = true;
                            if (anticlockwiseAxis.indexOf(axis) !== -1) {
                                front = false;
                            }
                            currentPosition = ctrl.getAxisDirecPosition(currentPosition, direc, front);
                            var diff = 0;
                            /*4和5机器人5轴默认旋转180度*/
                            if (axis === '4-5' || axis === '5-5') {
                                diff = 180 * OneDegree;
                            }
                            diff += currentPosition;
                            ctrl.setAnimate(mesh, mesh.control, diff, cycle);
                        }
                    });
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
                        template: 'vr_robot_zhuangbeidao_config_template',
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
                                AppDataService.set(appName, 'vr_zhuangbeidao', AppConfig);
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
                initScene: function () {
                    var files = [{
                        filename: 'others/diban.ctm',
                        option: {
                            color: '#76BD96'
                        }
                    }, {
                        filename: 'others/shebei.ctm',
                        option: {
                            color: '#5E3800'
                        }
                    }, {
                        filename: 'others/zhandongpan.ctm',
                        option: {
                            color: '#003E32'
                        }
                    }, {
                        filename: 'others/zhangti.ctm',
                        option: {
                            color: '#808080'
                        }
                    }, {
                        filename: 'others/zhuoban.ctm',
                        option: {
                            color: "#01A4BD"
                        }
                    }, {
                        filename: 'others/zujian.ctm',
                        option: {
                            color: '#474747'
                        }
                    }];

                    _.each(files, function (file) {
                        ctrl.loadCtmFile(file).done(function (mesh, param) {
                            parentObject.add(mesh);
                        });
                    });
                },
                initRobot2: function (key) {
                    var files = [{
                        filename: "robot2/1.ctm",
                        offset: 'center',
                        option: {
                            color: '#F09A07'
                        }
                    }, {
                        filename: "robot2/2.ctm",
                        option: {
                            color: '#F09A07'
                        },
                        offset: {
                            // x: -3.8224711418151855,
                            x: -3.81,
                            // y: -4.789816617965698,
                            y: -4.83,
                            z: -1.4075890183448792
                        }
                    }, {
                        filename: 'robot2/3.ctm',
                        option: {
                            color: '#F09A07'
                        },
                        offset: {
                            x: -3.561065435409546,
                            // y: -4.6158061027526855,
                            y: -4.62,
                            // z: -0.9423685669898987
                            z: -1.34
                        }
                    }, {
                        filename: 'robot2/4.ctm',
                        option: {
                            color: '#F09A07'
                        },
                        offset: {
                            x: -3.8139774799346924,
                            // y: -4.554198741912842,
                            y: -4.62,
                            // z: -0.38812075555324554
                            z: -0.44
                        }
                    }, {
                        filename: 'robot2/5.ctm',
                        option: {
                            color: '#F09A07'
                        },
                        offset: 'center'
                    }, {
                        filename: 'robot2/6.ctm',
                        option: {
                            color: '#F09A07'
                        },
                        offset: {
                            x: -3.7998074293136597,
                            y: -3.027305245399475,
                            // z: -0.3377254530787468
                            z: -0.28
                        }
                        /*afterAdd: function (object, mesh) {
                            var middle = new THREE.Vector3();

                            var box3 = new THREE.Box3().setFromObject(object);

                            middle.x = (box3.max.x + box3.min.x) / 2;
                            middle.y = (box3.max.y + box3.min.y) / 2;
                            middle.z = (box3.max.z + box3.min.z) / 2;


                            var dir = new THREE.Vector3(1, 0, 0);

                            dir.normalize();

                            var origin = new THREE.Vector3(middle.x, middle.y, middle.z);
                            var length = 0.3;
                            var hex = 0xffff00;

                            var arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
                            object.add(arrowHelper);
                        }*/
                    }, {
                        filename: 'robot2/7.ctm',
                        option: {
                            color: '#F09A07'
                        },
                        offset: 'center'
                    }, {
                        filename: 'robot2/8.ctm',
                        option: {
                            color: '#4a5d63'
                        },
                        offset: 'center'
                    }];

                    ctrl.loadCtmFileAsyc(files, parentObject, function (file, object, mesh) {
                        if (file.filename === 'robot2/1.ctm') {
                            if (key === 4) {
                                mesh.rotation.z = 180 * OneDegree;
                                mesh.position.x = 3.79;
                                mesh.position.y = 1.75;
                                mesh.position.z = 1.75;
                            } else if (key === 5) {
                                mesh.position.x = 3.79;
                                mesh.position.y = 4.87;
                                mesh.position.z = 1.75;
                            }
                            objMap[`${key}-0`] = mesh;
                        } else {
                            if (file.filename === 'robot2/2.ctm') {
                                object.position.x = 0.02;
                                object.position.y = -0.04;
                                object.position.z = -0.32;
                                object.control = 'z';
                                objMap[`${key}-1`] = object;
                            } else if (file.filename === 'robot2/3.ctm') {
                                object.position.x = -0.25;
                                object.position.y = -0.21;
                                object.position.z = -0.06;
                                object.control = 'x';
                                objMap[`${key}-2`] = object;
                            } else if (file.filename === 'robot2/4.ctm') {
                                object.position.x = 0.25;
                                object.position.y = 0;
                                object.position.z = -0.9;
                                object.control = 'x';
                                objMap[`${key}-3`] = object;
                            } else if (file.filename === 'robot2/5.ctm') {
                                object.position.x = -0.02;
                                object.position.y = -0.67;
                                object.position.z = -0.16;
                                object.rotation.x = -180 * OneDegree;
                                object.control = 'y';
                                objMap[`${key}-4`] = object;
                            } else if (file.filename === 'robot2/6.ctm') {
                                object.position.x = 0;
                                object.position.y = 0.35;
                                object.position.z = -0.01;
                                object.control = 'x';
                                object.rotation.x = 180 * OneDegree;
                                objMap[`${key}-5`] = object;
                            } else if (file.filename === 'robot2/7.ctm') {
                                object.position.z = 0.19;
                                object.control = 'z';
                                objMap[`${key}-6`] = object;
                            } else if (file.filename === 'robot2/8.ctm') {
                                object.position.x = 0.015;
                                object.position.y = -0.03;
                                object.position.z = 0.18;
                                objMap[`${key}-zhua`] = object;
                            }
                        }
                    });
                },
                initRobot: function (key) {
                    var files = [{
                        filename: 'robot1/1.ctm',
                        offset: 'center',
                        option: {
                            color: '#F09A07'
                        }
                    }, {
                        filename: 'robot1/2.ctm',
                        option: {
                            color: '#F09A07'
                        },
                        offset: {
                            // x: 2.892963409423828,
                            // y: 0.07200838625431061,
                            x: 2.97,
                            y: 0.13,
                            z: -1.4667157530784607
                        }
                    }, {
                        filename: 'robot1/3.ctm',
                        option: {
                            color: '#F09A07'
                        },
                        offset: {
                            x: 3.111840605735779,
                            // y: -0.01711893081665039,
                            y: -0.028,
                            // z: -1.0146436095237732
                            z: -1.4
                        }
                    }, {
                        filename: 'robot1/4.ctm',
                        option: {
                            color: '#F09A07'
                        },
                        offset: {
                            x: 2.9288467168807983,
                            // y: -0.1132829338312149,
                            y: -0.02,
                            // z: -0.51463682949543
                            z: -0.62
                        }
                    }, {
                        filename: 'robot1/5.ctm',
                        option: {
                            color: '#F09A07'
                        },
                        offset: 'center'
                    }, {
                        filename: 'robot1/6.ctm',
                        option: {
                            color: '#F09A07'
                        },
                        offset: {
                            x: 2.955219268798828,
                            y: -0.7839049100875854,
                            // z: -0.49972839653491974
                            z: -0.47
                        }
                    }, {
                        filename: 'robot1/7.ctm',
                        option: {
                            color: '#F09A07'
                        },
                        offset: 'center'
                    }];

                    files.push({
                        filename: `robot1/${key}-zhua.ctm`,
                        option: {
                            color: '#4a5d63'
                        }
                    });

                    ctrl.loadCtmFileAsyc(files, parentObject, function (file, object, mesh) {
                        if (file.filename === 'robot1/1.ctm') {
                            if (key === 1) {
                                mesh.position.x = -2.969;
                                mesh.position.y = -0.159;
                                mesh.position.z = 1.745;
                            } else if (key === 2) {
                                mesh.position.x = -0.53;
                                mesh.position.y = 0.4;
                                mesh.position.z = 1.74;
                                mesh.rotation.z = 180 * OneDegree;
                            } else if (key === 3) {
                                mesh.position.x = 2.1;
                                mesh.position.y = -0.07;
                                mesh.position.z = 1.75;
                            }
                            objMap[`${key}-0`] = mesh;
                        } else {
                            if (file.filename === 'robot1/2.ctm') {
                                object.control = 'z';
                                object.position.x = 0;
                                object.position.y = 0.03;
                                object.position.z = -0.29;
                                objMap[`${key}-1`] = object;
                            } else if (file.filename === 'robot1/3.ctm') {
                                object.position.x = -0.11;
                                object.position.y = 0.15;
                                object.position.z = -0.07;
                                object.control = 'x';
                                objMap[`${key}-2`] = object;
                            } else if (file.filename === 'robot1/4.ctm') {
                                object.position.x = 0.17;
                                object.position.y = 0;
                                object.position.z = -0.78;
                                object.control = 'x';
                                objMap[`${key}-3`] = object;
                            } else if (file.filename === 'robot1/5.ctm') {
                                object.position.x = -0.03;
                                object.position.y = 0.54;
                                object.position.z = -0.15;
                                object.control = 'y';
                                objMap[`${key}-4`] = object;
                            } else if (file.filename === 'robot1/6.ctm') {
                                object.position.x = 0;
                                object.position.y = 0.2;
                                object.position.z = 0.01;
                                object.control = 'x';
                                objMap[`${key}-5`] = object;
                            } else if (file.filename === 'robot1/7.ctm') {
                                object.position.x = -0.01;
                                object.position.z = 0.12;
                                object.control = 'z';
                                objMap[`${key}-6`] = object;
                            } else if (file.filename === 'robot1/1-zhua.ctm') {
                                object.position.x = 2.97;
                                object.position.y = -0.78;
                                object.position.z = -0.59;
                                objMap[`${key}-zhua`] = object;
                            } else if (file.filename === 'robot1/2-zhua.ctm') {
                                object.position.x = -0.55;
                                object.position.y = -0.59;
                                object.position.z = -0.59;
                                object.rotation.z = 180 * OneDegree;
                                objMap[`${key}-zhua`] = object;
                            } else if (file.filename === 'robot1/3-zhua.ctm') {
                                object.position.x = -2.105;
                                object.position.y = -0.865;
                                object.position.z = -0.59;
                                objMap[`${key}-zhua`] = object;
                            }
                        }
                    });
                },
                autoWidth: function () {
                    renderWidth = $('#zhuangbeidao_webgl_box').width();
                    renderHeight = $(window).height() - 200;

                    if (camera) {
                        camera.aspect = renderWidth / renderHeight;
                        camera.updateProjectionMatrix();
                    }
                    if (renderer) {
                        renderer.setSize(renderWidth, renderHeight);
                    }
                    $('.zhuangbeidao_left').height(renderHeight - 10);
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

                        var mesh = new THREE.Mesh(geometry, material);

                        if (params.beforeCreate && _.isFunction(params.beforeCreate)) {
                            params.beforeCreate.call(null, geometry, mesh);
                        }

                        deferred.resolve(mesh, params);
                        current++;
                        ctrl.setProgress();
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
                            if (_.isFunction(file.afterAdd)) {
                                file.afterAdd.call(null, object, mesh);
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
                    return cynovan.r_path + 'robot/vr_zhuangbeidao/resource/ctm/' + glfile + '?v=' + cynovan.version;
                },
                initWebGL: function () {
                    container = document.getElementById('zhuangbeidao_webgl_box');
                    camera = new THREE.PerspectiveCamera(40, renderWidth / renderHeight, 1, 10000);
                    camera.position.x = 0;
                    camera.position.y = -10;
                    camera.position.z = -8;

                    parentObject.scale.set(scale, scale, scale);
                    parentObject.position.y = 1.2;
                    parentObject.rotation.x = -10 * OneDegree;

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

                    var light = new THREE.DirectionalLight(0xffffff, 1);
                    light.position.set(3, 3, 3);
                    scene.add(light);

                    objMap['light'] = light;

                    objMap['camera'] = camera;

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
