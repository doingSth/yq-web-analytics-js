var NR_QUEUE = [];
"undefined" != typeof window.NREUMQ ? NR_QUEUE = NREUMQ : "undefined" != typeof window.EPISODES ? NR_QUEUE = EPISODES.q : "undefined" != typeof window.NREUM && (NR_QUEUE = NREUM.q);
var NREUM = NREUM || {};
NREUM.q = NR_QUEUE, NREUM.targetOrigin = document.location.protocol + "//" + document.location.host, NREUM.version = 42, NREUM.autorun = "undefined" != typeof NREUM.autorun ? NREUM.autorun : !0, NREUM.init = function () {
    NREUM.dataSent = !1, NREUM.jsonp = !1, NREUM.beaconToken = null, NREUM.navCookie = !0, NREUM.bDone = !1, NREUM.cycle = 0, NREUM.logging = !1, NREUM.contentLoadFired = !1, NREUM.marks = {}, NREUM.measures = {}, NREUM.starts = {}, NREUM.findStartTime(), NREUM.load = null, NREUM.extra = null, NREUM.addEventListener("beforeunload", NREUM.beforeUnload, !1), NREUM.addEventListener("pagehide", NREUM.beforeUnload, !1), NREUM.processQ(), NREUM.beacon = null, NREUM.licenseKey = null, NREUM.applicationID = null, NREUM.transactionName = null, NREUM.agentToken = null, NREUM.txnParam = null, NREUM.unloaded = !1, "complete" === document.readyState ? NREUM.domContentLoaded() : "undefined" != typeof document.addEventListener ? document.addEventListener("DOMContentLoaded", NREUM.domContentLoaded, !1) : "undefined" != typeof document.attachEvent && document.attachEvent("onreadystatechange", NREUM.readyStateChange), NREUM.load || document.loaded ? NREUM.onload() : NREUM.addEventListener("load", NREUM.onload, !1)
}, NREUM.processQ = function () {
    var a, b, c, d = NREUM.q.length;
    for (c = 0; d > c; c++) {
        switch (a = NREUM.q[c], b = null, a[0]) {
        case "mark":
            NREUM.mark(a[1], a[2]);
            break;
        case "measure":
            NREUM.measure(a[1], a[2], a[3]);
            break;
        case "done":
            NREUM.done(a[1]);
            break;
        case "nrf":
        case "nrfinish":
            b = "t";
            break;
        case "nrf2":
        case "nrfinish2":
            b = "to";
            break;
        case "nrfj":
            b = "to", NREUM.jsonp = parent == self;
            break;
        case "nrfjx":
            NREUM.jsonp = parent == self;
        case "nrf2x":
            NREUM.nrfinish("to", a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], null, null, null, a[10]);
            break;
        case "load":
            NREUM.load = a[1];
            break;
        default:
            NREUM.dprint("Unknown queue command " + a[0])
        }
        b && NREUM.nrfinish(b, a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], null)
    }
}, NREUM.nrfinish = function (a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    NREUM.dprint("NREUM: finish data received"), NREUM.txnParam = a, NREUM.beacon = b, NREUM.licenseKey = c, NREUM.applicationID = d, NREUM.transactionName = e, NREUM.tt_guid = i, NREUM.user = k, NREUM.account = l, NREUM.product = m, NREUM.extra = n, NREUM.measures.qt = f, NREUM.measures.ap = g, NREUM.dom_end_time = h, NREUM.agentToken = j
}, NREUM.mark = function (a, b) {
    return NREUM.dprint("NREUM.mark: " + a + ", " + b), a ? (NREUM.marks[a] = parseInt(b || (new Date).getTime(), 10), "firstbyte" === a ? (NREUM.measure("be", "starttime", "firstbyte"), NREUM.dom_start_time = NREUM.marks.firstbyte) : "onload" === a ? NREUM.measure("fe", "firstbyte", "onload") : "domContent" === a && NREUM.measure("dc", "firstbyte", "domContent"), void 0) : (NREUM.dprint("Error: markName is undefined in NREUM.mark."), void 0)
}, NREUM.measure = function (a, b, c) {
    if (NREUM.dprint("NREUM.measure: " + a + ", " + b + ", " + c), !a) return NREUM.dprint("Error: episodeName is undefined in NREUM.measure."), void 0;
    var d;
    if ("undefined" == typeof b) d = "number" == typeof NREUM.marks[a] ? NREUM.marks[a] : (new Date).getTime();
    else if ("number" == typeof NREUM.marks[b]) d = NREUM.marks[b];
    else {
        if ("number" != typeof b) return NREUM.dprint("Error: unexpected startNameOrTime in NREUM.measure: " + b), void 0;
        d = b
    }
    var e;
    if ("undefined" == typeof c) e = (new Date).getTime();
    else if ("number" == typeof NREUM.marks[c]) e = NREUM.marks[c];
    else {
        if ("number" != typeof c) return NREUM.dprint("NREUM: Error: unexpected endNameOrTime in NREUM.measure: " + c), void 0;
        e = c
    }
    NREUM.starts[a] = parseInt(d, 10), NREUM.measures[a] = parseInt(e - d, 10)
}, NREUM.done = function (a) {
    NREUM.bDone || (NREUM.bDone = !0, NREUM.mark("done"), NREUM.autorun && NREUM.sendBeacon(), "function" == typeof a && a())
}, NREUM.getMarks = function () {
    return NREUM.marks
}, NREUM.getMeasures = function () {
    return NREUM.measures
}, NREUM.getStarts = function () {
    return NREUM.starts
}, NREUM.sendBeacon = function () {
    if (!NREUM.dataSent) {
        if (NREUM.dataSent = !0, NREUM.processQ(), NREUM.domContentLoaded(), null === NREUM.licenseKey || null === NREUM.applicationID) return NREUM.dprint("NREUM: licenseKey or applicationID has not been set"), void 0;
        NREUM.dom_end_time && NREUM.dom_start_time && (NREUM.dprint("NREUM: picking up DOM processing time from embedded JS"), NREUM.mark("domContent", NREUM.dom_end_time)), NREUM.load && (NREUM.dprint("NREUM: picking up load event time from embedded JS"), NREUM.mark("onload", NREUM.load));
        var a, b = NREUM.getMeasures(),
            c = "";
        for (a in b) c += "&" + a + "=" + b[a];
        var d;
        if (c) {
            var e = "1";
            d = ("http:" === document.location.protocol ? "http:" : "https:") + "//" + NREUM.beacon + "/" + e + "/" + NREUM.licenseKey, d += "?a=" + NREUM.applicationID, d += c, d += NREUM.getParam(NREUM.txnParam, NREUM.transactionName), d += NREUM.getParam("tt", NREUM.tt_guid), d += NREUM.getParam("us", NREUM.user), d += NREUM.getParam("ac", NREUM.account), d += NREUM.getParam("pr", NREUM.product), d += NREUM.getParam("tk", NREUM.agentToken), d += "&v=" + NREUM.version, d += NREUM.getParam("xx", NREUM.extra), NREUM.jsonp && (d += "&jsonp=NREUM.setToken");
            var f = NREUM.getPerformance();
            if (f) {
                var g = {};
                g.timing = NREUM.addPT(f.timing, {}), g.navigation = NREUM.addPN(f.navigation, {}), d += NREUM.getParam("perf", NREUM.stringify(g))
            }
            if (NREUM.jsonp) {
                var h = document.createElement("script");
                h.type = "text/javascript", h.src = d, document.body.appendChild(h)
            } else {
                var i = new Image;
                i.src = d
            }
            NREUM.dprint("NREUM: (new) data sent", d)
        }
    }
}, NREUM.getParam = function (a, b) {
    return null != b && b.length > 0 ? "&" + a + "=" + encodeURIComponent(b) : ""
}, NREUM.addPT = function (a, b) {
    var c = a.navigationStart;
    return b.of = c, NREUM.addRel(a.navigationStart, c, b, "n"), NREUM.addRel(a.unloadEventStart, c, b, "u"), NREUM.addRel(a.unloadEventEnd, c, b, "ue"), NREUM.addRel(a.domLoading, c, b, "dl"), NREUM.addRel(a.domInteractive, c, b, "di"), NREUM.addRel(a.domContentLoadedEventStart, c, b, "ds"), NREUM.addRel(a.domContentLoadedEventEnd, c, b, "de"), NREUM.addRel(a.domComplete, c, b, "dc"), NREUM.addRel(a.loadEventStart, c, b, "l"), NREUM.addRel(a.loadEventEnd, c, b, "le"), NREUM.addRT(a, b, c), b
}, NREUM.addPN = function (a, b) {
    return NREUM.addRel(a.type, 0, b, "ty"), NREUM.addRel(a.redirectCount, 0, b, "rc"), b
}, NREUM.addRT = function (a, b, c) {
    var d;
    return c ? d = c : (d = a.startTime, b.of = d), NREUM.addRel(a.redirectStart, d, b, "r"), NREUM.addRel(a.redirectEnd, d, b, "re"), NREUM.addRel(a.fetchStart, d, b, "f"), NREUM.addRel(a.domainLookupStart, d, b, "dn"), NREUM.addRel(a.domainLookupEnd, d, b, "dne"), NREUM.addRel(a.connectStart, d, b, "c"), NREUM.addRel(a.connectEnd, d, b, "ce"), NREUM.addRel(a.secureConnectionStart, d, b, "s"), NREUM.addRel(a.requestStart, d, b, "rq"), NREUM.addRel(a.responseStart, d, b, "rp"), NREUM.addRel(a.responseEnd, d, b, "rpe"), c || (b.n = a.name, b.st = a.startTime - d, b.it = a.initiatorType, b.du = a.duration), b
}, NREUM.addRel = function (a, b, c, d) {
    "number" == typeof a && a > 0 && (c[d] = a - b)
}, NREUM.setToken = function (a) {
    NREUM.dprint("NREUM: trace " + a), NREUM.beaconToken = a
}, NREUM.inlineHit = function (a, b, c, d, e, f) {
    if (NREUM.cycle += 1, null === NREUM.licenseKey || null === NREUM.applicationID) return NREUM.dprint("NREUM: licenseKey or applicationID has not been set"), void 0;
    var g = new Image,
        h = ("http:" === document.location.protocol ? "http:" : "https:") + "//" + NREUM.beacon + "/1/" + NREUM.licenseKey;
    h += "?a=" + NREUM.applicationID + "&", h += "t=" + a + "&", h += "qt=" + b + "&", h += "ap=" + c + "&", h += "be=" + d + "&", h += "dc=" + e + "&", h += "fe=" + f + "&", h += "c=" + NREUM.cycle, g.src = h, NREUM.dprint("NREUM Inline: " + h)
}, NREUM.findStartTime = function () {
    var a = NREUM.findStartWebTiming() || NREUM.findStartGToolbar() || NREUM.findStartCookie();
    a ? NREUM.mark("starttime", a) : NREUM.dprint("NREUM: Error: couldn't find a start time")
}, NREUM.findStartWebTiming = function () {
    var a;
    if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
        var b = new Number(RegExp.$1);
        if (9 > b) return a
    }
    var c = NREUM.getPerformance();
    return c && "undefined" != typeof c.timing.navigationStart && (a = c.timing.navigationStart, NREUM.dprint("NREUM.findStartWebTiming: startTime = " + a)), a && (NREUM.navCookie = !1), a
}, NREUM.getPerformance = function () {
    var a = window.performance || window.mozPerformance || window.msPerformance || window.webkitPerformance;
    return "undefined" != typeof a && "undefined" != typeof a.timing ? a : null
}, NREUM.findStartGToolbar = function () {
    var a, b;
    try {
        window.external && window.external.pageT ? a = window.external.pageT : window.gtbExternal && window.gtbExternal.pageT ? a = window.gtbExternal.pageT() : window.chrome && window.chrome.csi && (a = window.chrome.csi().pageT), a && 6e4 > a && (b = (new Date).getTime() - a, NREUM.dprint("NREUM.findStartGToolbar: startTime = " + b))
    } catch (c) {}
    return b && (NREUM.navCookie = !1), b
}, NREUM.findStartCookie = function () {
    var a, b, c = document.cookie.split(" ");
    for (a = 0; a < c.length; a++)
        if (0 === c[a].indexOf("NREUM=")) {
            var d, e, f, g, h = c[a].substring("NREUM=".length).split("&");
            for (b = 0; b < h.length; b++) 0 === h[b].indexOf("s=") ? f = h[b].substring(2) : 0 === h[b].indexOf("h=") ? (f = h[b].substring(2), NREUM.measure("ph", 0, 1)) : 0 === h[b].indexOf("p=") ? (e = h[b].substring(2), ";" === e.charAt(e.length - 1) && (e = e.substr(0, e.length - 1))) : 0 === h[b].indexOf("r=") && (d = h[b].substring(2), ";" === d.charAt(d.length - 1) && (d = d.substr(0, d.length - 1)));
            if (d) {
                var i = NREUM.sHash(document.referrer);
                g = i == d, g || (g = NREUM.sHash(document.location.href) == d && i == e)
            }
            if (g && f) {
                var j = (new Date).getTime();
                return j - f > 6e4 ? (NREUM.dprint("NREUM.findStartCookie: startTime > 60s old - ignored"), void 0) : (NREUM.dprint("NREUM.findStartCookie: startTime = " + f), f)
            }
        }
    return void 0
}, NREUM.beforeUnload = function (a) {
    if (!NREUM.unloaded) {
        var b = "s";
        "pagehide" === a.type && (b = "h"), NREUM.navCookie && (document.cookie = "NREUM=" + b + "=" + Number(new Date) + "&r=" + NREUM.sHash(document.location.href) + "&p=" + NREUM.sHash(document.referrer) + "; path=/"), NREUM.beaconToken && (document.cookie = "NRAGENT=tk=" + NREUM.beaconToken + "; max-age=1; path=/"), NREUM.unloaded = !0
    }
}, NREUM.onload = function () {
    NREUM.mark("onload"), NREUM.autorun && NREUM.done()
}, NREUM.domContentLoaded = function () {
    NREUM.contentLoadFired || (NREUM.mark("domContent", (new Date).getTime()), NREUM.contentLoadFired = !0)
}, NREUM.readyStateChange = function () {
    "complete" === document.readyState && NREUM.domContentLoaded()
}, NREUM.addEventListener = function (a, b, c) {
    return "undefined" != typeof window.attachEvent ? window.attachEvent("on" + a, b) : window.addEventListener ? window.addEventListener(a, b, c) : void 0
}, NREUM.sHash = function (a) {
    var b, c = 0;
    for (b = 0; b < a.length; b++) c += (b + 1) * a.charCodeAt(b);
    return Math.abs(c)
}, NREUM.stringify = function (a) {
    var b = typeof a;
    switch (b) {
    case "string":
        return '"' + a + '"';
    case "boolean":
    case "number":
        return String(a);
    case "object":
        if (null === a) return "null";
        var c = !1,
            d = "";
        for (prop in a) {
            var e = String(prop),
                f = NREUM.stringify(a[prop]);
            f.length > 0 && (c ? d += ", " : c = !0, d += a instanceof Array ? f : '"' + e + '":' + f)
        }
        return a instanceof Array ? "[" + d + "]" : "{" + d + "}";
    default:
        return ""
    }
}, NREUM.dprint = "undefined" != typeof console && "undefined" != typeof console.log ? function (a) {
    NREUM.logging && console.log(a)
} : function () {}, NREUM.init();
