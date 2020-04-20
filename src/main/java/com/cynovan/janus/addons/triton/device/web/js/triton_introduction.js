define([], function () {
    var app = angular.module('app');

    app.controller('TritonIntroduction', function () {
        window.localStorage.setItem("activeAppName", 'triton');
    });
});