/**
 * 测试要点
 * - 不同浏览器
 * - 不同库混用：jQuery,Angular,React,Requirejs
 */
(function (window, xhr, mta) {
    if (!xhr) { return; }
    if ('_mta' in xhr) { return ;}
    xhr._mta = true;

    var protocol = window.location.protocol;
    if (protocol === 'file:') { return; }

    // rewrite XMLHttpRequest.open
    var _host = window.location.host;
    var _orginOpen = xhr.prototype.open;
    xhr.prototype.open = function(method, url, async, user, password) {
        this._method = typeof method === 'string' ? method.toUpperCase() : null;
        if (url) {
            if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0 || url.indexOf('//') ===0) {
                this._url = url;
            } else if (url.indexOf('/') === 0 ) {
                this._url = protocol + '//' + _host + url;
            } else {
                var dir = protocol + '//' + _host + window.location.pathname;
                dir = dir.substring(0, dir.lastIndexOf('/') + 1);
                this._url = dir + url;
            }
            var posQuestion = this._url.indexOf('?');
            if (posQuestion !== -1) {
                this._searchLength = this._url.length - 1 - posQuestion;
                this._url = this._url.substring(0, posQuestion);
            } else {
                this._searchLength = 0;
            }
        } else {
            this._url = null;
            this._searchLength = 0;
        }
        this._startTime = new Date().getTime();
        return _orginOpen.apply(this, arguments);
    };

    // rewrite XMLHttpRequest.send
    var _onreadystatechange = 'onreadystatechange';
    var _addEventListener = 'addEventListener';
    var _originSend = xhr.prototype.send;
    xhr.prototype.send = function(value) {
        function _sendAjax(_this, event) {
            if (_this._url.indexOf(protocol + '//frep.meituan.net/_.gif') === 0) {
                return;
            }
            var metricPrefix = 'browser.ajax';
            // validate string
            var metricPrefixCharCodes = [98, 114, 111, 119, 115, 101, 114, 46, 97, 106, 97, 120];
            for (var i = 0, len = metricPrefix.length; i < len; i++) {
                if (metricPrefix.charCodeAt(i) !== metricPrefixCharCodes[i]) {
                    return;
                }
            }
            var _responseSize;
            if (_this.response) {
                switch(_this.responseType) {
                case 'json':
                    _responseSize = JSON && JSON.stringify(_this.response).length;
                    break;
                case 'blob':
                case 'moz-blob':
                    _responseSize = _this.response.size;
                    break;
                case 'arraybuffer':
                    _responseSize = _this.response.byteLength;
                case 'document':
                    _responseSize = _this.response.documentElement && _this.response.documentElement.innerHTML && (_this.response.documentElement.innerHTML.length + 28);
                    break;
                default:
                    _responseSize = _this.response.length;
                }
            }
            window.mta('send', metricPrefix, {
                url: _this._url,
                method: _this._method,
                error: !(_this.status.toString().indexOf('2') === 0 || _this.status === 304),
                responseTime: new Date().getTime() - _this._startTime,
                requestSize: _this._searchLength + (value ? value.length : 0),
                responseSize: _responseSize || 0
            });
        }
        if (_addEventListener in this) { // XMLHttpRequest Level 2
            var _eventListener = function(event) {
                _sendAjax(this, event);
            }
            this[_addEventListener]('load', _eventListener);
            this[_addEventListener]('error', _eventListener);
            this[_addEventListener]('abort', _eventListener);
        } else { // XMLHttpRequest Level 1
            var _originStageChange = this[_onreadystatechange];
            this[_onreadystatechange] = function(event) {
                if (_originStageChange) {
                    _originStageChange.apply(this, arguments);
                }
                if (this.readyState === 4 && window.mta && window.mta) {
                    _sendAjax(this, event);
                }
            }
        }
        return _originSend.apply(this, arguments);
    };
})(window, window.XMLHttpRequest, 'mta');
