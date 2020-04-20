define([], function () {
    let settingConfig = {
        app: 'refrigerating_device',
        dialogTitle: '冷冻机数据配置',
        fields: [
            {"key": "DeviceType", "description": "设备型号"},
            {"key": "DeviceSpec", "description": "设备规格"},
            {"key": "DeviceSize", "description": "机械尺寸"},
            {"key": "ProductFactory", "description": "生产厂家"},
            {"key": "ProductDate", "description": "生产日期"},
            {"key": "ProductCapacity", "description": "产能"},
            {"key": "01_value", "description": "单次开机运行时间"},
            {"key": "CompressorNowValue", "description": "压缩机工作电流"},
            {"key": "FanNowValue", "description": "压缩机散热风扇工作电流"},
            {"key": "BoxNowValue", "description": "箱体内温度"},
            {"key": "MotorNowValue", "description": "输送带马达工作电流"},
            {"key": "06_value", "description": "压缩机工作异常报警"},
            {"key": "07_value", "description": "压缩机散热风扇工作异常报警"},
            {"key": "08_value", "description": "箱体内温度异常报警"},
            {"key": "09_value", "description": "输送带马达工作异常报警"},
            {"key": "CompressorMax", "description": "压缩机工作电流上限"},
            {"key": "CompressorMin", "description": "压缩机工作电流下限"},
            {"key": "FanMin", "description": "压缩机散热风扇工作电流下限"},
            {"key": "FanMax", "description": "压缩机散热风扇工作电流上限"},
            {"key": "BoxMin", "description": "箱体内温度下限"},
            {"key": "BoxMax", "description": "箱体内温度上限"},
            {"key": "MotorMin", "description": "输送带马达工作电流下限"},
            {"key": "MotorMax", "description": "输送带马达工作电流上限"},
        ]
    };
    return settingConfig;
});