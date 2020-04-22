({
// src 下是源代码，out的值是输出路径
//在node.js中执行生成build/entry-build.js
    baseUrl: '../src',
    name: "../build/entry",//模块入口文件
    out: "../build/entry-build.js",
    optimize: 'none',
    ignore: true,
    generateSourceMaps: false,
    skipPragmas: true,
    paths: {
        "jquery": 'jquery/jquery',
        "jquery-migrate": 'jquery/jquery-migrate',
        "jquery-ui": 'jquery/jquery-ui',
        "Noty": 'noty/noty',
        "opentip": 'opentip/opentip-jquery',
        "fancybox": 'fancybox/fancybox',
        "jstorage": 'jstorage/jstorage',
        "lodash": 'lodash/lodash',
        "angular": 'angular/angular',
        "angular-resource": "angular/angular-resource",
        "angular-route": "angular/angular-route",
        "angular-ui-router": "angular/angular-ui-router",
        "angular-animate": "angular/angular-animate",
        "angular-sanitize": "angular/angular-sanitize",
        "bootstrap": "bootstrap/js/bootstrap",
        "switch": "switch/bootstrap-switch",
        "bootbox": "bootbox/bootbox",
        "pace": "pace/pace",
        "mustache": "mustache/mustache",
        "datatables.net": "datatable/datatables.net",
        "datatable-bootstrap": "datatable/dataTables.bootstrap",
        "datepicker": "datepicker/datetimepicker",
        "jquery-mousewheel": "jquery/jquery.mousewheel",
        "sockjs": "socket/sockjs",
        "stomp": "socket/stomp"
    }, shim: {
        'angular': {exports: 'angular'},
        'angular-ui-router': ['angular']
    }
})