define(['web/base/service', 'web/base/directive', 'welcome/login/canvas'], function () {
    var app = angular.module('welcome', ['ngRoute', 'ngResource', 'ngSanitize', 'ngAnimate', 'ui.router', 'ui.router', 'cnv.services', 'cnv.directives']);

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

            function resolver(arr) {
                var definition = {
                    resolver: ['$q', '$rootScope', '$stateParams', '$state', 'I18nService',
                        function ($q, $rootScope, $stateParams, $state, I18nService) {
                            I18nService.setAppProperties('welcome');//加载当前app所需要的语言配置文件
                            var deferred = $q.defer();
                            arr = arr || [];
                            require(arr, function () {
                                $rootScope.$apply(function () {
                                    deferred.resolve();
                                });
                            });

                            return deferred.promise;
                        }]
                }
                return definition;
            }

            function getTemplate(appKey) {
                var arr = [cynovan.c_path, '/initialize/template/', appKey, '?v=', cynovan.version];
                return arr.join('');
            }

            $stateProvider.state('sync', {
                'url': '/sync',
                templateUrl: function () {
                    return getTemplate('welcome_sync_template');
                },
                resolve: resolver(['welcome/sync/sync', 'css!welcome/sync/sync'])
            }).state('login', {
                'url': '/login',
                templateUrl: function () {
                    return getTemplate('login_template');
                },
                resolve: resolver(['welcome/login/login', 'css!welcome/login/login'])
            });

            $urlRouterProvider.otherwise('/sync');
        }
    ]);

    return app;
});