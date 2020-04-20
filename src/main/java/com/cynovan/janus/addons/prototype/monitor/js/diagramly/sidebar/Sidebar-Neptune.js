(function () {
    /*Aric.chen :: Add Neptune Widgets*/
    Sidebar.prototype.addNeptunePalette = function () {
        var dt = 'neptune ';
        var sb = this;
        var style = 'perimeter=ellipsePerimeter;html=1;align=center;shadow=0;dashed=0;spacingTop=3;resizeWidth=1;resizeHeight=1;tag1=neptune;tag2=';

        var fns = [
            this.addEntry(dt + 'field', function () {
                var html = `<div class="component-content"><div class="component-field"><img style="width:40px;height: 40px;" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/field.svg"/></div></div>`;
                var bg = new mxCell(html, new mxGeometry(0, 0, 60, 60), style + 'field');
                bg.vertex = true;

                return sb.createVertexTemplateFromCells([bg], 60, 60, '数据栏位');
            }),
            this.addEntry(dt + 'control', function () {
                var html = `<div class="component-content"><div class="component-control"><img style="width:45px;height: 45px;" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/control.svg"/></div></div>`;
                var bg = new mxCell(html, new mxGeometry(0, 0, 60, 60), style + 'control');
                bg.vertex = true;

                return sb.createVertexTemplateFromCells([bg], 60, 60, '数据控制');
            }),
            this.addEntry(dt + 'line_chart', function () {
                var html = `<div class="component-content"><div class="component-chart component-linechart"><img style="width:75px;height: 75px;" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/line_chart.svg"/></div></div>`;
                var bg = new mxCell(html, new mxGeometry(0, 0, 100, 100), style + 'linechart');
                bg.vertex = true;

                return sb.createVertexTemplateFromCells([bg], 100, 100, '折线图');
            }),
            this.addEntry(dt + 'history_chart', function () {
                var html = `<div class="component-content"><div class="component-chart component-historychart"><img style="width:75px;height: 75px;" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/history_chart.svg"/></div></div>`;
                var bg = new mxCell(html, new mxGeometry(0, 0, 100, 100), style + 'historychart');
                bg.vertex = true;

                return sb.createVertexTemplateFromCells([bg], 100, 100, '历史数据图表');
            }),
            this.addEntry(dt + 'dashboard', function () {
                var html = `<div class="component-content"><div class="component-chart component-dashboard"><img style="width:90px;height: 90px;" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/dashboard.svg"/></div></div>`;
                var bg = new mxCell(html, new mxGeometry(0, 0, 100, 100), style + 'dashboard');
                bg.vertex = true;

                return sb.createVertexTemplateFromCells([bg], 100, 100, '仪表板');
            }),
            this.addEntry(dt + 'camera', function () {
                var html = `<div class="component-content"><div class="component-camera"><img style="width:90px;height: 90px;" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/camera.svg"/></div></div>`;
                var bg = new mxCell(html, new mxGeometry(0, 0, 100, 100), style + 'camera');
                bg.vertex = true;

                return sb.createVertexTemplateFromCells([bg], 100, 100, '摄像头');
            }),
            this.addEntry(dt + 'timeline', function () {
                var html = `<div class="component-content"><div class="componet-timeline"><img style="width:75px;height: 75px;" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/timeline.svg"/></div></div>`;
                var bg = new mxCell(html, new mxGeometry(0, 0, 100, 100), style + 'timeline');
                bg.vertex = true;

                return sb.createVertexTemplateFromCells([bg], 100, 100, '设备时间轴');
            }),
            this.addEntry(dt + 'map', function () {
                var html = `<div class="component-content"><div class="componet-map"><img style="width:75px;height: 75px;" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/map.svg"/></div></div>`;
                var bg = new mxCell(html, new mxGeometry(0, 0, 100, 100), style + 'map');
                bg.vertex = true;
                return sb.createVertexTemplateFromCells([bg], 100, 100, '地图');
            }),
            this.addEntry(dt + 'flowbar', function () {
                var html = `<div class="component-content"><div class="componet-flowbar"><img style="width:100px;height: 20px;" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/flowbar.svg"/></div></div>`;
                var bg = new mxCell(html, new mxGeometry(0, 0, 100, 30), style + 'flowbar');
                bg.vertex = true;
                return sb.createVertexTemplateFromCells([bg], 100, 30, '流动条');
            }),
            this.addEntry(dt + 'progressbar', function () {
                var html = `<div class="component-content"><div class="componet-progressbar"><img style="width:80px;height: 20px;" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/progressbar.svg"/></div></div>`;
                var bg = new mxCell(html, new mxGeometry(0, 0, 100, 30), style + 'progressbar');
                bg.vertex = true;
                return sb.createVertexTemplateFromCells([bg], 100, 30, '进度条');
            }),
            this.addEntry(dt + 'realtime', function () {
                var html = `<div class="component-content"><div class="componet-realtime"><img style="width:80px;height:75px;" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/realtime.svg"/></div></div>`;
                var bg = new mxCell(html, new mxGeometry(0, 0, 100, 100), style + 'realtime');
                bg.vertex = true;
                return sb.createVertexTemplateFromCells([bg], 100, 100, '实时时间');
            })
        ];

        this.addPalette('neptune', 'Janus组件', false, mxUtils.bind(this, function (content) {
            for (var i = 0; i < fns.length; i++) {
                content.appendChild(fns[i](content));
            }
        }));

        var gn = 'material';
        var r = 100;
        var s = 'aspect=fixed;html=1;points=[];align=center;image;fontSize=12;image=' + cynovan.r_path + 'prototype/monitor/img/lib/neptune/';
        var materialArr = ['AirBlower', 'blower1', 'blower2', 'blower3', 'pump1', 'pump2', 'bluebutton', 'greenbutton',
            'greybutton', 'redbutton', 'yellowbutton', 'selectorSwitch', 'conveyor1', 'conveyor2', 'conveyor3', 'conveyor4',
            'mixer2', 'motor1', 'motor2', 'motor3', 'pipe1', 'pipe2', 'pipe3', 'pipe4', 'pipe5',
            'tank1', 'tank2', 'tank4', 'tank5', 'tank6', 'tank7', 'tank8', 'ballvalve', 'check valve',
            'drainvalve1', 'gatevalve', 'globevalve', 'valve1', 'valve2', 'valve3', 'valve4', 'valvehandleblue', 'valvetop',
            'barrelblue', 'barrelred', 'boiler1', 'boiler2', 'box1', 'fire', 'glassbottle'];

        var materialEntry = [];
        for (let i = 0; i < materialArr.length; i++) {
            let name = materialArr[i];
            materialEntry.push(
                this.createVertexTemplateEntry(s + name + '.svg;',
                    r * 0.49, r * 0.5, '', name, null, null, this.getTagsForStencil(gn, name, dt).join(' ')),
            )
        }

        this.addPalette('material', '素材', false, mxUtils.bind(this, function (content) {
            for (var i = 0; i < materialEntry.length; i++) {
                content.appendChild(materialEntry[i](content));
            }
        }));

    };
})();
