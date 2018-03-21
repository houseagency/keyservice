const expect = require('chai').expect;
const td = require('testdouble')

const errors = require('../src/errors');
const mem = require('../src/storagebackends/mem'); 
const storage = require('../src/storage'); 

describe('storage', () => {

	it('should have an exists() function', () => {
		expect(storage.exists).to.be.a('function');
	});

	it('should have a get() function', () => {
		expect(storage.get).to.be.a('function');
	});

	it('should have a put() function', () => {
		expect(storage.put).to.be.a('function');
	});

	describe('decrypt()/encrypt()', () => {

		it('shall be able to encrypt and decrypt data', () => {

			const testStr = 'When the seagulls follow the trawler, it is because they think sardines will be thrown into the sea.';
			const testPath = '/test';

			const encrypted = storage._internal.encrypt(testStr, testPath);
			expect(encrypted).to.not.equal(testStr);

			const decrypted = storage._internal.decrypt(encrypted, testPath);
			expect(decrypted.toString()).to.equal(testStr);

		});

		it('shall not be able to decrypt data which is encrypted on another path', () => {
			const testStr = 'When the seagulls follow the trawler, it is because they think sardines will be thrown into the sea.';
			const encryptPath = '/test';
			const decryptPath = '/TEST';

			const encrypted = storage._internal.encrypt(testStr, encryptPath);
			expect(encrypted).to.not.equal(testStr);

			expect(() => storage._internal.decrypt(encrypted, decryptPath))
				.to.throw(errors.DecryptionFailedError);

		});

	});

	describe('put()', () => {

		afterEach(() => mem.flush());

		it('shall store data on the storage backend', () => {
			return storage.put('/wtf', 'hej')
				.then(() => {
					const keys = Object.keys(mem._internal.data);
					expect(keys.length).to.equal(1);
					expect(keys[0]).to.not.equal('/wtf');
				})
		});

		it('shall encrypt the object keys', () => {
			return storage.put('/wtf', 'hej')
				.then(() => {
					const keys = Object.keys(mem._internal.data);
					expect(keys[0]).to.not.equal('/wtf');
				})
		});

		it('shall encrypt the object data', () => {
			return storage.put('/wtf', 'hej')
				.then(() => {
					const keys = Object.keys(mem._internal.data);
					const key = keys[0];
					expect(mem._internal.data[key]).to.not.equal('hej');
				})
		});

		describe('ttl timeout', () => {

			it('should invalidate old data', () => {

				return storage.put('/whopaaa', 'hej', -10) // 10 seconds old.
					.then(() => storage.get('/whopaaa'))
					.catch((err) => {
						return err;
					})
					.then((err) => {
						expect(err).to.be.instanceOf(
							errors.StoredDataDoesNotExistError
						);
					});

			});

			it('data blobs should be deleted when trying to read old data', () => {

				return storage.put('/test', 'abc', -10)
					.then(() => {
						const keys = Object.keys(mem._internal.data);
						expect(keys.length).to.equal(1);
					})
					.then(() => storage.get('/test'))
					.catch((err) => { })
					.then(() => {
						const keys = Object.keys(mem._internal.data);
						expect(keys.length).to.equal(0);
					});

			});

		});

	});

});
