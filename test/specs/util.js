/* global util */
'use strict';

describe('Util', function () {

    it('should #random return a number', function () {
        chai.expect(util.random()).to.be.a('number');
    });

    it('keyPaths should get all the key path', function () {
        var paths = [];
        util.keyPaths({
            a: {
                y: 'hello',
                s: 'james'
            },
            b: {
                t: 'world'
            },
            c: 123
        }, function (key) {
            paths.push(key);
        });
        chai.assert.deepEqual(paths, [
           ['a', 'y'],
           ['a', 's'],
           ['b', 't'],
           ['c']
        ]);
    });

    it('keyPaths should prevent circular ref', function () {
        var b = {};
        var a = {
            b: b
        };
        b.c = a;

        util.keyPaths(a, function(paths) {
           chai.assert.equal(paths.length < 11, true);
        });
    });

    it('should only return white list path', function (){
       var wl = {
           a: {
               y: true,
               f: {
                   t: true
               }
           },
           f: {
               v: true
           },
           t: {
               n: true
           },
           c: true
       };

       var res = util.whitelistify({
            a: {
                y: 'hello',
                f: {
                    t: 'sick',
                    b: 'mean'
                }
            },
            t: {
                n: 'hey'
            },
            c: 'lock'
        }, wl);
        chai.assert.deepEqual(res, {
            a: {
                y: 'hello',
                f: {
                    t: 'sick'
                }
            },
            t: {
                n: 'hey'
            },
            c: 'lock'
        });
    });

});

