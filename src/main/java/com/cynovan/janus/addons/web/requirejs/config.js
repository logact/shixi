var cynovan = cynovan || {};

//这里配置了app_service
require.config({
    waitSeconds: 40,
    baseUrl: 'resource',
    urlArgs: function (id, url) {
        var args = 'v=' + cynovan.version;
        if (~url.indexOf('amap.com')) {
            args = ''
            return '';
        }
        return ((~url.indexOf('?')) ? '&' : '?') + args;
    },
    //这里直接使用了之后就能直接使用名字
    paths: {
        'css': 'web/requirejs/css',
        'threejs': 'web/dist/threejs',
        'echarts': 'web/echart/echarts',
        'amap': 'https://webapi.amap.com/maps?v=1.3&key=1c9ab23318ffb064ec5fa3ba02a7bd48',
        'amapui': 'https://webapi.amap.com/ui/1.0/main.js?v=1.0.11',
        'dropzone': 'web/lib/dropzone/dropzone',
        'mousetrap': 'web/lib/mousetrap/mousetrap',
        'moment': 'web/lib/moment/locale',
        'appservice': 'web/base/app_service',
        'chosen': 'web/lib/chosen/chosen',
        'pivot': 'web/lib/pivot/pivot',
        'taggle': 'web/lib/taggle/taggle',
        'pagination': 'web/lib/pagination/pagination',
        'orgchart': 'web/lib/orgchart/orgchart',
        'fullcalendar': 'web/lib/fullcalendar/zh-cn',
        'ztree': 'web/lib/ztree/jquery-ztree-exhide',
        'vs': 'web/lib/monaco/vs',
        'fullpage': 'web/lib/fullpage/fullpage',
        'screenfull': 'web/lib/screenfull/screenfull'
    },

    shim: {
        dropzone: {
            deps: ['css!web/lib/dropzone/dropzone']
        },
        moment: {
            deps: ['web/lib/moment/moment']
        },
        appservice: {
            deps: ['css!web/base/app_service']
        },
        chosen: {
            deps: ['css!web/lib/chosen/chosen']
        },
        taggle: {
            deps: ['css!web/lib/taggle/taggle']
        },
        pagination: {
            deps: ['css!web/lib/pagination/pagination']
        },
        orgchart: {
            deps: ['css!web/lib/orgchart/orgchart']
        },
        'fullcalendar': {
            deps: ['moment', 'css!web/lib/fullcalendar/fullcalendar', 'web/lib/fullcalendar/fullcalendar']
        },
        'ztree': {
            deps: ['css!web/lib/ztree/zTreeBootstrap/css/bootstrapztree',
                'web/lib/ztree/ztree', 'web/lib/ztree/fuzzysearch']
        },
        "amapui": {
            deps: ['https://webapi.amap.com/maps?v=1.3&key=1c9ab23318ffb064ec5fa3ba02a7bd48']
        }
    }
});
