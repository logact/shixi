define(['css!welding/history/css/pretty-checkbox'], function () {
    var app = angular.module('app');

    app.factory('DynamicDataConfigFactory', function () {
        // 配置信息
        var config = [];

        // 配置初始化
        function init() {
            initDynamicDataConfig();
            initSamplingDataConfing();
        };

        // 数据配置栏位
        function initDynamicDataConfig() {
            config['normal'] = ["001_CloudVersion", "002_DataType", "003_Axis1ProfilePosition",
                "004_Axis2ProfilePosition", "005_Axis3ProfilePosition", "006_Axis4ProfilePosition",
                "007_Axis5ProfilePosition", "008_Axis6ProfilePosition", "009_Axis7ProfilePosition",
                "010_Axis8ProfilePosition", "011_CartesianXPosition", "012_CartesianYPosition",
                "013_CartesianZPosition", "014_CartesianAPosition", "015_CartesianBPosition",
                "016_CartesianCPosition", "017_Idle", "018_Idle", "019_Axis1ProfileVelocity",
                "020_Axis2ProfileVelocity", "021_Axis3ProfileVelocity", "022_Axis4ProfileVelocity",
                "023_Axis5ProfileVelocity", "024_Axis6ProfileVelocity", "025_Axis7ProfileVelocity",
                "026_Axis8ProfileVelocity", "027_Motor1Speed", "028_Motor2Speed", "029_Motor3Speed",
                "030_Motor4Speed", "031_Motor5Speed", "032_Motor6Speed", "033_Motor7Speed",
                "034_Motor8Speed", "035_Axis1TheoryDynamicsCurrent", "036_Axis2TheoryDynamicsCurrent",
                "037_Axis3TheoryDynamicsCurrent", "038_Axis4TheoryDynamicsCurrent",
                "039_Axis5TheoryDynamicsCurrent", "040_Axis6TheoryDynamicsCurrent",
                "041_Axis7TheoryDynamicsCurrent", "042_Axis8TheoryDynamicsCurrent",
                "043_Axis1ActualCurrent", "044_Axis2ActualCurrent", "045_Axis3ActualCurrent",
                "046_Axis4ActualCurrent", "047_Axis5ActualCurrent", "048_Axis6ActualCurrent",
                "049_Axis7ActualCurrent", "050_Axis8ActualCurrent", "051_Axis1Collision",
                "052_Axis2Collision", "053_Axis3Collision", "054_Axis4Collision", "055_Axis5Collision",
                "056_Axis6Collision", "057_Idle", "058_Idle", "059_WorkMode", "060_ServoOnStatus",
                "061_VisuPage", "062_JOG_Axis", "063_JOG_Direction", "064_JOG_Coordsys", "065_JOG_VEL",
                "066_TeachFileName", "067_TeachFileLine", "068_ERRORStatus", "069_ERRORCode",
                "070_TCSNumber", "071_WCSNumber", "072_PCS1Number", "073_PCS2Number", "074_Exit3key",
                "075_CollisionFlag", "076_LineVelocity", "077_Axis1ProfileAcc", "078_Axis2ProfileAcc",
                "079_Axis3ProfileAcc", "080_Axis4ProfileAcc", "081_Axis5ProfileAcc", "082_Axis6ProfileAcc",
                "083_Axis7ProfileAcc", "084_Axis8ProfileAcc", "085_OrientationNumber", "086_BootTime",
                "087_RunTime", "088_Idle", "089_Idle", "090_Idle", "091_Idle", "092_Idle", "093_Idle",
                "094_Idle", "095_Idle", "096_Idle", "097_Idle", "098_Idle", "099_Idle", "100_Idle",
                "101_Status_DI_ArcWeldingStart", "102_Status_DI_WelderOK", "103_Status_DI_GasNotEnough",
                "104_Status_DI_WireNotEnough", "105_Status_DI_WireStick", "106_Status_DI_SearchPosIn",
                "107_Status_DI_CoolingSys", "108_Status_DI_ExGasCheck", "109_Status_DI_ExWireFw",
                "110_Status_DI_ExWireBw", "111_Status_DI_ExArcWeldingOn", "112_Status_DO_ArcOn",
                "113_Status_DO_GasCheck", "114_Status_DO_WireFw", "115_Status_DO_WireBw",
                "116_Status_DO_SearchPosOut", "117_Status_DO_WireStick", "118_Par_WeldingCurrent",
                "119_Par_WeldingVoltage", "120_Status_WeldingCurrent", "121_Status_WeldingVoltage",
                "122_Status_ArcTrackHorUse", "123_Status_ArcTrackHorSingle", "124_Status_ArcTrackHorSum",
                "125_Status_ArcTrackVerUse", "126_Status_ArcTrackVerSingle", "127_Status_ArcTrackVerSum",
                "128_Par_WelderType", "129_Par_FileIndex", "130_Par_MaterialType", "131_Par_WireType",
                "132_Par_GasType", "133_DI_Module_0_DWord_1", "134_DI_Module_0_DWord_2",
                "135_DI_Module_1_Word_1", "136_DI_Module_2_Word_1", "137_DO_Module_0_DWord_1",
                "138_DO_Module_0_DWord_2", "139_DO_Module_1_Word_1", "140_DO_Module_2_Word_1",
                "141_ArcOn_Time", "142_CloudSendFlag", "143_CloudSendWelderType", "144_CloudSendMaterialTypeA",
                "145_CloudSendMaterialThicknessA", "146_CloudSendMaterialTypeB", "147_CloudSendMaterialThicknessB",
                "148_CloudSendWireType", "149_CloudSendWireDiameter", "150_CloudSendSeamType", "151_ArcOnCurrent",
                "152_ArcOnVoltage", "153_WeldingCurrent", "154_WeldingVoltage", "155_ArcOfCurrent",
                "156_ArcOfVoltage", "157_WeldingSpeed", "158_GasSpeed", "159_WireExtensions", "160_ArcOnTime",
                "161_ArcOfTime", "162_ArcOnGasBeforeTime", "163_ArcOfGasAfterTime", "164_ArcCharacteristic",
                "165_ArcSegTime", "166_MaterialName", "167_MaterialBatch", "168_MaterialBarcode", "169_GasType",
                "170_GunAngle", "171_MoveType", "172_WireToMaterialDis", "173_Status_DI_ArcWeldingStart_DataCollect",
                "174_WireFeedSpeed", "175_WireFeedCurrent", "176_WireFeedLengthSingleWelding", "177_WireFeedCalFlag",
                "178_WireDensity", "179_WeldingAlarmCheckFlag", "180_WelderTemperature", "181_WelderFanSpeed",
                "182_TCP_X", "183_TCP_Y", "184_TCP_Z", "185_TCP_A", "186_TCP_B", "187_TCP_C",
                "188_Status_DI_ArcWelding_Status", "189_PrimaryVoltage", "190_ControlFrequency",
                "191_Status_WeldingCurrent_NoFilter", "192_Status_WeldingVoltage_NoFilter", "193_GasFlow",
                "194_GasPressure", "195_SpatterControlRate", "196_GunAngleRT", "197_CompensateNum",
                "198_OneCompleteProcess", "199_M_TCP_X", "200_M_TCP_Y", "201_M_TCP_Z",
                "202_M_TCP_A", "203_M_TCP_B", "204_M_TCP_C", "205_CloudSend_ParAcceptFlag",
                "206_CloudSend_RobotWorkFlag", "207_CloudSend_WeldingMode", "208_CloudSend_WeldingType",
                "209_CloudSend_GrooveType"]
        };

        function initSamplingDataConfing() {
            config['sampling'] = [
                "003_Axis1ProfilePosition", "004_Axis2ProfilePosition", "005_Axis3ProfilePosition",
                "006_Axis4ProfilePosition", "007_Axis5ProfilePosition", "008_Axis6ProfilePosition",
                "009_Axis7ProfilePosition", "010_Axis8ProfilePosition", "019_Axis1ProfileVelocity",
                "020_Axis2ProfileVelocity", "021_Axis3ProfileVelocity", "022_Axis4ProfileVelocity",
                "023_Axis5ProfileVelocity", "024_Axis6ProfileVelocity", "025_Axis7ProfileVelocity",
                "026_Axis8ProfileVelocity", "077_Axis1ProfileAcc", "078_Axis2ProfileAcc",
                "079_Axis3ProfileAcc", "080_Axis4ProfileAcc", "081_Axis5ProfileAcc",
                "082_Axis6ProfileAcc", "083_Axis7ProfileAcc", "084_Axis8ProfileAcc",
                "043_Axis1ActualCurrent", "044_Axis2ActualCurrent", "045_Axis3ActualCurrent",
                "046_Axis4ActualCurrent", "047_Axis5ActualCurrent", "048_Axis6ActualCurrent",
                "049_Axis7ActualCurrent", "050_Axis8ActualCurrent", "035_Axis1TheoryDynamicsCurrent",
                "036_Axis2TheoryDynamicsCurrent", "037_Axis3TheoryDynamicsCurrent", "038_Axis4TheoryDynamicsCurrent",
                "039_Axis5TheoryDynamicsCurrent", "040_Axis6TheoryDynamicsCurrent", "041_Axis7TheoryDynamicsCurrent",
                "042_Axis8TheoryDynamicsCurrent", "011_CartesianXPosition", "012_CartesianYPosition",
                "013_CartesianZPosition", "014_CartesianAPosition", "015_CartesianBPosition",
                "016_CartesianCPosition", "153_WeldingCurrent", "154_WeldingVoltage",
                "191_Status_WeldingCurrent_NoFilter", "192_Status_WeldingVoltage_NoFilter"]
        }

        init();

        var _getConfig = function (key) {
            if (config.hasOwnProperty(key)) {
                return config[key];
            }
            return {};
        };

        return {
            getConfig: _getConfig
        }
    });

    app.controller('WeldDataConfigController', ['$scope', '$timeout', 'dialog', '$element', 'util', 'DBUtils', 'AppDataService', 'http', 'DynamicDataConfigFactory', 'websocket', 'DeviceService',
        function ($scope, $timeout, dialog, $element, util, DBUtils, AppDataService, http, DynamicDataConfigFactory, websocket, DeviceService) {
            var ctrl = this;
            var bind = $scope.bind;
            var resourceOptions = [{
                id: 'input',
                name: '手工输入'
            }, {
                id: 'data',
                name: '动态数据'
            }];
            var typeOptions = [{
                id: 'str',
                name: '手动填入'
            }, {
                id: 'select',
                name: '下拉选项'
            }];

            var colors = [
                '#2185d0',
                '#00b5ad',
                '#f2711c',
                '#db2828',
                '#b5cc18',
                '#6435c9',
                '#a333c8',
                '#e03997',
                '#a5673f',
                '#767676',
                '#fbbd08',
                '#21ba45',
                '#00b5ad'];
            $scope.entity = {};
            $scope.shiftHours = [];
            $scope.shiftMinutes = [];
            $scope.shiftTypes = [{
                id: 'current',
                name: '当天'
            }, {
                id: 'tomorrow',
                name: '第二天'
            }];
            $scope.ftpModels = [{
                id: 'active',
                name: 'Active Mode'
            }, {
                id: 'passive',
                name: 'Passive Mode'
            }]
            $scope.startShiftTypes = [{
                id: 'current',
                name: '当天'
            }, {
                id: 'yest',
                name: '前一天'
            }];
            $scope.dynamic_data = DynamicDataConfigFactory.getConfig('normal');
            $scope.sampling_data_config = DynamicDataConfigFactory.getConfig('sampling');

            $scope.selectAllNormal = false;
            $scope.selectAllSampling = false;

            _.extend(ctrl, {
                initialize: function () {
                    ctrl.initData();
                    ctrl.bindEvent();
                },
                initData: function () {
                    $scope.resourceOptions = resourceOptions;
                    $scope.typeOptions = typeOptions;

                    // Load data struct from lastData in device dynamicData
                    DBUtils.find('device', {
                        'uuid': bind.uuid
                    }).success(function (result) {
                        var device = _.get(result, 'datas.result', {});
                        var dynamicData = _.get(device, "dynamicData", {});
                        var columns = _.map(dynamicData, function (value, field) {
                            return {
                                id: field,
                                name: field
                            }
                        });
                        $scope.columns = columns;
                    });

                    websocket.sub({
                        topic: 'cloud/' + bind.uuid,
                        onmessage: _.debounce(function (message) {
                            let action = _.get(message, 'action', '');
                            var uploadData = _.get(message, 'data', {});
                            if (uploadData.status === 'fail') {
                                dialog.noty('发生错误: ' + uploadData.msg);
                            } else {
                                if (action === 'cloud_download') {
                                    dialog.noty('更新成功');
                                    DeviceService.pushWithoutPassword(bind.uuid, 'update', {
                                        "012_RecvCmd": 'FileDownloadSuccessful',
                                    });
                                }
                            }
                        }, 300)
                    });

                    AppDataService.get('weld_robot_history_config')
                        .success(function (result) {
                            var entity = result || {};
                            if (!entity.ai_check) {
                                entity.ai_check = '0';
                            }
                            if (!entity.check_result) {
                                entity.check_result = 'person';
                            }
                            if (!entity.timeline) {
                                entity.timeline = '0';
                            }
                            if (!entity.download_ftp) {
                                entity.download_ftp = '1';
                            }
                            $scope.entity = entity;
                            ctrl.initDataConfig();
                            util.apply($scope);
                        });

                    var hours = [];
                    _.times(24, function (hour) {
                        hours.push({
                            id: hour,
                            name: (hour) + '时'
                        })
                    });
                    $scope.shiftHours = hours;

                    var minutes = [];
                    _.times(60, function (minu) {
                        minutes.push({
                            id: minu,
                            name: (minu) + '分'
                        });
                    });
                    $scope.shiftMinutes = minutes;
                },

                // 初始化数据配置tab
                initDataConfig: function () {
                    var entity = $scope.entity;
                    if (!entity.normal_frequency) {
                        entity.normal_frequency = 200;
                    }
                    if (!entity.sampling_frequency) {
                        entity.sampling_frequency = 6;
                    }
                    if (!entity.file_path_to) {
                        entity.file_path_to = "Hard Disk\\CPAC\\config\\CloudSendParFile.txt";
                    }
                    if (!$scope.entity.normal_data) {
                        var defineNormalData = $scope.dynamic_data[0];
                        $scope.entity.normal_data = {};
                        $scope.entity.normal_data[defineNormalData] = null;// 定义第一个普通数据
                        ctrl.selectAllFields(1);
                    }
                    if (!$scope.entity.sampling_data) {
                        $scope.selectAllSampling = true;
                        var defineSamplingData = $scope.sampling_data_config[0];
                        $scope.entity.sampling_data = {};
                        $scope.entity.sampling_data[defineSamplingData] = null;// 定义第一个采样数据
                    } else {
                        if (JSON.stringify($scope.entity.sampling_data).indexOf("true") === -1) {
                            $scope.selectAllSampling = true;
                        }
                    }
                },
                addShiftRow: function () {
                    var shifts = $scope.entity.shifts || [];
                    shifts.push({
                        s_hour: 0,
                        s_minute: 0,
                        e_hour: 23,
                        e_minute: 59,
                        e_type: 'current',
                        s_type: 'current'
                    });
                    $scope.entity.shifts = shifts;
                    _.each($scope.entity.shifts, function (shift, idx) {
                        shift.color = colors[idx];
                    })
                },
                removeShiftRow: function ($index) {
                    $scope.entity.shifts.splice($index, 1);
                    _.each($scope.entity.shifts, function (shift, idx) {
                        shift.color = colors[idx];
                    })
                },
                changeROption: function (field, old_r_option) {
                    if (field.r_option === 'input' && old_r_option === 'data') {
                        field.bind = '';
                    }
                },
                setAICheck: _.debounce(function () {
                    if ($scope.entity.ai_check === '0') {
                        $scope.entity.check_result = 'person';
                    }
                    util.apply($scope);
                }, 300),
                bindEvent: function () {
                    $scope.$watch('entity.ai_check', function () {
                        ctrl.setAICheck();
                    });

                    $scope.$on('success', function (event, checkMessage) {
                        var fields = _.map($scope.entity.fields, function (field) {
                            if (field.r_option === 'input' && !field.bind) {
                                field.bind = util.uuid();
                            }
                            // 动态数据类型， 填选方式和默认值置空
                            if (field.r_option === 'data') {
                                field.t_option = 'str';
                                if (!_.isEmpty(field.default)) {
                                    field.default = '';
                                }
                            }
                            return util.removeHashKey(field)
                        });
                        _.set($scope.entity, 'fields', fields);

                        var flag = ctrl.checkShiftSave();
                        if (flag === false) {
                            checkMessage.success = false;
                            return;
                        }

                        if (_.size($scope.entity.shifts)) {
                            $scope.entity.shifts = util.removeHashKey($scope.entity.shifts) || [];
                            _.each($scope.entity.shifts, function (shift, idx) {
                                shift.index = idx;
                            })
                        }

                        // data config begin
                        var entity = $scope.entity;
                        if (isNaN(entity.normal_frequency) || entity.normal_frequency < 200) {
                            dialog.noty("普通频率不能低于200ms");
                            checkMessage.success = false;
                            return false;
                        }
                        if (isNaN(entity.sampling_frequency) || entity.sampling_frequency < 6) {
                            dialog.noty("采样频率不能低于6ms");
                            checkMessage.success = false;
                            return false;
                        }
                        if (!entity.file_path_to) {
                            dialog.noty("文件存放路径不能为空");
                            checkMessage.success = false;
                            return false;
                        }

                        var nomalArr = [];
                        var samplingArr = [];
                        _.each(entity.normal_data, function (value, key) {
                            if (value) {
                                nomalArr.push(key.substring(0, 3));
                            }
                        });
                        _.each(entity.sampling_data, function (value, key) {
                            if (value) {
                                samplingArr.push(key.substring(0, 3));
                            }
                        });
                        if (nomalArr.length === 0) {
                            ctrl.selectAllFields(1); // 无选择时,普通数据默认全选
                        }
                        var nomalNewArr = [];
                        var samplingNewArr = [];

                        _.times(212, function (idx) {
                            var key = (Array(3).join(0) + (idx + 1)).slice(-3);
                            if (nomalArr.indexOf(key.toString()) !== -1) {
                                nomalNewArr.push(1);
                            } else {
                                nomalNewArr.push(0);
                            }
                            if (samplingArr.indexOf(key.toString()) !== -1) {
                                samplingNewArr.push(1);
                            } else {
                                samplingNewArr.push(0);
                            }
                        });

                        http.post('weld/creatDataConfigTxt', {
                            'uuid': bind.uuid,
                            'StateDataFrequency': entity.normal_frequency,
                            'SamplingPeriod': entity.sampling_frequency,
                            'file_path_to': entity.file_path_to,
                            'SendDataString': _.join(nomalNewArr, ''),
                            'SamplingString': _.join(samplingNewArr, '')
                        }).success(function (result) {
                        });

                        AppDataService.set('weld_robot_history_config', $scope.entity).success(function () {
                            dialog.notyWithRefresh('操作成功,2秒后自动刷新！', $scope);
                        });

                    });
                },
                selectAllFields: function (flag) {
                    if (flag === 1) {
                        $scope.selectAllNormal = false;
                        _.each($scope.dynamic_data, function (value) {
                            $scope.entity.normal_data[value] = true;
                        });
                    }
                    if (flag === 2) {
                        $scope.selectAllSampling = false;
                        _.each($scope.sampling_data_config, function (value) {
                            $scope.entity.sampling_data[value] = true;
                        });
                    }
                },
                cancelAllFields: function (flag) {
                    if (flag === 1) {
                        $scope.selectAllNormal = true;
                        _.each($scope.dynamic_data, function (value) {
                            $scope.entity.normal_data[value] = false;
                        });
                    }
                    if (flag === 2) {
                        $scope.selectAllSampling = true;
                        _.each($scope.sampling_data_config, function (value) {
                            $scope.entity.sampling_data[value] = false;
                        });
                    }
                },
                checkShiftSave: function () {
                    var shifts = $scope.entity.shifts;
                    if (_.size(shifts)) {
                        var checked = true;
                        var shiftNameMap = {};
                        _.each(shifts, function (shift) {
                            if (!shift.name) {
                                checked = false;
                            } else {
                                shiftNameMap[shift.name] = shift.name;
                            }
                        });
                        if (checked === false) {
                            dialog.noty('请输入班次名称');
                            return false;
                        }
                        var keys = _.keys(shiftNameMap);
                        if (keys.length !== shifts.length) {
                            dialog.noty('班次名称不能重复');
                            return false;
                        }
                        /*检查时间段是否重合，以及时间段是否有间隙*/
                        shifts = _.sortBy(shifts, ['s_hour', 's_minute', 'e_hour', 'e_minute']);
                        var totalMinutes = 0;
                        _.each(shifts, function (shift) {
                            totalMinutes += ctrl.shiftDiff(shift);
                        });
                        totalMinutes = _.parseInt(totalMinutes);
                        var dayMinutes = 24 * 60;
                        if (totalMinutes !== dayMinutes) {
                            dialog.noty('班次总时间必须为24小时!');
                            return false;
                        }
                        return checked;
                    }
                    return true;
                },
                shiftDiff: function (shift) {
                    var s_date = 27;
                    if (shift.s_type === 'yest') {
                        s_date = s_date - 1;
                    }
                    var s = moment(new Date(2018, 11, s_date, shift.s_hour, shift.s_minute, 0));

                    var e_date = 27;
                    if (shift.e_type === 'tomorrow') {
                        e_date = e_date + 1;
                    }
                    var e = moment(new Date(2018, 11, e_date, shift.e_hour, shift.e_minute, 0));
                    var diff = Math.abs(s.diff(e));
                    var duration = moment.duration(diff);
                    var minutes = duration.asMinutes() + 1;
                    return minutes;
                },
                addFieldRow: function () {
                    $scope.entity.fields = $scope.entity.fields || [];
                    $scope.entity.fields.push({
                        'r_option': 'input',
                        't_option': 'str'
                    });
                },
                removeFieldRow: function ($index) {
                    $scope.entity.fields.splice($index, 1);
                },
                testFtpConn: function () {
                    if (!$scope.entity.ftp_server) {
                        dialog.noty('请输入有效的FTP地址');
                        return false;
                    }

                    if (!$scope.entity.ftp_port) {
                        dialog.noty('请输入有效的FTP端口');
                        return false;
                    }
                    http.get('weld/testFtpConn', {
                        ftp_server: $scope.entity.ftp_server,
                        ftp_port: $scope.entity.ftp_port,
                        ftp_user: $scope.entity.ftp_user,
                        ftp_pwd: $scope.entity.ftp_pwd,
                        ftp_model: $scope.entity.ftp_model
                    }).success(function (result) {
                        dialog.noty(result.messages);
                    });
                },
                dropdownConfig: function ($index) {
                    dialog.show({
                        template: 'app_weld_dropdown_config_template',
                        title: '下拉框配置',
                        controller: ['$scope', 'util', function (dialogScope, util) {
                            dialogScope.datamap = {};

                            var options = _.get($scope.entity, `fields[${$index}].b_select`, '');
                            _.extend(dialogScope.datamap, {
                                'b_select': options.replace(/,/g, '\n')
                            });

                            dialogScope.$on('success', function (event) {
                                var dropdown = dialogScope.datamap.b_select;

                                $scope.entity.fields[$index].b_select = dropdown.replace(/\n/g, ',');
                                util.apply(dialogScope);
                            })

                        }]

                    });
                }
            });
            ctrl.initialize();
        }]);

    app.filter("selectBreak", function () {
            return function (value, delimeter, _blank) {
                if (!value || !value.length) {
                    return;
                }
                let arr = value.split(delimeter);
                if (_blank === '_blank') {
                    arr.push('');
                }
                return arr;
            }
        });
});