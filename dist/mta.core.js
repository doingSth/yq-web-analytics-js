(function (window, document) {
/* global escape, unescape */
/* exported util */

var hasOwnProp = Object.prototype.hasOwnProperty;
var util = {
    /**
     * 哈希函数。
     * @param str {String} 需要哈希的字符串。
     * @return ｛String｝哈希的结果字符串。
     */
    hash: function (str) {
        /*jshint bitwise:false*/
        var hash = 1,
            charCode = 0,
            idx;
        if (str) {
            hash = 0;
            for (idx = str.length - 1; idx >= 0; idx--) {
                charCode = str.charCodeAt(idx);
                hash = (hash << 6 & 268435455) + charCode + (charCode << 14);
                charCode = hash & 266338304;
                hash = charCode !== 0 ? hash ^ charCode >> 21 : hash;
            }
        }
        return hash;
    },

    /**
     * 用于遍历一个对象的键值。
     * 见test/specs/util.js
     *
     * @param obj
     * @param fn
     */
    keyPaths: function (obj, fn) {

        var kfunc = Object.keys || function keyFunc(obj) {
            var ks = [];
            for (var k in obj) {
                if (hasOwnProp.call(obj, k)) {
                    ks.push(k);
                }
            }
            return ks;
        };

        var keys = [];
        function traverse(obj) {
            // 超过十层，自动终止，防止循环引用导致死循环
            if (keys.length >= 10) {
                fn(keys.concat(), obj);
                return;
            }

            if (!(obj instanceof Object)) {
                fn(keys.concat(), obj);
                return;
            }

            kfunc(obj).forEach(function (key) {
                keys.push(key);
                traverse(obj[key]);
                keys.pop();
            });
        }

        traverse(obj);
    },

    /**
     * 通过白名单，过滤对象内容。
     * @param obj  原始对象
     * @param whitelist  白名单模板
     * @returns {{}}  白名单过滤后内容
     */
    whitelistify: function (obj, whitelist) {
        var whitePaths = [];
        util.keyPaths(whitelist, function (path) {
              whitePaths.push(path.join('.'));
        });
        var whitePathsString = '|' + whitePaths.join("|") + '|';
        var res = {};
        util.keyPaths(obj, function (path, val) {
           if (whitePathsString.indexOf('|' + path.join('.') + '|') !== -1) {
               var cur = res;
               for (var i = 0; i < path.length; i++) {
                   if (!cur[path[i]]) {
                       cur[path[i]] = {};
                   }
                   if (i === path.length - 1) {
                       cur[path[i]] = val;
                   }
                   cur = cur[path[i]];
               }
           }
        });
        return res;
    },

    random: function () {
        return Math.round(Math.random() * 2147483647);
    },

    stringify: function (data) {
        if (typeof JSON !== 'undefined' && JSON.stringify) {
            return JSON.stringify(data);
        }
        var type = typeof data;
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
                if (hasOwnProp.call(data, prop)) {
                    var e = '' + prop,
                        f = util.stringify(data[prop]);
                    if (f.length) {
                        if (c) {
                            d += ',';
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

    debug: function (message, isError) {
        if (typeof console !== 'undefined' && console.log) {
            if (isError && console.warn) {
                console.warn(message);
            } else {
                console.log(message);
            }
        }
    },

    encode: function (uri, isAll) {
        if (encodeURIComponent instanceof Function) {
            return isAll ? encodeURI(uri) : encodeURIComponent(uri);
        } else {
            return escape(uri);
        }
    },

    decode: function (encodedURI, isAll) {
        var uri;
        encodedURI = encodedURI.split("+").join(" ");
        if (decodeURIComponent instanceof Function) {
            try {
                uri = isAll ? decodeURI(encodedURI) : decodeURIComponent(encodedURI);
            } catch (ex) {
                uri = unescape(encodedURI);
            }
        } else {
            uri = unescape(encodedURI);
        }
        return uri;
    },

    merge: function (receiver, supplier) {
        for (var key in supplier) {
            if (hasOwnProp.call(supplier, key)) {
                receiver[key] = supplier[key];
            }
        }
        return receiver;
    },

    buildQueryString: function (data) {
        var encode = util.encode;

        // construct query string
        var key, dataStr = [];
        for (key in data) {
            if (hasOwnProp.call(data, key)) {
                var value = typeof data[key] === 'object' ? util.stringify(data[key]) : data[key];
                dataStr.push(encode(key) + '=' + encode(value));
            }
        }
        return dataStr.join('&');
    },

    addEventListener: function (name, callback, useCapture) {
        if (window.addEventListener) {
            return window.addEventListener(name, callback, useCapture);
        } else if (window.attachEvent) {
            return window.attachEvent('on' + name, callback);
        }
    },

    onload: function (callback) {
        if (document.readyState === 'complete') {
            callback();
        } else {
            util.addEventListener('load', callback, false);
        }
    },

    domready: function (callback) {
        if (document.readyState === 'interactive') {
            callback();
        } else if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', callback, false);
        } else if (document.attachEvent) {
            document.attachEvent('onreadystatechange', callback);
        }
    },

    /**
     * page unload
     * onbeforeunload is the right event to fire, but not all browsers don't support it.
     * This allows us to fall back to onunload when onbeforeunload isn't implemented
     */
    onunload: function (callback) {
        util.addEventListener('unload', callback, false);
        util.addEventListener('beforeunload', callback, false);
    },

    now: function () {
        return (new Date()).getTime();
    },

    ajax: function(settings) {
        if (window.location.protocol === 'file:') {
            return;
        }
        var xhr, 
            config = util.merge({ method: 'GET', async: true }, settings);
        if (window.XDomainRequest) {
            try {
                xhr = new window.XMLHttpRequest();
                xhr.open(config.method, config.url);
                xhr.send(util.stringify(config.data));
            } catch (e) {
            }
        } else if (window.XMLHttpRequest) {
            xhr = new window.XMLHttpRequest();
            if ("withCredentials" in xhr) {
                try {
                    xhr.open(config.method, config.url, config.async);
                    xhr.setRequestHeader("Content-type", "application/json");
                    xhr.send(util.stringify(config.data));
                } catch (e) {
                }
            }
        } else {
            return;
        }
    }
};

var Event = {
    queue: {},
    on: function(type, listener) {
        if (typeof listener !== 'function') {
            return;
        }
        if (!this.queue[type]) {
            this.queue[type] = [];
        }
        this.queue[type].push(listener);
    },
    trigger: function(type) {
        var i, args = [];
        for (i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        if (!this.queue[type]) {
            return;
        }
        for (i = 0; i < this.queue[type].length; i++) {
            this.queue[type][i].apply(this, args);
        }
    }
};
/* exported Cookie */

var Cookie = {
    /**
     * 获取cookie值
     * @param {String} name
     * @return {String} cookie值
     */
    get: function (name) {
        var cookie = document.cookie,
            arg = name + "=",
            alen = arg.length,
            clen = cookie.length,
            i = 0;
        while (i < clen) {
            var j = i + alen;
            if (cookie.substring(i, j) === arg) {
                return this._getValue(j);
            }
            i = cookie.indexOf(" ", i) + 1;
            if (i === 0) break;
        }
        return "";
    },

    /**
     * 设置cookie值
     * @param {String} name
     * @param {String|Number} value
     * @param {String} expires
     * @param {String} path
     * @param {String} domain
     * @param {String} secure
     */
    set: function (name, value, expires, path, domain, secure) {
        domain = domain ? domain : this._getDomain();
        document.cookie = name + "=" + encodeURIComponent(value) +
            ((expires) ? "; expires=" + expires : "") +
            ((path) ? "; path=" + path : "; path=/") +
            ((domain) ? "; domain=" + domain : "") +
            ((secure) ? "; secure" : "");
    },

    /**
     * 获取过期时间
     * @param {Number} days 天数
     * @param {Number} hours 小时数
     * @param {Number} minutes 分钟数
     * @return {String} 过期时间字符串
     */
    getExpire: function (days, hours, minutes) {
        var date = new Date();
        if (typeof days === "number" && typeof hours === "number" && typeof hours === "number") {
            date.setDate(date.getDate() + parseInt(days, 10));
            date.setHours(date.getHours() + parseInt(hours, 10));
            date.setMinutes(date.getMinutes() + parseInt(minutes, 10));
            return date.toGMTString();
        }
    },

    /**
     * 获取offset起的一对键值
     * @param {Number} offset
     * @return {String} 一对键值组成的字符串
     */
    _getValue: function (offset) {
        var cookie = document.cookie,
            endstr = cookie.indexOf(";", offset);
        if (endstr === -1) {
            endstr = cookie.length;
        }
        return decodeURIComponent(cookie.substring(offset, endstr));
    },

    /**
     * get domain
     */
    _getDomain: function () {
        /*global M*/
        var domain = document.domain;
        // http://stackoverflow.com/questions/1134290/cookies-on-localhost-with-explicit-domain
        // when working on localhost (!) the cookie-domain must be set
        // to "" or NULL or FALSE instead of "localhost"
        // otherwise, test wouldn't be passed.
        if ('localhost' === domain) {
            return "";
        }
        if (typeof M !== 'undefined' && M.DOMAIN_HOST) {
            domain = '.' + M.DOMAIN_HOST;
        }
        if ("www." === domain.substring(0, 4)) {
            domain = domain.substring(4);
        }
        return domain;
    }

};



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



/**
 * 数据发送，当数据长度符合要求时发送正常beacon
 * 如果数据长度太大，发送数据长度的错误日志方便后端统计错误条数
 */
function Beacon(url) {
    this.url = url;
}

// IE8's maximum URL length is 2083 chars, and it seems IE9 has a similar limit.
// https://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
Beacon.MAX_URL_LENGTH = 2083;

Beacon.prototype = {
    /**
     * Update beacon url
     * @param {string} url
     */
    config: function(url) {
        this.url = url;
    },
    /**
     * send a beacon request
     * @param {Object} data 发送的数据
     * @param {Function} callback 发送完毕之后的回调
     */
    send: function (data) {
        data.version = Tracker.VERSION;
        var dataStr = util.buildQueryString(data);

        // fast return when nothing to send
        if (!dataStr.length) {
            return;
        }
        // send beacon request, max url length comes from google analytics
        if ((this.url + '?' + dataStr).length <= Beacon.MAX_URL_LENGTH) {
            this._sendByScript(dataStr);
        } else {
            this.post(data);
        }
    },
    /**
     * As a matter of fact, beacon itself don't have the meaning of post data
     * to server. The reason to put post code in here just for simplicity.
     * Only when querystring too long this method will be used.
     *
     * @param {Object} data
     */
    post: function(data) {
        util.ajax({
            url: this.url,
            method: 'POST',
            data: data
        });
    },
    _sendByScript: function (param) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = this.url + '?' + param;
        var head = document.getElementsByTagName('script')[0];
        head.parentNode.insertBefore(script, head);
    }
};

/* global util, Client, Beacon */

var SEND_DELAY = 100;

/**
 * 创建新的性能数据追踪器
 * @param {Object} params
 *      beacon 发送beacon的图片地址，默认为beacon.gif
 *      useCombo 是否自动合并beacon请求，默认打开
 *      sampleRate 抽样比率，取值1~100之间
 */
function Tracker(config) {
    this._config = util.merge({
        sampleRate: 100,
        useCombo: true,
        autotags: true,
        beacon: document.location.protocol + '//frep.meituan.net/_.gif'
    }, config || {});

    this._client = new Client();
    this._beacon = new Beacon(this._config.beacon);

    this._queue = [];
    this._timer = null;

    this._app = null;        // 产品线标识符
    this._tags = {};         // 每个请求都会带上的信息

    this.visitorCode = util.random();

}

Tracker.VERSION = '0.0.1';

/**
 * 插件管理
 */
Tracker.Plugins = {};
Tracker.addPlugin = function (name, plugin) {
    if (typeof plugin.data !== 'function') {
        throw new Error('cannot add plugin: ' + name);
    }
    Tracker.Plugins[name] = plugin;
};

Tracker.prototype = {

    isInitialized: function () {
        return !!this._app;
    },

    /**
     * 执行指定的command, 该command应该是1个数组
     * 该数组的第1个元素必须是作为字符串传递的跟踪器对象方法的名称
     * 其余数组元素则是要作为不同参数传递给函数
     * 作用是在本脚本完全载入之前使用数组来替代 _mta
     * @param {Array} command 要执行的命令，可传入多项
     * @return {Number} 未能执行的命令的数量
     */
    push: function (/* command */) {
        var slice = Array.prototype.slice;
        for (var error = 0, i = 0, n = arguments.length; i < n; i++) {
            try {
                var command = arguments[i];
                if (typeof command === "function") {
                    arguments[i](this);
                } else {
                    command = slice.call(command, 0);
                    var fn = command[0];
                    this[fn].apply(this, command.slice(1));
                }
            } catch (exception) {
                error++;
            }
        }
        return error;
    },

    /**
     * set appname
     */
    create: function (appName, config) {
        this._app = appName;
        this._config = util.merge(this._config, config || {});
    },

    /**
     * update config
     */
    config: function (key, value) {
        if (value !== undefined) {
            switch (key) {
            case 'sampleRate':
                if (typeof value === 'number') {
                    this._config.sampleRate = value;
                }
                break;
            case 'beaconImage':
                this._beacon.config(this._config.beacon = value);
                break;
            case 'useCombo':
                if (typeof value === 'boolean') {
                    this._config.useCombo = value;
                }
                break;
            case 'autotags':
                if (typeof value === 'boolean') {
                    this._config.autotags = value;
                }
                break;
            }
        }
    },

    /**
     * add/remove tag
     */
    tag: function (key, value) {
        if (typeof key === 'string' && key.length) {
            if (typeof value !== 'undefined') {
                this._tags[key] = value;
            } else if (typeof this._tags[key] !== 'undefined') {
                delete this._tags[key];
            }
        }
    },

    /**
     * add plugin data into queue
     * or add data directly
     */
    send: function (key, data, tags, type) {
        if (!key) {
            return;
        }

        var plugin = Tracker.Plugins[key];
        if (plugin) {
            data = plugin.data();
            type = plugin.type;
        }

        var tmp = {};
        if (data) {
            tmp[key] = data;
            this._push(type || 'timer', tmp, tags);
        }

        var tracker = this;
        if (this._timer) {
            window.clearTimeout(this._timer);
            this._timer = null;
        }

        this._timer = window.setTimeout(function () {
            tracker._send.call(tracker);
        }, SEND_DELAY);
    },

    /**
     * send arbitary timing data
     * @example
     *  - mta('timing', 'api', {deal/dynamic: 25})
     *  - mta('timing', 'feature', { sidebar: {total:123, wait:100, api:200}})
     */
    timing: function (key, data, tags) {
        this.send(key, data || 1, tags, 'timer');
    },

    /**
     * send arbitary counter data
     */
    count: function (key, data, tags) {
        this.send(key, data || 1, tags, 'counter');
    },

    /**
     * send arbitary gauge data
     */
    gauge: function (key, data, tags) {
        this.send(key, data || 1, tags, 'gauge');
    },

    on: function(type, listener) {
        Event.on(type, listener);
    },

    /**
     * push data to queue
     * DO NOT check the queue exceeds max url length, it is Beacon.send's work
     */
    _push: function (type, data, tags) {
        this._queue.push({ type: type, data: data, tags: tags ? tags : this._tags });
    },

    /**
     * Construct a querystring of episodic time measurements and send it to the specified URL.
     */
    _send: function () {
        if (!this.isInitialized() || !this._isSampleHit()) {
            return;
        }

        var merge = util.merge,
            useCombo = this._config.useCombo,
            clientInfo = this._client.getInfo();

        var payload = {
            app: this._app,
            type: 'combo',
            url: window.location.protocol + '//' + window.location.hostname + window.location.pathname,
            autotags: this._config.autotags
        };

        payload = merge(payload, clientInfo);

        if (this._queue.length) {
            if (useCombo) {
                // combo send
                if (this._queue.length === 1) {
                    payload = merge(payload, this._queue[0]);
                    Event.trigger('data', payload);
                    this._beacon.send(payload);
                } else {
                    payload.data = this._queue;
                    Event.trigger('data', payload);
                    this._beacon.send(payload);
                }
            } else {
                // single send
                for (var i = 0, n = this._queue.length; i < n; i++) {
                    payload = merge(payload, this._queue[i]);
                    Event.trigger('data', payload);
                    this._beacon.send(payload);
                }
            }

            // reset queue
            this._queue = [];
        }
    },

    /**
     * 是否命中采样，对于第1次访问的始终采集所有数据
     * CAUTION: 第1次上线这个脚本的城市会全量采样
     */
    _isSampleHit: function () {
        return (this.visitorCode % 1E4) < (this._config.sampleRate * 100);
    }

};

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


})(window, document);
