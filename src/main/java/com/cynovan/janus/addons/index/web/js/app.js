//这里的路径？define中的路径
//这个文件是直接被index 页面所引用的里面由控制器，过滤器，路由器的设置
define(['index/web/js/header_controller'], function () {
    var app = angular.module('app', ['ngRoute', 'ngResource', 'ngSanitize', 'ngAnimate', 'ui.router', 'main', 'ui.router']);
    app.config(['$routeProvider', '$locationProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$httpProvider',
        '$stateProvider', '$urlRouterProvider',
        function ($routeProvider, $locationProvider, $controllerProvider, $compileProvider, $filterProvider, $provide, $httpProvider,
                  $stateProvider, $urlRouterProvider) {
            app.controller = $controllerProvider.register;
            app.directive = $compileProvider.directive;
            app.filter = $filterProvider.register;
//?
            app.factory = $provide.factory;
            app.service = $provide.service;
            //这里如果将 html5Mode 设为true就会把#取消 htmlMode5？？？？？？？？
            $locationProvider.html5Mode(false);
            $locationProvider.hashPrefix('');
            //这里定义的appResolver是什么意思呢？

            function appResolver() {
                var definition = {
                    resolver: ['$q', '$rootScope', '$stateParams', '$http', 'I18nService',
                        function ($q, $rootScope, $stateParams, $http, I18nService) {
                            var deferred = $q.defer();
                            var url = `${cynovan.c_path}/initialize/appMenuDepend/${$stateParams.appId}/${$stateParams.menuIdx}?v=${cynovan.version}`;
                            I18nService.setAppProperties($stateParams.appId);//加载当前app所需要的语言配置文件
                            $http({
                                method: 'post',
                                url: url
                            }).then(function (response) {
                                //这里是什么操作
                                var arr = response.data || [];
                                require(arr, function () {
                                    $rootScope.$apply(function () {
                                        //实际上，AngularJS对此有着非常明确的要求，就是它只负责对发生于AngularJS上下文环境中的变更会做出自动地响应(即，在$apply()方法中发生的对于models的更改)。AngularJS的built-in指令就是这样做的，所以任何的model变更都会被反映到view中。但是，如果你在AngularJS上下文之外的任何地方修改了model，那么你就需要通过手动调用$apply()来通知AngularJS。这就像告诉AngularJS，你修改了一些models，希望AngularJS帮你触发watchers来做出正确的响应。
                                        deferred.resolve();
                                    });
                                });
                            });
                            return deferred.promise;
                        }]
                };
                return definition;
            }

            $stateProvider.state('appMenu', {
                'url': '/app/:appId/menu/:menuIdx',
                templateUrl: function ($stateParams) {

                    return `${cynovan.c_path}/initialize/appMenuTemplate/${$stateParams.appId}/${$stateParams.menuIdx}?v=${cynovan.version}`;
                },
                resolve: appResolver()
            }).state('detail', {
                //这里的：??
                'url': '/app/:appId/menu/:menuIdx/r/:id',
                templateUrl: function ($stateParams) {
                    //`?

                    return `${cynovan.c_path}/initialize/appMenuDetailTemplate/${$stateParams.appId}/${$stateParams.menuIdx}?v=${cynovan.version}`;
                },
                resolve: appResolver()
            });
            //这里返回的又是哪个地址
            $urlRouterProvider.otherwise('/app/plant_efficiency/menu/0');
        }
    ]);
    return app;
});
