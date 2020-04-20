NeptuneHandler = function (_graph, _editor) {
    this.graph = _graph;
    this.editor = _editor;
    this.bindEvent();
};

NeptuneHandler.prototype.bindEvent = function () {
    var self = this;
    this.graph.addListener(mxEvent.CELLS_ADDED, function (graph, mxEvent) {
        var mxCell = _.get(mxEvent, 'properties.cells[0]');
        if (mxCell) {
            self.renderMxCell(mxCell);
        }
    });

    this.graph.addListener(mxEvent.CELLS_RESIZED, function (graph, mxEvent) {
        var mxCell = _.get(mxEvent, 'properties.cells[0]');
        if (mxCell) {
            self.renderMxCell(mxCell);
        }
    });

    this.editor.addListener('fileLoaded', function () {
        self.renderPage();
    });

    this.editor.addListener('pageSelected', function () {
        self.renderPage();
    });
};

NeptuneHandler.prototype.renderPage = function () {
    var cells = this.graph.getChildVertices(this.graph.getDefaultParent());
    var self = this;
    _.each(cells, function (mxCell) {
        self.renderMxCell(mxCell);
    });
};

NeptuneHandler.prototype.renderMxCell = function (cell) {
    var self = this;
    var style = cell.style;
    if (style.indexOf('tag2=field') !== -1) {
        self.renderField(cell);
    } else if (style.indexOf('tag2=linechart') !== -1) {
        self.renderLineChart(cell);
    } else if (style.indexOf('tag2=control') !== -1) {
        self.renderControlField(cell);
    } else if (style.indexOf('tag2=dashboard') !== -1) {
        self.renderDashboard(cell);
    } else if (style.indexOf('tag2=historychart') !== -1) {
        self.renderHistoryDataChart(cell);
    } else if (style.indexOf("tag2=timeline") !== -1) {
        self.renderTimeline(cell);
    } else if (style.indexOf("tag2=flowbar") !== -1) {
        self.renderFlowBar(cell);
    } else if (style.indexOf("tag2=progressbar") !== -1) {
        self.renderProgressBar(cell);
    } else if (style.indexOf("tag2=map") !== -1) {
        self.renderMap(cell);
    } else if (style.indexOf("tag2=realtime") !== -1) {
        self.renderRealtime(cell);
    }
};

NeptuneHandler.prototype.getCellAttr = function (mxCell, key) {
    return this.graph.getAttributeForCell(mxCell, key);
};

NeptuneHandler.prototype.renderTimeline = function (mxCell, uuid) {
    var self = this;
    var deferred = $.Deferred();

    var componentId = this.getComponentId(mxCell);
    var geometry = mxCell.geometry;
    var content = `<div class="component-content timeline_component" id="${componentId}" style="width:${geometry.width}px;height:${geometry.height}px;">
                        <div class="timeline-action" style="position: absolute;z-index: 100">
                            <div class="timeline-btn">
                                <button class="timeline-action-btn today btn-primary btn btn-xs ">今天</button>
                                <button class="timeline-action-btn yesterday  btn-success btn btn-xs ">昨天</button>
                            </div>
                            <div class="status-info">
                                <span><i class="fa fa-circle" style="color:#029359"></i> 正常<br><span class="normal" ></span></span>
                                <span><i class="fa fa-circle" style="color:#F0C600"></i> 警告<br><span class="warning"></span></span>
                                <span><i class="fa fa-circle" style="color:#D50C38"></i> 报警<br><span class="alarm"></span></span>
                                <span><i class="fa fa-circle" style="color:#CCCCCC"></i> 离线<br><span class="offline"></span></span>                                  
                            </div>                                                      
                        </div>                                          
                        <div class="component-status-chart"></div>         
                        <div class="component-timeline"></div>                    
                    </div>`;
    this.setLabel(mxCell, content);

    var range = self.getCellAttr(mxCell, 'timeline_range');
    if (_.isEmpty(range)) {
        range = 'today';
    }
    setTimeout(function () {
        DeviceTimelineService.getChartConfig(echarts, uuid, range, "", "").done(function (config) {
            var timeline_options = config.options;
            var state_options = config.stateoptions;
            _.set(timeline_options, "dataZoom[0].height", 8);

            let normal_duration = moment.duration(config.normalduration);
            let warning_duration = moment.duration(config.warningduration);
            let alarm_duration = moment.duration(config.alarmduration);
            let offline_duration = moment.duration(config.offlineduration);
            if (!uuid) {
                timeline_options.yAxis.data = [];
                timeline_options.series[0].data = [];
                _.set(state_options, "series[0].data", [0, 0, 0]);
            }
            var component = $('#' + componentId);
            var status_info = component.find(".status-info");
            status_info.find(".normal").text(getTime(normal_duration, uuid));
            status_info.find(".warning").text(getTime(warning_duration, uuid));
            status_info.find(".alarm").text(getTime(alarm_duration, uuid));
            status_info.find(".offline").text(getTime(offline_duration, uuid));

            var timeline_chart = echarts.init(component.find('.component-timeline')[0], null, {
                width: (geometry.width / 4) * 2.6,
                height: geometry.height
            });
            var stateChart = echarts.init(component.find('.component-status-chart')[0], null, {
                width: (geometry.width / 4) * 1.4,
                height: geometry.height
            });
            timeline_chart.setOption(timeline_options);
            stateChart.setOption(config.stateoptions);
            deferred.resolve(timeline_chart, config, stateChart);
        });
    }, 300);

    function getTime(duration, uuid) {
        if (uuid) {
            return duration.hours() + 'h' + duration.minutes() + 'm' + duration.seconds() + 's';
        } else {
            return '0h0m0s';
        }
    }

    return deferred;
};

NeptuneHandler.prototype.renderHistoryDataChart = function (mxCell) {
    var self = this;
    var componentId = this.getComponentId(mxCell);
    var geometry = mxCell.geometry;
    var content = `<div class="component-content" id="${componentId}" style="width:${geometry.width}px;height:${geometry.height}px;"><div class="component-chart"></div></div>`;

    this.setLabel(mxCell, content);

    var deferred = $.Deferred();
    var fields = self.getCellAttr(mxCell, 'fields');
    var chartType = self.getCellAttr(mxCell, 'chart_type') || 'line-chart1';// 历史数据图表类型.
    if (fields) {
        fields = JSON.parse(fields);
    }
    var style = self.graph.getCellStyle(mxCell);
    var type = "line";
    if (chartType === 'line-chart1') {
        type = "line";
    } else if (chartType === 'bar-chart1') {
        type = "bar";
    }
    var series = [];
    var legendData = [];
    _.each(fields, function (item) {
        legendData.push(item.name);
        series.push({
            name: item.name,
            key: item.id,
            type: type,
            data: []
        });
    });
    var xData = [];
    var option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: legendData,
            textStyle: {
                color: style.fontColor,
            }
        },
        grid: [{}],
        textStyle: {
            color: style.fontColor
        },
        xAxis: {
            type: 'category',
            data: xData,
            axisLine: {
                lineStyle: {
                    color: style.fontColor
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                lineStyle: {
                    color: style.fontColor
                }
            }
        },
        series: series
    };
    setTimeout(function () {
        var myChart = echarts.init($('#' + componentId).find('.component-chart')[0], null, {
            width: geometry.width,
            height: geometry.height
        });

        myChart.setOption(option);
        deferred.resolve(myChart, xData, series);
    }, 300);
    return deferred;
};

NeptuneHandler.prototype.renderLineChart = function (mxCell) {
    var self = this;
    var deferred = $.Deferred();
    //替换里面的内容
    var componentId = this.getComponentId(mxCell);
    var geometry = mxCell.geometry;
    var content = `<div class="component-content" id="${componentId}" style="width:${geometry.width}px;height:${geometry.height}px;"><div class="component-chart"></div></div>`;

    this.setLabel(mxCell, content);

    var device_uuid = self.getCellAttr(mxCell, 'device_uuid');
    var device_fields = self.getCellAttr(mxCell, 'device_fields');
    if (device_fields) {
        device_fields = JSON.parse(device_fields);
    }
    var style = self.graph.getCellStyle(mxCell);
    var series = [];
    var legendData = [];

    _.each(device_fields, function (item) {
        legendData.push(item.name);
        series.push({
            name: item.name,
            key: item.key,
            type: 'line',
            data: []
        });
    });
    var xData = [];
    var option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: legendData,
            textStyle: {
                color: style.fontColor,
            }
        },
        grid: [{
            left: 50,
            right: 20,
            bottom: 25,
            top: 35
        }],
        textStyle: {
            color: style.fontColor
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xData,
            axisLine: {
                lineStyle: {
                    color: style.fontColor
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                lineStyle: {
                    color: style.fontColor
                }
            }
        },
        series: series
    };
    setTimeout(function () {
        var myChart = echarts.init($('#' + componentId).find('.component-chart')[0], null, {
            width: geometry.width,
            height: geometry.height
        });
        myChart.setOption(option);
        deferred.resolve(myChart, xData, series);
    }, 300);
    return deferred;
};
NeptuneHandler.prototype.renderDashboard = function (mxCell) {
    var deferred = $.Deferred();
    var self = this;
    var componentId = this.getComponentId(mxCell);
    var geometry = mxCell.geometry;
    var content = `<div class="component-content" style="width:${geometry.width}px;height:${geometry.height}px;"><canvas style="position: relative;left: 5px" id="${componentId}"></canvas></div>`;
    this.setLabel(mxCell, content);

    var min = self.getCellAttr(mxCell, 'dashboard_min') || 0;
    var max = self.getCellAttr(mxCell, 'dashboard_max') || 100;
    var units = self.getCellAttr(mxCell, 'dashboard_units') || "";
    var type = self.getCellAttr(mxCell, 'dashboard_type') || 'radial';// 仪表板类型.
    var threshold = self.getCellAttr(mxCell, "dashboard_threshold") || max * 0.8;
    max = parseInt(max);
    threshold = parseInt(threshold);
    if (threshold < min) {
        threshold = max * 0.8;
    }
    if (threshold > max) {
        threshold = max * 0.8;
    }

    var majorTicksArr = [];
    min = parseInt(min);
    max = parseInt(max);
    var diff = (max - min) / 5;
    for (let i = 0; i <= 5; i++) {
        majorTicksArr.push(min + diff * i);
    }


    var options = {
        renderTo: componentId,
        width: geometry.width - 10,
        height: geometry.height - 10,
        value: 0,
        valueDec: 2,
        valueBoxWidth: 30,
        valueInt: 1,
        minValue: min,
        maxValue: max,
        units: units,
        valueBox: true,
        strokeTicks: true,
        majorTicks: majorTicksArr,
        save_units: units,
        highlights: [
            {
                "from": threshold,
                "to": max,
                "color": "rgba(200, 50, 50, .75)"
            }
        ],
        colorPlate: "#fff",
        borderShadowWidth: 0,
        borders: false,
        needleType: "arrow",
        needleWidth: 2,
        needleCircleSize: 2,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: "linear"
    };
    setTimeout(function () {
        var gauge;
        if (type === 'radial') {
            gauge = new RadialGauge(options).draw();
        } else if (type === 'half-radial') {
            options.startAngle = 90;
            options.ticksAngle = 180;
            options.valueBox = false;
            gauge = new RadialGauge(options).draw();
        } else if (type === 'linear') {
            gauge = new LinearGauge(options).draw();
        }
        deferred.resolve(gauge);
    }, 300);
    return deferred;
};
NeptuneHandler.prototype.renderControlField = function (mxCell) {
    var componentId = this.getComponentId(mxCell);
    //替换里面的内容
    var geometry = mxCell.geometry;
    var content = [];

    var width = geometry.width;
    content.push(`<div class="component-content" style="width:${width}px;height:${geometry.height}px;" id="${componentId}"><div class="component-field" style="width: ${width}px; margin-bottom: 5px;">`);

    var control_cmd_type = this.graph.getAttributeForCell(mxCell, 'control_cmd_type');
    if (control_cmd_type === 'singleDeviceValue') {
        var fieldStr = this.graph.getAttributeForCell(mxCell, 'device_fields');
        var fields = [];
        if (fieldStr) {
            fields = JSON.parse(fieldStr);
        }
        var item = _.first(fields) || {
            key: '',
            name: ''
        };
        var device_field_boolean_status = this.graph.getAttributeForCell(mxCell, 'device_control_boolean_status');
        var device_fields = this.graph.getAttributeForCell(mxCell, 'device_fields');
        var array;
        if (device_fields) {
            array = JSON.parse(device_fields);
        }
        var field = _.head(array);
        if (field && field.type === 'boo') {
            content.push(`<div class="pretty p-switch p-fill"><input type="checkbox" class="control-send" name="${item.key}"/><div class="state"><label></label></div></div>`);
        } else {
            content.push(`<div class="single-ctrl-div-d" style=""><input type="text" style="width: 70%;height: ${geometry.height - 2}px;margin-left: 2px;" placeholder="${item.name}" name="${item.key}"/><button class="control-send" style="width: 30%;height: ${geometry.height - 2}px;"><i class="fa fa-send-o control-send"></i></button></div>`);
        }
    } else if (control_cmd_type === 'multipleDeviceValue') {
        var btnName = this.graph.getAttributeForCell(mxCell, 'control_cmd_btn_name') || '下发';
        content.push(`<input type="button" class="control-send" style="height: ${geometry.height - 2}px;width: 100%" value="${btnName}"/>`);
    } else {
        content.push('数据下发');
    }
    content.push('</div></div>');
    content = content.join('');
    this.setLabel(mxCell, content);

    neptuneHandler.fontSize(mxCell);
};

NeptuneHandler.prototype.fontSize = function (mxCell, fontSize) {
    var graph = this.graph;
    var componentId = this.getComponentId(mxCell);
    var geometry = mxCell.geometry;
    var font_size = geometry.height - (geometry.height / 2.2);

    if (fontSize) {
        font_size = fontSize;
    }
    font_size = parseInt(font_size);

    graph.setCellStyles(mxConstants.STYLE_FONTSIZE, font_size, graph.getSelectionCells());
    graph.getModel().beginUpdate();
    try {
        graph.updateLabelElements(graph.getSelectionCells(), function (elt) {
            elt.style.fontSize = font_size + 'px';
            elt.removeAttribute('size');
        });
    } finally {
        graph.getModel().endUpdate();
    }

    _.defer(function () {
        $(`#${componentId}`).closest("foreignObject").find("div").first().css({
            "font-size": `${font_size}px`,
            "display": "flex"
        });
    }, 100)
};

NeptuneHandler.prototype.renderField = function (mxCell) {
    var componentId = this.getComponentId(mxCell);
    //替换里面的内容
    var geometry = mxCell.geometry;
    var field = this.getCellAttr(mxCell, 'device_fields');
    var fieldName = '';
    if (field) {
        field = JSON.parse(field);
        _.each(field, function (item) {
            fieldName = item.name;
        });
    }
    fieldName = fieldName || '数据栏位';
    var device_field_scroll_status = this.graph.getAttributeForCell(mxCell, 'device_field_scroll_status');
    var scrollClass = device_field_scroll_status === 'true' ? 'scrollField' : '';
    var content = [];
    content.push(`<div class="component-content ${scrollClass}" style="width:${geometry.width}px;height:${geometry.height}px;" id="${componentId}"><div class="component-field ${scrollClass}">`);
    var device_field_boolean_status = this.graph.getAttributeForCell(mxCell, 'device_field_boolean_status');
    if (device_field_boolean_status === 'true') {
        var button_height = geometry.height - (geometry.height / 3);
        content.push(`<div class="pretty p-switch p-fill" style="font-size: ${button_height}px" ><input type="checkbox"  ng-checked=""/><div class="state"><label></label></div></div>`);
    } else {
        content.push(`<span class="component-field-name">${fieldName}</span>`);
    }
    content.push('</div></div>');
    content = content.join('');
    this.setLabel(mxCell, content);

    _.defer(function () {
        $(`#${componentId}`).closest("foreignObject").find("div").first().css({
            "font-size": "initial"
        });
    }, 100)
};

NeptuneHandler.prototype.getComponentId = function (mxCell) {
    return 'component-' + mxCell.id;
};

NeptuneHandler.prototype.setLabel = function (mxCell, label) {
    this.graph.getModel().beginUpdate();
    try {
        this.graph.setAttributeForCell(mxCell, 'label', label);
    } finally {
        this.graph.getModel().endUpdate();
    }
};

NeptuneHandler.prototype.renderFlowBar = function (mxCell) {
    var self = this;
    //替换里面的内容
    var componentId = this.getComponentId(mxCell);
    var geometry = mxCell.geometry;
    var content = `<div class="component-content" id="${componentId}" style="width:${geometry.width - 2}px;height:${geometry.height}px;"><div class="progress-bar progress-bar-striped" style="width: 100%; transform: translateY(-2.5px);height: calc(100% - 2px); animation: 3s linear 0s infinite normal none progress-bar-stripes-reverse; background-image: linear-gradient(90deg, rgb(56, 149, 255) 25%, transparent 25%, transparent 50%, rgb(56, 149, 255) 50%, rgb(56, 149, 255) 75%, transparent 75%, transparent); background-color: rgb(255, 255, 255);"></div></div>`;

    this.setLabel(mxCell, content);

    var is_use_flowbar_expression = self.getCellAttr(mxCell, 'is_use_flowbar_expression') || "false";
    var flow_code_expression = self.getCellAttr(mxCell, 'flow_code_expression') || "";
    var flow_direction = self.getCellAttr(mxCell, 'flow_direction') || 'normal';
    var flow_speed = self.getCellAttr(mxCell, 'flow_speed') || 3;
    var flow_color = self.getCellAttr(mxCell, 'flow_color') || '#3895ff';
    var flow_background = self.getCellAttr(mxCell, 'flow_background') || '#ffffff';

    var animation = `${flow_speed}s linear 0s infinite normal none ${flow_direction === 'normal' ? 'progress-bar-stripes-reverse' : 'progress-bar-stripes'}`;

    if (is_use_flowbar_expression === "true" && flow_code_expression) {
        $('#' + componentId + ' >div.progress-bar').addClass('stop');
    } else {
        $('#' + componentId + ' >div.progress-bar').removeClass('stop');
    }

    setTimeout(function () {
        $('#' + componentId + ' >div.progress-bar').css({
            'height': 'calc(100% - 2px)',
            'animation': animation,
            'background-image': `linear-gradient(90deg, ${flow_color} 25%, transparent 25%, transparent 50%, ${flow_color} 50%, ${flow_color} 75%, transparent 75%, transparent)`,
            'background-color': flow_background
        });

    }, 0);

};

NeptuneHandler.prototype.renderProgressBar = function (mxCell) {
    var self = this;
    //替换里面的内容
    var componentId = this.getComponentId(mxCell);
    var geometry = mxCell.geometry;
    var content = `<div class="component-content" id="${componentId}" style="width:${geometry.width - 2}px;height:${geometry.height}px;"><div class="progress janus-progress"><div class="progress-bar janus-progress-bar show-percentage" style="width: 0%;"><span>0%</span></div></div></div>`;

    this.setLabel(mxCell, content);

    var is_use_progressbar_expression = self.getCellAttr(mxCell, 'is_use_progressbar_expression') || "false";
    var progress_percent = self.getCellAttr(mxCell, 'progress_percent') || "40";
    var progress_percent_label_show = self.getCellAttr(mxCell, 'progress_percent_label_show') || "true";
    var progressbar_code_expression = self.getCellAttr(mxCell, 'progressbar_code_expression') || "";
    var progress_font_color = self.getCellAttr(mxCell, 'progress_font_color') || '#ffffff';
    var progress_color = self.getCellAttr(mxCell, 'progress_color') || '#3895ff';
    var progress_background = self.getCellAttr(mxCell, 'progress_background') || '#98ceff';


    setTimeout(function () {
        if (is_use_progressbar_expression === "true" && progressbar_code_expression) {
            $('#' + componentId + ' div.progress-bar').addClass('show-percentage');
            progress_percent = 0;
        } else {
            $('#' + componentId + ' div.progress-bar').removeClass('show-percentage');
        }
        $('#' + componentId + ' div.progress-bar').css({
            width: progress_percent + '%'
        });

        if (progress_percent_label_show === 'true') {
            $('#' + componentId + ' div.progress-bar').removeClass('hide-percentage');
            $('#' + componentId + ' div.progress-bar').addClass('show-percentage');
            $('#' + componentId + ' div.show-percentage >span').html(progress_percent + '%');
        } else {
            $('#' + componentId + ' div.progress-bar').removeClass('show-percentage');
            $('#' + componentId + ' div.progress-bar').addClass('hide-percentage');
        }

        $('#' + componentId + ' div.progress').css({
            'background-color': progress_background
        });
        $('#' + componentId + ' div.progress-bar').css({
            'background-color': progress_color,
            'color': progress_font_color
        });
    }, 0);
};

NeptuneHandler.prototype.renderMap = function (mxCell) {
    var self = this;
    //替换里面的内容
    var componentId = this.getComponentId(mxCell);
    var geometry = mxCell.geometry;
    var content = `<div class="component-content" id="${componentId}" style="width:${geometry.width - 2}px;height:${geometry.height}px;"><div class="map-container" id="${componentId + '_map_container'}" style="width:100%;height:100%;margin-bottom: 4px;z-index: 1"></div></div>`;

    let noAmap = _.isEmpty(window.AMap);
    if (noAmap) {
        content = `<div class="component-content" id="${componentId}" style="width:${geometry.width - 2}px;height:${geometry.height}px;"><div><i class="fa fa-warning" title="未连接到互联网，无法定位，请稍后重试！" style="font-size: 30px"></i></div></div>`
    }

    this.setLabel(mxCell, content);

    var map_url_type = self.getCellAttr(mxCell, 'map_url_type') || 'user_add';
    var poi = self.getCellAttr(mxCell, 'poi') || {};
    if (!_.isEmpty(poi)) {
        poi = JSON.parse(poi);
    }

    if (!noAmap) {
        setTimeout(function () {
            var mapId = componentId + '_map_container';
            var map = new AMap.Map(mapId, {
                zoom: 8
            });
            $('#' + mapId).data('map', map);
            if (map_url_type === 'user_add' && !_.isEmpty(poi)) {
                NeptuneUtils.addMapMarker(componentId, poi, '', true);
            }
        }, 0);
    }
};

NeptuneHandler.prototype.renderRealtime = function (mxCell) {
    var self = this;
    var deferred = $.Deferred();

    var componentId = this.getComponentId(mxCell);
    var geometry = mxCell.geometry;

    var time_now = moment().format("HH:mm:ss");
    var content = `<div class="component-content realtime_component" id="${componentId}" style="width:${geometry.width}px;height:${geometry.height}px;"><span class="time_now">${time_now}</span></div>`;
    this.setLabel(mxCell, content);

    return deferred;
};