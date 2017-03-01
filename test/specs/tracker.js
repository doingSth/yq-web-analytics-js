'use strict';

describe('tracker', function() {
    describe('plugin', function() {});

    describe('create', function() {
        it('should setup tracker config', function() {
            var tracker = new Tracker();
            var config = {
                sampleRate: 50, useCombo: false, beacon: 'http://example.com'
            };
            expect(tracker._config).to.not.deep.equal(config);
            tracker.create('trackerTest', config);
            expect(tracker._app).to.equal('trackerTest');
            expect(tracker._config).to.deep.equal(config);
        });
    });

    describe('push', function() {
        var tracker;
        beforeEach(function() {
            tracker = new Tracker();
        });

        it('should invoke sepcified command', function() {
            var stub = sinon.stub(tracker, 'send');
            tracker.push(['send', 'page']);
            expect(stub.called).to.be.true;
            expect(stub.calledWith('page')).to.be.true;
            stub.restore();
        });

        it('should never throw exception if command dont exist', function() {
            expect(function() {
                tracker.push(['methodDontExist', 'ARGUMENT']);
            }).to.not.throw();
        });
    });

    describe('config', function() {
        var tracker;
        beforeEach(function() {
            tracker = new Tracker();
        });

        it('should override old config', function() {
            expect(tracker._config.sampleRate).to.not.equal(50);
            tracker.config('sampleRate', 50);
            expect(tracker._config.sampleRate).to.equal(50);
        });

        it('should filter unknown key', function() {
            var key = 'unknownKey';
            tracker.config(key, 'someValue');
            expect(tracker._config[key]).to.be.undefined;
        });

        it('should check config value type', function() {
            var value = 'someValue';

            expect(tracker._config.sampleRate).to.not.equal(value);
            tracker.config('sampleRate', value);
            expect(tracker._config.sampleRate).to.not.equal(value);

            tracker.config('useCombo', value);
            expect(tracker._config.useCombo).to.not.equal(value);

            tracker.config('beaconImage');
            expect(tracker._config.beacon).to.not.undefined;
        });
    });

    describe('tag', function() {
        var tracker;
        beforeEach(function() {
            tracker = new Tracker();
        });

        it('should add tag', function() {
            tracker.tag('key', 'value');
            expect(tracker._tags.key).to.equal('value');
        });

        it('should remove tag if only providing tag name', function() {
            var key = 'hello', value = 'world';
            tracker.tag(key, value);
            expect(tracker._tags[key]).to.equal(value);
            tracker.tag(key);
            expect(tracker._tags[key]).to.undefined;
        });

        it('should filter non string tag key', function() {
            var key = null;
            tracker.tag(key, 'value');
            expect(tracker._tags[key]).to.undefined;
        });
    });

    describe('send', function () {
        var tracker, clock;
        beforeEach(function() {
            clock = sinon.useFakeTimers();
            tracker = new Tracker();
            tracker.create('trackerTest');
        });
        afterEach(function() {
            clock.restore();
        });

        it('should support key, data, type send', function() {
            var stub = sinon.stub(tracker, '_push');
            tracker.send('key', 1, 'count', 20);
            expect(stub.called).to.be.true;
            expect(stub.calledWith({type: 'count', data: {key: 1}}, 20)).to.be.true;
            stub.restore();
        });

        it('should support plugin data send', function() {
            var stub = sinon.stub(tracker, '_push');
            tracker.send('page', 20);
            var args = stub.args[0];
            expect(args[0].category).to.equal('page');
            expect(args[0].type).to.equal('timer');
            expect(args[1]).to.equal(20);
            stub.restore();
        });

        it('should override default sampleRate', function() {
            var stub = sinon.stub(tracker, '_isSample');
            tracker.send('page', 20);
            clock.tick(100);
            expect(stub.calledWith(20)).to.be.true;
            stub.restore();
        });

        it('should send data after delay', function() {
            var stub = sinon.stub(tracker, '_send');
            tracker.send('page', 20);
            expect(stub.called).to.be.false;
            clock.tick(100);
            expect(stub.called).to.be.true;
            stub.restore();
        });

        it('should merge tag and client info into data', function() {
            var stub = sinon.stub(tracker._beacon, 'send');
            var data = JSON.stringify(new Array(1000));
            tracker.tag('key', 'value');
            tracker._push({data: data});
            var args = stub.args[0];
            expect(args[0].key).to.equal('value');
            stub.restore();
        });
    });

    describe('_push', function() {
        var tracker;
        beforeEach(function() {
            tracker = new Tracker();
        });

        it('should send data directory if exceed max length of URL', function() {
            var stub = sinon.stub(tracker, '_send');
            var data = JSON.stringify(new Array(10000));
            tracker._push(data);
            expect(stub.called).to.be.true;
            stub.restore();
        });
    });

    describe('timing, count and gauge', function () {
        it('should send key and data');

        it('should support sampleRate override');
    });
});
