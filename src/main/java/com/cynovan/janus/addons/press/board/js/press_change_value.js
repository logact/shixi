define([], function () {
    var data = {};
    _.extend(data, {
        TCP_iCurrentMode: {
            '0': '手动模式',
            '1': '半自动模式',
            '2': '全自动模式'
        },
        TCP_iMotorStatus: {
            '0': '未上使能',
            '1': '上使能',
            '2': '电机运动中',
            '3': '驱动报警'
        },
        TCP_iCurrentStage: {
            '1': '待机',
            '2': '快压',
            '3': '探测',
            '4': '压装',
            '5': '保压',
            '6': '回零',
            '10': '回程'
        },
        PMP_iSetPushNum: {
            '1': '一次压装',
            '2': '二次压装',
            '3': '三次压装'
        },
        QCM_bProductQualityOK: {
            '0': '不合格',
            'false': '不合格',
            'FALSE': '不合格',
            '1': '合格',
            'true': '合格',
            'TRUE': '合格'
        },
        iActuallyPushmountingMode: {
            '0': '位置模式',
            '1': '绝对压力模式',
            '2': '位移模式',
            '3': '相对压力模式'
        },
        bRelativePosAlarmBack: {
            '0': '不启用',
            'false': '不启用',
            'FALSE': '不启用',
            '1': '启用',
            'true': '启用',
            'TRUE': '启用'
        },
        iParamsCheck1Mode: {
            '0': '未启用',
            '1': '点检测位置模式',
            '2': '点检测压力模式',
            '3': '区域检测位置模式',
            '4': '区域检测压力模式',
            '5': '窗口检测位置模式',
            '6': '窗口检测压力模式'
        },
        iParamsCheck2Mode: {
            '0': '未启用',
            '1': '点检测位置模式',
            '2': '点检测压力模式',
            '3': '区域检测位置模式',
            '4': '区域检测压力模式',
            '5': '窗口检测位置模式',
            '6': '窗口检测压力模式'
        },
        iParamsCheck3Mode: {
            '0': '未启用',
            '1': '点检测位置模式',
            '2': '点检测压力模式',
            '3': '区域检测位置模式',
            '4': '区域检测压力模式',
            '5': '窗口检测位置模式',
            '6': '窗口检测压力模式'
        },
        iParamsCheck4Mode: {
            '0': '未启用',
            '1': '点检测位置模式',
            '2': '点检测压力模式',
            '3': '区域检测位置模式',
            '4': '区域检测压力模式',
            '5': '窗口检测位置模式',
            '6': '窗口检测压力模式'
        },
        iParamsCheck5Mode: {
            '0': '未启用',
            '1': '点检测位置模式',
            '2': '点检测压力模式',
            '3': '区域检测位置模式',
            '4': '区域检测压力模式',
            '5': '窗口检测位置模式',
            '6': '窗口检测压力模式'
        },
        iPushOverNum: {
            '0': '未启用',
            '1': '启用二次压装'
        },
        PMP_iPushOverNum: {
            '0': '一次压装',
            '1': '二次压装',
            '2': '三次压装'
        },
        iControlMode: {
            '0': '位置模式',
            '1': '压力模式',
            '2': '位移模式',
            '3': '相对压力模式'
        },
        iBackControlMode: {
            '0': '位置模式回退',
            '1': '反拉拉力模式回退',
            '2': '不启用'
        },
        iBackControlMode: {
            '0': '位置模式回退',
            '1': '反拉拉力模式回退',
            '2': '不启用'
        },
        iCurrentPushNumForQCM: {
            '0': '一次压装',
            '1': '二次压装',
            '2': '三次压装'
        },
        bSetDisCrossMode: {
            '0': '穿越',
            '1': '禁止穿越'
        },
        iSetEnterSide: {
            '0': '左侧',
            '1': '右侧',
            '2': '上侧',
            '3': '下侧'
        },
        iSetLeaveSide: {
            '0': '左侧',
            '1': '右侧',
            '2': '上侧',
            '3': '下侧'
        },
        bJudgtEnable: {
            '0': '未启用',
            'false': '未启用',
            'FALSE': '未启用',
            'true': '启用',
            'TRUE': '启用',
            '1': '启用'
        },
        bParamsEnable1: {
            '0': '未启用区域检测功能',
            'false': '未启用区域检测功能',
            'FALSE': '未启用区域检测功能',
            'true': '启用区域检测功能',
            'TRUE': '启用区域检测功能',
            '1': '启用区域检测功能'
        },
        bParamsEnable2: {
            '0': '未启用区域检测功能',
            'false': '未启用区域检测功能',
            'FALSE': '未启用区域检测功能',
            'true': '启用区域检测功能',
            'TRUE': '启用区域检测功能',
            '1': '启用区域检测功能'
        },
        bWindowEnable1: {
            '0': '未启用区域检测功能',
            'false': '未启用区域检测功能',
            'FALSE': '未启用区域检测功能',
            'true': '启用区域检测功能',
            'TRUE': '启用区域检测功能',
            '1': '启用区域检测功能'
        },
        bWindowEnable2: {
            '0': '未启用区域检测功能',
            'false': '未启用区域检测功能',
            'FALSE': '未启用区域检测功能',
            'true': '启用区域检测功能',
            'TRUE': '启用区域检测功能',
            '1': '启用区域检测功能'
        },
        bWindowEnable3: {
            '0': '未启用区域检测功能',
            'false': '未启用区域检测功能',
            'FALSE': '未启用区域检测功能',
            'true': '启用区域检测功能',
            'TRUE': '启用区域检测功能',
            '1': '启用区域检测功能'
        },
        bWindowEnable4: {
            '0': '未启用区域检测功能',
            'false': '未启用区域检测功能',
            'FALSE': '未启用区域检测功能',
            'true': '启用区域检测功能',
            'TRUE': '启用区域检测功能',
            '1': '启用区域检测功能'
        },
        bWindowEnable5: {
            '0': '未启用区域检测功能',
            'false': '未启用区域检测功能',
            'FALSE': '未启用区域检测功能',
            'true': '启用区域检测功能',
            'TRUE': '启用区域检测功能',
            '1': '启用区域检测功能'
        },
        bParamsEnable1: {
            '0': '未启用',
            'false': '未启用',
            'FALSE': '未启用',
            '1': '启用',
            'true': '启用',
            'TRUE': '启用'
        },
        iParamsCheckMode1: {
            '0': '未启用',
            '1': '质量点1',
            '2': '质量点2',
            '3': '质量点3',
            '4': '质量点4',
            '5': '质量点5',
            '11': '区域检测模式',
            '21': '窗口检测1',
            '22': '窗口检测2',
            '23': '窗口检测3',
            '24': '窗口检测4',
            '25': '窗口检测5'
        },
        bSetCheckMode1: {
            '0': '压力模式',
            'TRUE': '压力模式',
            '1': '位置模式',
            'FALSE': '位置模式'
        },
        bParamsEnable2: {
            '0': '未启用',
            'false': '未启用',
            'FALSE': '未启用',
            '1': '启用',
            'true': '启用',
            'TRUE': '启用'
        },
        iParamsCheckMode2: {
            '0': '未启用',
            '1': '质量点1',
            '2': '质量点2',
            '3': '质量点3',
            '4': '质量点4',
            '5': '质量点5',
            '11': '区域检测模式',
            '21': '窗口检测1',
            '22': '窗口检测2',
            '23': '窗口检测3',
            '24': '窗口检测4',
            '25': '窗口检测5'
        },
        bSetCheckMode2: {
            '0': '压力模式',
            'TRUE': '压力模式',
            '1': '位置模式',
            'FALSE': '位置模式'
        },
        bParamsEnable3: {
            '0': '未启用',
            'false': '未启用',
            'FALSE': '未启用',
            '1': '启用',
            'true': '启用',
            'TRUE': '启用'
        },
        iParamsCheckMode3: {
            '0': '未启用',
            '1': '质量点1',
            '2': '质量点2',
            '3': '质量点3',
            '4': '质量点4',
            '5': '质量点5',
            '11': '区域检测模式',
            '21': '窗口检测1',
            '22': '窗口检测2',
            '23': '窗口检测3',
            '24': '窗口检测4',
            '25': '窗口检测5'
        },
        bSetCheckMode3: {
            '0': '压力模式',
            'TRUE': '压力模式',
            '1': '位置模式',
            'FALSE': '位置模式'
        },
        bParamsEnable4: {
            '0': '未启用',
            'false': '未启用',
            'FALSE': '未启用',
            '1': '启用',
            'true': '启用',
            'TRUE': '启用'
        },
        iParamsCheckMode4: {
            '0': '未启用',
            '1': '质量点1',
            '2': '质量点2',
            '3': '质量点3',
            '4': '质量点4',
            '5': '质量点5',
            '11': '区域检测模式',
            '21': '窗口检测1',
            '22': '窗口检测2',
            '23': '窗口检测3',
            '24': '窗口检测4',
            '25': '窗口检测5'
        },
        bSetCheckMode4: {
            '0': '压力模式',
            'TRUE': '压力模式',
            '1': '位置模式',
            'FALSE': '位置模式'
        },
        bParamsEnable5: {
            '0': '未启用',
            'false': '未启用',
            'FALSE': '未启用',
            '1': '启用',
            'TRUE': '启用',
            'true': '启用'
        },
        iParamsCheckMode5: {
            '0': '未启用',
            '1': '质量点1',
            '2': '质量点2',
            '3': '质量点3',
            '4': '质量点4',
            '5': '质量点5',
            '11': '区域检测模式',
            '21': '窗口检测1',
            '22': '窗口检测2',
            '23': '窗口检测3',
            '24': '窗口检测4',
            '25': '窗口检测5'
        },
        bSetCheckMode5: {
            '0': '压力模式',
            'TRUE': '压力模式',
            '1': '位置模式',
            'FALSE': '位置模式'
        },
        bPreAlarmBack: {
            '0': '未启用',
            'false': '未启用',
            'FALSE': '未启用',
            '1': '启用',
            'TRUE': '启用',
            'true': '启用'
        },
        bSetPrePushEnablel: {
            '0': '未启用',
            'false': '未启用',
            'FALSE': '未启用',
            '1': '启用',
            'true': '启用',
            'TRUE': '启用'
        },
        bSetHoldPreEnable: {
            '0': '未启用',
            'false': '未启用',
            'FALSE': '未启用',
            '1': '启用',
            'TRUE': '启用',
            'true': '启用'
        },
        bBackPreAlarmBack: {
            '0': '未启用',
            'false': '未启用',
            'FALSE': '未启用',
            '1': '启用',
            'true': '启用',
            'TRUE': '启用',
        },
        iAlarmDetails: {
            '1': '记录开机时间',
            '1000': '急停',
            '1001': '机器停止以外触发',
            '1002': '安全光栅被触发',
            '1003': '压力传感器故障',
            '1004': 'IO扩展模块通讯故障',
            '1100': '伺服过流',
            '1101': '伺服过压',
            '1102': '伺服欠压',
            '1103': '伺服缺相',
            '1104': '伺服电机编码器出错',
            '1105': '伺服过载',
            '1106': '伺服过热',
            '1107': '伺服IO出错',
            '1108': '伺服制动电阻出错',
            '1109': '伺服功率模块出错',
            '1110': '伺服电机超速',
            '1111': '压力传感器输入过高',
            '1112': '伺服电机旋向出错',
            '1113': '伺服电机瞬时电流过大',
            '1114': '驱动器输出断线',
            '2000': '电缸负向物理限位开关被触发或者当前位置小于等于软负限位值',
            '2001': '电缸正向物理限位开关被触发或者当前位置大于等于软正限位值',
            '2002': '外部安全条件不满足',
            '2100': '伺服驱动器未上强电或电机未成功使能',
            '2101': '动作按钮操作出错',
            '2102': '回零动作按钮操作出错',
            '2110': '快进过程中探测到力',
            '2111': '运动过程中跟随误差超限',
            '2120': '压装过程中压力超过压力保护值',
            '2121': '压装过程中当前位移超过位移保护值',
            '2122': '压装过程中电机电流超过正向最大电流保护值',
            '2123': '压装过程中电机电流小于反向最大电流保护值',
            '2124': '压装过程中外部IO急停信号被触发',
            '2125': '压装过程中当前位置超过位置保护值',
            '2130': '回零Home点捕获失败',
            '2131': '回零Index点捕获失败',
            '2132': '限位开关装反位置',
            '2133': 'Home点开关未安装',
            '2134': '正限位开关安装错误',
            '2135': '负限位开关安装错误',
            '2136': 'Home点与限位开关距离过近',
            '2137': '机构实际位置出错',
            '2138': '回零过程运动行程超出最大保护值',
            '2139': '回零运动电流超过保护值',
            '2200': '周期循环超时',
            '2210': '快进超时',
            '2211': '探测超时',
            '2212': '压装超时',
            '2213': '回程超时',
            '2300': '温度不在设定温区范围内',
            '2340': '电机温度超过设定保护值',
            '3000': '回零未完成，无法进行手动及自动操作',
            '3100': '压装时夹具未锁紧',
            '3101': '一次压装时气夹未夹紧/二次压装时气夹未松开',
            '3102': '动作时真空吸嘴未吸附产品',
            '3103': '转盘没到位',
            '3104': '预压气缸01动作超时',
            '3105': '预压气缸02动作超时',
            '3106': '顶出气缸动作超时',
            '3200': '回零已完成',
            '3210': '压装已完成',
            '3211': '回程已完成',
            '3300': '当前探测位置小于原点位置',
            '3400': '端口IO地址被重复使用',
            '3401': '端口IO地址范围出错',
            '3402': '端口IO信号系统不支持',
            '3410': '当前文件名为空，请填入文件名或在文件列表中选中待操作文件',
            '4000': '无效的参数',
            '4001': '压力补偿位置校正数据未按顺序排',
            '4100': '密码输入错误',
            '4101': '创建的用户名已存在',
            '4102': '密码前后不一致',
            '4103': '用户列表已满无法创建新用户',
            '4104': '需要创建一个10级系统用户',
            '4105': '用户名输入错误',
            '4106': '用户等级输入错误',
            '4210': '批产量已完成',
            '4211': '超过维保次数',
            '4220': '位置模式下压装位置超过设定的终点位置',
            '4221': '探测结束未压倒产品',
            '4300': '文件不存在',
            '4301': '文件已存在',
            '4302': '文件列表已满',
            '4303': '文件名错误',
            '4304': '文件操作范围出错',
            '4305': '控制器可用存储空间不足',
            '4401': 'U盘可用存储空间不足',
            '4402': '未检测到可用的U盘',
            '4403': '数据文件夹复制失败',
            '5001': '一次压装点检测位置检测模式下压力超过上下限制值',
            '5002': '一次压装点检测压力检测模式下位置超过上下限制值',
            '5003': '二次压装点检测位置检测模式下压力超过上下限制值',
            '5004': '二次压装点检测压力检测模式下位置超过上下限制值',
            '5005': '三次压装点检测位置检测模式下压力超过上下限制值',
            '5006': '三次压装点检测压力检测模式下位置超过上下限制值',
            '5010': '一次压装区域检测位置检测模式下压力超过上下限制值',
            '5011': '三次压装区域检测压力检测模式下位置超过上下限制值',
            '5020': '一次压装位置窗口检测压力超过上下限制值',
            '5021': '一次压装压力窗口检测位置超过上下限制值',
            '5022': '二次压装位置窗口检测压力超过上下限制值',
            '5023': '二次压装压力窗口检测位置超过上下限制值',
            '5024': '三次压装位置窗口检测压力超过上下限制值',
            '5025': '三次压装压力窗口检测位置超过上下限制值',
            '5030': '一次压装特殊点判断出错',
            '5031': '二次压装特殊点判断出错',
            '5032': '三次压装特殊点判断出错',
            '6001': 'TCP/IP通讯连接失败',
            '6002': 'TCP/IP数据发送失败',
            '6011': '串口通讯失败',
            '6012': '串口读取失败',
            '6020': '外部PLC控制许可中断',
        },
        iLogDetails: {
            '1000': '记录开机时间',
            '1001': '登录账户名',
            '1002': '登录时间',
            '1003': '登出时间',
            '1100': '进入自动/半自动时间',
            '1101': '离开自动/半自动时间',
            '2000': '压装模式修改：0-不用、1-位置、2-绝对压力、3-位移、4、相对压力',
            '2001': '位置目标值修改',
            '2002': '压力目标值修改',
            '2003': '位移目标值修改',
            '2004': '相对压力目标值修改',
            '2010': '压力保护值修改',
            '2011': '位置保护值修改',
            '2012': '位置保护功能启用修改',
            '2013': '位移保护值修改',
            '2014': '位移保护功能启用修改',
            '2020': '回退模式修改',
            '2030': '探测接触压力值修改',
            '2040': '压装位置到位误差值修改',
            '2041': '压装压力到位误差值修改',
            '3000': '安全光栅被强制输入',
            '3001': '外部安全信号被强制输入',
            '3002': '抱闸被强制输出',
            '3003': '回零电流保护值被修改',
            '3004': '压装动作电流保护值被修改',
            '3005': '压力校正重新进行了标定',
            '3006': '回零方式修改',
            '3007': '正限位保护被取消',
            '3008': '负限位保护被取消',
            '4000': '系统进行了升级',
            '4001': '系统修改了机床编号'
        }
    });
    return data;
});