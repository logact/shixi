NeptunePreview = function (_editor) {
    this.editor = _editor;
    this.graph = _editor.graph;
    this.socketMap = {};
    this.stompClientMap = {};

    /*记录UUID和组件的对应关系
    {
     "AAA":{
        expression:[{
            id: mxCellId, 代表影响的mxCell
            key:'visible', 代表影响的是mxCell的visible表达式
        }],
        field:[{ //代表影响的是field的值
            id:mxCellId
        }],
        chart:[{
            id:mxCellId,代表影响的是chart的值
        }]
     }
    }
    * */
    this.uuidWidgetMap = {};
    /*存储所有的expression, key 为expression的md5,value为对应的方法*/
    this.expressionFuncCache = {};
    /*存储所有mxCell对应的bgcolors配置*/
    this.dynamicBgColors = {};
    /*存储所有mxCell对应的linechart配置*/
    this.linechart = {};
    /*存储所有mxCell对应的historyData配置*/
    this.historyDataChart = {};
    /*存储所有mxCell对应的dashboard配置*/
    this.dashboard = {};
    this.rootData = {};
    this.mxCellMap = {};
    /*存储所有mxCell对应的timeline配置*/
    this.timeline = {};
    /*存储所有mxCell对应的map配置*/
    this.mapSettingMap = {};
    /*标记占位符的设备列表,key为Placeholder的原本的UUID，value为Placeholder选中的UUID*/
    this.devicePlaceHolderMap = {};
    /*存储时钟的jquery对象*/
    this.clocks = [];
    this.initialize();
};

NeptunePreview.prototype.initialize = function () {
    this.bindEvent();
};

NeptunePreview.prototype.clearPageState = function () {
    /*取消订阅设备数据*/
    var self = this;
    var uuids = _.values(this.devicePlaceHolderMap);
    _.each(uuids, function (uuid) {
        self.unsubDevice(uuid);
    });
    $('.prototype_preview_device_placeholder_box').html('');
    this.devicePlaceHolderMap = {};
    this.uuidWidgetMap = {};
    this.expressionFuncCache = {};
    this.dynamicBgColors = {};
    this.linechart = {};
    this.historyDataChart = {};
    this.dashboard = {};
    this.rootData = {};
    this.mxCellMap = {};
    this.mapSettingMap = {};
};

NeptunePreview.prototype.renderDevicePlaceholder = function () {
    var self = this;
    var id = NeptuneUtils.findGetParameter('id');
    NeptuneUtils.getPlaceholderList(id).done(function (list) {
        var placeholders = list;
        if (_.size(placeholders)) {
            /*render的时候自动设置对应传过来的参数*/
            var size = _.size(placeholders);
            var uuidArr = [];
            _.times(size, function (idx) {
                var value = NeptuneUtils.findGetParameter('uuid' + (idx + 1));
                if (!value) {
                    /*当页面没有传入UUID时，则使用默认值*/
                    value = _.get(placeholders, idx + '.default', '');
                }
                uuidArr.push(value);
            });
            _.each(placeholders, function (placeholder, idx) {
                var defaultUuid = _.get(uuidArr, idx, '');
                self.createDevicePlaceholder(placeholder, defaultUuid);
            });
        }
    })
};

NeptunePreview.prototype.createDevicePlaceholder = function (placeholder, defaultUuid) {
    var self = this;
    var html = [];
    html.push(`<div class="prototype_device_placeholder" data-placeholder="${placeholder.name}">`);
    html.push(`<div class="prototype_device_placeholder-label">${placeholder.name}</div>`);
    html.push(`<div class="prototype_device_placeholder-select"><select class="format-input chosen-select"></select></div>`);
    html.push('</div>');

    var placeholderBox = $(html.join(''));
    $('.prototype_preview_device_placeholder_box').append(placeholderBox);
    NeptuneUtils.getDeviceClsData().done(function (res) {
        var deviceList = [];
        let clsCode_device_map = _.get(res, "clsCode_device_map", {});
        var clsCode = _.get(placeholder, 'clsCode', '');
        if (clsCode) {
            deviceList = _.get(clsCode_device_map, clsCode, []);
        } else {
            _.each(clsCode_device_map, function (valueArr) {
                deviceList = _.concat(deviceList, valueArr);
            });
        }
        var selectOpHtml = [];
        selectOpHtml.push('<option value="">请选择设备...</option>');
        _.each(deviceList, function (device) {
            selectOpHtml.push(`<option value="${device.uuid}">${device.uuid}(${device.baseInfo.name})</option>`);
        });

        var select = placeholderBox.find('select');
        select.append(selectOpHtml.join(''));
        select.chosen({
            search_contains: true,
            allow_single_deselect: true,
            no_results_text: "没有匹配结果"
        }).change(function (event, item) {
            var placeHolderUuid = $(event.target).closest('.prototype_device_placeholder').data('placeholder');
            var selectUuid = _.get(item, 'selected', '');
            if (selectUuid) {
                self.onDevicePlaceholderChange(placeHolderUuid, selectUuid);
            }
        });

        if (defaultUuid) {
            select.val(defaultUuid).trigger("chosen:updated");
            self.onDevicePlaceholderChange(placeholder.name, defaultUuid);
        }
    });
};

NeptunePreview.prototype.onDevicePlaceholderChange = function (placeHolderUuid, uuid) {
    this.devicePlaceHolderMap[placeHolderUuid] = uuid;
    /*unsub原来的设备数据*/
    this.unsubDevice(uuid);
    delete this.rootData['$' + placeHolderUuid + '$'];
    /*订阅转换后的数据*/
    var changeToUuid = this.devicePlaceHolderMap[placeHolderUuid];
    if (changeToUuid) {
        this.subDevice(changeToUuid);
        this.loadDeviceRootData([uuid]);
        this.loadDeviceTimeline(placeHolderUuid);
    }
    var self = this;
    setTimeout(function () {
        self.updateHistoryDataChart(uuid);
        self.updateMap(uuid, placeHolderUuid);
    }, 300)
};

NeptunePreview.prototype.loadDeviceTimeline = function (placeHolderUuid) {

    /*TODO:Aric.chen 获取设备关联对应的时间轴chart*/
    var self = this;
    /*此处代码为示例*/
    if (!_.isEmpty(self.timeline)) {
        var charts = _.get(self.timeline, placeHolderUuid, []);
        /*通过此语句即可获得charts对应的真实uuid*/
        var uuid = this.devicePlaceHolderMap[placeHolderUuid];
        // 此处进行加载数据并更新图表操作
        if (_.size(charts)) {
            _.each(charts, function (chart_instance_data) {
                self.updateCellTimelineChart(uuid, chart_instance_data);
            });
        }
    }
};

NeptunePreview.prototype.updateCellTimelineChart = function (uuid, chart_instance_data, type) {
    if (_.isEmpty(type)) {
        type = 'today';
    }
    DeviceTimelineService.getChartConfig(echarts, uuid, type, "", "").done(function (config) {
        var component = $('#component-' + chart_instance_data.id);
        var status_info = component.find(".status-info");
        status_info.find(".normal").text(getTime(moment.duration(config.normalduration), uuid));
        status_info.find(".warning").text(getTime(moment.duration(config.warningduration), uuid));
        status_info.find(".alarm").text(getTime(moment.duration(config.alarmduration), uuid));
        status_info.find(".offline").text(getTime(moment.duration(config.offlineduration), uuid));

        var timeline_options = config.options;
        var state_options = config.stateoptions;
        _.set(timeline_options, "dataZoom[0].height", 8);
        if (_.isEmpty(uuid)) {
            timeline_options.yAxis.data = [];
            timeline_options.series[0].data = [];
        }
        if (chart_instance_data.timeline_chart_instance) {
            chart_instance_data.timeline_chart_instance.setOption(timeline_options);
        }
        if (chart_instance_data.state_chart_instance) {
            chart_instance_data.state_chart_instance.setOption(state_options);
        }
    });

    function getTime(duration, uuid) {
        if (uuid) {
            return duration.hours() + 'h' + duration.minutes() + 'm' + duration.seconds() + 's';
        } else {
            return '0h0m0s';
        }
    }
};

NeptunePreview.prototype.onPageRender = function () {
    var self = this;
    this.clearPageState();
    this.putCellToMap();
    this.analysisPage();
    setTimeout(function () {
        /*Aric.Chen。此处不加载任何的RootData，等待用户选择*/
        // this.loadDeviceRootData(_.keys(this.uuidWidgetMap));
        // this.subAllDeviceData();
        self.reRenderCells();
        /*计算可替换的设备列表*/
        self.renderDevicePlaceholder();
    }, 200);
};

NeptunePreview.prototype.loadDeviceRootData = function (uuids) {
    var self = this;
    uuids = JSON.stringify(uuids);
    uuids = encodeURIComponent(uuids);
    $.ajax({
        url: cynovan.c_path + '/monitor_developer/loadRootData',
        method: 'post',
        dataType: 'json',
        data: {
            'uuids': uuids
        },
        success: function (result) {
            /*加载回来的数据是具体的UUID，放进rootData时，需要转换为虚拟的PlaceHolder*/
            var placeHolderData = {};

            var dataUuids = _.keys(result);
            _.each(dataUuids, function (uuid) {
                /*找到UUID对应的虚拟的PlaceHolder*/
                _.each(self.devicePlaceHolderMap, function (targetUuid, placeholderId) {
                    if (uuid === targetUuid) {
                        _.set(placeHolderData, '$' + placeholderId + '$', _.get(result, targetUuid, {}));
                    }
                });
            });
            _.extend(self.rootData, placeHolderData);
            self.updatePage();
        }
    });
};

NeptunePreview.prototype.timelineDataProcess = function (data) {

};

NeptunePreview.prototype.updateTimeline = function () {
}

NeptunePreview.prototype.processPlaceholderData = function (data) {
    var uuid = data.uuid;
    if (uuid) {
        var targetUuid = '';
        _.each(this.devicePlaceHolderMap, function (changeToUuid, originUuid) {
            if (uuid === changeToUuid) {
                targetUuid = originUuid;
            }
        });
        /*把数据转到原来的占位符设备上*/
        if (targetUuid) {
            data.uuid = targetUuid;
        }
    }
};

NeptunePreview.prototype.onData = function (data) {
    var uuid = data.uuid;
    if (uuid) {
        var dataKey = '$' + uuid + '$.dynamic';
        var dynamic = _.get(data, 'data', {});
        /*时间放进去*/
        dynamic.time = data.time;
        _.setWith(this.rootData, dataKey, dynamic, Object);

        /*触发页面重新计算*/
        this.updatePage();
    }
};

/*每200毫秒一定执行一次*/
NeptunePreview.prototype.updatePage = _.throttle(function () {
    var uuids = _.keys(this.uuidWidgetMap);
    var self = this;
    _.each(uuids, function (uuid) {
        self.updateField(uuid);
        self.updateExpressionWidgets(uuid);
        self.updateLinechart(uuid);
        self.updateDashboard(uuid);
    });
}, 200);

NeptunePreview.prototype.updateField = function (uuid) {
    var deviceData = _.get(this.rootData, '$' + uuid + '$.dynamic', {});
    var field = _.get(this.uuidWidgetMap, uuid + '.field', []);
    if (_.size(field)) {
        var self = this;
        this.graph.getModel().beginUpdate();
        try {
            _.each(field, function (item) {
                var value = _.get(deviceData, item.key, 0);
                var mxCell = self.mxCellMap[item.id];
                var componentId = self.getComponentId(mxCell);

                var ele = $('#' + componentId);
                var switchEle = ele.find('.p-switch');
                var suffix = "";
                if (item.suffix) {
                    suffix = `<span>` + item.suffix + `</span>`;
                }
                if (switchEle.length) {
                    var checkbox = switchEle.find('input');
                    if (!value || value === '0' || value === 'false') {
                        value = false;
                    } else {
                        value = true;
                    }
                    checkbox.prop('checked', value);
                } else {
                    ele.find('.component-field').html(value + suffix);
                }
            });
        } finally {
            this.graph.getModel().endUpdate();
        }
    }
};

NeptunePreview.prototype.updateExpressionWidgets = function (uuid) {
    var expressions = _.get(this.uuidWidgetMap, uuid + '.expression', []);
    if (_.size(expressions)) {
        var self = this;
        this.graph.getModel().beginUpdate();
        try {
            _.each(expressions, function (item) {
                var value = self.calcExpressionValue(item.expressionMd5);
                var mxCell = self.mxCellMap[item.id];
                if (item.type === 'visible') {
                    self.graph.getModel().setVisible(mxCell, value);
                } else if (item.type === 'bg_color') {
                    var color = _.get(self.dynamicBgColors, item.id + '.' + value, '');
                    self.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, color, [mxCell]);
                } else if (item.type === 'animate') {
                    var is_use_animation_expression = self.graph.getAttributeForCell(mxCell, "is_use_animation_expression");
                    if (is_use_animation_expression === 'true') {
                        if (value) {
                            self.setCellAnimation(mxCell);
                        } else {
                            self.removeCellAnimation(mxCell);
                        }
                    }
                } else if (item.type === 'value') {
                    var componentId = self.getComponentId(mxCell);
                    var ele = $('#' + componentId);
                    var switchEle = ele.find('.p-switch');
                    if (switchEle.length) {
                        switchEle.removeClass('p-on p-off');
                        if (!value || value === '0') {
                            value = false;
                        }
                        if (value) {
                            switchEle.addClass('p-on');
                        } else {
                            switchEle.addClass('p-off');
                        }
                    } else {
                        ele.find('.component-field').text(value);
                    }
                } else if (item.type === 'flowbar') {
                    var is_use_flowbar_expression = self.graph.getAttributeForCell(mxCell, "is_use_flowbar_expression");
                    if (is_use_flowbar_expression === 'true') {
                        if (value) {
                            self.setCellFlowBar(mxCell);
                        } else {
                            self.removeCellFlowBar(mxCell);
                        }
                    }
                } else if (item.type === 'progressbar') {
                    var is_use_progressbar_expression = self.graph.getAttributeForCell(mxCell, "is_use_progressbar_expression");
                    if (is_use_progressbar_expression === 'true') {
                        if (value) {
                            let progressValue = _.parseInt(value);
                            if (_.isNumber(progressValue)) {
                                self.updateCellProgressBar(mxCell, progressValue);
                            }
                        }
                    }
                }
            });
        } finally {
            this.graph.getModel().endUpdate();
        }
    }
};

NeptunePreview.prototype.updateHistoryDataChart = function (newuuid) {
    var self = this;
    self.graph.getCellStyle();
    var uuids = _.keys(self.uuidWidgetMap);
    _.each(uuids, function (uuid) {
        var charts = _.get(self.historyDataChart, uuid, []);
        if (_.size(charts)) {
            _.each(charts, function (chart) {
                self.updateCellHistoryDataChart(uuid, chart, newuuid);
            });
        }
    });
};


NeptunePreview.prototype.subDeviceHistory = function (topic, chart) {
    if (!topic) {
        return;
    }
    if (this.socketMap[topic]) {
        return;
    }
    var myChart = chart.chart;
    var series = chart.series;
    var socket = new SockJS(cynovan.c_path + '/ws', null, {});
    var stompClient = Stomp.over(socket);
    if (!cynovan.debug) {
        stompClient.debug = null;
    }
    var topic = '/ws/' + topic;

    var onData = function (result) {
        if (result && result.body) {
            var data = {};
            try {
                data = JSON.parse(result.body);
            } catch (e) {
                data = JSON.parse(_.replace(result.body, /NaN/g, "0"));
            }
            var charData = _.get(data, 'data', []);
            var options = myChart.getOption();
            options.xAxis[0].data = _.get(charData, 0, []);
            _.each(series, function (s, i) {
                series[i].data = _.get(charData, i + 1, []);
            });
            options.series = series;
            myChart.setOption(options);
            myChart.hideLoading();
            this.unsubDevice(topic);
        }
    };
    this.socketMap[topic] = socket;
    this.stompClientMap[topic] = stompClient;

    stompClient.connect({}, function (frame) {
        stompClient.subscribe(topic, function (result) {
            onData.call(null, result);
        });
    });
};

NeptunePreview.prototype.updateCellHistoryDataChart = function (uuid, chart, newuuid) {
    var self = this;
    var mxCell = this.mxCellMap[chart.id];
    let updateTime = self.getCellAttr(mxCell, 'updateTime');
    let useOrigin = self.getCellAttr(mxCell, 'useOrigin');
    let chartType = self.getCellAttr(mxCell, 'chart_type');
    let startDate = self.getCellAttr(mxCell, 'historyData_startDate');
    let rangType = self.getCellAttr(mxCell, 'historyData_rangeType');
    let endDate = self.getCellAttr(mxCell, 'historyData_endDate');
    let groups = self.getCellAttr(mxCell, 'groups');
    let fields = self.getCellAttr(mxCell, 'fields');

    if (groups) {
        groups = JSON.parse(groups);
    }
    if (fields) {
        fields = JSON.parse(fields);
    }

    if (uuid && !_.isEmpty(groups) && !_.isEmpty(fields)) {
        let virtualDevice = _.find(NeptuneUtils.placeholderList, {"uuid": uuid});
        let defaultuuid = _.get(virtualDevice, 'default', '');
        if (newuuid !== defaultuuid) {
            var myChart = chart.chart;
            var series = chart.series;
            _.each(series, function (s, i) {
                series[i].data = [];
            });
            myChart.showLoading({
                text: '正在加载数据...',
            });
            var data = {
                chartId: chart.id + updateTime,
                useOrigin: useOrigin,
                chartType: chartType,
                uuid: newuuid,
                rangType: rangType,
                startDate: startDate,
                endDate: endDate,
                groups: groups,
                fields: fields
            };
            NeptuneHttp.get('bi/data', {
                data: encodeURIComponent(JSON.stringify(data))
            }).done(function (result) {
                var type = _.get(result, 'datas.type', '');
                if (_.eq(type, 'geted')) {
                    var response = _.get(result, 'datas.data', {});
                    var data = _.get(response, 'data', []);
                    var options = myChart.getOption();
                    options.xAxis[0].data = _.get(data, 0, []);
                    _.each(series, function (s, i) {
                        series[i].data = _.get(data, i + 1, []);
                    });
                    series = _.takeRight(series, 1000)
                    options.series = series;
                    myChart.setOption(options);
                    myChart.hideLoading();
                } else if (_.eq(type, 'waiting') || _.eq(type, 'calculating')) {
                    var chart_id = _.get(result, 'datas.chart_id', '');
                    if (chart_id) {
                        self.subDeviceHistory(_.join(['historydata/', chart_id], ''), chart);
                    }
                }
            });
        }
    }
}

NeptunePreview.prototype.updateLinechart = function (uuid) {
    var self = this;
    self.graph.getCellStyle();
    var charts = _.get(this.linechart, uuid, []);
    if (_.size(charts)) {
        _.each(charts, function (chart) {
            self.updateCellLinechart(uuid, chart);
        });
    }
};

NeptunePreview.prototype.updateCellLinechart = function (uuid, config) {
    var deviceData = _.get(this.rootData, '$' + uuid + '$.dynamic', {});
    var xData = _.get(config, 'xData', []);
    if (xData.length > 50) {
        xData.shift();
    }
    var time = deviceData.time;
    if (time) {
        if (time.length > 11) {
            time = time.substr(11);
        }
        xData.push(time);
    }
    var series = _.get(config, 'series', []);
    _.each(series, function (item) {
        var value = _.get(deviceData, item.key, 0);
        if (item.data.length > 50) {
            item.data.shift();
        }
        item.data.push(value);
    });
    var options = {
        xAxis: {
            data: xData
        },
        series: series
    };
    if (config.chart) {
        config.chart.setOption(options);
    }
};

NeptunePreview.prototype.updateDashboard = function (uuid) {
    var self = this;
    var charts = _.get(this.dashboard, uuid, []);
    if (_.size(charts)) {
        _.each(charts, function (chart) {
            self.updateCellDashboard(uuid, chart);
        });
    }
};

NeptunePreview.prototype.updateCellDashboard = function (uuid, config) {
    var deviceData = _.get(this.rootData, '$' + uuid + '$.dynamic', {});
    var key = _.get(config, 'key');
    var value = _.get(deviceData, key, 0);

    if (isNaN(value)) {
        value = 0;
    }
    if (config.gauge) {
        var units = config.gauge.options.save_units;
        config.gauge.options.units = value + " " + units;
        config.gauge.update({
            value: value
        });
    }
};

NeptunePreview.prototype.calcExpressionValue = function (md5) {
    var func = this.expressionFuncCache[md5];
    var result = false;
    if (func) {
        try {
            result = func(this.rootData);
        } catch (e) {

        }
    }
    if (_.isUndefined(result)) {
        result = false;
    }
    return result;
};

NeptunePreview.prototype.unsubDevice = function (uuid) {
    var client = this.stompClientMap[uuid];
    if (client) {
        client.disconnect();
        delete this.stompClientMap[uuid];
    }

    var sock = this.socketMap[uuid];
    if (sock) {
        sock.close();
        delete this.socketMap[uuid];
    }
};

NeptunePreview.prototype.subDevice = function (uuid) {
    if (!uuid) {
        return;
    }
    if (this.socketMap[uuid]) {
        return;
    }
    var self = this;
    var socket = new SockJS(cynovan.c_path + '/ws', null, {});
    var stompClient = Stomp.over(socket);
    if (!cynovan.debug) {
        stompClient.debug = null;
    }
    var topic = '/ws/deviceData/' + uuid;

    var onData = _.throttle(function (result) {
        if (result && result.body) {
            var data = {};
            try {
                data = JSON.parse(result.body);
            } catch (e) {
                data = JSON.parse(_.replace(result.body, /NaN/g, "0"));
            }
            self.timelineDataProcess(data);
            self.processPlaceholderData(data);
            self.onData(data);
        }
    }, 180);
    this.socketMap[uuid] = socket;
    this.stompClientMap[uuid] = stompClient;

    stompClient.connect({}, function (frame) {
        stompClient.subscribe(topic, function (result) {
            onData.call(null, result);
        });
    });
};

NeptunePreview.prototype.subAllDeviceData = function () {
    var self = this;
    var uuids = _.keys(this.uuidWidgetMap);
    _.each(uuids, function (uuid) {
        self.subDevice(uuid);
    });
};

NeptunePreview.prototype.analysisPage = function () {
    this.analysisExpression();
    /*解析所有的field*/
    this.analysisField();
    this.analysisControl();
    this.analysisChart();
}

NeptunePreview.prototype.analysisField = function () {
    var self = this;
    _.each(this.mxCellMap, function (mxCell) {
        var style = mxCell.style;
        if (style.indexOf('tag2=field') !== -1) {
            var device_field_expression_value = self.getCellAttr(mxCell, 'device_field_expression_value');
            if (device_field_expression_value !== 'true') {
                var device_uuid = self.getCellAttr(mxCell, 'device_uuid');
                var device_fields = self.getCellAttr(mxCell, 'device_fields');
                if (_.size(device_fields) && device_uuid) {
                    device_fields = JSON.parse(device_fields);
                    _.each(device_fields, function (item) {
                        var fieldWidgets = _.get(self.uuidWidgetMap, device_uuid + '.field', []);
                        fieldWidgets.push({
                            id: mxCell.id,
                            key: item.key,
                            name: item.name,
                            suffix: item.suffix
                        });
                        _.set(self.uuidWidgetMap, device_uuid + '.field', fieldWidgets);
                    })
                }
            }
        }
    });
};

NeptunePreview.prototype.analysisControl = function () {
    var self = this;
    _.each(this.mxCellMap, function (mxCell) {
        var style = mxCell.style;
        if (style.indexOf('tag2=control') !== -1) {
            var device_fields = self.getCellAttr(mxCell, 'device_fields');
            var control_cmd_type = self.getCellAttr(mxCell, 'control_cmd_type');
            if (control_cmd_type === 'singleDeviceValue') {
                var device_uuid = self.getCellAttr(mxCell, 'device_uuid');
                if (_.size(device_fields) && device_uuid) {
                    device_fields = JSON.parse(device_fields);
                    _.each(device_fields, function (item) {
                        var controlWidgets = _.get(self.uuidWidgetMap, device_uuid + '.control', []);
                        controlWidgets.push({
                            id: mxCell.id,
                            key: item.key,
                            name: item.name
                        });
                        _.set(self.uuidWidgetMap, device_uuid + '.control', controlWidgets);
                    })
                }
            } else if (control_cmd_type === 'multipleDeviceValue') {
                var multi_device_uuid = self.getCellAttr(mxCell, 'multi_device_uuid');
                if (_.size(device_fields) && multi_device_uuid) {
                    var uuids = multi_device_uuid.split(',');
                    _.each(uuids, function (uuid) {
                        var multiControlWidgets = _.get(self.uuidWidgetMap, uuid + '.multiControl', []);
                        multiControlWidgets.push({
                            id: mxCell.id
                        })
                        _.set(self.uuidWidgetMap, uuid + '.multiControl', multiControlWidgets);
                    })
                }
            }
        }
    });
};

NeptunePreview.prototype.analysisChart = function () {
    var self = this;
    _.each(this.mxCellMap, function (mxCell) {
        var style = mxCell.style;
        if (style.indexOf('tag2=linechart') !== -1 || style.indexOf('tag2=historychart') !== -1 || style.indexOf('tag2=dashboard') !== -1) {
            var device_uuid = self.getCellAttr(mxCell, 'device_uuid');
            if (device_uuid) {
                var chartWidgets = _.get(self.uuidWidgetMap, device_uuid + '.chart', []);
                chartWidgets.push({
                    id: mxCell.id
                });
                _.set(self.uuidWidgetMap, device_uuid + '.chart', chartWidgets);
            }
        }
    });
};

/**
 * 收取所有表达式对应的UUID，作为顶部栏显示的信息
 */
NeptunePreview.prototype.analysisExpression = function () {
    var self = this;
    _.each(this.mxCellMap, function (mxCell) {
        self.analysisCellExpression(mxCell);
    });
};

NeptunePreview.prototype.analysisCellExpression = function (mxCell) {
    var style = mxCell.style;
    this.analysisCellTypeExpression(mxCell, 'visible_code_expression', 'visible');
    this.analysisCellTypeExpression(mxCell, 'bgcolor_code_expression', 'bg_color');
    this.analysisCellTypeExpression(mxCell, 'animate_code_expression', 'animate');

    /*动态颜色*/
    var dynamicBgColors = this.getCellAttr(mxCell, 'dynamic_bgcolors');
    if (dynamicBgColors) {
        var self = this;
        var id = mxCell.id;
        var colors = JSON.parse(dynamicBgColors);
        if (_.size(colors)) {
            _.each(colors, function (item) {
                var value = _.get(item, 'value', '');
                var color = _.get(item, 'color', '');
                _.setWith(self.dynamicBgColors, id + '.' + value, color, Object);
            });
        }
    }

    if (style.indexOf('tag2=field') !== -1) {
        var device_field_expression_value = this.getCellAttr(mxCell, 'device_field_expression_value');
        if (device_field_expression_value === 'true') {
            this.analysisCellTypeExpression(mxCell, 'device_field_code_expression', 'value');
        }
    }
    if (style.indexOf('tag2=flowbar') !== -1) {
        var is_use_flowbar_expression = this.getCellAttr(mxCell, 'is_use_flowbar_expression');
        if (is_use_flowbar_expression === 'true') {
            this.analysisCellTypeExpression(mxCell, 'flow_code_expression', 'flowbar');
        }
    }
    if (style.indexOf('tag2=progressbar') !== -1) {
        var is_use_progressbar_expression = this.getCellAttr(mxCell, 'is_use_progressbar_expression');
        if (is_use_progressbar_expression === 'true') {
            this.analysisCellTypeExpression(mxCell, 'progressbar_code_expression', 'progressbar');
        }
    }
};

NeptunePreview.prototype.expressionToFunc = function (expression) {
    var md5 = SparkMD5.hash(expression);
    var func = this.expressionFuncCache[md5];
    if (!func) {
        func = new Function('root', expression);
        this.expressionFuncCache[md5] = func;
    }
    return md5;
};

NeptunePreview.prototype.analysisCellTypeExpression = function (mxCell, expressionField, type) {
    var self = this;
    var mxCellId = mxCell.id;
    var expression = this.getCellAttr(mxCell, expressionField);
    if (expression) {
        var expressionMd5 = this.expressionToFunc(expression);
        var uuids = this.getUuidListFromExpression(expression);
        if (_.size(uuids)) {
            _.each(uuids, function (uuid) {
                var expressions = _.get(self.uuidWidgetMap, uuid + '.expression', []);
                expressions.push({
                    id: mxCellId,
                    type: type,
                    expressionMd5: expressionMd5
                });
                _.set(self.uuidWidgetMap, uuid + '.expression', expressions);
            });
        }
    }
};

NeptunePreview.prototype.getUuidListFromExpression = function (expression) {
    var list = [];
    if (expression) {
        var uuidRegexp = /\$(.*?)\$/g;
        var self = this;
        var m;
        while ((m = uuidRegexp.exec(expression)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === uuidRegexp.lastIndex) {
                uuidRegexp.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                if (groupIndex === 1 && match) {
                    list.push(match);
                }
            });
        }
        list = _.uniq(list);
    }
    return list;
};

NeptunePreview.prototype.putCellToMap = function () {
    var cells = this.graph.getChildVertices(this.graph.getDefaultParent());
    var self = this;
    _.each(cells, function (mxCell) {
        self.mxCellMap[mxCell.id] = mxCell;
    });
};

NeptunePreview.prototype.bindEvent = function () {
    var self = this;

    this.editor.addListener('fileLoaded', function () {
        self.onPageRender();
        // 全屏
        self.fullScreen();
    });

    this.editor.addListener('pageSelected', function () {
        self.onPageRender();
    });

    /*解决InputText在mxGraph下不能点击的问题*/
    var graphFireMouseEvent = this.graph.fireMouseEvent;
    this.graph.fireMouseEvent = function (evtName, me, sender) {
        if (evtName === mxEvent.MOUSE_DOWN) {
            var target = _.get(me, 'evt.target', '');
            if (target) {
                var id = $(target).closest('.component-content').attr('id');
                if (id) {
                    var mxCellId = $(target).closest('.component-content').attr('id').slice(10);
                    var mxCell = _.find(self.mxCellMap, function (item) {
                        return item.id === mxCellId;
                    });
                }
                if (target.type === 'text') {
                    $(target).focus();
                }
                if ($(target).hasClass('control-send')) { // 数据控制组件.
                    var control_cmd_type = self.getCellAttr(mxCell, 'control_cmd_type');
                    if (control_cmd_type === 'singleDeviceValue') {
                        controlSinglelIssued();// 单设备单值下发.
                    } else if (control_cmd_type === 'multipleDeviceValue') {
                        controlMultiplelIssued();// 多设备多值下发.
                    }
                } else if ($(target).hasClass('timeline-action-btn')) { // 时间轴组件
                    var placeHolderUuid = self.getCellAttr(mxCell, 'device_uuid');
                    var charts = _.get(self.timeline, placeHolderUuid, {});
                    var config = _.find(charts, ['id', mxCellId]);
                    var uuid = self.devicePlaceHolderMap[placeHolderUuid];
                    var type = "today";
                    if ($(target).hasClass('today')) {
                        type = 'today';
                    } else if ($(target).hasClass('yesterday')) {
                        type = 'yesterday';
                    } else if ($(target).hasClass('seven')) {
                        type = "seven";
                    }
                    self.updateCellTimelineChart(uuid, config, type)
                }
            }
        }
        graphFireMouseEvent.apply(this, arguments);

        function controlSinglelIssued() {
            var placeHolder = self.getCellAttr(mxCell, 'device_uuid');
            if (placeHolder) {
                var targetUuid = self.devicePlaceHolderMap[placeHolder];
                if (targetUuid) {
                    placeHolder = targetUuid; /*把数据下发到当前所选的设备上*/
                }
            }
            var inputEle = $(target).closest('.component-field').find("input");
            var inputKey = inputEle.attr('name');
            var inputVal = inputEle.val();// 数据控制组件的下发值.
            var control_boolean = inputEle.prop("type") === "checkbox";
            //var control_boolean = self.getCellAttr(mxCell, 'device_control_boolean_status');// 栏位是否为布尔类型.

            if (control_boolean === true) {
                inputEle.prop('checked', !inputEle.prop('checked'));
                inputVal = inputEle.prop('checked');
            } else {
                if (_.isEmpty(inputVal)) {
                    alert('请输入下发值');
                    return;
                }
            }
            var action = {
                "action": "update",
                "data": {}
            };
            _.set(action.data, inputKey, inputVal);
            if (!placeHolder) {
                return;
            }
            if (_.isString(action)) {
                action = {
                    'action': action,
                };
            }
            action.uuid = placeHolder;
            action = JSON.stringify(action);
            var url = 'device/pushToDevice';
            NeptuneHttp.post(url, placeHolder, {
                'action': action
            }).done(function (result) {
                if (result.success) {
                    window.setTimeout(function () {
                        alert('已执行下发命令');
                    }, 300);
                }
            });
        }

        function controlMultiplelIssued() {
            var action = {
                "action": "update",
                "data": {}
            };

            var uuids = self.getCellAttr(mxCell, 'multi_device_uuid');
            var uuidsArr = uuids.split(",");
            var device_fields = self.getCellAttr(mxCell, 'device_fields');
            device_fields = JSON.parse(device_fields);
            _.each(device_fields, function (item) {
                action.data[item.key] = item.value;
            });

            if (_.size(uuidsArr) == 0) {
                return;
            }
            if (_.isString(action)) {
                action = {
                    'action': action,
                };
            }
            action = JSON.stringify(action);
            var url = 'device/pushToDevice';
            _.each(uuidsArr, function (uuid) {
                var targetUuid = self.devicePlaceHolderMap[uuid];
                if (targetUuid) {
                    uuid = targetUuid;
                }
                NeptuneHttp.post(url, uuid, {
                    'action': action
                }).done(function (result) {
                });
            });
            window.setTimeout(function () {
                alert('已执行下发命令');
            }, 300);
        }
    };

    // 时钟
    self.realtimeUpdate();
};

NeptunePreview.prototype.fullScreen = function () {
    let btn = $(".fullscreen_btn");
    btn.click(function () {
        screenfull.toggle(document.getElementsByTagName("html")[0])
    });
};

NeptunePreview.prototype.reRenderCells = function () {
    var self = this;

    _.each(this.mxCellMap, function (cell) {
        var style = cell.style;
        if (style.indexOf('tag2=field') !== -1) {
            self.renderField(cell);
        } else if (style.indexOf('tag2=linechart') !== -1) {
            self.renderLineChart(cell);
        } else if (style.indexOf('tag2=control') !== -1) {
            self.renderControlField(cell);
        } else if (style.indexOf('tag2=dashboard') !== -1) {
            self.renderDashboard(cell);
        } else if (style.indexOf('tag2=camera') !== -1) {
            self.renderCamera(cell);
        } else if (style.indexOf('tag2=historychart') !== -1) {
            self.renderHistoryDataChart(cell);
        } else if (style.indexOf('tag2=timeline') !== -1) {
            self.renderTimeline(cell);
        } else if (style.indexOf('tag2=map') !== -1) {
            self.renderMap(cell);
        }
        self.loadCellAnimation(cell);
    });
};

NeptunePreview.prototype.loadCellAnimation = function (mxCell) {
    var self = this;

    var is_use_animation_expression = self.graph.getAttributeForCell(mxCell, "is_use_animation_expression");
    var animate_type = self.graph.getAttributeForCell(mxCell, 'animate_type');
    if (_.isEmpty(animate_type)) {
        return;
    }
    if (is_use_animation_expression !== 'true') {
        self.setCellAnimation(mxCell);
    }
};

NeptunePreview.prototype.setCellAnimation = function (mxCell) {
    var self = this;

    var state = self.graph.view.getState(mxCell);
    var animate_type = self.graph.getAttributeForCell(mxCell, 'animate_type');
    setTimeout(function () {
        // janus组件内容节点
        var next_node = state.shape.node.nextSibling;
        var geometry = mxCell.geometry;
        var x_point_of_rotation = geometry.x + (geometry.width / 2);
        var y_point_of_rotation = geometry.y + (geometry.height / 2);
        if (!_.isEmpty(next_node)) {
            state.shape.node.nextSibling.setAttribute('class', 'animated infinite slower ' + animate_type);
            state.shape.node.nextSibling.setAttribute('transform-origin', x_point_of_rotation + ' ' + y_point_of_rotation);
        }
        state.shape.node.setAttribute('class', 'animated infinite slower ' + animate_type);
        state.shape.node.setAttribute('transform-origin', x_point_of_rotation + ' ' + y_point_of_rotation);
    }, 400);

};

NeptunePreview.prototype.removeCellAnimation = function (mxCell) {
    var self = this;

    var state = self.graph.view.getState(mxCell);
    var animate_type = self.graph.getAttributeForCell(mxCell, 'animate_type');
    setTimeout(function () {
        // janus组件内容节点
        var next_node = state.shape.node.nextSibling;
        if (!_.isEmpty(next_node)) {
            state.shape.node.nextSibling.classList.remove('animated');
        }
        state.shape.node.classList.remove('animated');
    }, 400);
};

NeptunePreview.prototype.getCellAttr = function (mxCell, key) {
    return this.graph.getAttributeForCell(mxCell, key);
};

NeptunePreview.prototype.getCellAttr = function (mxCell, key) {
    return this.graph.getAttributeForCell(mxCell, key);
};

NeptunePreview.prototype.setLabel = function (mxCell, label) {
    this.graph.getModel().beginUpdate();
    try {
        this.graph.setAttributeForCell(mxCell, 'label', label);
    } finally {
        this.graph.getModel().endUpdate();
    }
};

NeptunePreview.prototype.renderField = function (mxCell) {
    neptuneHandler.renderField(mxCell);
};

NeptunePreview.prototype.renderControlField = function (mxCell) {
    neptuneHandler.renderControlField(mxCell);
};

NeptunePreview.prototype.getComponentId = function (mxCell) {
    return 'component-' + mxCell.id;
};

NeptunePreview.prototype.renderHistoryDataChart = function (mxCell) {
    var self = this;
    neptuneHandler.renderHistoryDataChart(mxCell).done(function (myChart, xData, series) {

        var device_uuid = self.getCellAttr(mxCell, 'device_uuid');
        var charts = _.get(self.historyDataChart, device_uuid, []);
        charts.push({
            id: mxCell.id,
            xData: xData,
            series: series,
            chart: myChart
        });
        _.set(self.historyDataChart, device_uuid, charts);
    });
}

NeptunePreview.prototype.renderLineChart = function (mxCell) {
    var self = this;
    neptuneHandler.renderLineChart(mxCell)
        .done(function (myChart, xData, series) {
            var device_uuid = self.getCellAttr(mxCell, 'device_uuid');
            var charts = _.get(self.linechart, device_uuid, []);
            charts.push({
                id: mxCell.id,
                xData: xData,
                series: series,
                chart: myChart
            });
            _.set(self.linechart, device_uuid, charts);
        });
};

NeptunePreview.prototype.renderTimeline = function (mxCell) {
    var self = this;
    var device_uuid = self.getCellAttr(mxCell, 'device_uuid');
    setTimeout(function () {
        var real_uuid = _.get(self.devicePlaceHolderMap, device_uuid, "");
        neptuneHandler.renderTimeline(mxCell, real_uuid).done(function (chart_instance, config, stateChart) {
            var timeline_charts = _.get(self.timeline, device_uuid, []);
            timeline_charts.push({
                id: mxCell.id,
                config: config,
                timeline_chart_instance: chart_instance,
                state_chart_instance: stateChart
            });
            _.set(self.timeline, device_uuid, timeline_charts);
        });
    }, 1000)
};

NeptunePreview.prototype.renderCamera = function (mxCell) {
    var self = this;

    var auto_play = self.getCellAttr(mxCell, 'auto_play');
    if (auto_play === 'true') {

    } else {
        auto_play = "false";
    }
    var componentId = this.getComponentId(mxCell);
    var geometry = mxCell.geometry;
    var content = `<div class="component-content" id="${componentId}" ><div class="component-camera" ><video id="${componentId}-video" width="${geometry.width}" height="${geometry.height}" autoplay="${auto_play}" controls="true"></video></div></div>`;
    this.setLabel(mxCell, content);

    var camera_url = self.getCellAttr(mxCell, 'camera_url');

    setTimeout(function () {
        /*create camera*/
        var video = document.getElementById(componentId + '-video');
        if (Hls.isSupported()) {
            var hls = new Hls({});
            hls.attachMedia(video);
            hls.on(Hls.Events.MEDIA_ATTACHED, function () {
                hls.loadSource(camera_url);
                hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                    video.play();
                });
            });
        }
    }, 300);
};

NeptunePreview.prototype.renderDashboard = function (mxCell) {
    var self = this;
    neptuneHandler.renderDashboard(mxCell).done(function (gauge) {
        var device_uuid = self.getCellAttr(mxCell, 'device_uuid');
        var device_fields = self.getCellAttr(mxCell, 'device_fields');
        if (device_fields) {
            device_fields = JSON.parse(device_fields);
        }
        var key = _.get(_.first(device_fields), 'key', '');
        var charts = _.get(self.dashboard, device_uuid, []);
        charts.push({
            id: mxCell.id,
            key: key,
            gauge: gauge
        });
        _.set(self.dashboard, device_uuid, charts);
    });
};

NeptunePreview.prototype.setCellFlowBar = function (mxCell) {
    var self = this;

    var state = self.graph.view.getState(mxCell);
    setTimeout(function () {
        // janus组件内容节点
        var next_node = state.shape.node.nextSibling;
        if (!_.isEmpty(next_node)) {
            /*开启动画显示流动效果*/
            $(next_node).find('.progress-bar').removeClass('stop');
        }
    }, 400);
};

NeptunePreview.prototype.removeCellFlowBar = function (mxCell) {
    var self = this;
    var state = self.graph.view.getState(mxCell);
    setTimeout(function () {
        // janus组件内容节点
        var next_node = state.shape.node.nextSibling;
        if (!_.isEmpty(next_node)) {
            $(next_node).find('.progress-bar').addClass('stop');
        }
    }, 400);
};

NeptunePreview.prototype.updateCellProgressBar = function (mxCell, value) {
    var self = this;
    var state = self.graph.view.getState(mxCell);
    var progress_percent_label_show = self.getCellAttr(mxCell, 'progress_percent_label_show') || 'true';
    setTimeout(function () {
        // janus组件内容节点
        var next_node = state.shape.node.nextSibling;
        if (!_.isEmpty(next_node)) {
            $(next_node).find('.progress-bar').css({
                'width': value + '%'
            });
            if (progress_percent_label_show === 'true') {
                $(next_node).find(' div.show-percentage >span').html(value + '%');
            }
        }
    }, 400);
};

NeptunePreview.prototype.renderMap = function (mxCell) {
    var self = this;
    var map_url_type = self.getCellAttr(mxCell, 'map_url_type') || 'user_add';

    if (map_url_type === 'bind_device') {
        // var id='#' + neptuneHandler.getComponentId(mxCell) + '_map_container';
        var multi_device_uuid = self.graph.getAttributeForCell(mxCell, 'multi_device_uuid');//关联设备
        var show_device_range = self.graph.getAttributeForCell(mxCell, 'show_device_range');//关联设备

        function setAllPlac(list) {
            let all_device_uuid = [];
            _.each(list, function (placeholder) {
                all_device_uuid.push(placeholder.name);
            });
            _.set(self.mapSettingMap, _.toString(all_device_uuid), setting);
        }

        var setting = {
            mxCell: mxCell,
            devicePoiMap: []
        };
        if (show_device_range === 'link_device') {
            let id = NeptuneUtils.findGetParameter('id');
            if (_.isEmpty(NeptuneUtils.placeholderList)) {
                NeptuneUtils.getPlaceholderList(id).done(function (list) {
                    setAllPlac(list);
                });
            } else {
                setAllPlac(NeptuneUtils.placeholderList);
            }
        } else {
            _.set(self.mapSettingMap, multi_device_uuid, setting);
        }
    }
};

NeptunePreview.prototype.updateMap = function (newuuid, placeHolderUuid) {
    var self = this;
    self.graph.getCellStyle();
    var placeHolders = _.keys(self.mapSettingMap);
    _.each(placeHolders, function (placeholder) {
        let index = _.findIndex(placeholder.split(','), function (p) {
            return p == placeHolderUuid;
        });
        if (index !== -1) {
            self.updateCellMap(placeholder, newuuid);
        }
    });
};

NeptunePreview.prototype.updateCellMap = function (placeholder, newuuid) {
    var self = this;
    let settings = _.get(self.mapSettingMap, placeholder, {});
    let mxCell = _.get(settings, 'mxCell', '');
    var componentId = self.getComponentId(mxCell);

    let devicePoiMap = _.get(settings, 'devicePoiMap', []);

    /*显示具体位置*/
    function showMarkerDesc(devicePoiMap) {
        let deviceInfo = _.get(devicePoiMap, newuuid, {});
        if (deviceInfo.poi) {
            NeptuneUtils.addMapMarker(componentId, deviceInfo.poi, deviceInfo.baseInfo.name, true);
        }
    }

    if (_.isEmpty(devicePoiMap)) {
        let clsCode = [];
        _.each(placeholder.split(','), function (p) {
            let placeholderItem = _.find(NeptuneUtils.placeholderList, {'name': p});
            if (!_.isEmpty(placeholderItem)) {
                clsCode.push(_.get(placeholderItem, 'clsCode', ''));
            }
        });

        NeptuneHttp.get('monitor_developer/loadDevicePoi', {
            clsCodes: _.toString(clsCode)
        }).done(function (result) {
            if (result.success) {
                let devicePoiMap = _.get(result, "datas.poiMap", {});
                _.set(settings, 'devicePoiMap', devicePoiMap);
                _.each(devicePoiMap, function (deviceInfo) {
                    if (deviceInfo.poi) {
                        NeptuneUtils.addMapMarker(componentId, deviceInfo.poi, deviceInfo.baseInfo.name);
                    }
                });
                showMarkerDesc(devicePoiMap);
            }
        });
    } else {
        showMarkerDesc(devicePoiMap);
    }

};

NeptunePreview.prototype.realtimeUpdate = function () {
    var self = this;
    var updateClocksTimer = setInterval(function () {
        if (self.clocks === null) {
            clearInterval(updateClocksTimer);
            return;
        }
        if (self.clocks.length === 0) {
            self.clocks = $(".realtime_component .time_now");
            if (self.clocks.length === 0) {
                self.clocks = null;
            }
        }
        var time_now = moment().format("HH:mm:ss");
        _.each(self.clocks, function (clock) {
            $(clock).text(time_now);
        });
    }, 1000)
};