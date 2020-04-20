var gulp = require('gulp');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
let babel = require('gulp-babel');
var rename = require('gulp-rename');
var cssmin = require('gulp-cssmin');
var gulpSequence = require('gulp-sequence');
var exec = require('child_process').exec;
var fs = require('fs');

var json = JSON.parse(fs.readFileSync('./package.json'));
var path = json.path;

function pPath(arr) {
    return arr.map(function (p) {
        return path + p;
    })
}

gulp.task('clean', function () {
    console.log('=======================Start Clean========================');

    var files = ['/**/*.min.js', '/**/*.min.css', '/web/dist', '/**/scss/*.css', '/prototype/dist'];
    files = pPath(files);
    files.push('!' + path + '**/hls/**');
    files.push('!' + path + 'web/echart/**');
    files.push('!' + path + 'web/lib/ztree/ztree.min.js');
    return gulp.src(files).pipe(clean({
        force: true
    }));
});

gulp.task('entry', function (cb) {
    return exec('node src/main/java/com/cynovan/janus/addons/web/build/r.js -o src/main/java/com/cynovan/janus/addons/web/build/r-build-config.js', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
})

gulp.task('threejs', ['clean'], function () {
    console.log('=======================Start Concat ThreeJS File========================');

    var jsfiles = ['three.js', 'STLLoader.js', 'OBJLoader.js', 'ColladaLoader.js', 'URDFLoader.js',
        'ctm/lzma.js', 'ctm/ctm.js', 'ctm/CTMLoader.js',
        'OrbitControls.js',
        'Projector.js',
        'Detector.js', 'Tween.js',
    ];
    jsfiles = jsfiles.map(function (p) {
        p = path + 'web/lib/threejs/' + p;
        console.log(p);
        return p;
    });

    return gulp.src(jsfiles)
        .pipe(concat('threejs.js'))
        .pipe(gulp.dest(path + '/web/dist/'));
});

gulp.task('libcss', function () {
    console.log('=======================Start Concat Lib CSS File========================');

    var cssfiles = [
        'jquery/jquery-ui.css',
        'noty/noty.css',
        'animate/animate.css',
        'bootstrap/css/bootstrap.css',
        'bootstrap/css/bootstrap-theme.css',
        'switch/bootstrap-switch.css',
        'fancybox/fancybox.css',
        'bootstrap/bootstrap-reset.css',
        'pace/pace-theme-flat-top.css',
        'fontawesome/css/font-awesome.css',
        'datepicker/datetimepicker.css',
        'opentip/opentip.css',
        'datatable/datatables.css',
        'datatable/dataTables.bootstrap.css',
        'select2/select2.css'
    ];
    cssfiles = cssfiles.map(function (p) {
        p = path + 'web/src/' + p;
        return p;
    });

    return gulp.src(cssfiles)
        .pipe(concat('libs.css'))
        .pipe(gulp.dest(path + 'web/dist/css/'));
});

gulp.task('jsmin', function () {
    console.log('=======================Start Uglify JavaScript File========================');
    var arr = [];
    arr.push(path + '/**/*.js');
    arr.push(path + '/prototype/dist/*.js');
    /*排除以下文件*/
    arr.push('!' + path + 'web/**/echarts**.js');
    arr.push('!' + path + 'web/**/ztree**.js');
    arr.push('!' + path + 'web/src/**/*.js');
    arr.push('!' + path + 'web/lib/monaco/**');
    arr.push('!' + path + '**/hls/**');
    /*排除prototype monitor下的文件*/
    // arr.push('!' + path + 'prototype/monitor/**/*.js');
    return gulp.src(arr)
        .pipe(gulp.dest(function (data) {
            console.log("Minify JS File: " + data.path);
            return data.base
        }))
        .pipe(babel({
            presets: ['minify']
        }))
        /*.pipe(babel({
            presets: ['env'],
            compact: false
        }))
        .pipe(uglify())*/
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(gulp.dest(function (data) {
            return data.base;
        }));
});

gulp.task('monaco-css', function () {
    console.log('=======================Start Monaco Editor========================');

    return gulp.src([path + 'web/lib/monaco/**/*.css'])
        .pipe(gulp.dest(function (data) {
            return data.base
        }))
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(gulp.dest(function (data) {
            return data.base;
        }));
});

gulp.task('monaco-js', function () {
    console.log('=======================Start Monaco Editor========================');

    return gulp.src([path + 'web/lib/monaco/vs/**/*.js'])
        .pipe(gulp.dest(function (data) {
            console.log("Monaco JS File: " + data.path);
            return data.base
        }))
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(gulp.dest(function (data) {
            return data.base;
        }));
});

gulp.task('cssmin', function () {
    console.log('=======================Start Minify CSS File========================');

    return gulp.src([path + '/**/*.css', '!' + path + '/web/src/**/*.css', '!' + path + 'web/lib/monaco/**'])
        .pipe(gulp.dest(function (data) {
            console.log("Minify CSS File: " + data.path);
            return data.base
        }))
        .pipe(cssmin())
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(gulp.dest(function (data) {
            return data.base
        }));
});

gulp.task('copyfiles', function () {
    console.log('=======================Start Copy Font Files ========================');
    var fontfiles = [path + 'web/src/fontawesome/fonts/*'];
    gulp.src(fontfiles)
        .pipe(gulp.dest(path + 'web/dist/fonts'));

    gulp.src(path + 'web/src/datatable/image/*')
        .pipe(gulp.dest(path + 'web/dist/image'));

    return gulp.src(path + 'web/src/jquery/images/*')
        .pipe(gulp.dest(path + 'web/dist/css/images'));
});

/*针对prototype作压缩*/
gulp.task('prototype_libs', function () {
    console.log('=======================Prototype Gulp ========================');
    /*打包prototype需要用到的第三方资源库*/
    var jsfiles = [
        'web/src/jquery/jquery.js',
        'web/src/lodash/lodash.js',
        'web/src/bootstrap/js/bootstrap.js',
        'web/src/bootbox/bootbox.js',
        'web/src/socket/sockjs.js',
        'web/src/socket/stomp.js',
        'prototype/monitor/js/spin/spin.js',
        'prototype/monitor/js/cryptojs/aes.js',
        'prototype/monitor/js/deflate/base64.js',
        'prototype/monitor/js/jscolor/jscolor.js',
        'prototype/monitor/js/sanitizer/sanitizer.js',
        'prototype/monitor/js/deflate/pako.js',
        'web/lib/md5/spark-md5.js',
        'web/lib/chosen/chosen.js'
    ];
    jsfiles = jsfiles.map(function (p) {
        p = path + p;
        console.log(p);
        return p;
    });

    return gulp.src(jsfiles)
        .pipe(concat('prototype_libs.js'))
        .pipe(gulp.dest(path + '/prototype/dist/'));
});

/*针对所有文件作压缩*/
gulp.task('prototype_mx_libs', function () {
    console.log('=======================Prototype Gulp ========================');
    /*打包prototype需要用到的第三方资源库*/
    var jsfiles = [
        'js/diagramly/Init.js',
        'mxgraph/Init.js',
        'janus/neptune-handler.js',
        'janus/neptune-http.js',

        'janus/neptune-utils.js',
        'mxgraph/Editor.js',
        'mxgraph/EditorUi.js',
        'mxgraph/Sidebar.js',
        'mxgraph/Graph.js',
        'mxgraph/Format.js',
        'mxgraph/Format.js',
        'mxgraph/Shapes.js',
        'mxgraph/Actions.js',
        'mxgraph/Menus.js',
        'mxgraph/Toolbar.js',
        'mxgraph/Dialogs.js',
        'js/diagramly/sidebar/Sidebar.js',
        'js/diagramly/sidebar/Sidebar-Neptune.js',
        'js/diagramly/sidebar/Sidebar-Android.js',
        'js/diagramly/sidebar/Sidebar-Arrows2.js',
        'js/diagramly/sidebar/Sidebar-Azure.js',
        'js/diagramly/sidebar/Sidebar-Basic.js',
        'js/diagramly/sidebar/Sidebar-Bootstrap.js',
        'js/diagramly/sidebar/Sidebar-Electrical.js',
        'js/diagramly/sidebar/Sidebar-Ios.js',
        'js/diagramly/sidebar/Sidebar-Ios7.js',
        'js/diagramly/sidebar/Sidebar-Network.js',
        'js/diagramly/sidebar/Sidebar-WebIcons.js',
        'js/diagramly/sidebar/Sidebar-Gmdl.js',
        'js/diagramly/sidebar/Sidebar-PID.js',
        'js/diagramly/util/mxJsCanvas.js',
        'js/diagramly/util/mxAsyncCanvas.js',
        'js/diagramly/DrawioFile.js',
        'js/diagramly/LocalFile.js',
        'js/diagramly/LocalLibrary.js',
        'js/diagramly/StorageFile.js',
        'js/diagramly/StorageLibrary.js',
        'js/diagramly/Dialogs.js',
        'js/diagramly/Editor.js',
        'js/diagramly/EditorUi.js',
        'js/diagramly/DiffSync.js',
        'js/diagramly/Settings.js',
        'js/diagramly/DriveComment.js',
        'js/diagramly/UrlLibrary.js',
        'js/diagramly/DriveFile.js',

        'js/diagramly/DriveLibrary.js',
        'js/diagramly/DriveClient.js',

        'js/diagramly/App.js',
        'js/diagramly/Menus.js',
        'js/diagramly/Pages.js',
        'js/diagramly/Trees.js',
        'js/diagramly/Minimal.js',
        'js/diagramly/DistanceGuides.js',
        'js/diagramly/mxRuler.js',
        'js/diagramly/mxFreehand.js'
    ];
    jsfiles = jsfiles.map(function (p) {
        p = path + 'prototype/monitor/' + p;
        console.log(p);
        return p;
    });

    return gulp.src(jsfiles)
        .pipe(concat('prototype_mx_libs.js'))
        .pipe(gulp.dest(path + '/prototype/dist/'));
});

/*针对prototype作压缩*/
gulp.task('prototype_css', function () {
    console.log('=======================Prototype CSS ========================');

    var cssfiles = [
        'web/lib/monaco/vs/editor/editor.main.css',
        'prototype/monitor/styles/grapheditor.css',
        'web/src/bootstrap/css/bootstrap.css',
        'web/src/fontawesome/css/font-awesome.css',
        'web/lib/chosen/chosen.css'
    ];
    cssfiles = cssfiles.map(function (p) {
        p = path + p;
        return p;
    });

    return gulp.src(cssfiles)
        .pipe(concat('prototype_mx_libs.css'))
        .pipe(gulp.dest(path + 'prototype/dist/css'));
});

gulp.task('prototype_copyfiles', function () {
    console.log('=======================Start Copy Prototype Font Files ========================');
    var fontfiles = [path + 'web/src/fontawesome/fonts/*'];
    gulp.src(fontfiles)
        .pipe(gulp.dest(path + 'prototype/dist/fonts'));

    var chosenImgFiles = [path + 'web/lib/chosen/*.png'];
    gulp.src(chosenImgFiles)
        .pipe(gulp.dest(path + 'prototype/dist/css'));
});

gulp.task('default', gulpSequence(['clean'], ['entry', 'threejs', 'libcss', 'monaco-css', 'monaco-js', 'copyfiles',
    'prototype_libs', 'prototype_mx_libs', 'prototype_css', 'prototype_copyfiles'], ['jsmin', 'cssmin']));
