define([], function () {

    function hideElement(element) {
        var timer = element.data("showTimer");
        if (timer) {
            clearTimeout(timer);
            element.removeData("showTimer");
        }
        element.children(".dropdown-menu").slideUp(100, function () {
            element.removeClass('open');
        });
    }

    /*drop down menu */
    $("body").on("mouseenter.dropdownmenu", ".dropdown-menu-toggle", function (event) {
        var element = $(this);
        event = setTimeout(function () {
            element.children(".dropdown-menu").slideDown("fast", function () {
                element.addClass('open');
            })
        }, 100);
        element.data("showTimer", event);
    }).on("mouseleave.dropdownmenu", ".dropdown-menu-toggle", function (event) {
        var element = $(this);
        hideElement(element);
    }).on('click.dropdownmenu', '.dropdown-menu', function (event) {
        var element = $(this).closest('.dropdown-menu-toggle');
        hideElement(element);
    })
});