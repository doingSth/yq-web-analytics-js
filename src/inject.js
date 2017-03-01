(function(window, document, _mta) {
    function loadScript() {
        var ndScript = document.createElement('script');
        ndScript.async = true;
        ndScript.src = 'https://s0.meituan.net/bs/js/?f=mta-js:mta.min.js';
        var ndFirst = document.getElementsByTagName('script')[0];
        ndFirst.parentNode.insertBefore(ndScript, ndFirst)
    }

    if (Object.prototype.toString.call(_mta) === '[object String]') {
        _mta = [_mta];
    }

    window.MeituanAnalyticsObject = _mta;

    for (var i = 0; i < _mta.length; i++) {
        (function (mta) {
            window[mta] = window[mta] || function() {
                (window[mta].q = window[mta].q || []).push(arguments);
            };
        })(_mta[i]);
    }


    if ('complete' === document.readyState) {
        loadScript();
    } else {
        var _addEventListener = 'addEventListener';
        var _attachEvent = 'attachEvent';
        if (window[_addEventListener]) {
            window[_addEventListener]('load', loadScript, false);
        } else if (window[_attachEvent]) {
            window[_attachEvent]('onload', loadScript);
        } else {
            var _onload = window.onload;
            window.onload = function() {
                loadScript();
                if (_onload) {
                    _onload();
                }
            }
        }

    }
})(window, document, 'mta');

