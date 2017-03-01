javascript:(function (a, b) {
    function d() {
        var a = document.createElement("script");
        a.async = !0, a.src = "//localhost:8084/static/mta.js";
        var b = document.getElementsByTagName("script")[0];
        b.parentNode.insertBefore(a, b)
    }

    if (a.MeituanAnalyticsObject = b, a[b] = a[b] || function () {
                (a[b].q = a[b].q || []).push(arguments)
            }, "complete" === document.readyState)d(); else {
        var c = window.onload;
        window.onload = function () {
            d(), c && c()
        }
    }
})(window, "mta");
