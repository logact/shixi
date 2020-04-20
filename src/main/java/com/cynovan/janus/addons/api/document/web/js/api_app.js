define(['api/document/web/js/api_menu_controller'], function () {
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


            function getTemplate(key) {
                var arr = [cynovan.c_path, '/api/doc/template/', key, '?v=', cynovan.version];
                let language = window.localStorage.getItem("systemLanguage");//获取设置的语言
                if (language) {
                    arr = [cynovan.c_path, '/api/doc/template/', key, '?language=', language, '&v=', cynovan.version];
                }
                return arr.join('');
            }

            $stateProvider.state('document', {
                'url': '/doc/:key',
                templateUrl: function ($stateParams) {
                    return getTemplate($stateParams.key);
                },
                resolve: []
            });

            $urlRouterProvider.otherwise('/doc/intro');
        }
    ]);

    return app;
});