Tracker.addPlugin('waterfall', {
    type: 'waterfall',
    data: function() {
        var win = window,
            performance = win.performance || win.mozPerformance || win.msPerformance || win.webkitPerformance;
        if (!performance) return null;
        var compress = TransformPerf.compress;

        var mainEntry = {};
        for (var key in performance.timing) {
            if (performance.timing.hasOwnProperty(key)) {
                mainEntry[key] = performance.timing[key];
            }
        }
        mainEntry.name = win.location.href;
        mainEntry.title = document.title;
        // NOTE personal defined initiatorType window will used to render main
        // document in waterfall
        mainEntry.initiatorType = 'window';
        mainEntry.entryType = 'resource';

        var entries = performance.getEntries();
        entries.push(mainEntry);

        return compress(entries);
    }
});
