define([], function () {
    let settingConfig = {
        app: 'vulcanizing_device',
        dialogTitle: '加硫机数据配置',
        fields: [
            {"key": "DeviceType", "description": "设备型号"},
            {"key": "DeviceSpec", "description": "设备规格"},
            {"key": "DeviceSize", "description": "机械尺寸"},
            {"key": "ProductFactory", "description": "生产厂家"},
            {"key": "ProductDate", "description": "生产日期"},
            {"key": "ProductCapacity", "description": "产能"},
            {"key": "01_value", "description": "温度设定值"},
            {"key": "02_value", "description": "温度当前值"},
            {"key": "03_value", "description": "设备产量"},
            {"key": "04_value", "description": "运行时间"},
            {"key": "05_value", "description": "动作信号"},
            {"key": "SteamNowValue", "description": "蒸汽压力"},
            {"key": "07_value", "description": "设备工作电流"},
            {"key": "BlowerNowValue", "description": "鼓风机工作电流"},
            {"key": "HotWindNowValue", "description": "热风电热管工作电流"},
            {"key": "BoiledWaterValue", "description": "烧水电热管工作电流"},
            {"key": "026_HMILibVersion", "description": "Hmi库版本"},
            {"key": "SteamMax", "description": "蒸汽压力上限"},
            {"key": "BlowerMax", "description": "鼓风机工作电流上限"},
            {"key": "BlowerMin", "description": "鼓风机工作电流下限"},
            {"key": "HotWindMax", "description": "热风电热管工作电流上限"},
            {"key": "HotWindMin", "description": "热风电热管工作电流下限"},
            {"key": "BoiledWaterMax", "description": "烧水电热管工作电流上限"},
            {"key": "BoiledWaterMin", "description": "烧水电热管工作电流下限"},
            {"key": "11_value", "description": "蒸汽压力过高报警"},
            {"key": "12_value", "description": "鼓风机工作异常报警"},
            {"key": "13_value", "description": "热风电热管工作异常报警"},
            {"key": "14_value", "description": "烧水电热管工作异常报警"},
            {"key": "TodayGoal", "description": "今日目标"},
            {"key": "16_value", "description": "运行时间"},
            {"key": "17_value", "description": "实际产量"},
            {"key": "18_value", "description": "设备达成率"}
        ]
    };
    return settingConfig;
});