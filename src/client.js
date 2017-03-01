/* global util, Cookie */

var COOKIE_USER_TRACKING = '__mta';

/**
 * 采集客户端信息, Stealing from GA
 */
function Client() {
    var empty = "-",
        encode = util.encode,
        screen = window.screen,
        navigator = window.navigator,
        viewport = this._getViewport();

    this.screen = screen ? screen.width + "x" + screen.height : empty;
    this.viewport = viewport.width + "x" + viewport.height;
    this.charset = encode(document.characterSet ? document.characterSet : document.charset ? document.charset : empty);
    this.language = (navigator && navigator.language ? navigator.language : navigator && navigator.browserLanguage ? navigator.browserLanguage : empty).toLowerCase();
    this.javaEnabled = navigator && navigator.javaEnabled() ? 1 : 0;
    this.isFirstVisit = false;
    this.setCookie();
}

Client.prototype = {
    setCookie: function () {
        var cookieStr = Cookie.get(COOKIE_USER_TRACKING),
            expire = Cookie.getExpire(720, 0, 0),
            now = util.now();

        // if empty cookieStr, create newone, expire in 2 years
        if (!cookieStr) {
            var userId = this._hashInfo(),
                gmtFirstVisit = now,
                gmtLastVisit = now,
                gmtThisVisit = now,
                visitCount = 1;

            cookieStr = [userId, gmtFirstVisit, gmtLastVisit, gmtThisVisit, visitCount].join('.');
            Cookie.set(COOKIE_USER_TRACKING, cookieStr, expire);

            this.isFirstVisit = true;
            this.uuid = userId;

        // increment visit count, update last visit gmt
        } else {
            cookieStr = cookieStr.split('.');
            cookieStr[2] = cookieStr[3];
            cookieStr[3] = now;
            cookieStr[4] = parseInt(cookieStr[4], 10) + 1;
            Cookie.set(COOKIE_USER_TRACKING, cookieStr.join('.'), expire);
            this.uuid = cookieStr[0];
        }
    },
    getInfo: function () {
        return {
            /*jshint camelcase:false*/
            sr: this.screen,
            vp: this.viewport,
            csz: document.cookie ? document.cookie.length : 0,
            uuid: this.uuid
        };
    },
    _hashInfo: function () {
        var navigator = window.navigator,
            historyCount = window.history.length;

        /*jshint laxbreak:true*/
        navigator = navigator.appName
            + navigator.version
            + this.language
            + navigator.platform
            + navigator.userAgent
            + this.javaEnabled
            + this.screen
            + (document.cookie ? document.cookie : "")
            + (document.referrer ? document.referrer : "");

        /*jshint bitwise:false*/
        for (var len = navigator.length; historyCount > 0;) {
            navigator += historyCount-- ^ len++;
        }
        return util.hash(navigator);
    },
    _getViewport: function () {
        // This works for all browsers except IE8 and before
        if (window.innerWidth !== null) {
            return {
                width: window.innerWidth,
                height: window.innerHeight
            };
        }

        // For IE (or any browser) in Standards mode
        if (document.compatMode === "CSS1Compat") {
            return {
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight
            };
        }

        // For browsers in Quirks mode
        return {
            width: document.body.clientWidth,
            height: document.body.clientWidth
        };
    }
};


