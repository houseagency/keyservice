const expect = require('chai').expect;
const td = require('testdouble')

const mem = require('../../src/storagebackends/mem'); 

describe('storagebackends/mem', () => {

	afterEach(() => mem.flush());

	it('get()/put()', () => {
		return mem.put('/hej', 'apa')
			.then(() => mem.get('/hej'))
			.then((data) => {
				expect(data).to.equal('apa');
			});
	});

	it('exists()', () => {
		return mem.exists('/finns-ej')
			.then((exists) => {
				expect(exists).to.equal(false);
			})
			.then(() => mem.put('/hej', 'yay'))
			.then(() => mem.exists('/hej'))
			.then((exists) => {
				expect(exists).to.equal(true);
			})
	});

	it('flush()', () => {
		return mem.put('/hej', 'apa')
			.then(() => mem.exists('/hej'))
			.then((exists) => {
				expect(exists).to.equal(true);
			})
			.then(() => mem.flush())
			.then(() => mem.exists('/hej'))
			.then((exists) => {
				expect(exists).to.equal(false);
			});
	});

	it('del()', () => {
		return mem.put('/hej', 'apa')
			.then(() => mem.exists('/hej'))
			.then((exists) => {
				expect(exists).to.equal(true);
			})
			.then(() => mem.del('/hej'))
			.then(() => mem.exists('/hej'))
			.then((exists) => {
				expect(exists).to.equal(false);
			});
	});

});


