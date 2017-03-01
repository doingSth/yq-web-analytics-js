wptJSVer = '30';
wptBrowser = 'Chrome 30';
function getCookie(c_name) {
    var i, x, y, ARRcookies = document.cookie.split(";");
    for (i=0; i<ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
        x = x.replace(/^\s+|\s+$/g,"");
        if (x === c_name) {
            return unescape(y);
        }
    }
}

function setCookie(c_name,value,exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}

// see if the browser we are in supports resource timing
function WptExperiment() {
    try {
        if (window['performance'] !== undefined &&
                (window.performance.getEntriesByType ||
                 window.performance.webkitGetEntriesByType)) {
            if (window.performance.getEntriesByType)
                var requests = window.performance.getEntriesByType("resource");
            else
                var requests = window.performance.webkitGetEntriesByType("resource");
            var detected = false;
            var data = {'browser': wptBrowser,
                'jsCached': false,
                'cookiePresent': false,
                'existingSession' : false,
                'localStoragePresent' : false,
                'jsTime': 0};
            for (i = 0; i < requests.length; i++) {
                var url = requests[i].name;
                if (requests[i].name.indexOf('site.js') !== -1) {
                    detected = true;
                    if (requests[i].responseStart === 0 ||
                            requests[i].responseStart === requests[i].requestStart)
                        data.jsCached = true;
                    data.jsTime = Math.round(requests[i].duration);
                }
            }

            if (getCookie('exptVer') === wptJSVer) {
                data.cookiePresent = true;
            }
            setCookie('exptVer', wptJSVer, 365);
            if (getCookie('exptSession') === wptJSVer) {
                data.existingSession = true;
            }
            setCookie('exptSession', wptJSVer, null);
            if (localStorage["exptVer"] === wptJSVer)  {
                ata.localStoragePresent = true;
            }
            localStorage["exptVer"] = wptJSVer;
            if (detected) {
                console.log(JSON.stringify(data));
                var debug_str = 'site.js loaded from ';
                if (data.jsCached)
                    debug_str += 'cache';
                else
                    debug_str += 'network';
                debug_str += ' in ' + data.jsTime + ' milliseconds';
                if (data.existingSession)
                    debug_str += ' (Existing Session)';
                else
                    debug_str += ' (New Session)';
                $("#experiment-timing").html(debug_str);
                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/experiment/data.php', true);
                xhr.send(JSON.stringify(data));
            }
        }
    } catch (e) { }
};

