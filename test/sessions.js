const expect = require('chai').expect;
const td = require('testdouble')

const mem = require('../src/storagebackends/mem'); 
const sessions = require('../src/sessions'); 
const storage = require('../src/storage'); 
const users = require('../src/users');
const sessionistHeader = require('sessionistheader');

describe('sessions', () => {

	afterEach(() => mem.flush());

	describe('create()', () => {
		
		it('should store an encrypted blob when a session is created', () => {
			const accountId = 123;
			return sessions.create(accountId)
				.then((session) => {
					const keys = Object.keys(mem._internal.data);
					expect(keys.length).to.equal(1);
					
					const decrypted = storage._internal.decrypt(
						mem._internal.data[keys[0]].slice(4),
						'/sessions/' + session.id
					);

					const deserialized = JSON.parse(decrypted.toString());
					expect(deserialized.accountId).to.equal(accountId);
					expect(deserialized.secret).to.be.a('string');
					expect(deserialized.time).to.be.a('number');
				});
		});

		it('should delete the blob session is deleted', () => {
			const accountId = 123;
			return sessions.create(accountId)
				.then((session) => {
					return sessions.del(session.id);
				})
				.then(() => {
					const keys = Object.keys(mem._internal.data);
					expect(keys.length).to.equal(0);
				});
		});

	});

	describe('verifyHeader()', () => {

		it('should resolve accountId on good header', () => {

			const method = 'POST';
			const path = '/somepath';
			const body = '{ "ftw": "fuck the world" }';
			const dateHeader = new Date().toISOString();

			return users.create([ 'test0' ], 'topsecret')
				.then((accountId) => {
					return sessions.create(accountId)
						.then((session) => {

							return sessionistHeader(
								session.id,
								session.secret, 
								method,
								path,
								body,
								dateHeader
							);

						})
						.then((authHeader) => {

							return sessions.verifyAuthHeader(
								authHeader,
								method,
								path,
								body,
								dateHeader
							);

						})
						.then((sessionAccountId) => {

							expect(sessionAccountId).to.equal(accountId);

						});
				});

		});

	});

});
