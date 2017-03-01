
Tracker.addPlugin('page', {
    type: 'timer',
    data: function () {
        /* jshint -W106 */
        var win = window,
            performance = win.performance || win.mozPerformance || win.msPerformance || win.webkitPerformance;

        if (!performance) {
            return;
        }

        // append data from window.performance
        var timing = performance.timing;
        var data = {
            // network
            redirect: timing.fetchStart - timing.navigationStart,       // 跳转时间
            dns: timing.domainLookupEnd - timing.domainLookupStart,     // DNS查找时间
            connect: timing.connectEnd - timing.connectStart,           // 建连时间
            network: timing.connectEnd - timing.navigationStart,        // 网络总耗时

            // backend
            send: timing.responseStart - timing.requestStart,           // 后端时间
            receive: timing.responseEnd - timing.responseStart,         // 接收时间
            backend: timing.responseEnd - timing.requestStart,          // 接收时间

            // frontend
            render: timing.loadEventEnd - timing.loadEventStart,                                    // loadevent持续
            dom: timing.domComplete - timing.domLoading,                                            // load时间
            frontend: timing.loadEventEnd - timing.domLoading,                                      // 前端时间

            // 全过程系列
            load: timing.loadEventEnd - timing.navigationStart,                                     // 完全加载全过程
            domReady: timing.domContentLoadedEventStart - timing.navigationStart,                   // domready时间
            interactive: timing.domInteractive - timing.navigationStart,                            // 可操作时间

            ttf: timing.fetchStart - timing.navigationStart,  // Time to Fetch
            ttr: timing.requestStart - timing.navigationStart,  // Time to Request
            ttdns: timing.domainLookupStart - timing.navigationStart,  // Time to DNS
            ttconnect: timing.connectStart - timing.navigationStart, // Time to TCP
            ttfb: timing.responseStart - timing.navigationStart,  // Time to First Byte
        };

        if (typeof M === 'object' && M.subresources && M.subresources.names && typeof window.SubResoucesTiming !== 'undefined') {
            var lastImage = M.subresources.lastImage || "",
                firstImage = M.subresources.firstImage || "",
                resources = new window.SubResoucesTiming(M.subresources.names, lastImage, firstImage);

            if (resources.length && resources[resources.length - 1].id === "fsImg") {
                data.atf = resources[resources.length - 1].start;
                data.c_atf = resources[resources.length - 1].start - (timing.responseStart - timing.navigationStart);
            }
        }

        // msFirstPaint is IE9+ http://msdn.microsoft.com/en-us/library/ff974719
        // https://github.com/addyosmani/timing.js/blob/master/timing.js
        if (timing.msFirstPaint && typeof timing.msFirstPaint === 'number') {
            data.firstPaint = timing.msFirstPaint - timing.navigationStart;
        }

        // http://www.webpagetest.org/forums/showthread.php?tid=11782
        if (win.chrome && win.chrome.loadTimes) {
            var loadTimes = win.chrome.loadTimes();
            data.firstPaint = Math.round((loadTimes.firstPaintTime - loadTimes.startLoadTime) * 1000);
        }

        // FE-5979
        if (typeof data.firstPaint !== 'number' || data.firstPaint < 0) {
            data.firstPaint = void 0;
        }

        // 兼容原来的首屏时间
        if (typeof M !== 'undefined' && M.TimeTracker && M.TimeTracker.fst) {
            data.firstScreen = M.TimeTracker.fst - timing.navigationStart;
        }

        return data;
    }
});

