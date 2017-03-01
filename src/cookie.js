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


