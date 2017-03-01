'use strict';

describe('Cookie', function () {

    it('should have get and set method', function () {
        chai.expect(Cookie.get).to.be.a('function');
        chai.expect(Cookie.set).to.be.a('function');
    });

    it('should get and set work correctly', function () {
        Cookie.set('name', 'wangshijun');

        chai.expect(Cookie.get('name')).to.equal('wangshijun');
    });

});
