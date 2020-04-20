require(['jquery', 'bootbox', 'Noty', 'sockjs', 'jquery-migrate', 'jquery-ui', 'opentip', 'fancybox', 'jstorage',
        'lodash', 'angular', 'angular-resource', 'angular-route', 'angular-ui-router', 'angular-animate', 'angular-sanitize',
        'bootstrap', 'switch', 'pace', 'mustache', 'datatables.net', 'datatable-bootstrap',
        'datepicker', 'stomp'],
    function (jquery, bootbox, noty, sockjs) {
        window.$ = jquery;
        window.jQuery = jquery;
        window.jquery = jquery;
        window.bootbox = bootbox;
        window.Noty = noty;
        window.SockJS = sockjs;
    });