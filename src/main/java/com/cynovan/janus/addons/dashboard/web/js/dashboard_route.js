define(['moment', 'web/base/service', 'web/base/directive', 'triton/device/web/service/bind_device', 'triton/device/web/service/device_service', 'dashboard/list/rear_machine/rear_machine_dashboard'], function () {
    var app = angular.module('app', ['ngRoute', 'ngResource', 'ngSanitize', 'ngAnimate', 'ui.router', 'cnv.services', 'cnv.directives', 'cnv.binddevice.service', 'cnv.device.service', 'dashboard']);

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
                    resolver: ['$q', '$rootScope', '$stateParams', '$state',
                        function ($q, $rootScope, $stateParams, $state) {
                            var deferred = $q.defer();
                            arr = arr || [];
                            var dashboardKey = $stateParams.key;
                            if (dashboardKey) {
                                arr = _.concat(arr, [`dashboard/list/${dashboardKey}/${dashboardKey}_dashboard`, `css!dashboard/list/${dashboardKey}/${dashboardKey}_dashboard`]);
                            }
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

            function getTemplate(templateName) {
                var arr = [cynovan.c_path, '/initialize/template/', templateName, '?v=', cynovan.version];
                return arr.join('');
            }

            $stateProvider.state('dashboard', {
                'url': '/item/:key',
                templateUrl: function ($stateParams) {
                    var templateName = `${$stateParams.key}_dashboard_template`;
                    return getTemplate(templateName);
                },
                resolve: resolver()
            });
        }
    ]);

    return app;
});