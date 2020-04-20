define([], function () {
    let settingConfig = {
        app: 'cutting_device',
        dialogTitle: '皮料切割机数据配置',
        fields: [
            {"key": "DeviceType", "description": "设备型号"},
            {"key": "DeviceSpec", "description": "设备规格"},
            {"key": "CuttingSpeed", "description": "切割速度"},
            {"key": "ProductFactory", "description": "生产厂家"},
            {"key": "ProductDate", "description": "生产日期"},
            {"key": "DeviceVoltage", "description": "设备工作电压"},
            {"key": "CuttingMaterial", "description": "切割材料"},
            {"key": "CuttingCount", "description": "刀头数"},
            {"key": "01_value", "description": "设备加工产量"},
            {"key": "02_value", "description": "单次运行时间"},
            {"key": "03_value", "description": "设备动作"},
            {"key": "04_value", "description": "设备工作电流"},
            {"key": "FanNowTemp", "description": "散热风扇温度"},
            {"key": "PumpNowValue", "description": "真空泵工作电流"},
            {"key": "CuttingHeadNowValue1", "description": "切割刀头工作电流1"},
            {"key": "CuttingHeadNowValue2", "description": "切割刀头工作电流2"},
            {"key": "PumpMax", "description": "真空泵工作电流上限"},
            {"key": "PumpMin", "description": "真空泵工作电流下限"},
            {"key": "CuttingHeadMax1", "description": "切割刀头1工作电流上限"},
            {"key": "CuttingHeadMin1", "description": "切割刀头1工作电流下限"},
            {"key": "CuttingHeadMax2", "description": "切割刀头2工作电流上限"},
            {"key": "CuttingHeadMin2", "description": "切割刀头2工作电流下限"},
            {"key": "FanMax", "description": "散热风扇工作温度上限"},
            {"key": "FanMin", "description": "散热风扇工作温度下限"},
            {"key": "05_value", "description": "散热扇温度报警"},
            {"key": "06_value", "description": "真空泵工作异常报警"},
            {"key": "07_value", "description": "切割刀头1报警"},
            {"key": "08_value", "description": "切割刀头2报警"},
            {"key": "TodayGoal", "description": "今日目标"},
            {"key": "09_value", "description": "运行时间"},
            {"key": "10_value", "description": "实际产量"},
            {"key": "11_value", "description": "设备达成率"}
        ]
    };
    return settingConfig;
});