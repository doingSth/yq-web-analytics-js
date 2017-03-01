/*global escape*/
(function () {
    var win = window,
        doc = document;

    /* get performance queue */
    var queue = [];
    if (typeof win._mtq !== 'undefined') {
        queue = win._mtq;
    } else if (typeof win.mtperf !== 'undefined') {
        queue = win.mtperf.q;
    }

    var mtperf = mtperf || {};
    mtperf.q = queue;
    mtperf.version = 1;
    mtperf.targetOrigin = doc.location.protocol + '//' + doc.location.host;
    if (typeof mtperf.isAutorun === 'undefined') {
        mtperf.isAutorun = true;
    }

    // simple merge
    function merge(receiver, supplier) {
        for (var key in supplier) {
            if (supplier.hasOwnProperty(key)) {
                receiver[key] = supplier[key];
            }
        }
        return receiver;
    }

    // library methods
    mtperf = merge(mtperf, {
        init: function () {
            this.isDataSent = false;
            this.isJsonp = false;
            this.isDone = false;
            this.isDebugMode = true;
            this.isDomContentLoaded = false;
            this.isUnloaded = false;

            this.loadTime = null;
            this.needNavCookie = true;

            this.params = {};
            this.marks = {};
            this.measures = {};
            this.starts = {};

            this.findStartTime();

            // Process any commands that have been queued up while this script loaded asynchronously.
            this.processQueue();

            // Params
            this.beacon = this.beacon ? this.beacon : this.targetOrigin + '/beacon.gif';

            var self = this;

            // domready
            if (doc.readyState === 'complete') {
                self.domContentLoaded.call(self);
            } else if (doc.addEventListener) {
                doc.addEventListener('DOMContentLoaded', function () {
                    self.domContentLoaded.call(self);
                }, false);
            } else if (doc.attachEvent) {
                doc.attachEvent('onreadystatechange', function () {
                    self.readyStateChange.call(self);
                });
            }

            // page unload
            // onbeforeunload is the right event to fire, but not all browsers don't support it.
            // This allows us to fall back to onunload when onbeforeunload isn't implemented
            if (win.onpagehide || win.onpagehide === null) {
                this.addEventListener('pagehide', this.beforeUnload, false);
            } else {
                this.addEventListener('unload', this.beforeUnload, false);
            }
            this.addEventListener('beforeunload', this.beforeUnload, false);

            // page load, can be triggerred manually
            if (this.loadTime || doc.loaded) {
                this.onload.call(this);
            } else {
                this.addEventListener('load', function () {
                    self.onload.call(self);
                }, false);
            }
        },

        /*
         * Process any commands in the queue.
         * The command queue is used to store calls to the API before the full script has been loaded.
         */
        processQueue: function () {
            var commandCount = this.q.length,
                commandIndex,
                command;

            for (commandIndex = 0; commandIndex < commandCount; commandIndex++) {
                command = this.q[commandIndex];
                switch (command[0]) {
                case 'mark':
                    this.mark(command[1], command[2]);
                    break;
                case 'measure':
                    // TODO maybe buggy here
                    this.measure(command[1], command[2], command[3]);
                    break;
                case 'param':
                    this.addParam(command[1], command[2]);
                    break;
                case 'done':
                    this.done(command[1]);
                    break;
                // trigger load event manually
                case 'load':
                    this.loadTime = command[1];
                    break;
                default:
                    this.debug('mtperf.processQueue: unknown queue command ' + command[0], true);
                    break;
                }
            }
        },

        /**
         * Set a time marker (typically the beginning of an episode).
         * @param {String} markName
         * @param {Time} markTime
         */
        mark: function (markName, markTime) {
            this.debug('mtperf.mark: ' + markName + ', ' + markTime);
            if (typeof markName === 'undefined') {
                return this.debug('mtperf.mark: markName is undefined', true);
            }
            this.marks[markName] = parseInt(markTime || (new Date()).getTime(), 10);
            switch (markName) {
            case 'firstbyte':
                this.measure('be', 'starttime', 'firstbyte');
                this.domStartTime = this.marks.firstbyte;
                break;
            case 'onload':
                this.measure('fe', 'firstbyte', 'onload');
                break;
            case 'domContent':
                this.measure('dc', 'firstbyte', 'domContent');
                break;
            }
        },

        /**
         * Measure time elapsed between two markers
         * @param {String} periodName
         * @param {String|Number} startMark
         * @param {String|Number} endMark
         */
        measure: function (periodName, startMark, endMark) {
            this.debug('mtperf.measure: ' + periodName + ', ' + startMark + ', ' + endMark);
            if (typeof periodName === 'undefined') {
                return this.debug('mtperf.measure: episodeName is undefined', true);
            }

            var periodStartTime;
            if (typeof startMark === 'undefined') {
                if (typeof this.marks[periodName] === 'number') {
                    periodStartTime = this.marks[periodName];
                } else {
                    periodStartTime = (new Date()).getTime();
                }
            } else if (typeof this.marks[startMark] === 'number') {
                periodStartTime = this.marks[startMark];
            } else if (typeof startMark === 'number') {
                periodStartTime = startMark;
            } else {
                this.debug('mtperf.measure: unexpected startMark: ' + startMark, true);
                return false;
            }

            var periodEndTime;
            if (typeof endMark === 'undefined') {
                periodEndTime = (new Date()).getTime();
            } else if (typeof this.marks[endMark] === 'number') {
                periodEndTime = this.marks[endMark];
            } else if (typeof endMark === 'number') {
                periodEndTime = endMark;
            } else {
                this.debug('mtperf.measure: unexpected endMark: ' + endMark, true);
                return false;
            }

            this.starts[periodName] = parseInt(periodStartTime, 10);
            this.measures[periodName] = parseInt(periodEndTime - periodStartTime, 10);
            return true;
        },

        /**
         * In the case of Ajax or post-onload episodes, call done to signal the end of episodes.
         */
        done: function (callback) {
            if (this.isDone) { return; }
            this.isDone = true;
            this.mark('done');
            if (this.isAutorun) {
                this.sendBeacon();
            }
            if (typeof callback === 'function') {
                callback();
            }
        },

        /**
         * Return an object of mark names and their corresponding times.
         */
        getMarks: function () {
            return this.marks;
        },

        /**
         * Return an object of episode names and their corresponding durations.
         */
        getMeasures: function () {
            return this.measures;
        },

        /**
         * Return an object of episode names and their corresponding start times.
         * This is needed so that we can determine the start and end time of a duration.
         */
        getStarts: function () {
            return this.starts;
        },

        // Construct a querystring of episodic time measurements and send it to the specified URL.
        //    url      The URL to which to send the beacon request.
        //             This is the full path including filename, but without querystring params.
        //             Example: 'http://yourdomain.com/gen204'
        //             A best practice is to return a 204 'No Content' response.
        //             If not specified then EPISODES.beaconUrl is used.
        //
        //    params - An object of key|value pairs that are added to the URL's querystring.
        //             Example: { 'pageType': 'login', 'dataCenter': 'Wash DC' }
        //             That example would add this to the querystring: &pageType=login&dataCenter=Wash%20DC
        //
        sendBeacon: function () {
            if (this.isDataSent) { return; }

            this.isDataSent = true;
            this.processQueue();
            this.domContentLoaded();

            var hasOwnProperty = Object.prototype.hasOwnProperty;

            if (this.domEndTime && this.domStartTime) {
                this.debug('mtperf.sendBeacon: picking up DOM processing time from embedded JS');
                this.mark('domContent', this.domEndTime);
            }

            if (this.loadTime) {
                this.debug('mtperf.sendBeacon: picking up load event time from embedded JS');
                this.mark('onload', this.loadTime);
            }

            // measurements
            var measures = this.getMeasures(),
                measureStr = '';
            for (var key in measures) {
                if (hasOwnProperty.call(measures, key)) {
                    measureStr += '&' + escape(key) + '=' + encodeURIComponent(measures[key]);
                }
            }

            // params
            var params = this.params,
                paramStr = '';
            for (key in params) {
                if (hasOwnProperty.call(params, key)) {
                    paramStr += '&' + escape(key) + '=' + encodeURIComponent(params[key]);
                }
            }

            // fast return when nothing to send
            if (measureStr === '') {
                return;
            }

            var beaconUrl;
            var data = {
                measures: measures,
                params: params,
                timing: null,
                navigation: null,
                dom: this.stringify(this.getDomData())
            };

            beaconUrl = this.beacon + '?v=' + this.version;
            beaconUrl += measureStr;
            beaconUrl += paramStr;

            // jsonp when in iframe
            if (this.isJsonp) {
                beaconUrl += '&jsonp=test';
            }

            // append performance.timing, performance.navigation
            var performance = this.getPerformance();
            if (performance) {
                data.timing = this.stringify(this.getTimingData(performance.timing));
                data.navigation = this.stringify(this.getNavigationData(performance.navigation));
                beaconUrl += this.getParam('timing', data.timing);
                beaconUrl += this.getParam('navigation', data.navigation);
            }

            beaconUrl += this.getParam('dom', data.dom);

            // send beacon request
            if (this.isJsonp) {
                var script = doc.createElement('script');
                script.type = 'text/javascript';
                script.src = beaconUrl;
                doc.body.appendChild(script);
            } else {
                var image = new Image(1, 1);
                image.src = beaconUrl;
            }

            this.debug('mtperf.sendBeacon: (new) data sent');
            this.debug('mtperf.sendBeacon.data.measures: ' + this.stringify(data.measures));
            this.debug('mtperf.sendBeacon.data.params: ' + this.stringify(data.params));
            this.debug('mtperf.sendBeacon.data.timing: ' + this.stringify(data.timing));
            this.debug('mtperf.sendBeacon.data.navigation: ' + this.stringify(data.navigation));
            this.debug('mtperf.sendBeacon.data.dom: ' + this.stringify(data.dom));
        },

        /**
         * add param to be sent with the beacon
         */
        addParam: function (key, value) {
            if (typeof value !== 'undefined') {
                this.params[key] = value;
            }
        },

        /**
         * get param with url encoded
         */
        getParam: function (key, value) {
            if ((value !== null) && (value.length > 0)) {
                return '&' + key + '=' + encodeURIComponent(value);
            }
            return '';
        },

        /**
         * add timing data
         */
        getTimingData: function (timing) {
            var start = timing.navigationStart ? timing.navigationStart : this.startTime;
            var data = {
                st: start,
                ce: timing.connectEnd - start,
                cs: timing.connectStart - start,
                dc: timing.domComplete - start,
                de: timing.domContentLoadedEventEnd - start,
                di: timing.domInteractive - start,
                dl: timing.domLoading - start,
                dne: timing.domainLookupEnd - start,
                dns: timing.domainLookupStart - start,
                ds: timing.domContentLoadedEventStart - start,
                fs: timing.fetchStart - start,
                le: timing.loadEventEnd - start,
                ls: timing.loadEventStart - start,
                ns: timing.navigationStart - start,
                re: timing.redirectEnd ? (timing.redirectEnd - start) : 0,
                rpe: timing.responseEnd - start,
                rps: timing.responseStart - start,
                rqs: timing.requestStart - start,
                rs: timing.redirectStart ? (timing.redirectStart - start) : 0,
                ue: timing.unloadEventEnd - start,
                us: timing.unloadEventStart - start
            };

            // msFirstPaint is IE9+ http://msdn.microsoft.com/en-us/library/ff974719
            if (timing.msFirstPaint) {
                data.fsp = timing.msFirstPaint;
            }

            // http://www.webpagetest.org/forums/showthread.php?tid=11782
            if (win.chrome && win.chrome.loadTimes) {
                var loadTimes = win.chrome.loadTimes();
                data.fsp = Math.round((loadTimes.firstPaintTime - loadTimes.startLoadTime) * 1000);
            }

            return data;
        },

        /**
         * add navigation data
         */
        getNavigationData: function (navigation) {
            return {
                ty: navigation.type,
                rc: navigation.redirectCount
            };
        },

        /**
         * add dom data
         */
        getDomData: function () {
            var fn = doc.querySelectorAll ? doc.querySelectorAll : doc.getElementsByTagName;
            return {
                nc: fn.call(doc, '*').length,
                sz: fn.call(doc, 'html')[0].innerHTML.length,
                img: fn.call(doc, 'img').length,
                js: fn.call(doc, 'script').length
            };
        },

        /**
         * Use various techniques to determine the time at which this page started.
         */
        findStartTime: function () {
            var startTime = this.findStartWebTiming() || this.findStartGToolbar() || this.findStartCookie();
            if (startTime) {
                this.mark('starttime', startTime);
            } else {
                this.debug('mtperf.findStartTime: cannot find a start time', true);
            }
        },

        /**
         * Find the start time from the Web Timing 'performance' object.
         * http://test.w3.org/webperf/specs/NavigationTiming/
         * http://blog.chromium.org/2010/07/do-you-know-how-slow-your-web-page-is.html
         */
        findStartWebTiming: function () {
            var startTime;
            if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
                var b = parseInt(RegExp.$1, 10);
                if (b < 9) {
                    return startTime;
                }
            }
            var performance = this.getPerformance();
            if (performance && (typeof performance.timing.navigationStart !== 'undefined')) {
                startTime = performance.timing.navigationStart;
                this.debug('mtperf.findStartWebTiming: startTime = ' + startTime);
            }
            // Turn off navigation cookie if we browser supports navigation api
            if (startTime) {
                this.needNavCookie = false;
            }
            return startTime;
        },

        /**
         * Find the start time from the Google Toolbar.
         * http://ecmanaut.blogspot.com/2010/06/google-bom-feature-ms-since-pageload.html
         */
        findStartGToolbar: function () {
            var pagetime, starttime;
            try {
                if (win.external && win.external.pageT) {
                    pagetime = win.external.pageT;
                } else if (win.gtbExternal && win.gtbExternal.pageT) {
                    pagetime = win.gtbExternal.pageT();
                } else if (win.chrome && win.chrome.csi) {
                    pagetime = win.chrome.csi().pageT;
                }
                if (pagetime && pagetime < 6e4) {
                    starttime = (new Date()).getTime() - pagetime;
                    this.debug('mtperf.findStartGToolbar: startTime = ' + starttime);
                }
            } catch (exception) {}
            // Turn off navigation cookie if browser has google toolbar installed
            if (starttime) {
                this.needNavCookie = false;
            }
            return starttime;
        },

        /**
         * Find the start time based on a cookie set by Episodes in the unload handler.
         */
        findStartCookie: function () {
            this.debug('mtperf.findStartCookie: ' + doc.cookie);
            var a, b, c = doc.cookie.split(' ');
            for (a = 0; a < c.length; a++) {
                if (0 === c[a].indexOf('mtperf=')) {
                    var d, e, f, g, h = c[a].substring('mtperf='.length).split('&');
                    for (b = 0; b < h.length; b++) {
                        if (h[b].indexOf('s=') === 0) {
                            f = h[b].substring(2);
                        } else if (0 === h[b].indexOf('h=')) {
                            f = h[b].substring(2);
                            this.measure('ph', 0, 1);
                        } else if (0 === h[b].indexOf('p=')) {
                            e = h[b].substring(2);
                            if (';' === e.charAt(e.length - 1)) {
                                e = e.substr(0, e.length - 1);
                            }
                        } else if (0 === h[b].indexOf('r=')) {
                            d = h[b].substring(2);
                            if (';' === d.charAt(d.length - 1)) {
                                d = d.substr(0, d.length - 1);
                            }
                        }
                    }
                    if (d) {
                        var i = this.sHash(doc.referrer);
                        g = (i === d);
                        if (!g) {
                            g = (this.sHash(doc.location.href) === d) && (i === e);
                        }
                    }
                    if (g && f) {
                        var j = (new Date()).getTime();
                        if (j - f > 6e4) {
                            this.debug('mtperf.findStartCookie: startTime > 60s old - ignored');
                            return undefined;
                        } else {
                            this.debug('mtperf.findStartCookie: startTime = ' + f);
                            return f;
                        }
                    }
                }
            }
            return undefined;
        },

        /**
         * get navigation timing data
         */
        getPerformance: function () {
            var performance = win.performance || win.mozPerformance || win.msPerformance || win.webkitPerformance;
            return (typeof performance !== 'undefined') && (typeof performance.timing !== 'undefined') ? performance : null;
        },

        /**
         * Set a cookie when the page unloads. Consume this cookie on the next page to get a 'start time'.
         */
        beforeUnload: function (event) {
            if (this.isUnloaded) { return; }
            event = event || win.event;
            if (this.needNavCookie) {
                win.alert('needNavCookie');
                var source = event.type === 'pagehide' ? 'h' : 's';
                doc.cookie = 'mtperf=' + source + '=' + (+new Date()) + '&r=' + this.sHash(doc.location.href) + '&p=' + this.sHash(doc.referrer) + '; path=/';
            }
            this.isUnloaded = true;
        },

        /**
         * When the page is done do final wrap-up.
         */
        onload: function () {
            var self = this;
            this.mark('onload');
            if (this.isAutorun) {
                // workaround for win.performance.timing.loadEventEnd = 0
                // TODO use setImmediate polyfil
                win.setTimeout(function () {
                    self.done.call(self);
                }, 1);
            }
        },

        domContentLoaded: function () {
            if (this.isDomContentLoaded) { return; }
            this.mark('domContent', (new Date()).getTime());
            this.isDomContentLoaded = true;
        },

        readyStateChange: function () {
            if (doc.readyState === 'complete') {
                this.domContentLoaded();
            }
        },

        addEventListener: function (name, callback, useCapture) {
            if (win.attachEvent) {
                return win.attachEvent('on' + name, callback);
            } else if (win.addEventListener) {
                return win.addEventListener(name, callback, useCapture);
            }
        },

        sHash: function (str) {
            var i, hash = 0;
            for (i = 0; i < str.length; i++) {
                hash += (i + 1) * str.charCodeAt(i);
            }
            return Math.abs(hash);
        },

        stringify: function (data) {
            var type = typeof data,
                hasOwnProperty = Object.prototype.hasOwnProperty;
            switch (type) {
            case 'string':
                return '"' + data + '"';
            case 'boolean':
            case 'number':
                return String(data);
            case 'object':
                if (null === data) {
                    return 'null';
                }
                var c = false, d = '';
                for (var prop in data) {
                    if (hasOwnProperty.call(data, prop)) {
                        var e = String(prop),
                            f = this.stringify(data[prop]);
                        if (f.length) {
                            if (c) {
                                d += ', ';
                            } else {
                                c = true;
                            }
                            d += (data instanceof Array) ? f : '"' + e + '":' + f;
                        }
                    }
                }
                return (data instanceof Array) ? '[' + d + ']' : '{' + d + '}';
            default:
                return '';
            }
        },

        /**
         * Wrapper for debug log function.
         */
        debug: function (message, isError) {
            if (this.isDebugMode === false) { return; }
            if (win.console && win.console.log) {
                if (isError && win.console.warn) {
                    win.console.warn(message);
                } else {
                    win.console.log(message);
                }
            }
        }
    });

    mtperf.init();

    win.mtperf = mtperf;

})();
