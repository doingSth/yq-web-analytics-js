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
