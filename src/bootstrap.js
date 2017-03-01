/* globals util, Tracker */
util.onload(function () {
    if (!window['MeituanAnalyticsObject']) {
        return;
    }

    var _mta = window['MeituanAnalyticsObject'];
    // 兼容单/多实例
    if (Object.prototype.toString.call(_mta) === '[object String]') {
        _mta = [_mta];
    }

    for (var i = 0; i < _mta.length; i++) {
        (function (mta){
            var obj = window[mta];
            if (typeof obj !== 'function') {
                return;
            }
            if (obj.q && obj.q.isInitialized && obj.q.isInitialized()) {
                return;
            }

            var toString = Object.prototype.toString,
                tracker = new Tracker(),
                commands = obj ? obj.q : [];

            obj.q = tracker;

            if (commands && toString.call(commands) === "[object Array]") {
                tracker.push.apply(tracker, commands);
            }
        })(_mta[i]);
    }

});

