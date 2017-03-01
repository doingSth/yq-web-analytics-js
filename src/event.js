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