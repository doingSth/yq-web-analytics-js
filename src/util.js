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
