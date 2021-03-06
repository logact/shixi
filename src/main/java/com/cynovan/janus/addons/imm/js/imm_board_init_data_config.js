define([], function () {
    let settingConfig = {
        app: 'imm_board',
        dialogTitle: '注塑机数据配置',
        fields: [{
            key: 'MachineType',
            description: '机床型号',
            lastKey: 'MachineType'
        }, {
            key: 'MachineID',
            description: '机床ID',
            lastKey: 'MachineID'
        }, {
            key: 'Type',
            description: '规格',
            lastKey: 'Type'
        }, {
            key: 'Material',
            description: '原料',
            lastKey: 'Material'
        }, {
            key: 'Company',
            description: '品牌',
            lastKey: 'Company'
        }, {
            key: 'MaintenanceDate',
            description: '保养日期',
            lastKey: 'MaintenanceDate'
        }, {
            key: 'InferiorNum',
            description: '次品数',
            lastKey: 'InferiorNum'
        }, {
            key: 'SuperiorNum',
            description: '良品数',
            lastKey: 'SuperiorNum'
        }, {
            key: 'CycleTime',
            description: '周期耗时',
            lastKey: 'CycleTime'
        }, {
            key: 'CavityNum',
            description: '模腔数',
            lastKey: 'CavityNum'
        }, {
            key: 'WorkMode',
            description: '工作模式',
            lastKey: 'WorkMode'
        }, {
            key: 'MachineStatus',
            description: '设备状态',
            lastKey: 'MachineStatus'
        }, {
            key: 'RobotMode',
            description: '机械手操作模式',
            lastKey: 'RobotMode'
        }, {
            key: 'RobotAxis1Action',
            description: '机械手X轴动作',
            lastKey: 'RobotAxis1Action'
        }, {
            key: 'RobotAxis2Action',
            description: '机械手Y轴动作',
            lastKey: 'RobotAxis2Action'
        }, {
            key: 'RobotAxis3Action',
            description: '机械手Z轴动作',
            lastKey: 'RobotAxis3Action'
        }, {
            key: 'RobotAxis4Action',
            description: '机械手C轴动作',
            lastKey: 'RobotAxis4Action'
        }, {
            key: 'RobotGripperAction',
            description: '机械手夹具动作',
            lastKey: 'RobotGripperAction'
        }, {
            key: 'VisionStatus',
            description: '视觉检测机构状态',
            lastKey: 'VisionStatus'
        }, {
            key: 'VisionResult',
            description: '视觉检测结果',
            lastKey: 'VisionResult'
        }, {
            key: 'Barrel1AreaTemper',
            description: '料筒1区实时温度',
            lastKey: 'Barrel1AreaTemper'
        }, {
            key: 'Barrel2AreaTemper',
            description: '料筒2区实时温度',
            lastKey: 'Barrel2AreaTemper'
        }, {
            key: 'Barrel3AreaTemper',
            description: '料筒3区实时温度',
            lastKey: 'Barrel3AreaTemper'
        }, {
            key: 'Barrel4AreaTemper',
            description: '料筒4区实时温度',
            lastKey: 'Barrel4AreaTemper'
        }, {
            key: 'Barrel5AreaTemper',
            description: '料筒5区实时温度',
            lastKey: 'Barrel5AreaTemper'
        }, {
            key: 'Barrel6AreaTemper',
            description: '料筒6区实时温度',
            lastKey: 'Barrel6AreaTemper'
        }, {
            key: 'Barrel7AreaTemper',
            description: '料筒7区实时温度',
            lastKey: 'Barrel7AreaTemper'
        }, {
            key: 'NozzleTemper',
            description: '射嘴实时温度',
            lastKey: 'NozzleTemper'
        }, {
            key: 'Pump1Pressure',
            description: '泵1压力',
            lastKey: 'Pump1Pressure'
        }, {
            key: 'Pump1Flow',
            description: '泵1流量',
            lastKey: 'Pump1Flow'
        }, {
            key: 'OpenOrCloseClampPostion',
            description: '开合模实时位置',
            lastKey: 'OpenOrCloseClampPostion'
        }, {
            key: 'SystemPressure',
            description: '系统压力',
            lastKey: 'SystemPressure'
        }, {
            key: 'InjectionRealPostion',
            description: '注射实时位置',
            lastKey: 'InjectionRealPostion'
        }, {
            key: 'ScrewSpeed',
            description: '螺杆转速',
            lastKey: 'ScrewSpeed'
        }, {
            key: 'InjectionTime',
            description: '注射时间',
            lastKey: 'InjectionTime'
        }, {
            key: 'CoolingTime',
            description: '冷却时间',
            lastKey: 'CoolingTime'
        }, {
            key: 'SuckingBackTime',
            description: '松退时间',
            lastKey: 'SuckingBackTime'
        }, {
            key: 'CleanMaterialNum',
            description: '清料次数',
            lastKey: 'CleanMaterialNum'
        }, {
            key: 'CleanMaterialTime',
            description: '清料时间',
            lastKey: 'CleanMaterialTime'
        }, {
            key: 'ThimbleRealPostion',
            description: '顶针实时位置',
            lastKey: 'ThimbleRealPostion'
        }, {
            key: 'EjectionNum',
            description: '顶针顶出次数',
            lastKey: 'EjectionNum'
        }, {
            key: 'ThimbleHolsingTime',
            description: '顶针保持时间',
            lastKey: 'ThimbleHolsingTime'
        }, {
            key: 'ChillerSetTemper',
            description: '冷水机设定温度',
            lastKey: 'ChillerSetTemper'
        }, {
            key: 'ChillerRealTemper',
            description: '冷水机实际温度',
            lastKey: 'ChillerRealTemper'
        }, {
            key: 'ChillerRunningStatus',
            description: '冷水机运行状态',
            lastKey: 'ChillerRunningStatus'
        }, {
            key: 'BakingMachineSetTemper',
            description: '烘料机设定温度',
            lastKey: 'BakingMachineSetTemper'
        }, {
            key: 'BakingMachineRealTemper',
            description: '烘料机实际温度',
            lastKey: 'BakingMachineRealTemper'
        }, {
            key: 'SuctionMachineStatus',
            description: '吸料机器状态',
            lastKey: 'SuctionMachineStatus'
        }, {
            key: 'APhaseVoltage',
            description: '整机A相电压',
            lastKey: 'APhaseVoltage'
        }, {
            key: 'BPhaseVoltage',
            description: '整机B相电压',
            lastKey: 'BPhaseVoltage'
        }, {
            key: 'CPhaseVoltage',
            description: '整机C相电压',
            lastKey: 'CPhaseVoltage'
        }, {
            key: 'APhaseCurrent',
            description: '整机A相电流',
            lastKey: 'APhaseCurrent'
        }, {
            key: 'BPhaseCurrent',
            description: '整机B相电流',
            lastKey: 'BPhaseCurrent'
        }, {
            key: 'CPhaseCurrent',
            description: '整机C相电流',
            lastKey: 'CPhaseCurrent'
        }, {
            key: 'InstantaneousPower',
            description: '整机瞬时功率',
            lastKey: 'InstantaneousPower'
        }, {
            key: 'EnergyEfficiency',
            description: '整机累计能耗',
            lastKey: 'EnergyEfficiency'
        }, {
            key: 'Emergency',
            description: '急停',
            lastKey: 'Emergency'
        }, {
            key: 'FrontLimitEjectionSeat',
            description: '射座前限位',
            lastKey: 'FrontLimitEjectionSeat'
        }, {
            key: 'FrontLimitTransferMode',
            description: '调模前限位',
            lastKey: 'FrontLimitTransferMode'
        }, {
            key: 'BehindLimitTransferMode',
            description: '调模后限位',
            lastKey: 'BehindLimitTransferMode'
        }, {
            key: 'FrontSafeDoorOpen',
            description: '前安全门开',
            lastKey: 'FrontSafeDoorOpen'
        }, {
            key: 'FrontSafeDoorClose',
            description: '前安全门关',
            lastKey: 'FrontSafeDoorClose'
        }, {
            key: 'BehindSafeDoorOpen',
            description: '后安全门开',
            lastKey: 'BehindSafeDoorOpen'
        }, {
            key: 'BehindSafeDoorClose',
            description: '后安全门关',
            lastKey: 'BehindSafeDoorClose'
        }, {
            key: 'RobotReady',
            description: '机械手就绪',
            lastKey: 'RobotReady'
        }, {
            key: 'CloseClampAllowed',
            description: '锁模允许',
            lastKey: 'CloseClampAllowed'
        }, {
            key: 'CloseClampAllowed',
            description: '锁模允许',
            lastKey: 'CloseClampAllowed'
        }, {
            key: 'OpenClampAllowed',
            description: '开模允许',
            lastKey: 'OpenClampAllowed'
        }, {
            key: 'InjectionAllowed',
            description: '注射允许',
            lastKey: 'InjectionAllowed'
        }, {
            key: 'EjectionAllowed',
            description: '顶出允许',
            lastKey: 'EjectionAllowed'
        }, {
            key: 'EjectionBackAllowed',
            description: '顶退允许',
            lastKey: 'EjectionBackAllowed'
        }, {
            key: 'RobotActionFinish',
            description: '机械手取出完成',
            lastKey: 'RobotActionFinish'
        }, {
            key: 'RobotEmergencyStop',
            description: '机械手急停',
            lastKey: 'RobotEmergencyStop'
        }, {
            key: 'MotorStatus',
            description: '电机状态',
            lastKey: 'MotorStatus'
        }, {
            key: 'VisionDetectionPlatformForward',
            description: '视觉检测台滑台启动',
            lastKey: 'VisionDetectionPlatformForward'
        }, {
            key: 'VisionDetectionPlatformBackward',
            description: '视觉检测台滑台返回',
            lastKey: 'VisionDetectionPlatformBackward'
        }, {
            key: 'VisionDetectionPlatformForwardLimited',
            description: '视觉检测台前限位',
            lastKey: 'VisionDetectionPlatformForwardLimited'
        }, {
            key: 'VisionDetectionPlatformBackwardLimited',
            description: '视觉检测台后限位',
            lastKey: 'VisionDetectionPlatformBackwardLimited'
        }, {
            key: 'EmptyBoxForwardLimited',
            description: '空箱前限位',
            lastKey: 'EmptyBoxForwardLimited'
        }, {
            key: 'EmptyBoxBackwardLimited',
            description: '空箱后限位',
            lastKey: 'EmptyBoxBackwardLimited'
        }, {
            key: 'EmptyBoxLeftLimited',
            description: '空箱左限位',
            lastKey: 'EmptyBoxLeftLimited'
        }, {
            key: 'EmptyBoxRightLimited',
            description: '空箱右限位',
            lastKey: 'EmptyBoxRightLimited'
        }, {
            key: 'FullBoxForwardLimited',
            description: '满箱前限位',
            lastKey: 'FullBoxForwardLimited'
        }, {
            key: 'FullBoxBackwardLimited',
            description: '满箱后限位',
            lastKey: 'FullBoxBackwardLimited'
        }, {
            key: 'ReclaimerRobotForward',
            description: '取料机械手启动',
            lastKey: 'ReclaimerRobotForward'
        }, {
            key: 'ReclaimerRobotBackward',
            description: '取料机械手返回',
            lastKey: 'ReclaimerRobotBackward'
        }]
    };
    return settingConfig;
});