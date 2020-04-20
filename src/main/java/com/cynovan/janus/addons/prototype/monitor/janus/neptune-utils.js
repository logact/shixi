window.NeptuneUtils = {
    deviceList: [],
    placeholderList: [],
    clsList: [],
    clsCode_device_map: {},
    clsCode_clsDDList_map: {},
    getDeviceClsData: function () {
        var deferred = $.Deferred();
        if (!_.size(this.clsList)) {
            NeptuneHttp.get('monitor_developer/loadDevices').done(function (result) {
                var clsList = _.get(result, 'datas.clsList', []);
                NeptuneUtils.clsCode_device_map = _.get(result, "datas.deviceClsMap", {});
                NeptuneUtils.clsList = clsList;
                let res = {
                    clsList: NeptuneUtils.clsList,
                    clsCode_device_map: NeptuneUtils.clsCode_device_map
                };
                deferred.resolve(res);
            });
        } else {
            let res = {
                clsList: NeptuneUtils.clsList,
                clsCode_device_map: NeptuneUtils.clsCode_device_map
            };
            deferred.resolve(res);
        }
        return deferred;
    },
    getClsDDList: function (clsCode) {
        var deferred = $.Deferred();
        let ddList = _.get(NeptuneUtils.clsCode_clsDDList_map, clsCode, []);
        if (_.isEmpty(ddList)) {
            NeptuneHttp.get('monitor_developer/loadClsDDList', {
                clsCode: clsCode
            }).done(function (result) {
                console.log(result);
                var list = _.get(result, 'datas.list.data_definition.details', []);
                _.set(NeptuneUtils.clsCode_clsDDList_map, clsCode, list);
                deferred.resolve(list);
            });
        } else {
            deferred.resolve(ddList);
        }
        return deferred;
    },
    getEditorZtreeData: function (id) {
        var deferred = $.Deferred();
        let ztreeData = _.get(NeptuneUtils, "ztreeData", []);
        if (_.size(ztreeData) === 0) {
            NeptuneHttp.get("monitor_developer/getDeviceFieldsData", {
                id: id
            }).done(function (result) {
                if (_.size(result) !== 0) {
                    _.set(NeptuneUtils, "ztreeData", result);
                    deferred.resolve(result);
                }
            });
        } else {
            deferred.resolve(ztreeData);
        }
        return deferred;
    },
    getPlaceholderList: function (id) {
        var deferred = $.Deferred();
        if (!_.size(this.placeholderList)) {
            NeptuneHttp.get('monitor_developer/getDevicePlaceholders', {
                id: id,
            }).done(function (result) {
                var list = _.get(result, 'datas.placeholders', []);
                NeptuneUtils.placeholderList = list;
                deferred.resolve(NeptuneUtils.placeholderList);
            });
        } else {
            deferred.resolve(NeptuneUtils.placeholderList);
        }
        return deferred;
    },
    findGetParameter: function (parameterName) {
        var result = null,
            tmp = [];
        location.search
            .substr(1)
            .split("&")
            .forEach(function (item) {
                tmp = item.split("=");
                if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
            });
        return result;
    },
    showExpressionDialog: function (params) {
        var deferred = $.Deferred();
        require(['vs/editor/editor.main'], function () {
            /*var selectOpHtml = [];
            _.each(NeptuneUtils.placeholderList, function (placeholder) {
                selectOpHtml.push(`<option value="${placeholder.name}">${placeholder.name}(${placeholder.uuid})</option>`);
            });*/
            var id = NeptuneUtils.findGetParameter('id');
            var html = `<ul id="myTab" class="nav nav-tabs">
                           <li class="active"><a href="#editCode" data-toggle="tab">处理代码</a></li>
                           <li><a href="#testData" data-toggle="tab">测试数据</a></li>
                        </ul>
                        <div id="myTabContent" class="tab-content">
                           <div class="tab-pane fade in active" id="editCode">
                                <div class="row">
                                    <div class="col-xs-12" style="padding: 10px">   
                                        <button class="btn btn-primary btn-outline btn-xs helpDoc" type="button"><i class="fa fa-question"></i> 帮助文档</button>
                                        <button class="btn btn-danger btn-xs testRun" type="button">执行测试</button>
                                        <button class="btn btn-primary btn-outline btn-xs" type="button" whenClicked="=="> 等于</button>
                                        <button class="btn btn-primary btn-outline btn-xs" type="button" whenClicked="!="> 不等于</button>
                                        <button class="btn btn-primary btn-outline btn-xs" type="button" whenClicked="string.contains(,)"> 包含</button>
                                        <button class="btn btn-primary btn-outline btn-xs" type="button" whenClicked="!string.contains(,)"> 不包含</button>
                                        <button class="btn btn-primary btn-outline btn-xs" type="button" whenClicked=">"> 大于</button>
                                        <button class="btn btn-primary btn-outline btn-xs" type="button" whenClicked=">="> 大于等于</button>
                                        <button class="btn btn-primary btn-outline btn-xs" type="button" whenClicked="<"> 小于</button>
                                        <button class="btn btn-primary btn-outline btn-xs" type="button" whenClicked="<="> 小于等于</button>
                                        <button class="btn btn-primary btn-outline btn-xs" type="button" whenClicked="&amp;&amp;"> And</button>
                                        <button class="btn btn-primary btn-outline btn-xs" type="button" whenClicked="||"> 或</button>
                                   </div>
                                   <div class="col-xs-12">
                                        <div class="mxgraph-expression-dialog">
                                            <div id="cls_dd_tree" class="ztree"></div>
                                            <div id="mxgraph-express-code-editor"></div>
                                        </div>
                                   </div>
                               </div>
                           </div>
                           <div class="tab-pane fade" id="testData">
                           <div class="row">
                               <div class="col-xs-6">
                                    <div class="mxgraph-expression-dialog">                                        
                                        <div id="mxgraph-express-testdata-editor"></div>
                                    </div>
                                  </div>
                                  <div class="col-xs-6">
                                    <div class="mxgraph-expression-dialog"><div id="mxgraph-express-outputdata-editor"></div></div>
                                  </div>
                                </div>
                           </div>
                        </div>`;

            var editor = null, editor1 = null, editor2 = null;
            var element = bootbox.dialog({
                title: false,
                message: html,
                buttons: {
                    'success': {
                        label: "确认",
                        className: "btn btn-success",
                        callback: function () {
                            var value = '', value1 = '', value2 = '';
                            if (editor) {
                                value = editor.getValue();
                            }
                            if (editor1) {
                                value1 = editor1.getValue();
                            }
                            if (editor2) {
                                value2 = editor2.getValue();
                            }
                            params.value.code = value;
                            params.value.testdata = value1;
                            params.value.outputdata = value2;
                            deferred.resolve(params);
                            return true;
                        }
                    },
                    'cancel': {
                        label: '取消',
                        className: 'btn btn-default',
                        callback: function (event) {
                            return true;
                        }
                    }
                }
            });
            element.find('.modal-dialog').width(1200);

            /*init the monaco editor*/
            var monacoObj = {
                language: 'javascript',
                automaticLayout: true,
                height: '350px'
            };
            var monacoJsonObj = {
                language: 'json',
                automaticLayout: true,
                height: '350px'
            };
            var editorEle = document.getElementById('mxgraph-express-code-editor');
            var editorEle1 = document.getElementById('mxgraph-express-testdata-editor');
            var editorEle2 = document.getElementById('mxgraph-express-outputdata-editor');
            editor = monaco.editor.create(editorEle, monacoObj);// 处理代码
            editor1 = monaco.editor.create(editorEle1, monacoJsonObj); // 测试数据
            editor2 = monaco.editor.create(editorEle2, monacoJsonObj); // 输出结果
            if (editor) {
                editor.setValue(params.value.code);
            }
            if (editor1) {
                if (_.isEmpty(params.value.testdata)) {
                    var fictitious_data = {
                        "name": {
                            "static": {
                                "baseInfo": {
                                    "name": "设备名称"
                                },
                                "uuid": "设备uuid"
                            },
                            "dynamic": {
                                "key1": "30"
                            }
                        }
                    };
                    NeptuneUtils.getPlaceholderList(id).done(function (list) {
                        var placeholders = list;
                        if (_.size(placeholders)) {
                            var first = _.first(placeholders);
                            var name = "$" + first.name + "$";
                            _.set(fictitious_data, name, fictitious_data.name);
                            _.unset(fictitious_data, "name");
                        }
                        fictitious_data = JSON.stringify(fictitious_data, null, "\t");
                        editor1.setValue(fictitious_data);
                    });
                } else {
                    editor1.setValue(params.value.testdata);
                }
            }
            if (editor2) {
                editor2.setValue(params.value.outputdata);
            }

            // 初始化ztree
            NeptuneUtils.getEditorZtreeData(id).done(function (data) {
                let tree = $("#cls_dd_tree");
                var zTreeObj;
                var onDblClick = function (event, treeId, treeNode, clickFlag) {
                    if (!treeNode.isParent) {
                        var firstP = _.head(treeNode.getPath());
                        var device_name = _.get(firstP, "name");
                        var key = treeNode.key;
                        var type = treeNode.deviceDataType;
                        var name = _.join(['root["$' + device_name + '$"]["' + type + '"]["', key, '"]'], '');
                        NeptuneUtils.addExpress(editor, name);
                    }
                };
                var setting = {
                    callback: {
                        onDblClick: onDblClick
                    }
                };
                zTreeObj = $.fn.zTree.init(tree, setting, data);
            });


            // 选择设备.
            $('.format-input').on('change', function (item) {
                var name = this.value;
                if (name) {
                    // uuid length > 4, 设备 else 设备域
                    if (name.length > 4) {
                        name = _.join(['$', name, '$'], '');
                    } else {
                        name = _.join(['$', name, '$'], '');
                    }
                    NeptuneUtils.addExpress(editor, name);
                }
            });

            // 处理代码: editor在所在光标处加入当前点击的运算符.
            var buttons = document.getElementsByClassName('btn-primary');
            for (var i = 0; i < buttons.length; i++) {
                var button = buttons[i];
                button.onclick = function () {
                    var whenClicked = this.getAttribute('whenClicked');
                    if (whenClicked != null) {
                        NeptuneUtils.addExpress(editor, whenClicked);
                    }
                }
            }

            // 执行测试.
            $('.testRun').on('click', function () {
                NeptuneUtils.testRun(editor, editor1, editor2);
            });

            // 帮助文档.
            $('.helpDoc').on('click', function () {
                $('.modal-dialog').hide();// 隐藏处理代码dialog
                NeptuneUtils.showHelpDocumentDialog();
            });

            element.on('hidden.bs.modal', function () {
                if (editor) {
                    editor.dispose();
                }
                if (editor1) {
                    editor1.dispose();
                }
                if (editor2) {
                    editor2.dispose();
                }
            });
        });
        return deferred;
    },
    addExpress: function (editor, express) {
        var express = ' ' + express;
        editor.executeEdits("", [{
            range: {
                startLineNumber: editor.getPosition().lineNumber,
                startColumn: editor.getPosition().column,
                endLineNumber: editor.getPosition().lineNumber,
                endColumn: editor.getPosition().column
            },
            text: express
        }]);
    },
    testRun: function (editor, editor1, editor2) {
        var flag = NeptuneUtils.execCode(editor, editor1, editor2);
        if (flag === true) {
            alert('执行通过，请点击[处理后数据]查看结果');
        }
    },
    execCode: function (editor, editor1, editor2) {
        var code = editor.getValue();
        var testdata = editor1.getValue();

        var data = {};
        try {
            data = JSON.parse(testdata);
        } catch (e) {
            alert("请输入正确的测试数据");
            return false;
        }
        try {
            var func = new Function("root", code);
            func(data);
        } catch (e) {
            alert('测试错误');
            return false;
        }
        editor2.setValue(JSON.stringify(data));
        editor2.getAction('editor.action.formatDocument').run();// format outputdata code
        return true;
    },
    showHelpDocumentDialog: function () {
        var html = [];
        html.push(`<div class="code_title" style="font-size: 16px;padding-top: 5px;">提示:</div>
                   <div class="code_title">1.使用root即可引用数据，例如root["$AGV小车$"]["static"]["company"]代表引用AGV小车设备静态数据中的company栏位</div>
                   <div class="code_title">2.表达式必须有明确的返回值，条件表达式时返回true/false</div>
                   <div class="code_title" style="font-size: 16px;padding-top: 10px;">数据示例:</div>
<pre class="code-area">
{
     "$上下料机器人$": {
         "dynamic":{
             "temp":"30",
             "error_code":"ERROR001"
         }
     },
     "$AGV小车$": {
         "dynamic":{
             "position":"1"
         },
         "static":{
             "company":"cynovan"
         }
     },
}
</pre>
                   <div class="code_title" style="font-size: 16px;padding-top: 10px;">代码示例:</div>
                   <div class="code_title">1. $上下料机器人$设备的动态数据温度大于20</div>
                   <div class="code-area">return root["$上下料机器人$"]["dynamic"]["temp"] > 20</div>
                   <div class="code_title">2. $上下料机器人$设备的动态数据报警代码为'ERROR001'</div>
                   <div class="code-area">return root["$上下料机器人$"]["dynamic"]["error_code"] == 'ERROR001'</div>`);
        html = html.join('');

        var element = bootbox.dialog({
            title: '帮助文档',
            message: html,
            buttons: {
                'cancel': {
                    label: '取消',
                    className: 'btn btn-default',
                    callback: function () {
                        $('.modal-dialog').show();// 显示处理代码dialog
                        return true;
                    }
                }
            }, onEscape: function () {
                $('.modal-dialog').show();// 显示处理代码dialog
            }
        });
        element.find('.modal-dialog').width(1000);
    },
    showDevicePlaceHolderDialog: function (params) {
        var deferred = $.Deferred();
        NeptuneUtils.placeholderList = _.cloneDeep(params.value.devicePlaceHolderList);
        NeptuneUtils.getDeviceClsData().done(function (res) {
            let list = _.get(res, "clsList", []);
            let clsCode_device_map = _.get(res, "clsCode_device_map", {});
            var html = [];
            html.push(`<div style="padding-left: 30px;padding-right: 30px">`);
            html.push(`<table class="device-placeholder-list table table-condensed table-bordered edittable no-padding">`);
            html.push(`<thead><tr><th style="width: 45px">序号</th><th>名称</th><th>设备分类</th><th>默认设备</th></th><th>操作</th></tr></thead>`);
            html.push(`<tbody>`);
            if (_.size(NeptuneUtils.placeholderList)) {
                var rows = [];
                _.each(NeptuneUtils.placeholderList, function (item, idx) {
                    var clsSelectOpHtml = [];
                    var deviceSelectOpHtml = [];
                    let deviceList = _.get(clsCode_device_map, item.clsCode, []);
                    _.each(list, function (cls) {
                        if (cls.code === item.clsCode) {
                            clsSelectOpHtml.push(`<option value="${cls.code}" selected="selected">${cls.name}</option>`);
                        } else {
                            clsSelectOpHtml.push(`<option value="${cls.code}">${cls.name}</option>`);
                        }
                    });
                    deviceSelectOpHtml.push(`<option  value="">无</option>`);
                    _.each(deviceList, function (device) {
                        // 是否选中设备
                        if (device.uuid === item.default) {
                            deviceSelectOpHtml.push(`<option value="${device.uuid}" selected="selected">${device.uuid}(${device.baseInfo.name})</option>`);
                        } else {
                            deviceSelectOpHtml.push(`<option value="${device.uuid}">${device.uuid}(${device.baseInfo.name})</option>`);
                        }
                    });
                    rows.push(NeptuneUtils.addPlaceholderRow(item, idx, clsSelectOpHtml, deviceSelectOpHtml));
                });
                if (_.size(rows)) {
                    html.push(rows.join(''));
                }
            }

            html.push(`</tbody></table>`);
            html.push(`<button type="button" class="btn btn-primary btn-outline btn-sm addPlaceholder" title="添加"><i class="fa fa-plus"></i> 添加</button>`);
            html.push(`</div>`);
            html = html.join('');

            var element = bootbox.dialog({
                title: '创建设备关联',
                message: html,
                closeButton: false,
                buttons: {
                    'success': {
                        label: "确认",
                        className: "btn btn-success",
                        callback: function () {
                            var emptyFlag = true;// 检查名称是否为空
                            var ruleFlag = true;// 检查名称是否含有特殊字符
                            let isClsEmpty = false;
                            let isDvsEmpty = false;
                            var rule = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？ ]");

                            _.each(NeptuneUtils.placeholderList, function (item) {
                                if (_.isEmpty(item.name)) {
                                    emptyFlag = false;
                                } else if (rule.test(item.name)) {
                                    ruleFlag = false;
                                }
                                if (_.isEmpty(item.clsCode)) {
                                    isClsEmpty = true;
                                }
                                if (_.isEmpty(item.default)) {
                                    isDvsEmpty = true;
                                }
                            });
                            if (emptyFlag === false) {
                                alert('名称不能为空');
                                return false;
                            }
                            if (ruleFlag === false) {
                                alert('名称不能含有特殊字符');
                                return false;
                            }
                            if (_.size(_.uniqBy(NeptuneUtils.placeholderList, 'name')) != _.size(NeptuneUtils.placeholderList)) {
                                alert('名称不能重复');
                                return false
                            }
                            if (isClsEmpty) {
                                alert('请选择分类');
                                return false;
                            }
                            params.value.devicePlaceHolderList = _.cloneDeep(NeptuneUtils.placeholderList);
                            _.set(NeptuneUtils, "ztreeData", []);
                            deferred.resolve(params);

                            return true;
                        }
                    },
                    'cancel': {
                        label: '取消',
                        className: 'btn btn-default',
                        callback: function (event) {
                            NeptuneUtils.placeholderList = params.value.devicePlaceHolderList;
                            return true;
                        }
                    }
                }
            });
            element.find('.modal-dialog').width(1100);
            element.on('hidden.bs.modal', function () {

            });
            // 添加一行.
            $('.addPlaceholder').on('click', function () {
                NeptuneUtils.placeholderList.push({});
                NeptuneUtils.addPlaceholderRows();
            });
            var rowElement = $('.device-placeholder-list tbody');
            NeptuneUtils.managePlaceholderRow(rowElement);
        });
        return deferred;
    },
    showClsDataStruDialog: function (options) {
        let placeholder_clsCode = options.placeholder_clsCode;
        let device_fields = options.device_fields;
        let isMultiple = options.isMultiple;
        let tag2 = options.tag2;
        let control_cmd_type = options.control_cmd_type;

        if (_.isEmpty(device_fields)) {
            device_fields.push({});
        }
        NeptuneUtils.clsDDCollection = device_fields;
        var deferred = $.Deferred();
        require([], function () {
            NeptuneUtils.getClsDDList(placeholder_clsCode).done(function (clsDDList) {
                var html = [];
                html.push(`<div class="clsDDListTableDiv">`);
                html.push(`<table class="clsDDListTable table table-condensed table-bordered edittable no-padding">`);
                let isValue = tag2 === "control" && isMultiple;
                if (tag2 === 'control') {
                    if (isMultiple) {
                        html.push(`<thead><tr><th style="width: 45px">序号</th><th style="width:294px">数据栏位</th><th>下发数据值</th><th>操作</th></tr></thead>`);
                    } else {
                        html.push(`<thead><tr><th style="width: 45px">序号</th><th style="width:375px">数据栏位</th><th>操作</th></tr></thead>`);
                    }
                } else {
                    html.push(`<thead><tr><th style="width: 45px">序号</th><th style="width:294px">数据栏位</th><th>数据名称</th></th><th>操作</th></tr></thead>`);
                }
                html.push(`<tbody>`);
                // 表格的每一行
                if (_.size(device_fields)) {
                    var rows = [];
                    _.each(device_fields, function (item, idx) {
                        var selectOpHtml = [];
                        selectOpHtml.push('<option value="">请选择栏位...</option>');
                        _.each(clsDDList, function (clsDDItem) {
                            if (clsDDItem.key === item.key) {
                                selectOpHtml.push(`<option value="${clsDDItem.key}" selected="selected">${clsDDItem.name} (${clsDDItem.key})</option>`);
                            } else {
                                selectOpHtml.push(`<option value="${clsDDItem.key}">${clsDDItem.name} (${clsDDItem.key})</option>`);
                            }
                        });
                        rows.push(NeptuneUtils.addClsDDRow(item, idx, selectOpHtml, tag2, options.control_cmd_type));
                    });
                    if (_.size(rows)) {
                        html.push(rows.join(''));
                    }
                }
                html.push(`</tbody></table>`);
                if (isMultiple) {
                    html.push(`<button type="button" class="btn btn-primary btn-sm addClsDDBtn btn-outline" title="添加" style="margin-top: 8px">
                                    <i class="fa fa-plus"></i> 添加
                                </button>`);
                }
                html.push(`<div>`);
                html = html.join('');
                var element = bootbox.dialog({
                    title: '栏位设置',
                    message: html,
                    buttons: {
                        'success': {
                            label: "确认",
                            className: "btn btn-success",
                            callback: function () {
                                var nameNotEmpty = true;// 检查名称是否为空
                                var ruleFlag = true;// 检查名称是否含有特殊字符
                                var keyNotEmpty = true;
                                var rule = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？ ]");
                                _.each(NeptuneUtils.clsDDCollection, function (item) {
                                    if (_.isEmpty(item.name)) {
                                        nameNotEmpty = false;
                                    } else if (rule.test(item.name)) {
                                        ruleFlag = false;
                                    }
                                    if (_.isEmpty(item.key)) {
                                        keyNotEmpty = false;
                                    }
                                });
                                if (keyNotEmpty === false) {
                                    alert("请选择栏位");
                                    return false;
                                }
                                if (nameNotEmpty === false) {
                                    alert('名称不能为空');
                                    return false;
                                }
                                if (ruleFlag === false) {
                                    alert('名称不能含有特殊字符');
                                    return false;
                                }
                                if (_.size(_.uniqBy(NeptuneUtils.clsDDCollection, 'key')) != _.size(NeptuneUtils.clsDDCollection)) {
                                    alert('所选栏位重复!');
                                    return false
                                }
                                let clsDDCollection = _.cloneDeep(NeptuneUtils.clsDDCollection);
                                deferred.resolve(clsDDCollection);
                                return true;
                            }
                        },
                        'cancel': {
                            label: '取消',
                            className: 'btn btn-default',
                            callback: function (event) {
                            }
                        }
                    }
                });

                element.find('.modal-dialog').width(800);
                // 添加一行.
                $('.addClsDDBtn').on('click', function () {
                    if (isMultiple) {
                        NeptuneUtils.clsDDCollection.push({});
                        let options = {
                            placeholder_clsCode: placeholder_clsCode,
                            "clsDDCollection": NeptuneUtils.clsDDCollection,
                            isValue: isValue,
                            tag2: tag2,
                            control_cmd_type: control_cmd_type
                        };
                        NeptuneUtils.addClsDDRows(options);
                    } else {
                        if (_.size(NeptuneUtils.clsDDCollection) > 0) {
                            alert("只能选择一个栏位");
                            return;
                        }
                        NeptuneUtils.clsDDCollection.push({});
                    }
                });
                var rowElement = $('.clsDDListTable tbody');
                NeptuneUtils.manageAddClsDDRow(rowElement, clsDDList);
            });
        });
        return deferred;
    },
    addPlaceholderRows: function () {
        var rows = [];
        _.each(NeptuneUtils.placeholderList, function (item, idx) {
            var clsSelectOpHtml = [];
            clsSelectOpHtml.push('<option value="">请选择分类...</option>');
            var deviceSelectOpHtml = [];
            let deviceList = _.get(NeptuneUtils.clsCode_device_map, item.clsCode, []);
            deviceSelectOpHtml.push(`<option value="">无</option>`);
            _.each(deviceList, function (device) {
                // 是否选中设备
                if (device.uuid === item.default) {
                    deviceSelectOpHtml.push(`<option value="${device.uuid}" selected="selected">${device.uuid}(${device.baseInfo.name})</option>`);
                } else {
                    deviceSelectOpHtml.push(`<option value="${device.uuid}">${device.uuid}(${device.baseInfo.name})</option>`);
                }
            });
            _.each(NeptuneUtils.clsList, function (cls) {
                if (cls.code === item.clsCode) {
                    clsSelectOpHtml.push(`<option value="${cls.code}" selected="selected">${cls.name}</option>`);
                } else {
                    clsSelectOpHtml.push(`<option value="${cls.code}">${cls.name}</option>`);
                }
            });
            rows.push(NeptuneUtils.addPlaceholderRow(item, idx, clsSelectOpHtml, deviceSelectOpHtml));
        });

        var rowElement = $('.device-placeholder-list tbody');
        rowElement.html(rows.join(''));

        NeptuneUtils.managePlaceholderRow(rowElement);
    },
    addPlaceholderRow: function (item, idx, clsSelectOpHtml, deviceSelectOpHtml) {
        var rows = [];
        rows.push(`<tr class="mxgraph-device-placeholder-row"  data-index="${idx}">
                        <td style="vertical-align:middle;text-align: center">${idx + 1}</td>`);
        rows.push(`<td><input type="text" class="form-control mxgraph-device-placeholder-input" value="${item.name || ''}" placeholder="名称"/></td>`);
        rows.push(`<td style="width:300px"><select class="form-control clsSelect">` + clsSelectOpHtml.join('') + `</select></td>`);
        rows.push(`<td style="width:300px"><select class="form-control dvsSelect">` + deviceSelectOpHtml.join('') + `</select></td>`);
        rows.push(`<td style="vertical-align: middle;width: 70px;text-align: center"><button class="btn btn-primary btn-outline btn-xs" type="button" >
                                          <i class="fa fa-trash-o" title="删除"></i> 删除</button></td>`);
        rows.push('</tr>');
        return rows.join('');
    },
    addClsDDRow: function (item, idx, selectOpHtml, tag2, control_cmd_type) {
        var rows = [];
        rows.push(`<tr class="addClsDDTblTr"  data-index="${idx}"><td class="align-center-center">${idx + 1}</td>`);
        rows.push(`<td class="cls-dd-chosen"><select class="form-control addClsDDRowSelect chosen-select">` + selectOpHtml.join('') + `</select></td>`);
        if (tag2 === 'control') {
            if (control_cmd_type === 'multipleDeviceValue') {
                rows.push(`<td><input type="text" class="form-control addClsDDRowSelectValue" value="${item.value || ''}" placeholder="数据值"/></td>`);
            }
        } else {
            rows.push(`<td class="addClsDDRowSelectName"> ${item.name || ''} </td>`);
        }
        rows.push(`<td class="addClsDDDeleteTd">
                        <button class="btn btn-primary btn-outline btn-xs" type="button"><i class="fa fa-trash-o" title="删除"></i> 删除</button></td>`);
        rows.push('</tr>');
        return rows.join('');
    },
    addClsDDRows: function (options) {
        let placeholder_clsCode = options.placeholder_clsCode;
        let clsDDList = _.get(NeptuneUtils.clsCode_clsDDList_map, placeholder_clsCode, []);
        var rows = [];
        _.each(NeptuneUtils.clsDDCollection, function (item, idx) {
            var selectOpHtml = [];
            var value = '';
            selectOpHtml.push('<option value="">请选择栏位...</option>');
            _.each(clsDDList, function (clsDDItem) {
                value = clsDDItem.value;
                if (clsDDItem.key === item.key) {
                    selectOpHtml.push(`<option value="${clsDDItem.key}" selected="selected">${clsDDItem.name} (${clsDDItem.key})</option>`);
                } else {
                    selectOpHtml.push(`<option value="${clsDDItem.key}">${clsDDItem.name} (${clsDDItem.key})</option>`);
                }
            });
            rows.push(NeptuneUtils.addClsDDRow(item, idx, selectOpHtml, options.tag2, options.control_cmd_type));
        });
        // 将表格元素放到dialog table上
        var rowElement = $('.clsDDListTable tbody');
        rowElement.html(rows.join(''));

        NeptuneUtils.manageAddClsDDRow(rowElement, clsDDList);
    },
    manageAddClsDDRow: function (rowElement, clsDDList) {
        // 删除当前行.
        rowElement.find('.fa').closest('button').click(function (event) {
            var row = $(event.target).closest('.addClsDDTblTr');
            var idx = _.parseInt(row.data('index'));
            NeptuneUtils.clsDDCollection.splice(idx, 1);
            row.remove();
        });
        // 选中栏位后更新table以及相关的对象集合
        rowElement.find('.addClsDDRowSelect').closest('select').change(function (event) {
            let selectedIndex = $(this).prop('selectedIndex');
            var row = $(event.target).closest('.addClsDDTblTr');
            var idx = _.parseInt(row.data('index'));
            if (selectedIndex !== 0) {
                // 选择栏位
                let item = _.nth(clsDDList, selectedIndex - 1);
                NeptuneUtils.clsDDCollection[idx] = {
                    key: item.key,
                    name: item.name,
                    id: item.id,
                    type: item.rule,
                    suffix: item.suffix
                };
                row.find(".addClsDDRowSelectName").text(item.name);
            } else {
                // 未选择
                row.find(".addClsDDRowSelectName").text("");
                NeptuneUtils.clsDDCollection[idx] = {};
            }
        });
        // 名称改变
        rowElement.find(".addClsDDRowSelectName").change(function (event) {
            var row = $(event.target).closest('.addClsDDTblTr');
            var idx = _.parseInt(row.data('index'));
            if (!_.isEmpty($(this).val())) {
                NeptuneUtils.clsDDCollection[idx].name = $(this).val();
            }
        });
        // 下发值
        rowElement.find(".addClsDDRowSelectValue").change(function (event) {
            var row = $(event.target).closest('.addClsDDTblTr');
            var idx = _.parseInt(row.data('index'));
            if (!_.isEmpty($(this).val())) {
                NeptuneUtils.clsDDCollection[idx].value = $(this).val();
            }
        });
        var element = $(".modal-dialog");
        let dd_selects = element.find(".cls-dd-chosen .chosen-select");
        _.each(dd_selects, function (item) {
            $(item).chosen({
                search_contains: true,
                allow_single_deselect: true,
                no_results_text: "没有匹配结果"
            }).change(function (event, item) {
                console.log(item);
            });
        });
    },
    managePlaceholderRow: function (rowElement) {
        // 删除当前行.
        rowElement.find('.fa').closest('button').click(function (event) {
            var row = $(event.target).closest('.mxgraph-device-placeholder-row');
            var idx = _.parseInt(row.data('index'));
            NeptuneUtils.placeholderList.splice(idx, 1);
            row.remove();
        });

        // 更改占位符名称.
        rowElement.find('input').change(function (event) {
            var row = $(event.target).closest('.mxgraph-device-placeholder-row');
            var idx = _.parseInt(row.data('index'));
            var item = NeptuneUtils.placeholderList[idx];
            if (!item.uuid) {
                _.set(item, 'uuid', NeptuneUtils.generatePlaceholderid());
            }
            _.set(item, 'name', event.target.value);
        });

        // 更改设备分类
        rowElement.find('select.clsSelect').change(function (event) {
            var row = $(event.target).closest('.mxgraph-device-placeholder-row');
            var idx = _.parseInt(row.data('index'));
            var item = NeptuneUtils.placeholderList[idx];
            _.set(item, 'clsCode', event.target.value);
            let deviceList = _.get(NeptuneUtils.clsCode_device_map, event.target.value, []);
            // 更新当前row分类下的设备列表
            let dvsOpsHtml = [];
            dvsOpsHtml.push(`<option value="">无</option>`);
            _.each(deviceList, function (device) {
                dvsOpsHtml.push(`<option value="${device.uuid}">${device.uuid}(${device.baseInfo.name})</option>`);
            });
            row.find('select.dvsSelect').html(dvsOpsHtml.join(''));
            _.set(item, 'default', row.find('select.dvsSelect').val() || "");
        });

        // 更改默认设备.
        rowElement.find('select.dvsSelect').change(function (event) {
            var row = $(event.target).closest('.mxgraph-device-placeholder-row');
            var idx = _.parseInt(row.data('index'));
            var item = NeptuneUtils.placeholderList[idx];
            _.set(item, 'default', event.target.value);
        });
    },
    generatePlaceholderid: function () {
        var d = new Date().getTime();
        var uuid = 'PH-yxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
        var exists = _.find(NeptuneUtils.placeholderList, function (item) {
            return item.id === uuid;
        });
        if (exists) {
            return NeptuneUtils.generatePlaceholderid();
        }
        return uuid;
    },
    addHistoryDataFieldRows: function (fields, clsDDList) {

        var rows = [];
        _.each(fields, function (field, filedIndex) {

            rows.push(NeptuneUtils.addHistoryDataFieldRow(filedIndex, field, clsDDList));
        });
        return _.join(rows, '');
    },
    addHistoryDataFieldRow: function (filedIndex, field, clsDDList, useOrigin) {
        var staticsTypes = [{
            id: '$count',
            name: '计数'
        }, {
            id: '$sum',
            name: '求和'
        }, {
            id: '$avg',
            name: '平均数'
        }, {
            id: '$max',
            name: '最大值'
        }, {
            id: '$min',
            name: '最小值'
        }];
        var selectOpHtml = [];
        var isDisabled = true;
        _.each(clsDDList, function (clsDDItem) {
            if (clsDDItem.key === field.id) {
                if (clsDDItem.rule === 'number') {
                    isDisabled = false;
                }
                selectOpHtml.push(`<option value="${clsDDItem.key}" selected="selected">${clsDDItem.name}</option>`);
            } else {
                selectOpHtml.push(`<option value="${clsDDItem.key}">${clsDDItem.name}</option>`);
            }
        });
        selectOpHtml = _.join(selectOpHtml, '');
        var staticsOpHtml = [];
        _.each(staticsTypes, function (statics) {
            if (statics.id === field.statis) {
                staticsOpHtml.push(`<option value="${statics.id}" selected="selected">${statics.name}</option>`);
            } else {
                staticsOpHtml.push(`<option value="${statics.id}">${statics.name}</option>`);
            }
        });
        staticsOpHtml = _.join(staticsOpHtml);
        var fieldStaticsHtml = `<select class="form-control field-statics" style="${useOrigin ? `display:none` : ''}">${staticsOpHtml}</select>`;
        if (isDisabled) {
            fieldStaticsHtml = `<select class="form-control field-statics" style="${useOrigin ? `display:none` : ''}" disabled="disabled">${staticsOpHtml}</select>`;
        }
        fieldStaticsHtml = _.join(fieldStaticsHtml, '');
        var rowHtml = `
        <div class="axis_row" data-index="${filedIndex}">
            <select class="form-control field-key">${selectOpHtml}</select>
            ${fieldStaticsHtml}
            <span class="axis_oper_box">
                <i class="axis_oper_icon add-row" title="添加"></i>
                <i class="axis_oper_icon minus-row" title="删除"></i>
            </span>
        </div>`;
        return rowHtml;
    },
    showHistoryDataChartDialog: function (params) {
        let virtualDeviceCls = params.virtualDeviceCls || '';
        let chartType = params.chartType || 'line-chart1';
        let useOrigin = params.useOrigin || false;
        let rangeType = params.rangeType || 'D1';
        let startDate = params.startDate || '';
        let endDate = params.endDate || '';
        let groups = params.groups || {};//{field:'','format':''}
        if (_.isEmpty(groups)) {
            _.set(groups, 'id', 'time');
            _.set(groups, 'time_format', '%Y');
            _.set(groups, 'name', '时间(年份)');
        } else {
            groups = JSON.parse(groups);
        }
        let fields = params.fields || [{'id': 'time', 'statis': '$count', 'name': '时间(计数)'}];//[{'field':'','type':''}]
        if (_.isEmpty(fields)) {
            fields = [{'id': 'time', 'statis': '$count', 'name': '时间(计数)'}];
        } else {
            fields = JSON.parse(fields);
        }
        var deferred = $.Deferred();
        NeptuneUtils.getClsDDList(virtualDeviceCls).done(function (clsDDList) {
            var clsDDFirst = _.nth(clsDDList, 0);
            if (clsDDFirst && clsDDFirst.key !== 'time' && (chartType === 'line-chart1' && !useOrigin)) {
                clsDDList.unshift({
                    key: 'time',
                    name: '时间',
                    rule: 'str'
                });
            }
            var timeFormats = [{
                id: '%Y',
                name: '年份',
                example: '2016'
            }, {
                id: '%Y-%m',
                name: '年-月',
                example: '2016-5'
            }, {
                id: '%Y-%m-%d',
                name: '年-月-日',
                example: '2016-5-6'
            }, {
                id: '%H:%M',
                name: '时:分',
                example: '15:30'
            }, {
                id: '%H:%M:%S',
                name: '时:分:秒',
                example: '15:30:36'
            }, {
                id: '%H:%M:%S.%L',
                name: '时:分:秒.毫秒',
                example: '15:30:36.568'
            }, {
                id: '%Y-%m-%d %H',
                name: '年-月-日 时',
                example: '2016-05-06 15'
            }, {
                id: '%Y-%m-%d %H:%M',
                name: '年-月-日 时-分',
                example: '2016-05-06 15:30'
            }];

            var timeFormatHtml = [];
            _.each(timeFormats, function (item) {
                if (item.id === groups.time_format) {
                    timeFormatHtml.push(`<option value="${item.id}" selected="selected">${item.name}</option>`);
                } else {
                    timeFormatHtml.push(`<option value="${item.id}">${item.name}</option>`);
                }
            });

            var selectOpHtml = [], disabledGroup = '';
            if (chartType === 'line-chart1' && useOrigin) {
                selectOpHtml.push(`<option value="time" selected="selected">时间</option>`);
                disabledGroup = `disabled='disabled'`;
            }
            _.each(clsDDList, function (clsDDItem) {
                if (clsDDItem.key === groups.id) {
                    selectOpHtml.push(`<option value="${clsDDItem.key}" selected="selected">${clsDDItem.name}</option>`);
                } else {
                    selectOpHtml.push(`<option value="${clsDDItem.key}">${clsDDItem.name}</option>`);
                }
            });
            var fieldHtml = NeptuneUtils.addHistoryDataFieldRows(fields, clsDDList);

            var html = `<div class="chart_setting_body">
<div class="chart_sub_title"> <i class="fa fa-circle-o"></i> <span>图表类型</span> </div>
<div class="chart_setting_row">
    <img style="cursor: pointer;" class="line-chart-history" data-key="line-chart1" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/line_chart1.png" title="折线图"/>
    <img style="cursor: pointer;" class="bar-chart-history" data-key="bar-chart1" src="${cynovan.r_path}prototype/monitor/img/lib/neptune/bar_chart1.png" title="柱状图"/>
</div>
<div class="chart_sub_title"> <i class="fa fa-circle-o"></i> <span>数据筛选</span> </div>
<div class="chart_setting_row">
    <select class="form-control date_range_type">
        <option value="D1">今天</option>
        <option value="D2">昨天</option>
        <option value="D3">过去7天</option>
        <option value="D4">过去30天</option>
        <option value="D5">过去60天</option>
        <option value="D6">过去90天</option>
        <option value="D7">过去180天</option>
        <option value="D100">日期范围</option>
    </select>
<div class="date_range_box" style="display: none">
    <input type="date" class="data-start-date form-control date" data-key="startDate" />
    <input type="date" class="data-end-date form-control date" data-key="dateEnd" /></div>
</div>
<div class="chart_sub_title"> 
    <i class="fa fa-circle-o"></i> <span>分组栏位</span>
    <span class="use-origin-span" style="margin-left: 10px;cursor: pointer">
        <label style="font-size: 14px;font-weight: 500;margin-bottom: 0;display: inline-flex; align-items: center; align-content: center;">
            <input type="checkbox" class="use-origin-value" style="margin: 0 5px;"> 使用原值
        </label> 
    </span>
</div>
<div class="chart_setting_row">
    <select class="form-control group-field" ${disabledGroup}>${selectOpHtml.join('')}</select>
    <select class="form-control group-format"> ${timeFormatHtml.join('')}</select>
</div>
<div class="chart_sub_title"> <i class="fa fa-circle-o"></i> <span>数据栏位</span></div>
<div class="chart_setting_row data-field">
    ${fieldHtml}
</div>`;

            var element = bootbox.dialog({
                title: '历史数据图表设置',
                message: html,
                buttons: {
                    'success': {
                        label: "确认",
                        className: "btn btn-success",
                        callback: function () {
                            var fieldsArray = [];
                            var fieldsRow = $('.data-field .axis_row');
                            let noClose = false;
                            let allFieldKeys = [];
                            _.each(fieldsRow, function (row) {
                                let key = $(row).find('.field-key').val();
                                if (key === '') {
                                    noClose = true;
                                }
                                allFieldKeys.push(key);
                                let fieldInfo = {};
                                _.set(fieldInfo, 'id', key);
                                let name = $(row).find('.field-key option:selected').text() + '(' + $(row).find('.field-statics option:selected').text() + ')';
                                if (useOrigin) {
                                    name = $(row).find('.field-key option:selected').text();
                                }
                                _.set(fieldInfo, 'name', name);
                                _.set(fieldInfo, 'statis', $(row).find('.field-statics').val());
                                fieldsArray.push(fieldInfo)
                            });
                            let override = allFieldKeys.length === _.uniq(allFieldKeys).length ? false : true;

                            if (noClose) {
                                alert('请选择栏位');
                                return false;
                            }
                            if (override) {
                                alert('栏位重复，请检查');
                                return false;
                            }

                            let params = {
                                updateTime: new Date().getTime(),
                                chartType: chartType,
                                rangeType: rangeType,
                                startDate: startDate,
                                endDate: endDate,
                                useOrigin: useOrigin,
                                groups: JSON.stringify(groups),
                                fields: JSON.stringify(fieldsArray)
                            };

                            deferred.resolve(params);
                            return true;
                        }
                    },
                    'cancel': {
                        label: '取消',
                        className: 'btn btn-default',
                        callback: function (event) {
                            return true;
                        }
                    }
                }
            });
            element.find('.modal-dialog').width(800);

            element.find('.bootbox-body').css({
                'max-height': window.innerHeight - 210 + 'px',
                'overflow-y': 'scroll'
            });

            /**选择图表类型start*/
            var addSelectBorder = function (chartType) {
                if (chartType === 'line-chart1') {
                    $('.chart_setting_row >.line-chart-history').css({
                        "border": "solid 1px #488eff"
                    });
                    $('.chart_setting_row >.bar-chart-history').css({
                        "border": "none"
                    });
                    $('.use-origin-span').css('display', 'inline-block');
                } else if (chartType === 'bar-chart1') {
                    $('.chart_setting_row >.line-chart-history').css({
                        "border": "none"
                    });
                    $('.chart_setting_row >.bar-chart-history').css({
                        "border": "solid 1px #488eff"
                    });
                    $('.use-origin-span').css('display', 'none');
                }
            };
            addSelectBorder(chartType);
            element.find('.chart_setting_row >img').click(function (event) {
                var img = $(this);
                chartType = img.data('key');
                let checked = $('.use-origin-value')[0].checked;
                if (chartType === 'bar-chart1') {
                    checked = false;
                }
                initUseOrigin(checked);
                addSelectBorder(chartType);
            });
            /**选择图表类型end*/

            /**数据范围start*/
            element.find('.date_range_type').change(function (event) {
                let select = $(this);
                let value = select.val();
                if (value && value === 'D100') {
                    $('.date_range_box').css('display', 'inline-flex');
                    let defaultDate = new Date();
                    if (_.isEmpty(startDate)) {
                        startDate = defaultDate.toISOString().split('T')[0];
                    }
                    if (_.isEmpty(endDate)) {
                        endDate = defaultDate.toISOString().split('T')[0];
                    }
                    $('.date_range_box .data-start-date').val(startDate);
                    $('.date_range_box .data-end-date').val(endDate);
                } else {
                    $('.date_range_box').css('display', 'none');
                }
                rangeType = value;
            });
            element.find('.data-start-date').change(function (event) {
                let select = $(this);
                let value = select.val();
                startDate = value;
            });
            element.find('.data-end-date').change(function (event) {
                let select = $(this);
                let value = select.val();
                endDate = value;
            });
            element.find('.date_range_type').val(rangeType);
            if (rangeType === 'D100') {
                $('.date_range_box .data-start-date').val(startDate);
                $('.date_range_box .data-end-date').val(endDate);
            }

            /**数据范围end*/

            /**分组栏位start*/
            function initUseOrigin(isOrigin) {
                if (isOrigin) {
                    $('.group-field').val('time');
                    $('.group-field').attr('disabled', 'disabled');
                    $('.group-format').css('display', 'none');
                    $('.field-statics').css('display', 'none');
                    _.each($('.field-key'), function (f) {
                        let opFirst = $(f).find('option:nth-child(1)');
                        if (opFirst.val() && opFirst.val() === 'time') {
                            $(`<option value=""></option>`).insertBefore(opFirst);
                            opFirst.remove();
                        }
                    });
                } else {
                    $('.group-field').removeAttr('disabled');
                    if ($('.group-field').val() === 'time') {
                        $('.group-format').css('display', 'inline-flex');
                    }
                    $('.field-statics').css('display', 'inline-block');
                    _.each($('.field-key'), function (f) {
                        let opFirst = $(f).find('option:nth-child(1)');
                        if (opFirst.val() !== 'time') {
                            $(`<option value="time">时间</option>`).insertBefore(opFirst);
                            if (opFirst.val() === '') {
                                opFirst.remove();
                            }
                        }
                    });
                }
            };
            if (chartType === 'line-chart1' && useOrigin) {
                $('.use-origin-value')[0].checked = true;
                initUseOrigin(useOrigin);
            }
            element.find('.use-origin-value').change(function (event) {
                let isOrigin = $('.use-origin-value')[0].checked;
                useOrigin = isOrigin;
                initUseOrigin(isOrigin);
            });
            element.find('.group-field').change(function (event) {
                let select = $(this);
                let value = select.val();
                if (value && value === 'time') {
                    $('.group-format').css('display', 'inline-flex');
                    _.set(groups, 'id', 'time');
                    _.set(groups, 'time_format', '%Y');
                    _.set(groups, 'name', '时间(年份)');
                } else {
                    $('.group-format').css('display', 'none');
                    _.set(groups, 'id', value);
                    _.unset(groups, "time_format");
                    _.unset(groups, "name");
                }
            });
            element.find('.group-format').change(function (event) {
                let select = $(this);
                let value = select.val();
                _.set(groups, 'time_format', value);
            });
            element.find('.group-field').val(groups.id);
            if (groups.time_format) {
                element.find('.group-format').val(groups.time_format);
            }

            /**分组栏位end*/

            /**数据栏位start*/
            function fieldChange(event) {
                let selectedIndex = $(event.target).prop('selectedIndex');
                let row = $(event.target).closest('.axis_row');
                let item = _.nth(clsDDList, selectedIndex);
                if (item.rule === 'number') {
                    row.find('.field-statics').removeAttr('disabled');
                } else {
                    row.find('.field-statics').val('$count');//不是数字，则默认选择计数方式
                    row.find('.field-statics').attr('disabled', 'disabled');
                }
            }

            element.find('.field-key').closest('select').change(function (event) {
                fieldChange(event);
            });

            // 添加一行.
            function addRow(event) {
                var row = $(event.target).closest('.axis_row');
                var idx = _.parseInt(row.data('index')) + 1;
                var newField = {'field': 'time', 'type': '$count'};
                if (useOrigin) {
                    if (clsDDFirst.key === 'time') {
                        clsDDList.splice(0, 1)
                    }
                }
                var newRowHtml = NeptuneUtils.addHistoryDataFieldRow(idx, newField, clsDDList, useOrigin);

                var newRow = $(newRowHtml).insertAfter(row);
                newRow.find('.field-key').closest('select').change(function (event) {
                    fieldChange(event);
                });
                newRow.find('.add-row').closest('i').click(function (event) {
                    addRow(event);
                });
                newRow.find('.minus-row').closest('i').click(function (event) {
                    removeRow(event);
                });

            };
            element.find('.add-row').closest('i').click(function (event) {
                addRow(event);
            });

            // 删除当前行.
            function removeRow(event) {
                var row = $(event.target).closest('.axis_row');
                var rowLength = $('.data-field .axis_row').length;
                if (rowLength === 1) {
                    return;
                }
                row.remove();
            };
            element.find('.minus-row').closest('i').click(function (event) {
                removeRow(event)
            });
            /**数据栏位end*/
        });

        return deferred;
    },
    addMapMarker: function (componentId, poi, deviceName, showTip) {
        let mapId = '#' + componentId + '_map_container';
        let map = $(mapId).data('map');
        let title = deviceName ? deviceName : poi.name;
        var marker = new AMap.Marker({
            title: title
        });
        marker.setPosition(poi.location);
        map.setCenter([poi.location.lng, poi.location.lat]);
        map.add(marker);

        var infoWindow = new AMap.InfoWindow({
            offset: new AMap.Pixel(0, -20)
        });
        infoWindow.setMap(map);
        infoWindow.setPosition(poi.location);
        if (showTip) {
            var html = [];
            html.push(`<div class="marker-device-name">${title}</div>`);
            html.push('<div>' + (poi.district || '') + '</div>');
            html.push('<div>' + (poi.address || '') + '</div>');
            html.push('<div>' + (poi.name || '') + '</div>');
            infoWindow.setContent(html.join(''));
        }
        infoWindow.open(map, marker.getPosition());
        setTimeout(function () {
            /*清除href属性，防止跳转页面*/
            $(mapId).find(".amap-info-close").removeAttr('href');
        }, 400);
    }
};

