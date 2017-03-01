(function (window, document, script, src, ga, a, m) {
    window['GoogleAnalyticsObject'] = ga;
    window[ga] = window[ga] || function () {
        (window[ga].q = window[ga].q || []).push(arguments)
    }, window[ga].l = 1 * new Date();
    a = document.createElement(script),
    m = document.getElementsByTagName(script)[0];
    a.async = 1;
    a.src = src;
    m.parentNode.insertBefore(a, m)
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-XXXX-Y', 'auto');
ga('send', 'pageview');
