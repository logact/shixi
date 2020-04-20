//这里的路径？define中的路径
define(['index/web/js/header_controller'], function () {
    var app = angular.module('app', ['ngRoute', 'ngResource', 'ngSanitize', 'ngAnimate', 'ui.router', 'main', 'ui.router']);

    app.config(['$routeProvider', '$locationProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$httpProvider',
        '$stateProvider', '$urlRouterProvider',
        function ($routeProvider, $locationProvider, $controllerProvider, $compileProvider, $filterProvider, $provide, $httpProvider,
                  $stateProvider, $urlRouterProvider) {
            app.controller = $controllerProvider.register;
            app.directive = $compileProvider.directive;
            app.filter = $filterProvider.register;
            app.factory = $provide.factory;
            app.service = $provide.service;

            $locationProvider.html5Mode(false);
            $locationProvider.hashPrefix('');

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
                                var arr = response.data || [];
                                require(arr, function () {
                                    $rootScope.$apply(function () {
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
                'url': '/app/:appId/menu/:menuIdx/r/:id',
                templateUrl: function ($stateParams) {
                    return `${cynovan.c_path}/initialize/appMenuDetailTemplate/${$stateParams.appId}/${$stateParams.menuIdx}?v=${cynovan.version}`;
                },
                resolve: appResolver()
            });

            $urlRouterProvider.otherwise('/app/plant_efficiency/menu/0');
        }
    ]);

    return app;
});
