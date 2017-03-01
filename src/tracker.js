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

Tracker.VERSION = '@VERSION@';

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
