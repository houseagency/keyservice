const expect = require('chai').expect;
const td = require('testdouble')

const buffertool = require('../src/buffertool'); 

describe('buffertool', () => {

	describe('toStr()', () => {

		it('should return filename safe base64 from buffer', () => {

			expect(buffertool.toStr(Buffer.from([255,255,254,254])))
				.to.equal('___-_g');

		});

	});

});
